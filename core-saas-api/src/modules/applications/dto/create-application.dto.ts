import { IsString, IsOptional, IsUrl, Matches } from 'class-validator';

export class CreateApplicationDto {
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug deve conter apenas letras minúsculas, números e hífens',
  })
  slug: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsUrl()
  webhookUrl?: string;
}