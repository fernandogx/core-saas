import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AsaasAdapter } from '../../adapters/asaas/asaas.adapter';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { Prisma } from '@prisma/client'; // Adicione este import

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private asaasAdapter: AsaasAdapter, // ✅ Injeção do Adapter
  ) {}

  // ============================================
  // CRIAR FATURA
  // ============================================
  async create(applicationId: string, subscriptionId: string, dto: CreateInvoiceDto) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        customer: { applicationId },
      },
      include: { customer: true },
    });

    if (!subscription) {
      throw new NotFoundException('Assinatura não encontrada nesta aplicação');
    }

    return this.prisma.invoice.create({
      data: {
        customerId: subscription.customerId,
        subscriptionId,
        amount: dto.amount,
        dueDate: new Date(dto.dueDate),
        status: 'PENDING' as any,
        asaasPaymentId: dto.asaasPaymentId,
      },
    });
  }

  // ============================================
  // LISTAR FATURAS DE UMA ASSINATURA
  // ============================================
  async findAllBySubscription(applicationId: string, subscriptionId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { id: subscriptionId, customer: { applicationId } },
    });

    if (!subscription) {
      throw new NotFoundException('Assinatura não encontrada nesta aplicação');
    }

    return this.prisma.invoice.findMany({
      where: { subscriptionId },
      orderBy: { dueDate: 'desc' },
    });
  }

  // ============================================
  // MARCAR FATURA COMO PAGA
  // ============================================
  async markAsPaid(applicationId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        customer: { applicationId },
      },
      include: { subscription: true },
    });

    if (!invoice) throw new NotFoundException('Fatura não encontrada');
    if (invoice.status === ('PAID' as any)) {
      throw new BadRequestException('Fatura já está paga');
    }

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const paidInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'PAID' as any,
          paidAt: new Date(),
        },
      });

      // Se a assinatura estava bloqueada, desbloqueia automaticamente
      if (invoice.subscription && invoice.subscription.status === ('BLOCKED' as any)) {
        await tx.subscription.update({
          where: { id: invoice.subscriptionId! },
          data: {
            status: 'ACTIVE' as any,
            blockedAt: null,
            blockedReason: null,
          },
        });
      }

      return paidInvoice;
    });
  }

  // ============================================
  // TESTE: CRIAR CUSTOMER NO ASAAS
  // ============================================
  async testAsaasCustomer(applicationId: string) {
    // Busca o primeiro customer da aplicação
    const customer = await this.prisma.customer.findFirst({
      where: { 
        applicationId,
        asaasCustomerId: null, // ✅ Pega apenas os que AINDA não foram sincronizados
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!customer) {
      throw new NotFoundException('Nenhum customer encontrado nesta aplicação');
    }

    // Se já está sincronizado com o Asaas, retorna o ID existente
    if (customer.asaasCustomerId) {
      return {
        message: '✅ Customer já existe no Asaas',
        customerName: customer.name,
        asaasCustomerId: customer.asaasCustomerId,
      };
    }

    // Cria no Asaas
    const asaasCustomer = await this.asaasAdapter.createCustomer({
      name: customer.name,
      email: customer.email,
      document: customer.document,
      phone: customer.phone || undefined,
    });

    // Salva o ID do Asaas no nosso banco
    await this.prisma.customer.update({
      where: { id: customer.id },
      data: { asaasCustomerId: asaasCustomer.id },
    });

    return {
      message: '🎉 Customer criado no Asaas com sucesso!',
      customerName: customer.name,
      asaasCustomerId: asaasCustomer.id,
    };
  }

// ============================================
// TESTE: CRIAR CUSTOMER ESPECÍFICO NO ASAAS
// ============================================
async testAsaasCustomerById(applicationId: string, customerId: string) {
  const customer = await this.prisma.customer.findFirst({
    where: { 
      id: customerId, 
      applicationId 
    },
  });

  if (!customer) {
    throw new NotFoundException('Customer não encontrado nesta aplicação');
  }

  // Se já está sincronizado com o Asaas, retorna o ID existente
  if (customer.asaasCustomerId) {
    return {
      message: '✅ Customer já existe no Asaas',
      customerName: customer.name,
      asaasCustomerId: customer.asaasCustomerId,
    };
  }

  // Cria no Asaas
  const asaasCustomer = await this.asaasAdapter.createCustomer({
    name: customer.name,
    email: customer.email,
    document: customer.document,
    phone: customer.phone || undefined,
  });

  // Salva o ID do Asaas no nosso banco
  await this.prisma.customer.update({
    where: { id: customer.id },
    data: { asaasCustomerId: asaasCustomer.id },
  });

  return {
    message: '🎉 Customer criado no Asaas com sucesso!',
    customerName: customer.name,
    asaasCustomerId: asaasCustomer.id,
  };
}

  // ============================================
  // TESTE: GERAR COBRANÇA NO ASAAS
  // ============================================
  async createAsaasCharge(
    applicationId: string,
    subscriptionId: string,
    billingType: 'BOLETO' | 'PIX' | 'CREDIT_CARD',
  ) {
    // Busca a assinatura com customer
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        customer: { applicationId },
      },
      include: {
        customer: true,
        plan: true,
      },
    });

    if (!subscription) {
      throw new NotFoundException('Assinatura não encontrada');
    }

    // Valida se o customer já foi sincronizado com o Asaas
    if (!subscription.customer.asaasCustomerId) {
      throw new BadRequestException(
        'Customer ainda não foi sincronizado com o Asaas. Rode o endpoint /test/asaas-customer primeiro.',
      );
    }

    // Calcula valor e data de vencimento
    const value = Number(subscription.plan.price);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // Vence em 7 dias

    // Cria a cobrança no Asaas
    const asaasPayment = await this.asaasAdapter.createPayment({
      asaasCustomerId: subscription.customer.asaasCustomerId,
      value,
      dueDate,
      description: `Assinatura: ${subscription.plan.name}`,
      billingType,
    });

    // Cria a fatura no nosso banco vinculando ao payment do Asaas
    const invoice = await this.prisma.invoice.create({
      data: {
        customerId: subscription.customerId,
        subscriptionId,
        amount: value,
        dueDate,
        status: 'PENDING' as any,
        asaasPaymentId: asaasPayment.id,
      },
    });

    return {
      message: '🎉 Cobrança criada no Asaas!',
      invoiceId: invoice.id,
      asaasPaymentId: asaasPayment.id,
      invoiceUrl: asaasPayment.invoiceUrl, // 🔗 Link de pagamento para o cliente
      value,
      dueDate,
      billingType,
    };
  }
    // ============================================
    // ============================================
  // SINCRONIZAR STATUS COM O ASAAS (MANUAL) - V2
  // ============================================
  async syncWithAsaas(applicationId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        customer: { applicationId },
      },
      include: { subscription: true },
    });

    if (!invoice) throw new NotFoundException('Fatura não encontrada');
    if (!invoice.asaasPaymentId) {
      throw new BadRequestException('Esta fatura não está vinculada a um pagamento do Asaas');
    }

    // 1. Consulta o status no Asaas
    const asaasStatus = await this.asaasAdapter.getPaymentStatus(invoice.asaasPaymentId);
    
    // 🔍 LOG DETALHADO para debug
    console.log('📡 Status retornado pelo Asaas:', JSON.stringify(asaasStatus, null, 2));

    // 2. Mapeia TODOS os status possíveis do Asaas
    let newStatus: any;
    let paidDate: Date | null = null;
    
	const paidStatuses = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH', 'DUNNING_RECEIVED', 'AWAITING_RISK_ANALYSIS'];
	const failedStatuses = ['OVERDUE', 'REFUNDED', 'REFUND_IN_PROGRESS', 'CHARGEBACK_REQUESTED', 'CHARGEBACK_DISPUTE', 'AWAITING_CHARGEBACK_REVERSAL', 'DUNNING_REQUESTED'];
    
    if (paidStatuses.includes(asaasStatus.status)) {
      newStatus = 'PAID';
      paidDate = asaasStatus.paidDate ? new Date(asaasStatus.paidDate) : new Date();
    } else if (failedStatuses.includes(asaasStatus.status)) {
      newStatus = 'OVERDUE';
    } else {
      newStatus = 'PENDING';
    }

    // 3. Se nada mudou, retorna
    if (invoice.status === newStatus) {
      return {
        message: `Status já sincronizado: ${newStatus}`,
        invoiceId,
        asaasRawStatus: asaasStatus.status, // 🔍 Retorna o status cru do Asaas
        status: newStatus,
        changed: false,
      };
    }

    // 4. Transação atômica
    return this.prisma.$transaction(async (tx) => {
      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: newStatus,
          paidAt: paidDate,
        },
      });

      let subscriptionAction = 'none';

      // ✅ PAGAMENTO CONFIRMADO
      if (newStatus === 'PAID' && invoice.subscription) {
        const currentSubStatus = invoice.subscription.status as string;

        // 🔑 NOVO: Trata TRIAL → ACTIVE (primeiro pagamento)
        if (currentSubStatus === 'TRIAL' || currentSubStatus === 'BLOCKED' || currentSubStatus === 'PAST_DUE') {
          await tx.subscription.update({
            where: { id: invoice.subscriptionId! },
            data: {
              status: 'ACTIVE' as any,
              blockedAt: null,
              blockedReason: null,
            },
          });
          subscriptionAction = `${currentSubStatus} → ACTIVE`;
        }
      }

      // ❌ PAGAMENTO FALHOU / VENCIDO
      if ((newStatus === 'OVERDUE' || newStatus === 'REFUNDED') && invoice.subscription) {
        const currentSubStatus = invoice.subscription.status as string;
        const activeStatuses = ['TRIAL', 'ACTIVE', 'PAST_DUE'];
        
        if (activeStatuses.includes(currentSubStatus)) {
          await tx.subscription.update({
            where: { id: invoice.subscriptionId! },
            data: {
              status: 'BLOCKED' as any,
              blockedAt: new Date(),
              blockedReason: `Inadimplência (Asaas: ${asaasStatus.status})`,
            },
          });
          
          await tx.subscriptionBlock.create({
            data: {
              subscriptionId: invoice.subscriptionId!,
              reason: `Sincronização manual: Asaas retornou ${asaasStatus.status}`,
              blockedBy: 'sync-service',
            },
          });
          subscriptionAction = `${currentSubStatus} → BLOCKED`;
        }
      }

      return {
        message: `Status sincronizado: ${invoice.status} → ${newStatus}`,
        invoiceId,
        asaasRawStatus: asaasStatus.status, // 🔍 Status cru do Asaas
        previousStatus: invoice.status,
        newStatus,
        paidAt: paidDate,
        subscriptionAction,
        changed: true,
      };
    });
  }
  
}