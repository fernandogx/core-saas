import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('asaas')
  @HttpCode(HttpStatus.OK)
  async handleAsaasWebhook(@Body() body: any) {
    await this.webhooksService.enqueueAsaasEvent(body);
    return { received: true };
  }
}
