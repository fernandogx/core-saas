export interface CreateCustomerDTO {
  name: string;
  email: string;
  document: string;
  phone?: string;
}

export interface GatewayCustomer {
  id: string;
  name: string;
  email: string;
  document: string;
}

export interface CreateSubscriptionDTO {
  customerId: string;
  value: number;
  billingCycle: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  description?: string;
}

export interface GatewaySubscription {
  id: string;
  status: string;
  currentPeriodEnd: Date;
}

export interface IPaymentGateway {
  createCustomer(data: CreateCustomerDTO): Promise<GatewayCustomer>;
  getCustomer?(id: string): Promise<GatewayCustomer | null>;
  createPayment?(params: {
    asaasCustomerId: string;
    value: number;
    dueDate: Date;
    description: string;
    billingType?: 'BOLETO' | 'PIX' | 'CREDIT_CARD';
  }): Promise<{ id: string; invoiceUrl: string }>;
  createSubscription(data: CreateSubscriptionDTO): Promise<GatewaySubscription>;
  cancelSubscription(subscriptionId: string): Promise<void>;
}