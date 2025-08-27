import { storage } from '../storage.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';

export interface AngolaPaymentRequest {
  tenantId: string;
  invoiceId: string;
  paymentMethod: 'multicaixa_express' | 'unitel_money' | 'bank_transfer' | 'referencia_pagamento';
  amount: number;
  
  // Multicaixa Express
  multicaixaReference?: string;
  multicaixaEntity?: string;
  
  // Unitel Money
  unitelPhoneNumber?: string;
  unitelTransactionId?: string;
  
  // Bank Transfer
  bankName?: string;
  bankIban?: string;
  accountHolder?: string;
  swiftCode?: string;
  proofOfPaymentFile?: Express.Multer.File;
  
  // Reference Payment
  referenciaEntity?: string;
  referenciaNumber?: string;
}

export class AngolaPaymentService {
  private static readonly COMPANY_BANK_DETAILS = {
    bankName: "Banco Angolano de Investimentos (BAI)",
    iban: "AO06000400000123456789101",
    accountHolder: "TatuTicket Angola, Lda",
    swiftCode: "BAIAAOLU",
    address: "Luanda, Angola"
  };

  private static readonly MULTICAIXA_DETAILS = {
    entity: "20144",
    entityName: "TatuTicket Angola"
  };

  private static readonly REFERENCIA_DETAILS = {
    entity: "11604",
    entityName: "TatuTicket Angola"
  };

  /**
   * Create a new Angola payment request
   */
  static async createPayment(paymentData: AngolaPaymentRequest): Promise<any> {
    const paymentId = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 3); // 3 days expiry

    let proofOfPaymentUrl = null;
    let proofOfPaymentFilename = null;

    // Handle file upload for bank transfers
    if (paymentData.paymentMethod === 'bank_transfer' && paymentData.proofOfPaymentFile) {
      const uploadResult = await this.uploadProofOfPayment(paymentId, paymentData.proofOfPaymentFile);
      proofOfPaymentUrl = uploadResult.url;
      proofOfPaymentFilename = uploadResult.filename;
    }

    // Generate reference numbers for Multicaixa and Referencia
    let multicaixaReference = paymentData.multicaixaReference;
    let referenciaNumber = paymentData.referenciaNumber;

    if (paymentData.paymentMethod === 'multicaixa_express') {
      multicaixaReference = this.generateMulticaixaReference();
    }

    if (paymentData.paymentMethod === 'referencia_pagamento') {
      referenciaNumber = this.generateReferenciaNumber();
    }

    const payment = {
      id: paymentId,
      tenantId: paymentData.tenantId,
      invoiceId: paymentData.invoiceId,
      paymentMethod: paymentData.paymentMethod,
      amount: paymentData.amount,
      currency: 'aoa',
      status: paymentData.paymentMethod === 'bank_transfer' ? 'processing' : 'pending',
      
      // Method-specific fields
      multicaixaReference,
      multicaixaEntity: this.MULTICAIXA_DETAILS.entity,
      unitelPhoneNumber: paymentData.unitelPhoneNumber,
      unitelTransactionId: paymentData.unitelTransactionId,
      bankName: paymentData.bankName || this.COMPANY_BANK_DETAILS.bankName,
      bankIban: paymentData.bankIban || this.COMPANY_BANK_DETAILS.iban,
      accountHolder: paymentData.accountHolder || this.COMPANY_BANK_DETAILS.accountHolder,
      swiftCode: paymentData.swiftCode || this.COMPANY_BANK_DETAILS.swiftCode,
      proofOfPaymentUrl,
      proofOfPaymentFilename,
      referenciaEntity: this.REFERENCIA_DETAILS.entity,
      referenciaNumber,
      
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save to database (mock implementation)
    // await storage.createAngolaPayment(payment);

    return {
      ...payment,
      companyBankDetails: this.COMPANY_BANK_DETAILS,
      multicaixaDetails: this.MULTICAIXA_DETAILS,
      referenciaDetails: this.REFERENCIA_DETAILS
    };
  }

  /**
   * Upload proof of payment file
   */
  private static async uploadProofOfPayment(paymentId: string, file: Express.Multer.File): Promise<{ url: string; filename: string }> {
    const uploadDir = './uploads/payment-proofs';
    await fs.mkdir(uploadDir, { recursive: true });

    const fileExtension = path.extname(file.originalname);
    const filename = `${paymentId}-${Date.now()}${fileExtension}`;
    const filePath = path.join(uploadDir, filename);

    await fs.writeFile(filePath, file.buffer);

    return {
      url: `/uploads/payment-proofs/${filename}`,
      filename: filename
    };
  }

