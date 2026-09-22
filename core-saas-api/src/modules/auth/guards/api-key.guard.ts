import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { HashUtil } from '../../../common/utils/hash.util';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('API Key não fornecida');
    }

    const apiKeyHash = HashUtil.hashApiKey(apiKey);

    const application = await this.prisma.application.findFirst({
      where: {
        apiKey: apiKeyHash,
        isActive: true,
      },
    });

    if (!application) {
      throw new UnauthorizedException('API Key inválida');
    }

    request.application = application;
    return true;
  }
}