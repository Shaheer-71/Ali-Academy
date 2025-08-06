import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface AttendanceRecord {
  id: string;
  student_id: string;
  class_id: string;
  date: string;
  arrival_time: string;
  status: 'present' | 'late' | 'absent';
  late_minutes?: number;
  students?: {
    full_name: string;
    roll_number: string;
  };
}

interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  attendanceRate: number;
}

export const useAttendance = (classId?: string, studentId?: string) => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({
    totalDays: 0,
    presentDays: 0,
    lateDays: 0,
    absentDays: 0,
    attendanceRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    if (classId || studentId) {
      fetchAttendanceData();
    }
  }, [classId, studentId]);

  const fetchAttendanceData = async () => {
    try {
      let query = supabase
        .from('attendance')
        .select(`
          *,
          students (
            full_name,
            roll_number
          )
        `)
        .order('date', { ascending: false });

      if (classId) {
        query = query.eq('class_id', classId);
      }

      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setAttendanceRecords(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (records: AttendanceRecord[]) => {
    const totalDays = records.length;
    const presentDays = records.filter(r => r.status === 'present').length;
    const lateDays = records.filter(r => r.status === 'late').length;
    const absentDays = records.filter(r => r.status === 'absent').length;
    const attendanceRate = totalDays > 0 ? Math.round(((presentDays + lateDays) / totalDays) * 100) : 0;

    setAttendanceStats({
      totalDays,
      presentDays,
      lateDays,
      absentDays,
      attendanceRate,
    });
  };

  const markAttendance = async (
    studentId: string,
    classId: string,
    status: 'present' | 'late' | 'absent',
    arrivalTime?: string,
    date?: string
  ) => {
    try {
      const attendanceDate = date || new Date().toISOString().split('T')[0];
      const currentTime = arrivalTime || new Date().toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      });

      // Calculate if late
      const classStartTime = new Date(`${attendanceDate}T16:00:00`);
      const cutoffTime = new Date(`${attendanceDate}T16:15:00`);
      const [hours, minutes] = currentTime.split(':').map(Number);
      const arrivalDateTime = new Date(`${attendanceDate}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`);
      
      let finalStatus = status;
      let lateMinutes: number | undefined;

      if (status === 'present' && arrivalDateTime > cutoffTime) {
        finalStatus = 'late';
        lateMinutes = Math.ceil((arrivalDateTime.getTime() - classStartTime.getTime()) / (1000 * 60));
      }

      const { error } = await supabase
        .from('attendance')
        .upsert({
          student_id: studentId,
          class_id: classId,
          date: attendanceDate,
          arrival_time: currentTime,
          status: finalStatus,
          late_minutes: lateMinutes,
          marked_by: profile!.id,
        });

      if (error) throw error;

      await fetchAttendanceData();
      return { success: true, status: finalStatus, lateMinutes };
    } catch (error) {
      console.error('Error marking attendance:', error);
      return { success: false, error };
    }
  };

  const getAttendanceForDate = (date: string) => {
    return attendanceRecords.filter(record => record.date === date);
  };

  const getStudentAttendance = (studentId: string, limit?: number) => {
    const records = attendanceRecords.filter(record => record.student_id === studentId);
    return limit ? records.slice(0, limit) : records;
  };

  return {
    attendanceRecords,
    attendanceStats,
    loading,
    markAttendance,
    getAttendanceForDate,
    getStudentAttendance,
    refetch: fetchAttendanceData,
  };
};