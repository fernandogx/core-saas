import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

  async create(applicationId: string, productId: string, dto: CreatePlanDto) {
    // Verifica se o produto pertence a esta application
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        applicationId,
        isActive: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Produto com ID ${productId} não encontrado`);
    }

    // Verifica se já existe um plano com este slug neste produto
    const existing = await this.prisma.plan.findFirst({
      where: {
        productId,
        slug: dto.slug,
      },
    });

    if (existing) {
      throw new ConflictException(`Já existe um plano com o slug "${dto.slug}" neste produto`);
    }

    return this.prisma.plan.create({
      data: {
        productId,
        name: dto.name,
        slug: dto.slug,
        price: dto.price,
        billingCycle: dto.billingCycle,
        trialDays: dto.trialDays || 0,
        features: dto.features || null,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        billingCycle: true,
        trialDays: true,
        features: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async findOne(applicationId: string, id: string) {
    const plan = await this.prisma.plan.findFirst({
      where: {
        id,
        product: {
          applicationId,
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        billingCycle: true,
        trialDays: true,
        features: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException(`Plano com ID ${id} não encontrado`);
    }

    return plan;
  }

  async update(applicationId: string, id: string, dto: UpdatePlanDto) {
    await this.findOne(applicationId, id);

    // Se o slug está sendo atualizado, verifica conflito
    if (dto.slug) {
      const existing = await this.prisma.plan.findFirst({
        where: {
          slug: dto.slug,
          product: {
            applicationId,
          },
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException(`Já existe um plano com o slug "${dto.slug}" nesta aplicação`);
      }
    }

    return this.prisma.plan.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        billingCycle: true,
        trialDays: true,
        features: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  async remove(applicationId: string, id: string) {
    await this.findOne(applicationId, id);

    // Soft delete: desativa o plano
    await this.prisma.plan.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Plano desativado com sucesso' };
  }
}