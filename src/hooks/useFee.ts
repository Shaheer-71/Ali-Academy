// File: src/hooks/useFee.ts

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/src/lib/supabase';
import {
    FeeStructure,
    StudentFee,
    FeePayment,
    FeeNotification,
    StudentWithFeeStatus,
    FeeStatistics,
    FeePaymentRequest,
    FeeNotificationRequest,
    MonthlySummary,
} from '@/src/types/fee';
import { sendPushNotification } from '../lib/notifications';

interface UseFeeDependencies {
    userId?: string;
    schoolId?: string;
}

/**
 * Custom hook for fee management operations
 * Provides functions to manage fees, payments, and notifications
 */
export const useFee = (dependencies?: UseFeeDependencies) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Fetch fee structure for a specific class and academic year
     */
    const fetchFeeStructure = useCallback(
        async (classId: string, academicYear: string): Promise<FeeStructure | null> => {
            try {
                setLoading(true);
                setError(null);

                const { data, error: err } = await supabase
                    .from('fee_structures')
                    .select('*')
                    .eq('class_id', classId)
                    .eq('academic_year', academicYear)
                    .single();

                if (err) {
                    console.warn('Error fetching fee structure:', err);
                    setError(err.message);
                    return null;
                }

                return data as FeeStructure;
            } catch (err: any) {
                const message = err.message || 'Failed to fetch fee structure';
                setError(message);
                console.warn('Fetch fee structure error:', err);
                return null;
            } finally {
                setLoading(false);
            }
        },
        []
    );

    /**
     * Fetch all fee structures for a school
     */
    const fetchFeeStructures = useCallback(
        async (academicYear: string): Promise<FeeStructure[]> => {
            try {
                setLoading(true);
                setError(null);

                const { data, error: err } = await supabase
                    .from('fee_structures')
                    .select('*')
                    .eq('academic_year', academicYear)
                    .order('class_id');

                if (err) {
                    console.warn('Error fetching fee structures:', err);
                    setError(err.message);
                    return [];
                }

                return (data as FeeStructure[]) || [];
            } catch (err: any) {
                const message = err.message || 'Failed to fetch fee structures';
                setError(message);
                console.warn('Fetch fee structures error:', err);
                return [];
            } finally {
                setLoading(false);
            }
        },
        []
    );

    /**
     * Create or update a fee structure
     */
    const upsertFeeStructure = useCallback(
        async (
            schoolId: string,
            classId: string,
            amount: number,
            academicYear: string,
            description?: string
        ): Promise<FeeStructure | null> => {
            try {
                setLoading(true);
                setError(null);

                const { data, error: err } = await supabase
                    .from('fee_structures')
                    .upsert(
                        [
                            {
                                school_id: schoolId,
                                class_id: classId,
                                amount,
                                academic_year: academicYear,
                                description,
                            },
                        ],
                        { onConflict: 'school_id,class_id,academic_year' }
                    )
                    .select()
                    .single();

                if (err) {
                    console.warn('Error upserting fee structure:', err);
                    setError(err.message);
                    return null;
                }

                return data as FeeStructure;
            } catch (err: any) {
                const message = err.message || 'Failed to save fee structure';
                setError(message);
                console.warn('Upsert fee structure error:', err);
                return null;
            } finally {
                setLoading(false);
            }
        },
        []
    );

    /**
     * Create a student fee record
     */
    const createStudentFee = useCallback(
        async (
            studentId: string,
            classId: string,
            amountDue: number,
            academicYear: string
        ): Promise<StudentFee | null> => {
            try {
                setLoading(true);
                setError(null);

                const { data, error: err } = await supabase
                    .from('student_fees')
                    .insert([
                        {
                            student_id: studentId,
                            class_id: classId,
                            amount_due: amountDue,
                            academic_year: academicYear,
                        },
                    ])
                    .select()
                    .single();

                if (err) {
                    console.warn('Error creating student fee:', err);
                    setError(err.message);
                    return null;
                }

                return data as StudentFee;
            } catch (err: any) {
                const message = err.message || 'Failed to create student fee';
                setError(message);
                console.warn('Create student fee error:', err);
                return null;
            } finally {
                setLoading(false);
            }
        },
        []
    );

    /**
     * Fetch fee payments for a specific month/year
     */
    const fetchFeePayments = useCallback(
        async (
            classId: string,
            month: number,
            year: number
        ): Promise<FeePayment[]> => {
            try {
                setLoading(true);
                setError(null);

                const { data, error: err } = await supabase
                    .from('fee_payments')
                    .select('*')
                    .eq('class_id', classId)
                    .eq('month', month)
                    .eq('year', year)
                    .order('created_at', { ascending: false });

                if (err) {
                    console.warn('Error fetching fee payments:', err);
                    setError(err.message);
                    return [];
                }

                return (data as FeePayment[]) || [];
            } catch (err: any) {
                const message = err.message || 'Failed to fetch fee payments';
                setError(message);
                console.warn('Fetch fee payments error:', err);
                return [];
            } finally {
                setLoading(false);
            }
        },
        []
    );

    /**
     * Fetch all fee payments for a student
     */
    const fetchStudentFeeHistory = useCallback(
        async (studentId: string): Promise<FeePayment[]> => {
            try {
                setLoading(true);
                setError(null);

                const { data, error: err } = await supabase
                    .from('fee_payments')
                    .select('*')
                    .eq('student_id', studentId)
                    .order('year', { ascending: false })
                    .order('month', { ascending: false });

                if (err) {
                    console.warn('Error fetching student fee history:', err);
                    setError(err.message);
                    return [];
                }

                return (data as FeePayment[]) || [];
            } catch (err: any) {
                const message = err.message || 'Failed to fetch fee history';
                setError(message);
                console.warn('Fetch student fee history error:', err);
                return [];
            } finally {
                setLoading(false);
            }
        },
        []
    );

    /**
     * Create a fee payment record
     */
    const createFeePayment = useCallback(
        async (paymentRequest: FeePaymentRequest): Promise<FeePayment | null> => {
            try {
                setLoading(true);
                setError(null);

                const { data, error: err } = await supabase
                    .from('fee_payments')
                    .insert([
                        {
                            student_fee_id: paymentRequest.student_fee_id,
                            student_id: paymentRequest.student_id,
                            class_id: paymentRequest.class_id,
                            month: paymentRequest.month,
                            year: paymentRequest.year,
                            amount_paid: paymentRequest.amount_paid,
                            payment_method: paymentRequest.payment_method,
                            payment_status: 'paid',
                            payment_date: new Date().toISOString(),
                            notes: paymentRequest.notes,
                            receipt_number: paymentRequest.receipt_number,
                        },
                    ])
                    .select()
                    .single();

                if (err) {
                    console.warn('Error creating fee payment:', err);
                    setError(err.message);
                    return null;
                }

                return data as FeePayment;
            } catch (err: any) {
                const message = err.message || 'Failed to create fee payment';
                setError(message);
                console.warn('Create fee payment error:', err);
                return null;
            } finally {
                setLoading(false);
            }
        },
        []
    );

    /**
     * Update fee payment status
     */
    const updateFeePaymentStatus = useCallback(
        async (
            paymentId: string,
            status: 'pending' | 'paid' | 'partial' | 'overdue',
            amountPaid?: number
        ): Promise<boolean> => {
            try {
                setLoading(true);
                setError(null);

                const updateData: any = {
                    payment_status: status,
                };

                if (amountPaid !== undefined) {
                    updateData.amount_paid = amountPaid;
                }

                if (status === 'paid') {
                    updateData.payment_date = new Date().toISOString();
                }

                const { error: err } = await supabase
                    .from('fee_payments')
                    .update(updateData)
                    .eq('id', paymentId);

                if (err) {
                    console.warn('Error updating fee payment status:', err);
                    setError(err.message);
                    return false;
                }

                return true;
            } catch (err: any) {
                const message = err.message || 'Failed to update payment status';
                setError(message);
                console.warn('Update fee payment error:', err);
                return false;
            } finally {
                setLoading(false);
            }
        },
        []
    );

    /**
     * Fetch students with fee status for a class in a specific month/year
     */
    const fetchStudentsWithFeeStatus = useCallback(
        async (
            classId: string,
            month: number,
            year: number
        ): Promise<StudentWithFeeStatus[]> => {
            try {
                setLoading(true);
                setError(null);

                // Fetch all students in the class
                const { data: studentsData, error: studentsError } = await supabase
                    .from('students')
                    .select('id, full_name, class_id, email, parent_contact')
                    .eq('class_id', classId)
                    .order('full_name');

                if (studentsError) {
                    console.warn('Error fetching students:', studentsError);
                    setError(studentsError.message);
                    return [];
                }

                if (!studentsData || studentsData.length === 0) {
                    return [];
                }

                // Fetch fee payments for the selected month/year
                const { data: feesData, error: feesError } = await supabase
                    .from('fee_payments')
                    .select('*')
                    .eq('class_id', classId)
                    .eq('month', month)
                    .eq('year', year);

                if (feesError) {
                    console.warn('Error fetching fees:', feesError);
                    setError(feesError.message);
                    return [];
                }

                // Create a map for quick lookup
                const feeMap = new Map<string, FeePayment>();
                feesData?.forEach(fee => {
                    feeMap.set(fee.student_id, fee);
                });

                // Combine students with fee status
                const studentsWithFees = studentsData.map(student => ({
                    ...student,
                    fee_status: {
                        pending: feeMap.has(student.id) &&
                            feeMap.get(student.id)!.payment_status === 'pending' ? 1 : 0,
                        paid: feeMap.has(student.id) &&
                            feeMap.get(student.id)!.payment_status === 'paid' ? 1 : 0,
                        partial: feeMap.has(student.id) &&
                            feeMap.get(student.id)!.payment_status === 'partial' ? 1 : 0,
                        overdue: feeMap.has(student.id) &&
                            feeMap.get(student.id)!.payment_status === 'overdue' ? 1 : 0,
                    },
                })) as StudentWithFeeStatus[];

                return studentsWithFees;
            } catch (err: any) {
                const message = err.message || 'Failed to fetch students with fee status';
                setError(message);
                console.warn('Fetch students with fee status error:', err);
                return [];
            } finally {
                setLoading(false);
            }
        },
        []
    );

    /**
     * Calculate fee statistics for a class
     */
    const calculateFeeStatistics = useCallback(
        async (
            classId: string,
            month: number,
            year: number
        ): Promise<FeeStatistics | null> => {
            try {
                setLoading(true);
                setError(null);

                const { data: feesData, error: feesError } = await supabase
                    .from('fee_payments')
                    .select('payment_status, amount_paid')
                    .eq('class_id', classId)
                    .eq('month', month)
                    .eq('year', year);

                if (feesError) {
                    console.warn('Error fetching statistics:', feesError);
                    setError(feesError.message);
                    return null;
                }

                const { data: studentsData, error: studentsError } = await supabase
                    .from('students')
                    .select('id')
                    .eq('class_id', classId);

                if (studentsError) {
                    console.warn('Error fetching students count:', studentsError);
                    setError(studentsError.message);
                    return null;
                }

                const fees = feesData || [];
                const totalStudents = studentsData?.length || 0;

                const stats: FeeStatistics = {
                    total_students: totalStudents,
                    pending_count: fees.filter(f => f.payment_status === 'pending').length,
                    paid_count: fees.filter(f => f.payment_status === 'paid').length,
                    partial_count: fees.filter(f => f.payment_status === 'partial').length,
                    overdue_count: fees.filter(f => f.payment_status === 'overdue').length,
                    total_amount_due: totalStudents * 5000, // Replace with actual fee structure query
                    total_amount_paid: fees.reduce((sum, f) => sum + (f.amount_paid || 0), 0),
                };

                return stats;
            } catch (err: any) {
                const message = err.message || 'Failed to calculate statistics';
                setError(message);
                console.warn('Calculate statistics error:', err);
                return null;
            } finally {
                setLoading(false);
            }
        },
        []
    );

    /**
     * Create a unified fee notification
     */

    const createFeeNotification = useCallback(
        async (notificationRequest: FeeNotificationRequest): Promise<FeeNotification | null> => {

            try {
                setLoading(true);
                setError(null);


                const { data: notif, error: notifError } = await supabase
                    .from("notifications")
                    .insert([
                        {
                            type: "fee_update",
                            title: notificationRequest.title,
                            message: notificationRequest.message,
                            entity_type: "fee_payment",
                            entity_id: notificationRequest.entity_id || null,
                            target_type: notificationRequest.target_type || "individual",
                            target_id: notificationRequest.target_id || null,
                            priority: notificationRequest.priority || "medium",
                            created_by: dependencies?.userId || null,
                        },
                    ])
                    .select()
                    .single();


                if (notifError) {
                    console.warn("❌ [FEE] Error inserting notification:", notifError);
                    setError(notifError.message);
                    return null;
                }

                // ✅ 3️⃣ Log success

                // 🔍 4️⃣ Check recipients
                if (!notificationRequest.student_ids || notificationRequest.student_ids.length === 0) {
                    return notif as FeeNotification;
                }


                // 🧾 5️⃣ Insert recipients
                const recipientRows = notificationRequest.student_ids.map((studentId) => ({
                    notification_id: notif.id,
                    user_id: studentId,
                    is_read: false,
                    is_deleted: false,
                }));

                const { data: recData, error: recipientError } = await supabase
                    .from("notification_recipients")
                    .insert(recipientRows)
                    .select();


                if (recipientError) {
                    console.warn("❌ [FEE] Error inserting recipients:", recipientError);
                } 
                // 📱 6️⃣ SEND PUSH NOTIFICATIONS TO ALL STUDENTS
                let sentCount = 0;
                let failedCount = 0;

                for (let i = 0; i < notificationRequest.student_ids.length; i++) {
                    const studentId = notificationRequest.student_ids[i];
                    try {

                        await sendPushNotification({
                            userId: studentId,
                            title: notificationRequest.title,
                            body: notificationRequest.message,
                            data: {
                                type: 'fee_update',
                                notificationId: notif.id,
                                entityId: notificationRequest.entity_id,
                                priority: notificationRequest.priority || 'medium',
                                targetType: notificationRequest.target_type || 'individual',
                                timestamp: new Date().toISOString(),
                            },
                        });

                        sentCount++;
                    } catch (studentError) {
                        console.warn(`❌ [FEE] Failed to send notification to student ${i + 1}:`, studentError);
                        failedCount++;
                        // Continue with next student instead of stopping
                        continue;
                    }
                }

                return notif as FeeNotification;
            } catch (err: any) {
                console.warn("🔥 [FEE] Unexpected error in createFeeNotification:", err);
                setError(err.message || "Failed to create fee notification");
                return null;
            } finally {
                setLoading(false);
            }
        },
        [dependencies?.userId]
    );


    /**
     * Fetch monthly summary for statistics
     */
    const fetchMonthlySummary = useCallback(
        async (
            classId: string,
            month: number,
            year: number
        ): Promise<MonthlySummary | null> => {
            try {
                setLoading(true);
                setError(null);

                const { data: feesData, error: feesError } = await supabase
                    .from('fee_payments')
                    .select('payment_status, amount_paid, student_id')
                    .eq('class_id', classId)
                    .eq('month', month)
                    .eq('year', year);

                if (feesError) {
                    console.warn('Error fetching monthly summary:', feesError);
                    setError(feesError.message);
                    return null;
                }

                const fees = feesData || [];
                const uniqueStudents = new Set(fees.map(f => f.student_id)).size;

                const summary: MonthlySummary = {
                    month,
                    year,
                    total_students: uniqueStudents,
                    paid: fees.filter(f => f.payment_status === 'paid').length,
                    pending: fees.filter(f => f.payment_status === 'pending').length,
                    partial: fees.filter(f => f.payment_status === 'partial').length,
                    overdue: fees.filter(f => f.payment_status === 'overdue').length,
                    total_amount: uniqueStudents * 5000, // Replace with fee structure
                    collected_amount: fees.reduce((sum, f) => sum + (f.amount_paid || 0), 0),
                };

                return summary;
            } catch (err: any) {
                const message = err.message || 'Failed to fetch monthly summary';
                setError(message);
                console.warn('Fetch monthly summary error:', err);
                return null;
            } finally {
                setLoading(false);
            }
        },
        []
    );

    /**
     * Mark multiple payments as processed
     */
    const bulkUpdatePaymentStatus = useCallback(
        async (
            paymentIds: string[],
            status: 'pending' | 'paid' | 'partial' | 'overdue'
        ): Promise<boolean> => {
            try {
                setLoading(true);
                setError(null);

                const updateData: any = {
                    payment_status: status,
                };

                if (status === 'paid') {
                    updateData.payment_date = new Date().toISOString();
                }

                const { error: err } = await supabase
                    .from('fee_payments')
                    .update(updateData)
                    .in('id', paymentIds);

                if (err) {
                    console.warn('Error bulk updating payments:', err);
                    setError(err.message);
                    return false;
                }

                return true;
            } catch (err: any) {
                const message = err.message || 'Failed to bulk update payments';
                setError(message);
                console.warn('Bulk update error:', err);
                return false;
            } finally {
                setLoading(false);
            }
        },
        []
    );

    /**
     * Clear error state
     */
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        // State
        loading,
        error,

        // Fee Structure Operations
        fetchFeeStructure,
        fetchFeeStructures,
        upsertFeeStructure,

        // Student Fee Operations
        createStudentFee,
        fetchStudentsWithFeeStatus,

        // Payment Operations
        fetchFeePayments,
        fetchStudentFeeHistory,
        createFeePayment,
        updateFeePaymentStatus,
        bulkUpdatePaymentStatus,

        // Statistics & Reports
        calculateFeeStatistics,
        fetchMonthlySummary,

        // Notification Operations
        createFeeNotification,

        // Utilities
        clearError,
    };
};

/**
 * Type for the hook return value
 */
export type UseFeeReturn = ReturnType<typeof useFee>;