// ============================================
// USER & AUTH
// ============================================
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'OPERATOR';
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface AuthResponse {
  user: User;
}

// ============================================
// APPLICATIONS
// ============================================
export type ApplicationStatus = 'ACTIVE' | 'SUSPENDED' | 'CANCELED';

export interface Application {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status: ApplicationStatus;
  webhookUrl?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    customers: number;
    products: number;
  };
}

export interface ApiKeyResponse {
  apiKey: string;
  createdAt: string;
}

// ============================================
// CUSTOMERS
// ============================================
export type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';

export interface Customer {
  id: string;
  applicationId: string;
  name: string;
  email: string;
  document: string;
  phone?: string;
  asaasCustomerId?: string;
  status: CustomerStatus;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// PRODUCTS & PLANS
// ============================================
export interface Product {
  id: string;
  applicationId: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  plans?: Plan[];
}

export type BillingCycle = 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface Plan {
  id: string;
  productId: string;
  name: string;
  slug: string;
  description?: string;
  price: string; // Decimal vem como string do Prisma
  billingCycle: BillingCycle;
  trialDays: number;
  features?: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// SUBSCRIPTIONS
// ============================================
export type SubscriptionStatus =
  | 'TRIAL'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'BLOCKED'
  | 'CANCELED'
  | 'EXPIRED';

export interface Subscription {
  id: string;
  customerId: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  extendedUntil?: string;
  blockedAt?: string;
  blockedReason?: string;
  canceledAt?: string;
  asaasSubscriptionId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    email: string;
  };
  plan?: {
    id: string;
    name: string;
    price: string;
    billingCycle: BillingCycle;
    product?: {
      id: string;
      name: string;
      slug: string;
    };
  };
}

// ============================================
// INVOICES
// ============================================
export type InvoiceStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'REFUNDED' | 'CANCELED';
export type PaymentMethod = 'PIX' | 'BOLETO' | 'CREDIT_CARD';

export interface Invoice {
  id: string;
  customerId: string;
  subscriptionId?: string;
  amount: string; // Decimal vem como string
  currency: string;
  status: InvoiceStatus;
  dueDate: string;
  paidAt?: string;
  paymentMethod?: PaymentMethod;
  asaasPaymentId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// API ERROR
// ============================================
export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}