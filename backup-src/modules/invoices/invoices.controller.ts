import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';

@Controller()
@UseGuards(ApiKeyGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  // ============================================
  // CRIAR FATURA PARA UMA ASSINATURA
  // ============================================
  @Post('subscriptions/:subscriptionId/invoices')
  create(
    @Req() req: any,
    @Param('subscriptionId') subscriptionId: string,
    @Body() dto: CreateInvoiceDto,
  ) {
    return this.invoicesService.create(req.application.id, subscriptionId, dto);
  }

  // ============================================
  // LISTAR FATURAS DE UMA ASSINATURA
  // ============================================
  @Get('subscriptions/:subscriptionId/invoices')
  findAll(@Req() req: any, @Param('subscriptionId') subscriptionId: string) {
    return this.invoicesService.findAllBySubscription(req.application.id, subscriptionId);
  }

  // ============================================
  // MARCAR FATURA COMO PAGA
  // ============================================
  @Post('invoices/:id/pay')
  @HttpCode(HttpStatus.OK)
  markAsPaid(@Req() req: any, @Param('id') id: string) {
    return this.invoicesService.markAsPaid(req.application.id, id);
  }

  // ============================================
  // TESTE: CRIAR CUSTOMER NO ASAAS (SANDBOX)
  // ============================================
  @Post('test/asaas-customer')
  @HttpCode(HttpStatus.OK)
  testAsaasCustomer(@Req() req: any) {
    return this.invoicesService.testAsaasCustomer(req.application.id);
  }
  
  // ============================================
  // TESTE: CRIAR CUSTOMER ESPECÍFICO NO ASAAS
  // ============================================
  @Post('test/asaas-customer/:customerId')
  @HttpCode(HttpStatus.OK)
  testAsaasCustomerById(
  @Req() req: any,
  @Param('customerId') customerId: string,
) {
  return this.invoicesService.testAsaasCustomerById(req.application.id, customerId);
}

  // ============================================
  // TESTE: GERAR COBRANÇA NO ASAAS (SANDBOX)
  // ============================================
  @Post('subscriptions/:subscriptionId/charge')
  @HttpCode(HttpStatus.CREATED)
  createAsaasCharge(
    @Req() req: any,
    @Param('subscriptionId') subscriptionId: string,
    @Body() body: { billingType?: 'BOLETO' | 'PIX' | 'CREDIT_CARD' },
  ) {
    return this.invoicesService.createAsaasCharge(
      req.application.id,
      subscriptionId,
      body.billingType || 'BOLETO',
    );
  }
  
  // ============================================
  // SINCRONIZAR STATUS COM O ASAAS (MANUAL)
  // ============================================
  @Post('invoices/:id/sync-status')
  @HttpCode(HttpStatus.OK)
  syncWithAsaas(@Req() req: any, @Param('id') id: string) {
    return this.invoicesService.syncWithAsaas(req.application.id, id);
  }  
  
}