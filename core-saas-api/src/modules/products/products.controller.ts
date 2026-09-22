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
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';

@Controller('products')
@UseGuards(ApiKeyGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateProductDto) {
    const applicationId = req.application.id;
    return this.productsService.create(applicationId, dto);
  }

  @Get()
  findAll(@Req() req: any) {
    const applicationId = req.application.id;
    return this.productsService.findAll(applicationId);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    const applicationId = req.application.id;
    return this.productsService.findOne(applicationId, id);
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateProductDto) {
    const applicationId = req.application.id;
    return this.productsService.update(applicationId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Req() req: any, @Param('id') id: string) {
    const applicationId = req.application.id;
    return this.productsService.remove(applicationId, id);
  }
}