  /**
   * Generate Multicaixa Express reference
   */
  private static generateMulticaixaReference(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 999).toString().padStart(3, '0');
    return `${timestamp}${random}`;
  }

  /**
   * Generate Reference Payment number
   */
  private static generateReferenciaNumber(): string {
    const timestamp = Date.now().toString().slice(-7);
    const random = Math.floor(Math.random() * 99).toString().padStart(2, '0');
    return `${timestamp}${random}`;
  }

  /**
   * Approve a payment (admin only)
   */
  static async approvePayment(paymentId: string, approvedBy: string): Promise<any> {
    // In real implementation, update database
    const approval = {
      paymentId,
      status: 'approved',
      approvedBy,
      approvedAt: new Date()
    };

    // Update payment status and send notification
    console.log(`💳 Payment ${paymentId} approved by ${approvedBy}`);
    
    return approval;
  }

  /**
   * Reject a payment (admin only)
   */
  static async rejectPayment(paymentId: string, rejectedBy: string, reason: string): Promise<any> {
    const rejection = {
      paymentId,
      status: 'rejected',
      rejectedBy,
      rejectionReason: reason,
      rejectedAt: new Date()
    };

    console.log(`❌ Payment ${paymentId} rejected by ${rejectedBy}: ${reason}`);
    
    return rejection;
  }

  /**
   * Get payment instructions for different methods
   */
  static getPaymentInstructions(paymentMethod: string, amount: number): any {
    switch (paymentMethod) {
      case 'multicaixa_express':
        return {
          title: 'Multicaixa Express',
          instructions: [
            '1. Acesse qualquer terminal Multicaixa',
            '2. Selecione "Pagamentos" > "Serviços"',
            `3. Digite a entidade: ${this.MULTICAIXA_DETAILS.entity}`,
            '4. Digite a referência fornecida',
            `5. Confirme o valor: Kz ${amount.toFixed(2)}`,
            '6. Complete o pagamento'
          ],
          paymentWindow: '3 dias úteis',
          entity: this.MULTICAIXA_DETAILS.entity
        };

      case 'unitel_money':
        return {
          title: 'Unitel Money',
          instructions: [
            '1. Abra o app Unitel Money',
            '2. Selecione "Transferir" > "Para Conta Bancária"',
            `3. IBAN: ${this.COMPANY_BANK_DETAILS.iban}`,
            `4. Beneficiário: ${this.COMPANY_BANK_DETAILS.accountHolder}`,
            `5. Valor: Kz ${amount.toFixed(2)}`,
            '6. Envie o ID da transação para confirmar'
          ],
          paymentWindow: '24 horas',
          accountDetails: this.COMPANY_BANK_DETAILS
        };

      case 'bank_transfer':
        return {
          title: 'Transferência Bancária',
          instructions: [
            '1. Acesse seu banco online ou agência',
            `2. IBAN: ${this.COMPANY_BANK_DETAILS.iban}`,
            `3. Beneficiário: ${this.COMPANY_BANK_DETAILS.accountHolder}`,
            `4. Banco: ${this.COMPANY_BANK_DETAILS.bankName}`,
            `5. SWIFT: ${this.COMPANY_BANK_DETAILS.swiftCode}`,
            `6. Valor: Kz ${amount.toFixed(2)}`,
            '7. Faça upload do comprovativo',
            '8. Aguarde aprovação em até 3 dias úteis'
          ],
          paymentWindow: '3 dias úteis',
          accountDetails: this.COMPANY_BANK_DETAILS
        };

      case 'referencia_pagamento':
        return {
          title: 'Pagamento por Referência',
          instructions: [
            '1. Acesse seu banco online',
            '2. Selecione "Pagamentos" > "Por Referência"',
            `3. Entidade: ${this.REFERENCIA_DETAILS.entity}`,
            '4. Digite a referência fornecida',
            `5. Valor: Kz ${amount.toFixed(2)}`,
            '6. Confirme o pagamento'
          ],
          paymentWindow: '3 dias úteis',
          entity: this.REFERENCIA_DETAILS.entity
        };

      default:
        throw new Error('Método de pagamento não suportado');
    }
  }
}