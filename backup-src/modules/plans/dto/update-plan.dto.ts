import { PartialType } from '@nestjs/mapped-types';
import { CreatePlanDto } from './create-plan.dto';
import { IsOptional, IsString, Matches } from 'class-validator';

export class UpdatePlanDto extends PartialType(CreatePlanDto) {
  // Forçar o slug a estar disponível e validado
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug deve conter apenas letras minúsculas, números e hífens',
  })
  slug?: string;
}