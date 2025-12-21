import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface PaymentMethod {
  id: string;
  type: 'card' | 'cash' | 'digital_wallet' | 'qr_code';
  name: string;
  description?: string;
  isActive: boolean;
  icon?: string;
  processingFee?: number; // Percentage
}

export interface PaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod['type'];
  customerInfo?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  metadata?: {
    [key: string]: any;
  };
}

export interface PaymentResponse {
  id: string;
  orderId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod['type'];
  transactionId?: string;
  gatewayResponse?: any;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
}

export interface RefundRequest {
  paymentId: string;
  amount?: number; // Partial refund if specified, full refund if not
  reason?: string;
}

export interface RefundResponse {
  id: string;
  paymentId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  reason?: string;
  createdAt: Date;
  processedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private paymentsSubject = new BehaviorSubject<PaymentResponse[]>([]);
  private paymentMethodsSubject = new BehaviorSubject<PaymentMethod[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  // Public observables
  public payments$ = this.paymentsSubject.asObservable();
  public paymentMethods$ = this.paymentMethodsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  // Computed observables
  public completedPayments$ = this.payments$.pipe(
    map(payments => payments.filter(payment => payment.status === 'completed'))
  );

  public pendingPayments$ = this.payments$.pipe(
    map(payments => payments.filter(payment => payment.status === 'pending'))
  );

  public failedPayments$ = this.payments$.pipe(
    map(payments => payments.filter(payment => payment.status === 'failed'))
  );

  public totalRevenue$ = this.completedPayments$.pipe(
    map(payments => payments.reduce((sum, payment) => sum + payment.amount, 0))
  );

  constructor() {
    this.initializePaymentMethods();
  }

  /**
   * Initialize default payment methods
   */
  private initializePaymentMethods(): void {
    const defaultMethods: PaymentMethod[] = [
      {
        id: 'card',
        type: 'card',
        name: 'Credit/Debit Card',
        description: 'Pay with Visa, Mastercard, or American Express',
        isActive: true,
        icon: 'credit-card',
        processingFee: 2.9
      },
      {
        id: 'cash',
        type: 'cash',
        name: 'Cash Payment',
        description: 'Pay with cash at the counter',
        isActive: true,
        icon: 'dollar-sign',
        processingFee: 0
      },
      {
        id: 'digital_wallet',
        type: 'digital_wallet',
        name: 'Digital Wallet',
        description: 'Pay with Apple Pay, Google Pay, or PayPal',
        isActive: true,
        icon: 'smartphone',
        processingFee: 2.5
      },
      {
        id: 'qr_code',
        type: 'qr_code',
        name: 'QR Code Payment',
        description: 'Scan QR code to pay',
        isActive: true,
        icon: 'qr-code',
        processingFee: 1.5
      }
    ];

    this.paymentMethodsSubject.next(defaultMethods);
  }

  /**
   * Process payment
   */
  async processPayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    try {
      this.loadingSubject.next(true);
      this.errorSubject.next(null);

      // Simulate payment processing
      const paymentResponse = await this.simulatePaymentProcessing(paymentRequest);
      
      // Add to payments list
      const currentPayments = this.paymentsSubject.value;
      this.paymentsSubject.next([...currentPayments, paymentResponse]);
      
      return paymentResponse;
    } catch (error) {
      this.errorSubject.next('Payment processing failed');
      console.error('Error processing payment:', error);
      throw error;
    } finally {
      this.loadingSubject.next(false);
    }
  }

