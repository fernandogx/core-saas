import { IsEmail, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateCustomerDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @Length(11, 14, { message: 'Documento deve ser CPF (11) ou CNPJ (14)' })
  document: string;

  @IsOptional()
  @IsString()
  phone?: string;
}