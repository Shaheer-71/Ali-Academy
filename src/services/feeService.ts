// services/feeService.ts
import { supabase } from '@/src/lib/supabase';

export interface FeePayment {
    id: string;
    student_fee_id: string;
    student_id: string;
    class_id: string;
    month: number;
    year: number;
    amount_paid: string;
    payment_status: 'pending' | 'paid' | 'partial' | 'overdue';
    payment_date?: string;
    payment_method?: string;
    notes?: string;
    receipt_number?: string;
}

export interface StudentWithFeeStatus {
    id: string;
    full_name: string;
    class_id: string;
    email?: string;
    parent_contact?: string;
    fee_payment_id?: string;
    current_month_payment_status: 'pending' | 'paid' | 'partial' | 'overdue';
    current_month_amount?: string;
}

export const feeService = {
    // Get fee payment for a specific month/year/student
    async getFeePaymentForMonth(
        studentId: string,
        classId: string,
        month: number,
        year: number
    ) {
        try {
            const { data, error } = await supabase
                .from('fee_payments')
                .select('*')
                .eq('student_id', studentId)
                .eq('class_id', classId)
                .eq('month', month)
                .eq('year', year)
                .single();

            // If no record exists, return null (not an error)
            if (error?.code === 'PGRST116') {
                return null;
            }
            if (error) throw error;
            return data;
        } catch (error) {
            console.warn('Error fetching fee payment:', error);
            return null;
        }
    },

    // Create a new fee payment record
    async createFeePayment(payment: Partial<FeePayment>) {
        try {
            const { data, error } = await supabase
                .from('fee_payments')
                .insert([payment])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.warn('Error creating fee payment:', error);
            throw error;
        }
    },

    // Update fee payment status
    async updateFeePayment(paymentId: string, updates: Partial<FeePayment>) {
        try {
            const { data, error } = await supabase
                .from('fee_payments')
                .update(updates)
                .eq('id', paymentId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.warn('Error updating fee payment:', error);
            throw error;
        }
    },

    // Fetch all fee payments for a student (historical records)
    async getStudentFeePayments(studentId: string) {
        try {
            const { data, error } = await supabase
                .from('fee_payments')
                .select('*')
                .eq('student_id', studentId)
                .order('year', { ascending: false })
                .order('month', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.warn('Error fetching student fee payments:', error);
            throw error;
        }
    },

    // Get fee structure for a class
    async getFeeStructure(classId: string) {
        try {
            const { data, error } = await supabase
                .from('fee_structures')
                .select('*')
                .eq('class_id', classId)
                .single();

            if (error?.code === 'PGRST116') return null;
            if (error) throw error;
            return data;
        } catch (error) {
            console.warn('Error fetching fee structure:', error);
            return null;
        }
    },

    // Get students with fee status for a specific month/year
    async getStudentsWithFeeStatus(
        classId: string,
        month: number,
        year: number
    ): Promise<StudentWithFeeStatus[]> {
        try {
            // Fetch all active students in class
            const { data: students, error: studentsError } = await supabase
                .from('students')
                .select('id, full_name, class_id, email, parent_contact')
                .eq('class_id', classId)
                .eq('is_deleted', false)
                .order('full_name');

            if (studentsError) throw studentsError;
            if (!students?.length) return [];

            // Fetch fee payments for this specific month/year
            const { data: feePayments, error: feesError } = await supabase
                .from('fee_payments')
                .select('*')
                .eq('class_id', classId)
                .eq('month', month)
                .eq('year', year);

            if (feesError) throw feesError;

            // Create a map for quick lookup
            const feeMap = new Map(
                (feePayments || []).map(fee => [fee.student_id, fee])
            );

            // Combine students with their current month fee status
            return students.map(student => {
                const payment = feeMap.get(student.id);

                return {
                    ...student,
                    fee_payment_id: payment?.id,
                    current_month_payment_status: payment?.payment_status || 'pending',
                    current_month_amount: payment?.amount_paid,
                };
            });
        } catch (error) {
            console.warn('Error fetching students with fee status:', error);
            throw error;
        }
    },

    // Mark a fee as paid and create notification
    async markAsPaidWithNotification(
        studentId: string,
        classId: string,
        month: number,
        year: number,
        feeStructure: any,
        studentName: string,
        teacherId: string,
        months: string[]
    ) {
        try {
            console.log("🚀 Starting markAsPaidWithNotification...");
            console.log("📦 Input parameters:", {
                studentId,
                classId,
                month,
                year,
                feeStructure,
                studentName,
                teacherId,
            });

            const now = new Date();

            // Check if payment record exists
            console.log("🔍 Checking for existing payment record...");
            let payment = await this.getFeePaymentForMonth(studentId, classId, month, year);
            console.log("🧾 Existing payment record:", payment);

            let paymentResult;

            if (payment) {
                console.log("✏️ Updating existing fee payment record:", payment.id);
                paymentResult = await this.updateFeePayment(payment.id, {
                    payment_status: "paid",
                    payment_date: now.toISOString(),
                    amount_paid: feeStructure?.amount || "0",
                });
                console.log("✅ Payment updated successfully:", paymentResult);
            } else {
                console.log("🆕 Creating new fee payment record...");
                console.log("🧩 Searching student_fee record for:", { studentId, classId });

                const { data: studentFee, error: studentFeeError } = await supabase
                    .from("student_fees")
                    .select("id")
                    .eq("student_id", studentId)
                    .eq("class_id", classId)
                    .single();

                console.log("📄 Student fee query result:", { studentFee, studentFeeError });

                if (studentFeeError) {
                    console.warn("❌ Error fetching student_fee:", studentFeeError);
                    throw studentFeeError;
                }

                console.log("📤 Creating fee_payment entry...");
                paymentResult = await this.createFeePayment({
                    student_fee_id: studentFee?.id,
                    student_id: studentId,
                    class_id: classId,
                    month,
                    year,
                    amount_paid: feeStructure?.amount || "0",
                    payment_status: "paid",
                    payment_date: now.toISOString(),
                    payment_method: "manual",
                    notes: "Marked as paid by teacher",
                });
                console.log("✅ Fee payment created successfully:", paymentResult);
            }

            console.log("🧠 Preparing to insert notification...");
            console.log("📩 Notification variables:", {
                type: "fee_paid",
                title: `Fee Payment Confirmed`,
                message: `Payment for ${months[month - 1]} ${year} has been marked as paid. Amount: Rs ${feeStructure?.amount || "0"}`,
                entity_type: "fee_payment",
                entity_id: paymentResult?.id,
                created_by: teacherId,
                target_type: "individual",
                target_id: studentId,
            });

            // Create notification
            const { data: notif, error: notifError } = await supabase
                .from("notifications")
                .insert([
                    {
                        type: "fee_paid",
                        title: `Fee Payment Confirmed`,
                        message: `Payment for ${months[month - 1]} ${year} has been marked as paid. Amount: Rs ${feeStructure?.amount || "0"}`,
                        entity_type: "fee_payment",
                        entity_id: paymentResult?.id,
                        created_by: teacherId,
                        target_type: "individual",
                        target_id: studentId,
                        priority: "high",
                    },
                ])
                .select("id")
                .single();

            if (notifError) {
                console.warn("❌ Error creating payment notification:", notifError);
                throw notifError;
            }

            console.log("✅ Notification created successfully:", notif);

            // Add recipient
            if (notif) {
                console.log("📬 Adding notification recipient for:", { notification_id: notif.id, user_id: studentId });
                const { error: recError } = await supabase.from("notification_recipients").insert([
                    {
                        notification_id: notif.id,
                        user_id: studentId,
                        is_read: false,
                        is_deleted: false,
                    },
                ]);

                if (recError) {
                    console.warn("❌ Error adding notification recipient:", recError);
                } else {
                    console.log("✅ Notification recipient added successfully");
                }
            } else {
                console.warn("⚠️ No notification returned from insert, skipping recipients.");
            }

            console.log("🎉 Finished markAsPaidWithNotification successfully");
            return paymentResult;
        } catch (error) {
            console.warn("💥 Error in markAsPaidWithNotification:", error);
            throw error;
        }
    }

};

// services/notificationService.ts
export const notificationService = {
    async createNotification(notificationData: any) {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .insert([notificationData])
                .select('id')
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.warn('Error creating notification:', error);
            throw error;
        }
    },

    async addNotificationRecipients(recipients: any[]) {
        try {
            const { error } = await supabase
                .from('notification_recipients')
                .insert(recipients);

            if (error) throw error;
        } catch (error) {
            console.warn('Error adding notification recipients:', error);
            throw error;
        }
    },

    async getUnpaidStudents(classId: string, month: number, year: number) {
        try {
            const { data: allStudents, error: studentsError } = await supabase
                .from('students')
                .select('id, full_name, parent_contact')
                .eq('class_id', classId)
                .eq('is_deleted', false);

            if (studentsError) throw studentsError;

            const { data: paidRecords, error: paidError } = await supabase
                .from('fee_payments')
                .select('student_id')
                .eq('class_id', classId)
                .eq('month', month)
                .eq('year', year)
                .eq('payment_status', 'paid');

            if (paidError) throw paidError;

            const paidIds = new Set((paidRecords || []).map(p => p.student_id));

            return (allStudents || []).filter(s => !paidIds.has(s.id));
        } catch (error) {
            console.warn('Error getting unpaid students:', error);
            throw error;
        }
    },

    // Send WhatsApp message
    async sendWhatsAppMessage(phoneNumber: string, message: string) {
        try {
            console.log('📱 Sending WhatsApp message to:', phoneNumber);

            // Call your WhatsApp API endpoint
            const response = await fetch('YOUR_API_ENDPOINT/send-whatsapp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer YOUR_API_KEY',
                },
                body: JSON.stringify({
                    to: phoneNumber,
                    message: message,
                }),
            });

            if (!response.ok) {
                throw new Error(`WhatsApp API error: ${response.statusText}`);
            }

            console.log('✅ WhatsApp message sent successfully');
            return await response.json();
        } catch (error) {
            console.warn('❌ Error sending WhatsApp message:', error);
            throw error;
        }
    },

    // Format fee reminder message
    formatFeeReminderMessage(studentName: string, month: string, year: number, amount: string): string {
        return `Hello,\n\nThis is a friendly reminder that the fee for ${month} ${year} is due.\n\nStudent Name: ${studentName}\nAmount Due: Rs ${amount}\n\nPlease make the payment at your earliest convenience.\n\nThank you!`;
    },

    // Format fee paid confirmation message
    formatFeePaidMessage(studentName: string, month: string, year: number, amount: string): string {
        return `Hello,\n\nWe're happy to confirm that the fee payment has been received.\n\nStudent Name: ${studentName}\nMonth: ${month} ${year}\nAmount Paid: Rs ${amount}\n\nThank you for the payment!`;
    },
};

// services/classService.ts
export const classService = {
    async getTeacherClasses() {
        try {
            const { data, error } = await supabase
                .from('classes')
                .select('*')
                .order('name');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.warn('Error fetching classes:', error);
            throw error;
        }
    },
};