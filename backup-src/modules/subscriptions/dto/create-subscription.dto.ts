import { IsNotEmpty, IsOptional, IsString, IsInt, Min } from 'class-validator';

export class CreateSubscriptionDto {
  @IsNotEmpty()
  @IsString()
  customerId: string;

  @IsNotEmpty()
  @IsString()
  planId: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  trialDays?: number; // Override do trial do plano (se não informado, usa o do plano)
}