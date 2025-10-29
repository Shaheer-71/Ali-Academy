// File: src/types/fee.ts

/**
 * Fee Structure Interface
 * Defines the fee amounts for each class per academic year
 */
export interface FeeStructure {
  id: string;
  school_id: string;
  class_id: string;
  class_name?: string;
  amount: number;
  description?: string;
  academic_year: string;
  created_at: string;
  updated_at: string;
}

/**
 * Student Fee Interface
 * Tracks the total fee record for a student in an academic year
 */
export interface StudentFee {
  id: string;
  student_id: string;
  class_id: string;
  amount_due: number;
  academic_year: string;
  created_at: string;
  updated_at: string;
}

/**
 * Fee Payment Interface
 * Records individual monthly payments
 */
export interface FeePayment {
  id: string;
  student_fee_id: string;
  student_id: string;
  class_id: string;
  month: number; // 1-12
  year: number;
  amount_paid?: number;
  payment_status: 'pending' | 'paid' | 'partial' | 'overdue';
  payment_method?: 'cash' | 'card' | 'transfer' | 'cheque';
  payment_date?: string;
  notes?: string;
  paid_by?: string;
  receipt_number?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Fee Notification Interface
 * Stores notification records for fee-related updates
 */
export interface FeeNotification {
  id: string;
  type: 'fee_reminder' | 'fee_overdue' | 'fee_paid';
  title: string;
  message: string;
  entity_type: string; // 'fee_payment', 'student_fee'
  entity_id?: string;
  created_by: string; // User ID
  target_type: 'student' | 'class' | 'all';
  target_id?: string;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
}

/**
 * Fee Notification Recipient Interface
 * Tracks which users have received each notification
 */
export interface FeeNotificationRecipient {
  id: string;
  notification_id: string;
  user_id: string;
  is_read: boolean;
  is_deleted: boolean;
  read_at?: string;
  created_at: string;
}

/**
 * Student with Fee Status
 * Combines student data with their current fee status
 */
export interface StudentWithFeeStatus {
  id: string;
  full_name: string;
  class_id: string;
  email?: string;
  parent_contact?: string;
  fee_status: FeeStatus;
}

/**
 * Fee Status Summary
 * Tracks count of fees in each status category
 */
export interface FeeStatus {
  pending: number;
  paid: number;
  partial: number;
  overdue: number;
}

/**
 * Student Fee Record
 * Complete fee history for a student
 */
export interface StudentFeeRecord {
  id: string;
  student_id: string;
  student_name: string;
  class_id: string;
  amount_due: number;
  monthly_payments: FeePayment[];
}

/**
 * Fee Statistics
 * Summary statistics for fee dashboard
 */
export interface FeeStatistics {
  total_students: number;
  pending_count: number;
  paid_count: number;
  partial_count: number;
  overdue_count: number;
  total_amount_due: number;
  total_amount_paid: number;
}

/**
 * Fee Filter Options
 * Options for filtering fee records
 */
export interface FeeFilterOptions {
  month?: number;
  year?: number;
  class_id?: string;
  payment_status?: FeePayment['payment_status'];
  student_id?: string;
}

/**
 * Fee Payment Request
 * Data structure for submitting a payment
 */
export interface FeePaymentRequest {
  student_fee_id: string;
  student_id: string;
  month: number;
  year: number;
  amount_paid: number;
  payment_method: 'cash' | 'card' | 'transfer' | 'cheque';
  notes?: string;
  receipt_number?: string;
}

/**
 * Fee Notification Request
 * Data structure for sending a notification
 */
export interface FeeNotificationRequest {
  type: 'fee_reminder' | 'fee_overdue' | 'fee_paid';
  title: string;
  message: string;
  target_type: 'student' | 'class' | 'all';
  target_id?: string;
  priority: 'low' | 'medium' | 'high';
  student_ids?: string[];
}

/**
 * Monthly Fee Summary
 * Aggregated data for a specific month/year
 */
export interface MonthlySummary {
  month: number;
  year: number;
  total_students: number;
  paid: number;
  pending: number;
  partial: number;
  overdue: number;
  total_amount: number;
  collected_amount: number;
}

/**
 * Fee Report Data
 * Comprehensive report data for analysis
 */
export interface FeeReport {
  period: {
    start_date: string;
    end_date: string;
  };
  summary: FeeStatistics;
  by_class: Record<string, FeeStatistics>;
  by_month: Record<string, MonthlySummary>;
  payment_methods: Record<string, number>;
}

/**
 * Payment History Item
 * Individual payment record with related data
 */
export interface PaymentHistoryItem {
  id: string;
  student_name: string;
  month: string;
  year: number;
  amount_due: number;
  amount_paid?: number;
  status: FeePayment['payment_status'];
  payment_date?: string;
  payment_method?: string;
  receipt_number?: string;
}

/**
 * Fee Configuration
 * System-wide fee configuration settings
 */
export interface FeeConfiguration {
  id: string;
  school_id: string;
  reminder_days_before?: number; // Send reminder this many days before due date
  overdue_days?: number; // Mark as overdue after this many days
  academic_year_start_month?: number; // 1-12
  academic_year_end_month?: number; // 1-12
  created_at: string;
  updated_at: string;
}

/**
 * Fee Error Response
 * Standardized error response structure
 */
export interface FeeErrorResponse {
  code: string;
  message: string;
  details?: Record<string, any>;
}

/**
 * Fee Success Response
 * Standardized success response structure
 */
export interface FeeSuccessResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}