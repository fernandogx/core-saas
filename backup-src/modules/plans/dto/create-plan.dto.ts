import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, Min } from 'class-validator';

// BillingCycle como union type
export type BillingCycle = 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export class CreatePlanDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug deve conter apenas letras minúsculas, números e hífens',
  })
  slug: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price: number;

  @IsNotEmpty()
  @IsEnum(['WEEKLY', 'MONTHLY', 'YEARLY']) // Valores diretos
  billingCycle: BillingCycle;

  @IsOptional()
  @IsInt()
  @Min(0)
  trialDays?: number;

  @IsOptional()
  features?: any;
}