  /**
   * Simulate payment processing (replace with actual payment gateway integration)
   */
  private async simulatePaymentProcessing(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    return new Promise((resolve, reject) => {
      // Simulate network delay
      setTimeout(() => {
        // Simulate random success/failure
        const isSuccess = Math.random() > 0.1; // 90% success rate
        
        if (isSuccess) {
          const paymentResponse: PaymentResponse = {
            id: this.generatePaymentId(),
            orderId: paymentRequest.orderId,
            status: 'completed',
            amount: paymentRequest.amount,
            currency: paymentRequest.currency,
            paymentMethod: paymentRequest.paymentMethod,
            transactionId: this.generateTransactionId(),
            gatewayResponse: {
              gateway: 'simulated',
              responseCode: '00',
              responseMessage: 'Approved'
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            processedAt: new Date()
          };
          resolve(paymentResponse);
        } else {
          const paymentResponse: PaymentResponse = {
            id: this.generatePaymentId(),
            orderId: paymentRequest.orderId,
            status: 'failed',
            amount: paymentRequest.amount,
            currency: paymentRequest.currency,
            paymentMethod: paymentRequest.paymentMethod,
            errorMessage: 'Payment declined by bank',
            createdAt: new Date(),
            updatedAt: new Date()
          };
          reject(paymentResponse);
        }
      }, 2000); // 2 second delay
    });
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId: string): Promise<PaymentResponse | null> {
    try {
      const payments = this.paymentsSubject.value;
      return payments.find(payment => payment.id === paymentId) || null;
    } catch (error) {
      console.error('Error fetching payment by ID:', error);
      return null;
    }
  }

  /**
   * Get payments by order ID
   */
  async getPaymentsByOrderId(orderId: string): Promise<PaymentResponse[]> {
    try {
      const payments = this.paymentsSubject.value;
      return payments.filter(payment => payment.orderId === orderId);
    } catch (error) {
      console.error('Error fetching payments by order ID:', error);
      return [];
    }
  }

  /**
   * Process refund
   */
  async processRefund(refundRequest: RefundRequest): Promise<RefundResponse> {
    try {
      this.loadingSubject.next(true);
      this.errorSubject.next(null);

      const payment = await this.getPaymentById(refundRequest.paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'completed') {
        throw new Error('Only completed payments can be refunded');
      }

      const refundAmount = refundRequest.amount || payment.amount;
      if (refundAmount > payment.amount) {
        throw new Error('Refund amount cannot exceed payment amount');
      }

      // Simulate refund processing
      const refundResponse = await this.simulateRefundProcessing(refundRequest, refundAmount);
      
      // Update payment status if full refund
      if (refundAmount === payment.amount) {
        const updatedPayment = { ...payment, status: 'refunded' as const, updatedAt: new Date() };
        const currentPayments = this.paymentsSubject.value;
        const updatedPayments = currentPayments.map(p => 
          p.id === payment.id ? updatedPayment : p
        );
        this.paymentsSubject.next(updatedPayments);
      }
      
      return refundResponse;
    } catch (error) {
      this.errorSubject.next('Refund processing failed');
      console.error('Error processing refund:', error);
      throw error;
    } finally {
      this.loadingSubject.next(false);
    }
  }

  /**
   * Simulate refund processing
   */
  private async simulateRefundProcessing(refundRequest: RefundRequest, amount: number): Promise<RefundResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const refundResponse: RefundResponse = {
          id: this.generateRefundId(),
          paymentId: refundRequest.paymentId,
          amount,
          status: 'completed',
          reason: refundRequest.reason,
          createdAt: new Date(),
          processedAt: new Date()
        };
        resolve(refundResponse);
      }, 1500);
    });
  }

  /**
   * Get available payment methods
   */
  getAvailablePaymentMethods(): PaymentMethod[] {
    return this.paymentMethodsSubject.value.filter(method => method.isActive);
  }

  /**
   * Get payment method by type
   */
  getPaymentMethodByType(type: PaymentMethod['type']): PaymentMethod | null {
    return this.paymentMethodsSubject.value.find(method => method.type === type) || null;
  }

  /**
   * Calculate processing fee
   */
  calculateProcessingFee(amount: number, paymentMethod: PaymentMethod['type']): number {
    const method = this.getPaymentMethodByType(paymentMethod);
    if (!method || !method.processingFee) return 0;
    
    return (amount * method.processingFee) / 100;
  }

  /**
   * Calculate total amount with fees
   */
  calculateTotalWithFees(amount: number, paymentMethod: PaymentMethod['type']): number {
    const processingFee = this.calculateProcessingFee(amount, paymentMethod);
    return amount + processingFee;
  }

  /**
   * Get payment statistics
   */
  getPaymentStats(): {
    totalPayments: number;
    completedPayments: number;
    failedPayments: number;
    pendingPayments: number;
    totalRevenue: number;
    averagePaymentAmount: number;
    successRate: number;
  } {
    const payments = this.paymentsSubject.value;
    const completedPayments = payments.filter(p => p.status === 'completed');
    const failedPayments = payments.filter(p => p.status === 'failed');
    const pendingPayments = payments.filter(p => p.status === 'pending');
    
    const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0);
    const averagePaymentAmount = completedPayments.length > 0 ? totalRevenue / completedPayments.length : 0;
    const successRate = payments.length > 0 ? (completedPayments.length / payments.length) * 100 : 0;

    return {
      totalPayments: payments.length,
      completedPayments: completedPayments.length,
      failedPayments: failedPayments.length,
      pendingPayments: pendingPayments.length,
      totalRevenue,
      averagePaymentAmount,
      successRate
    };
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  }

  /**
   * Get payment status color
   */
  getPaymentStatusColor(status: PaymentResponse['status']): string {
    const colors = {
      pending: 'text-yellow-600 bg-yellow-100',
      processing: 'text-blue-600 bg-blue-100',
      completed: 'text-green-600 bg-green-100',
      failed: 'text-red-600 bg-red-100',
      cancelled: 'text-gray-600 bg-gray-100',
      refunded: 'text-purple-600 bg-purple-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.errorSubject.next(null);
  }

  /**
   * Generate payment ID
   */
  private generatePaymentId(): string {
    return `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate transaction ID
   */
  private generateTransactionId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate refund ID
   */
  private generateRefundId(): string {
    return `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate payment request
   */
  validatePaymentRequest(paymentRequest: PaymentRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!paymentRequest.orderId) {
      errors.push('Order ID is required');
    }

    if (!paymentRequest.amount || paymentRequest.amount <= 0) {
      errors.push('Valid amount is required');
    }

    if (!paymentRequest.currency) {
      errors.push('Currency is required');
    }

    if (!paymentRequest.paymentMethod) {
      errors.push('Payment method is required');
    }

    const availableMethods = this.getAvailablePaymentMethods();
    const methodExists = availableMethods.some(method => method.type === paymentRequest.paymentMethod);
    if (!methodExists) {
      errors.push('Invalid payment method');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
