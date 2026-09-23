import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { HashUtil } from '../../common/utils/hash.util';

@Injectable()
export class ApplicationsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateApplicationDto) {
    const existing = await this.prisma.application.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException(`Já existe uma aplicação com o slug "${dto.slug}"`);
    }

    const apiKeyPlain = HashUtil.generateApiKey();
    const apiKeyHash = HashUtil.hashApiKey(apiKeyPlain);

    const application = await this.prisma.application.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        apiKey: apiKeyHash,
        webhookUrl: dto.webhookUrl,
      },
    });

    return {
      id: application.id,
      name: application.name,
      slug: application.slug,
      webhookUrl: application.webhookUrl,
      apiKey: apiKeyPlain,
      createdAt: application.createdAt,
    };
  }

  async findAll() {
    return this.prisma.application.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        webhookUrl: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async findOne(id: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        webhookUrl: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!application) {
      throw new NotFoundException(`Application com ID ${id} não encontrada`);
    }

    return application;
  }

  async update(id: string, dto: UpdateApplicationDto) {
    await this.findOne(id);

    return this.prisma.application.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        name: true,
        slug: true,
        webhookUrl: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.application.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Application desativada com sucesso' };
  }

  async regenerateApiKey(id: string) {
    await this.findOne(id);

    const apiKeyPlain = HashUtil.generateApiKey();
    const apiKeyHash = HashUtil.hashApiKey(apiKeyPlain);

    await this.prisma.application.update({
      where: { id },
      data: { apiKey: apiKeyHash },
    });

    return {
      message: 'API Key regenerada com sucesso',
      apiKey: apiKeyPlain,
    };
  }
}