import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectQueue('asaas-events') private readonly asaasQueue: Queue,
  ) {}

  async enqueueAsaasEvent(payload: any) {
    this.logger.log(`📥 Recebido webhook do Asaas: ${payload.event}`);
    
    await this.asaasQueue.add('process-event', payload, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }
}