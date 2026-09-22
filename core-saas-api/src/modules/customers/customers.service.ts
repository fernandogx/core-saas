import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(applicationId: string, dto: CreateCustomerDto) {
    // Verifica se já existe um customer com este email nesta application
    const existing = await this.prisma.customer.findFirst({
      where: {
        applicationId,
        email: dto.email,
      },
    });

    if (existing) {
      throw new ConflictException(`Já existe um customer com o email "${dto.email}" nesta aplicação`);
    }

    return this.prisma.customer.create({
      data: {
        applicationId,
        name: dto.name,
        email: dto.email,
        document: dto.document,
        phone: dto.phone,
      },
      select: {
        id: true,
        name: true,
        email: true,
        document: true,
        phone: true,
        asaasCustomerId: true,
        createdAt: true,
      },
    });
  }

  async findAll(applicationId: string) {
    return this.prisma.customer.findMany({
      where: { applicationId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        document: true,
        phone: true,
        asaasCustomerId: true,
        createdAt: true,
      },
    });
  }

  async findOne(applicationId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id,
        applicationId, // Garante que só retorna customers da aplicação autenticada
      },
      select: {
        id: true,
        name: true,
        email: true,
        document: true,
        phone: true,
        asaasCustomerId: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer com ID ${id} não encontrado`);
    }

    return customer;
  }

  async update(applicationId: string, id: string, dto: UpdateCustomerDto) {
    await this.findOne(applicationId, id); // Garante que existe e pertence a esta application

    // Se o email está sendo atualizado, verifica conflito
    if (dto.email) {
      const existing = await this.prisma.customer.findFirst({
        where: {
          applicationId,
          email: dto.email,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException(`Já existe um customer com o email "${dto.email}" nesta aplicação`);
      }
    }

    return this.prisma.customer.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        name: true,
        email: true,
        document: true,
        phone: true,
        asaasCustomerId: true,
        updatedAt: true,
      },
    });
  }

  async remove(applicationId: string, id: string) {
    await this.findOne(applicationId, id);

    await this.prisma.customer.delete({
      where: { id },
    });

    return { message: 'Customer removido com sucesso' };
  }
}