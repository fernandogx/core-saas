import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { AuthModule } from '../auth/auth.module';
import { AsaasAdapter } from '../../adapters/asaas/asaas.adapter'; // <-- NOVO

@Module({
  imports: [AuthModule],
  controllers: [InvoicesController],
  providers: [
    InvoicesService,
    AsaasAdapter, // ✅ Adicionado como provider
  ],
  exports: [InvoicesService],
})
export class InvoicesModule {}