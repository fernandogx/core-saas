import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { 
  IPaymentGateway, 
  CreateCustomerDTO, 
  GatewayCustomer, 
  CreateSubscriptionDTO, 
  GatewaySubscription 
} from '../payment-gateway.interface';

@Injectable()
export class AsaasAdapter implements IPaymentGateway {
  private readonly logger = new Logger(AsaasAdapter.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiUrl = this.configService.getOrThrow<string>('ASAAS_API_URL');
    this.apiKey = this.configService.getOrThrow<string>('ASAAS_API_KEY');
    this.logger.log(`🔌 Asaas Adapter conectado em: ${this.apiUrl}`);
  }

  /**
   * Faz uma requisição HTTP para a API do Asaas
   */
  private async request<T>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE', 
    body?: any
  ): Promise<T> {
    const url = `${this.apiUrl}${endpoint}`;
    this.logger.debug(`[ASAAS] ${method} ${url}`);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'access_token': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        this.logger.error(`[ASAAS] Erro ${response.status}: ${JSON.stringify(data)}`);
        throw new HttpException(
          data.errors?.[0]?.description || 'Erro na API do Asaas',
          response.status,
        );
      }

      return data as T;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Erro desconhecido';      
      this.logger.error(`[ASAAS] Erro de rede: ${errorMessage}`);
	  
      throw new HttpException(
        'Falha de conexão com o Asaas',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Cria um customer no Asaas
   */
  async createCustomer(data: CreateCustomerDTO): Promise<GatewayCustomer> {
    this.logger.log(`👤 Criando customer no Asaas: ${data.email}`);

    const response = await this.request<any>('/customers', 'POST', {
      name: data.name,
      email: data.email,
      cpfCnpj: data.document,
      phone: data.phone,
      // Notificações desativadas no sandbox para evitar spam
      notifications: [{ email: data.email, sms: false }],
    });

    return {
      id: response.id,
      name: response.name,
      email: response.email,
      document: response.cpfCnpj,
    };
  }

  /**
   * Busca um customer no Asaas
   */
  async getCustomer(asaasCustomerId: string): Promise<GatewayCustomer | null> {
    try {
      const response = await this.request<any>(`/customers/${asaasCustomerId}`, 'GET');
      return {
        id: response.id,
        name: response.name,
        email: response.email,
        document: response.cpfCnpj,
      };
    } catch {
      return null;
    }
  }

  /**
   * Cria uma cobrança (Payment) no Asaas
   * No Asaas, "assinatura" e "cobrança avulsa" são coisas diferentes.
   * Para o nosso MVP, vamos criar cobranças avulsas vinculadas ao período.
   */
  async createPayment(params: {
    asaasCustomerId: string;
    value: number;
    dueDate: Date;
    description: string;
    billingType?: 'BOLETO' | 'PIX' | 'CREDIT_CARD';
  }): Promise<{ id: string; invoiceUrl: string }> {
    this.logger.log(`💰 Criando cobrança no Asaas: R$ ${params.value}`);

    const response = await this.request<any>('/payments', 'POST', {
      customer: params.asaasCustomerId,
      billingType: params.billingType || 'BOLETO',
      value: params.value,
      dueDate: params.dueDate.toISOString().split('T')[0], // YYYY-MM-DD
      description: params.description,
      externalReference: `${Date.now()}`, // Útil para rastrear no nosso sistema
    });

    return {
      id: response.id,
      invoiceUrl: response.invoiceUrl, // Link de pagamento para o cliente
    };
  }

  /**
   * Cria uma assinatura recorrente no Asaas
   */
  async createSubscription(data: CreateSubscriptionDTO): Promise<GatewaySubscription> {
    this.logger.log(`🔄 Criando assinatura no Asaas para customer: ${data.customerId}`);

    const response = await this.request<any>('/subscriptions', 'POST', {
      customer: data.customerId,
      billingType: data.billingCycle === 'MONTHLY' ? 'BOLETO' : 'PIX',
      value: data.value,
      nextDueDate: new Date().toISOString().split('T')[0],
      cycle: data.billingCycle,
      description: data.description || 'Assinatura Core SaaS',
    });

    return {
      id: response.id,
      status: response.status,
      currentPeriodEnd: new Date(response.nextDueDate),
    };
  }

  /**
   * Cancela uma assinatura no Asaas
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    this.logger.log(`❌ Cancelando assinatura no Asaas: ${subscriptionId}`);
    await this.request(`/subscriptions/${subscriptionId}`, 'DELETE');
  }
  
    /**
   * Busca o status de um pagamento no Asaas
   */
  async getPaymentStatus(asaasPaymentId: string): Promise<{
    status: string;
    value: number;
    paidDate?: string;
    invoiceUrl?: string;
  }> {
    this.logger.log(`🔍 Consultando status do pagamento: ${asaasPaymentId}`);

    const response = await this.request<any>(`/payments/${asaasPaymentId}`, 'GET');

    return {
      status: response.status, // PENDING, RECEIVED, CONFIRMED, OVERDUE, REFUNDED, etc.
      value: response.value,
      paidDate: response.paymentDate || response.confirmedDate,
      invoiceUrl: response.invoiceUrl,
    };
  }
  
}