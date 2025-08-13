import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface TimetableEntry {
    id: string;
    day: string;
    start_time: string;
    end_time: string;
    subject: string;
    room_number: string;
    class_id: string;
    teacher_id: string;
    created_at: string;
    updated_at: string;
    classes?: { name: string };
    profiles?: { full_name: string };
}

export const useTimetable = (classId?: string) => {
    const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const { profile } = useAuth();

    useEffect(() => {
        fetchTimetable();
    }, [classId, profile]);

    const fetchTimetable = async () => {
        try {
            let query = supabase
                .from('timetable')
                .select(`
          *,
          classes (name),
          profiles (full_name)
        `)
                .order('day')
                .order('start_time');

            if (classId) {
                query = query.eq('class_id', classId);
            }

            // Filter based on user role
            if (profile?.role === 'parent' || profile?.role === 'student') {
                // For parents/students, show timetable for their classes
                // This would need additional logic to determine student's classes
            }

            const { data, error } = await query;

            if (error) throw error;
            setTimetable(data || []);
        } catch (error) {
            console.error('Error fetching timetable:', error);
        } finally {
            setLoading(false);
        }
    };

    const addTimetableEntry = async (entryData: {
        day: string;
        start_time: string;
        end_time: string;
        subject: string;
        room_number: string;
        class_id: string;
    }) => {
        try {
            const { data, error } = await supabase
                .from('timetable')
                .insert([{
                    ...entryData,
                    teacher_id: profile!.id,
                }])
                .select()
                .single();

            if (error) throw error;

            await fetchTimetable();
            return { success: true, data };
        } catch (error) {
            console.error('Error adding timetable entry:', error);
            return { success: false, error };
        }
    };

    const updateTimetableEntry = async (entryId: string, updates: Partial<TimetableEntry>) => {
        try {
            const { data, error } = await supabase
                .from('timetable')
                .update(updates)
                .eq('id', entryId)
                .select()
                .single();

            if (error) throw error;

            await fetchTimetable();
            return { success: true, data };
        } catch (error) {
            console.error('Error updating timetable entry:', error);
            return { success: false, error };
        }
    };

    const deleteTimetableEntry = async (entryId: string) => {
        try {
            const { error } = await supabase
                .from('timetable')
                .delete()
                .eq('id', entryId);

            if (error) throw error;

            await fetchTimetable();
            return { success: true };
        } catch (error) {
            console.error('Error deleting timetable entry:', error);
            return { success: false, error };
        }
    };

    const getTodaySchedule = () => {
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        return timetable
            .filter(entry => entry.day === today)
            .sort((a, b) => a.start_time.localeCompare(b.start_time));
    };

    const getEntriesForDay = (day: string) => {
        return timetable
            .filter(entry => entry.day === day)
            .sort((a, b) => a.start_time.localeCompare(b.start_time))
            .slice(0, 3); // Max 3 classes per day
    };

    const getNextClass = () => {
        const todaySchedule = getTodaySchedule();
        const currentTime = new Date().toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
        });

        return todaySchedule.find(entry => entry.start_time > currentTime);
    };

    const getCurrentClass = () => {
        const todaySchedule = getTodaySchedule();
        const currentTime = new Date().toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
        });

        return todaySchedule.find(entry =>
            entry.start_time <= currentTime && entry.end_time >= currentTime
        );
    };

    return {
        timetable,
        loading,
        addTimetableEntry,
        updateTimetableEntry,
        deleteTimetableEntry,
        getTodaySchedule,
        getEntriesForDay,
        getNextClass,
        getCurrentClass,
        refetch: fetchTimetable,
    };
};