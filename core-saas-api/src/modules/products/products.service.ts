import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(applicationId: string, dto: CreateProductDto) {
    // Verifica se já existe um produto com este slug nesta application
    const existing = await this.prisma.product.findFirst({
      where: {
        applicationId,
        slug: dto.slug,
      },
    });

    if (existing) {
      throw new ConflictException(`Já existe um produto com o slug "${dto.slug}" nesta aplicação`);
    }

    return this.prisma.product.create({
      data: {
        applicationId,
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async findAll(applicationId: string) {
    return this.prisma.product.findMany({
      where: { applicationId, isActive: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        isActive: true,
        createdAt: true,
        plans: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            billingCycle: true,
          },
        },
      },
    });
  }

  async findOne(applicationId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        applicationId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        plans: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            billingCycle: true,
            trialDays: true,
            features: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Produto com ID ${id} não encontrado`);
    }

    return product;
  }

  async update(applicationId: string, id: string, dto: UpdateProductDto) {
    await this.findOne(applicationId, id);

    // Se o slug está sendo atualizado, verifica conflito
    if (dto.slug) {
      const existing = await this.prisma.product.findFirst({
        where: {
          applicationId,
          slug: dto.slug,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException(`Já existe um produto com o slug "${dto.slug}" nesta aplicação`);
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  async remove(applicationId: string, id: string) {
    await this.findOne(applicationId, id);

    // Soft delete: desativa o produto em vez de deletar
    await this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Produto desativado com sucesso' };
  }
}