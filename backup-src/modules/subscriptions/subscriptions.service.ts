import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { BlockSubscriptionDto } from './dto/block-subscription.dto';
import { ExtendSubscriptionDto } from './dto/extend-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // CRIAR ASSINATURA
  // ============================================
  async create(applicationId: string, dto: CreateSubscriptionDto) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, applicationId },
    });
    if (!customer) throw new NotFoundException('Customer não encontrado nesta aplicação');

    const plan = await this.prisma.plan.findFirst({
      where: {
        id: dto.planId,
        isActive: true,
        product: { applicationId, isActive: true },
      },
      include: { product: true },
    });
    if (!plan) throw new NotFoundException('Plano não encontrado nesta aplicação');

    const existingActive = await this.prisma.subscription.findFirst({
      where: {
        customerId: dto.customerId,
        planId: dto.planId,
        status: {
          in: ['TRIAL' as any, 'ACTIVE' as any, 'PAST_DUE' as any],
        },
      },
    });
    if (existingActive) throw new ConflictException('Este customer já possui uma assinatura ativa para este plano');

    const now = new Date();
    const trialDays = dto.trialDays ?? plan.trialDays ?? 0;
    let currentPeriodStart: Date;
    let currentPeriodEnd: Date;
    let status: any;

    if (trialDays > 0) {
      const trialEndsAt = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);
      currentPeriodStart = trialEndsAt;
      currentPeriodEnd = this.calculatePeriodEnd(currentPeriodStart, plan.billingCycle);
      status = 'TRIAL';
    } else {
      currentPeriodStart = now;
      currentPeriodEnd = this.calculatePeriodEnd(now, plan.billingCycle);
      status = 'ACTIVE';
    }

    return this.prisma.subscription.create({
      data: {
        customerId: dto.customerId,
        planId: dto.planId,
        status,
        currentPeriodStart,
        currentPeriodEnd,
        extendedUntil: trialDays > 0 ? currentPeriodStart : null,
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        plan: {
          select: { id: true, name: true, price: true, billingCycle: true, product: { select: { id: true, name: true } } },
        },
      },
    });
  }

  // ============================================
  // LISTAR ASSINATURAS
  // ============================================
  async findAll(applicationId: string) {
    return this.prisma.subscription.findMany({
      where: { customer: { applicationId } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        extendedUntil: true,
        blockedAt: true,
        canceledAt: true,
        createdAt: true,
        customer: { select: { id: true, name: true, email: true } },
        plan: {
          select: { id: true, name: true, price: true, billingCycle: true, product: { select: { id: true, name: true, slug: true } } },
        },
      },
    });
  }

  // ============================================
  // BUSCAR POR ID
  // ============================================
  async findOne(applicationId: string, id: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { id, customer: { applicationId } },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        plan: {
          select: { id: true, name: true, slug: true, price: true, billingCycle: true, product: { select: { id: true, name: true, slug: true } } },
        },
        blockHistory: {
          orderBy: { createdAt: 'desc' },
          select: { id: true, reason: true, blockedBy: true, createdAt: true },
        },
        extensionHistory: {
          orderBy: { createdAt: 'desc' },
          select: { id: true, days: true, reason: true, extendedBy: true, previousPeriodEnd: true, newPeriodEnd: true, createdAt: true },
        },
      },
    });

    if (!subscription) throw new NotFoundException('Assinatura não encontrada');
    return subscription;
  }

  // ============================================
  // BLOQUEAR
  // ============================================
  async block(applicationId: string, id: string, dto: BlockSubscriptionDto) {
    const subscription = await this.findOne(applicationId, id);

    if (subscription.status === ('CANCELED' as any) || subscription.status === ('EXPIRED' as any)) {
      throw new BadRequestException(`Não é possível bloquear uma assinatura com status ${subscription.status}`);
    }
    if (subscription.status === ('BLOCKED' as any)) throw new ConflictException('Assinatura já está bloqueada');

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updated = await tx.subscription.update({
        where: { id },
        data: {
          status: 'BLOCKED' as any,
          blockedAt: new Date(),
          blockedReason: dto.reason,
        },
        include: {
          customer: { select: { id: true, name: true, email: true } },
          plan: { select: { id: true, name: true, price: true } },
        },
      });

      await tx.subscriptionBlock.create({
        data: {
          subscriptionId: id,
          reason: dto.reason,
          blockedBy: dto.blockedBy || 'system',
        },
      });

      return updated;
    });
  }

  // ============================================
  // DESBLOQUEAR
  // ============================================
  async unblock(applicationId: string, id: string) {
    const subscription = await this.findOne(applicationId, id);
    if (subscription.status !== ('BLOCKED' as any)) {
      throw new BadRequestException('Apenas assinaturas bloqueadas podem ser desbloqueadas');
    }

    return this.prisma.subscription.update({
      where: { id },
      data: {
        status: 'ACTIVE' as any,
        blockedAt: null,
        blockedReason: null,
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        plan: { select: { id: true, name: true, price: true } },
      },
    });
  }

  // ============================================
  // PRORROGAR
  // ============================================
  async extend(applicationId: string, id: string, dto: ExtendSubscriptionDto) {
    const subscription = await this.findOne(applicationId, id);

    if (subscription.status === ('CANCELED' as any) || subscription.status === ('EXPIRED' as any)) {
      throw new BadRequestException(`Não é possível prorrogar uma assinatura com status ${subscription.status}`);
    }

    const previousPeriodEnd = subscription.currentPeriodEnd;
    const newPeriodEnd = new Date(previousPeriodEnd.getTime() + dto.days * 24 * 60 * 60 * 1000);

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updated = await tx.subscription.update({
        where: { id },
        data: {
          currentPeriodEnd: newPeriodEnd,
          extendedUntil: newPeriodEnd,
        },
        include: {
          customer: { select: { id: true, name: true, email: true } },
          plan: { select: { id: true, name: true, price: true } },
        },
      });

      await tx.subscriptionExtension.create({
        data: {
          subscriptionId: id,
          days: dto.days,
          reason: dto.reason || undefined,
          extendedBy: dto.extendedBy || 'system',
          previousPeriodEnd,
          newPeriodEnd,
        },
      });

      return updated;
    });
  }

  // ============================================
  // CANCELAR
  // ============================================
  async cancel(applicationId: string, id: string) {
    const subscription = await this.findOne(applicationId, id);
    if (subscription.status === ('CANCELED' as any)) throw new ConflictException('Assinatura já está cancelada');

    return this.prisma.subscription.update({
      where: { id },
      data: {
        status: 'CANCELED' as any,
        canceledAt: new Date(),
        blockedAt: null,
        blockedReason: null,
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        plan: { select: { id: true, name: true, price: true } },
      },
    });
  }

  // ============================================
  // HELPERS
  // ============================================
  private calculatePeriodEnd(startDate: Date, billingCycle: string): Date {
    const end = new Date(startDate);
    switch (billingCycle) {
      case 'WEEKLY': end.setDate(end.getDate() + 7); break;
      case 'MONTHLY': end.setMonth(end.getMonth() + 1); break;
      case 'YEARLY': end.setFullYear(end.getFullYear() + 1); break;
      default: end.setMonth(end.getMonth() + 1);
    }
    return end;
  }
}