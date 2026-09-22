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
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { BlockSubscriptionDto } from './dto/block-subscription.dto';
import { ExtendSubscriptionDto } from './dto/extend-subscription.dto';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';

@Controller('subscriptions')
@UseGuards(ApiKeyGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // ============================================
  // CRIAR ASSINATURA
  // ============================================
  @Post()
  create(@Req() req: any, @Body() dto: CreateSubscriptionDto) {
    const applicationId = req.application.id;
    return this.subscriptionsService.create(applicationId, dto);
  }

  // ============================================
  // LISTAR ASSINATURAS
  // ============================================
  @Get()
  findAll(@Req() req: any) {
    const applicationId = req.application.id;
    return this.subscriptionsService.findAll(applicationId);
  }

  // ============================================
  // BUSCAR POR ID
  // ============================================
  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    const applicationId = req.application.id;
    return this.subscriptionsService.findOne(applicationId, id);
  }

  // ============================================
  // BLOQUEAR
  // ============================================
  @Post(':id/block')
  @HttpCode(HttpStatus.OK)
  block(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: BlockSubscriptionDto,
  ) {
    const applicationId = req.application.id;
    return this.subscriptionsService.block(applicationId, id, dto);
  }

  // ============================================
  // DESBLOQUEAR
  // ============================================
  @Post(':id/unblock')
  @HttpCode(HttpStatus.OK)
  unblock(@Req() req: any, @Param('id') id: string) {
    const applicationId = req.application.id;
    return this.subscriptionsService.unblock(applicationId, id);
  }

  // ============================================
  // PRORROGAR
  // ============================================
  @Post(':id/extend')
  @HttpCode(HttpStatus.OK)
  extend(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: ExtendSubscriptionDto,
  ) {
    const applicationId = req.application.id;
    return this.subscriptionsService.extend(applicationId, id, dto);
  }

  // ============================================
  // CANCELAR
  // ============================================
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(@Req() req: any, @Param('id') id: string) {
    const applicationId = req.application.id;
    return this.subscriptionsService.cancel(applicationId, id);
  }
}