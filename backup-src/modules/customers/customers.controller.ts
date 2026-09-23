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
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';

@Controller('customers')
@UseGuards(ApiKeyGuard) // Todas as rotas exigem API Key válida
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateCustomerDto) {
    // O ApiKeyGuard anexou a application ao request
    const applicationId = req.application.id;
    return this.customersService.create(applicationId, dto);
  }

  @Get()
  findAll(@Req() req: any) {
    const applicationId = req.application.id;
    return this.customersService.findAll(applicationId);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    const applicationId = req.application.id;
    return this.customersService.findOne(applicationId, id);
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    const applicationId = req.application.id;
    return this.customersService.update(applicationId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Req() req: any, @Param('id') id: string) {
    const applicationId = req.application.id;
    return this.customersService.remove(applicationId, id);
  }
}