import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class BlockSubscriptionDto {
  @IsNotEmpty()
  @IsString()
  reason: string; // Ex: "Inadimplência há 15 dias"

  @IsOptional()
  @IsString()
  blockedBy?: string; // Ex: "system", "admin@coresaas.local", "webhook_asaas"
}