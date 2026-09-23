import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';

@Controller()
@UseGuards(ApiKeyGuard)
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  // Criar plano para um produto específico
  @Post('products/:productId/plans')
  create(
    @Req() req: any,
    @Param('productId') productId: string,
    @Body() dto: CreatePlanDto,
  ) {
    const applicationId = req.application.id;
    return this.plansService.create(applicationId, productId, dto);
  }

  // Buscar plano por ID
  @Get('plans/:id')
  findOne(@Req() req: any, @Param('id') id: string) {
    const applicationId = req.application.id;
    return this.plansService.findOne(applicationId, id);
  }

  // Atualizar plano
  @Patch('plans/:id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdatePlanDto,
  ) {
    const applicationId = req.application.id;
    return this.plansService.update(applicationId, id, dto);
  }

  // Desativar plano
  @Delete('plans/:id')
  @HttpCode(HttpStatus.OK)
  remove(@Req() req: any, @Param('id') id: string) {
    const applicationId = req.application.id;
    return this.plansService.remove(applicationId, id);
  }
}