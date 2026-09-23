import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq'; // <-- NOVO
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { CustomersModule } from './modules/customers/customers.module';
import { ProductsModule } from './modules/products/products.module';
import { PlansModule } from './modules/plans/plans.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module'; // <-- NOVO

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    
    // <-- NOVO: Conexão global com Redis para filas
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),

    PrismaModule,
    AuthModule,
    ApplicationsModule,
    CustomersModule,
    ProductsModule,
    PlansModule,
    SubscriptionsModule,
    InvoicesModule,
    WebhooksModule, // <-- NOVO
  ],
})
export class AppModule {}