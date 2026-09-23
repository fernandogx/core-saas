import { IsNotEmpty, IsNumber, IsString, IsDateString, IsOptional, Min } from 'class-validator';

export class CreateInvoiceDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number;

  @IsNotEmpty()
  @IsDateString()
  dueDate: string; // Data de vencimento

  @IsOptional()
  @IsString()
  asaasPaymentId?: string; // ID do pagamento no gateway
}