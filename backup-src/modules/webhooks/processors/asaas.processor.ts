import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

// ============================================
// MAPEAMENTO DE EVENTOS DO ASAAS
// Referência: https://docs.asaas.com/reference/eventos-de-cobrancas
// ============================================

// Eventos que confirmam pagamento (Invoice → PAID, Subscription → ACTIVE)
const PAID_EVENTS = [
  'PAYMENT_CONFIRMED',           // Pagamento confirmado (saldo pendente)
  'PAYMENT_RECEIVED',            // Cobrança recebida (saldo disponível)
  'PAYMENT_ANTICIPATED',         // Cobrança antecipada
  'PAYMENT_DUNNING_RECEIVED',    // Recebimento após negativação
];

// Eventos de falha (Subscription → BLOCKED)
const FAILED_EVENTS = [
  'PAYMENT_OVERDUE',                  // Vencida
  'PAYMENT_REFUNDED',                 // Estornada
  'PAYMENT_REFUND_IN_PROGRESS',       // Estorno em processamento
  'PAYMENT_CHARGEBACK_REQUESTED',     // Chargeback solicitado
  'PAYMENT_CHARGEBACK_DISPUTE',       // Em disputa de chargeback
  'PAYMENT_RECEIVED_IN_CASH_UNDONE',  // Recebimento em dinheiro desfeito
  'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED', // Captura do cartão recusada
  'PAYMENT_REPROVED_BY_RISK_ANALYSIS',   // Reprovado na análise de risco
];

// Eventos informativos (apenas log, sem ação)
const INFO_EVENTS = [
  'PAYMENT_CREATED',
  'PAYMENT_UPDATED',
  'PAYMENT_DELETED',
  'PAYMENT_RESTORED',
  'PAYMENT_REFUND_DENIED',
  'PAYMENT_AWAITING_CHARGEBACK_REVERSAL',
  'PAYMENT_DUNNING_REQUESTED',
  'PAYMENT_BANK_SLIP_CANCELLED',
  'PAYMENT_BANK_SLIP_VIEWED',
  'PAYMENT_CHECKOUT_VIEWED',
  'PAYMENT_PARTIALLY_REFUNDED',
  'PAYMENT_SPLIT_CANCELLED',
  'PAYMENT_SPLIT_DIVERGENCE_BLOCK',
  'PAYMENT_SPLIT_DIVERGENCE_BLOCK_FINISHED',
  'PAYMENT_SPLIT_DONE',
];

// Eventos de cartão em processamento (aguardando)
const PENDING_CARD_EVENTS = [
  'PAYMENT_AUTHORIZED',              // Autorizado, aguardando captura
  'PAYMENT_AWAITING_RISK_ANALYSIS',  // Aguardando análise de risco
  'PAYMENT_APPROVED_BY_RISK_ANALYSIS', // Aprovado na análise
];

@Processor('asaas-events')
export class AsaasProcessor extends WorkerHost {
  private readonly logger = new Logger(AsaasProcessor.name);

  constructor(private prisma: PrismaService) {
    super();
  }

  async process(job: Job) {
    const { event, payment } = job.data;
    this.logger.log(`⚙️ Processando evento: ${event} para pagamento ${payment?.id}`);

    if (!payment || !payment.id) {
      this.logger.warn('Webhook sem payment.id, ignorando.');
      return;
    }

    // Busca a invoice vinculada a este payment do Asaas
    const invoice = await this.prisma.invoice.findFirst({
      where: { asaasPaymentId: payment.id },
      include: { subscription: true },
    });

    if (!invoice) {
      this.logger.warn(`Fatura não encontrada para payment ID ${payment.id}`);
      return;
    }

    // ============================================
    // ROTEAMENTO DE EVENTOS
    // ============================================

    if (PAID_EVENTS.includes(event)) {
      await this.handlePaymentConfirmed(invoice, event);
    } 
    else if (FAILED_EVENTS.includes(event)) {
      await this.handlePaymentFailed(invoice, event);
    } 
    else if (PENDING_CARD_EVENTS.includes(event)) {
      this.logger.log(`⏳ Evento de cartão em processamento: ${event}`);
    } 
    else if (INFO_EVENTS.includes(event)) {
      this.logger.debug(`💡 Evento informativo: ${event}`);
    } 
    else {
      this.logger.warn(`⚠️ Evento desconhecido: ${event}`);
    }
  }

  // ============================================
  // PAGAMENTO CONFIRMADO
  // ============================================
  private async handlePaymentConfirmed(invoice: any, event: string) {
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Marca a invoice como PAID
      await tx.invoice.update({
        where: { id: invoice.id },
        data: { 
          status: 'PAID' as any, 
          paidAt: new Date() 
        },
      });

      // 2. Atualiza a assinatura se necessário
      if (invoice.subscription) {
        const currentStatus = invoice.subscription.status;
        
        // Transição: TRIAL/BLOCKED/PAST_DUE → ACTIVE
        if (['TRIAL', 'BLOCKED', 'PAST_DUE'].includes(currentStatus)) {
          await tx.subscription.update({
            where: { id: invoice.subscriptionId! },
            data: { 
              status: 'ACTIVE' as any, 
              blockedAt: null, 
              blockedReason: null 
            },
          });
          this.logger.log(`🔄 Assinatura: ${currentStatus} → ACTIVE (via ${event})`);
        }
      }
    });
    
    this.logger.log(`✅ Fatura ${invoice.id} paga (evento: ${event})`);
  }

  // ============================================
  // PAGAMENTO FALHOU
  // ============================================
  private async handlePaymentFailed(invoice: any, event: string) {
    if (!invoice.subscription) {
      this.logger.warn(`Fatura ${invoice.id} sem assinatura vinculada`);
      return;
    }

    const currentStatus = invoice.subscription.status;
    
    // Não bloqueia se já está cancelada ou expirada
    if (['CANCELED', 'EXPIRED'].includes(currentStatus)) {
      this.logger.debug(`Assinatura já está ${currentStatus}, ignorando evento ${event}`);
      return;
    }

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Bloqueia a assinatura
      await tx.subscription.update({
        where: { id: invoice.subscriptionId! },
        data: { 
          status: 'BLOCKED' as any, 
          blockedAt: new Date(), 
          blockedReason: `Inadimplência via Asaas (evento: ${event})` 
        },
      });

      // 2. Registra no histórico de bloqueios
      await tx.subscriptionBlock.create({
        data: {
          subscriptionId: invoice.subscriptionId!,
          reason: `Webhook Asaas: ${event}`,
          blockedBy: 'webhook_asaas',
        }
      });
    });

    this.logger.warn(`🚫 Assinatura bloqueada (evento: ${event})`);
  }
}