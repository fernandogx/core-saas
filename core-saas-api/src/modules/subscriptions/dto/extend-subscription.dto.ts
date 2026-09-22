import { IsNotEmpty, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ExtendSubscriptionDto {
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  days: number; // Quantos dias prorrogar

  @IsOptional()
  @IsString()
  reason?: string; // Ex: "Cortesia por suporte", "Problema técnico"

  @IsOptional()
  @IsString()
  extendedBy?: string; // Quem autorizou a prorrogação
}