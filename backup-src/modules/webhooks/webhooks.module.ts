import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { AsaasProcessor } from './processors/asaas.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'asaas-events',
    }),
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService, AsaasProcessor],
})
export class WebhooksModule {}