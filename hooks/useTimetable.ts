// hooks/useTimetable.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
    TimetableEntryWithDetails,
    CreateTimetableEntry,
    UpdateTimetableEntry,
    TimetableFilters,
    TimetableValidation,
    TimetableConflict,
    UseTimetableReturn,
    DayOfWeek,
    DAYS_ORDER
} from '@/types/timetable';
import { Alert } from 'react-native';

export const useTimetable = (): UseTimetableReturn => {
    const { profile } = useAuth();
    const [timetable, setTimetable] = useState<TimetableEntryWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFiltersState] = useState<TimetableFilters>({});
    const subscriptionRef = useRef<any>(null);

    // Fetch timetable data
    const fetchTimetable = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            let query = supabase
                .from('timetable_view')
                .select('*')
                .order('day', { ascending: true })
                .order('start_time', { ascending: true });

            // Apply filters based on user role and selected filters
            if (profile?.role === 'student') {
                // Students can only see their class timetable
                const { data: studentData } = await supabase
                    .from('students')
                    .select('class_id')
                    .eq('id', profile.id)
                    .single();

                if (studentData?.class_id) {
                    query = query.eq('class_id', studentData.class_id);
                } else {
                    setTimetable([]);
                    setLoading(false);
                    return;
                }
            } else if (profile?.role === 'teacher') {
                // If a specific class is selected, show that class
                if (filters.class_id) {
                    query = query.eq('class_id', filters.class_id);
                } else {
                    // If no class selected, show all classes this teacher teaches
                    query = query.eq('teacher_id', profile.id);
                }
            } else if (profile?.role === 'admin') {
                // Admin can see all classes, or filter by selected class
                if (filters.class_id) {
                    query = query.eq('class_id', filters.class_id);
                }
                // If no class selected, show all classes
            }

            // Apply additional filters
            if (filters.teacher_id) {
                query = query.eq('teacher_id', filters.teacher_id);
            }
            if (filters.day) {
                query = query.eq('day', filters.day);
            }
            if (filters.search_query) {
                query = query.or(
                    `subject_name.ilike.%${filters.search_query}%,` +
                    `room_number.ilike.%${filters.search_query}%,` +
                    `teacher_name.ilike.%${filters.search_query}%,` +
                    `class_name.ilike.%${filters.search_query}%`
                );
            }

            const { data, error } = await query;

            if (error) throw error;

            setTimetable(data || []);
        } catch (err: any) {
            console.error('Error fetching timetable:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [profile, filters]);

    // Set up real-time subscription
    const setupRealtimeSubscription = useCallback(() => {
        if (subscriptionRef.current) {
            subscriptionRef.current.unsubscribe();
        }

        subscriptionRef.current = supabase
            .channel('timetable_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'timetable'
                },
                () => {
                    fetchTimetable();
                }
            )
            .subscribe();
    }, [fetchTimetable]);

    // Create timetable entry
    const createEntry = useCallback(async (entry: CreateTimetableEntry): Promise<TimetableEntryWithDetails | null> => {
        try {
            // Validate entry first
            const validation = await validateEntry(entry);
            if (!validation.is_valid) {
                const errorMsg = validation.conflicts.length > 0
                    ? `Time conflict detected with existing ${validation.conflicts[0].existing_entry.subject} class`
                    : validation.errors[0];
                Alert.alert('Validation Error', errorMsg);
                return null;
            }

            const { data, error } = await supabase
                .from('timetable')
                .insert([{
                    ...entry,
                    created_by: profile?.id
                }])
                .select(`
          *,
          subject_name:subjects(name),
          class_name:classes(name),
          teacher_name:profiles(full_name),
          teacher_avatar:profiles(avatar_url)
        `)
                .single();

            if (error) throw error;

            // Transform the response to match our type
            const newEntry: TimetableEntryWithDetails = {
                ...data,
                subject_name: data.subject_name?.name,
                class_name: data.class_name?.name,
                teacher_name: data.teacher_name?.full_name,
                teacher_avatar: data.teacher_avatar?.avatar_url
            };

            Alert.alert('Success', 'Timetable entry created successfully');
            return newEntry;
        } catch (err: any) {
            console.error('Error creating timetable entry:', err);
            Alert.alert('Error', err.message);
            return null;
        }
    }, [profile?.id]);

    // Update timetable entry
    const updateEntry = useCallback(async (entry: UpdateTimetableEntry): Promise<TimetableEntryWithDetails | null> => {
        try {
            // Validate entry if time or day is being changed
            if (entry.start_time || entry.end_time || entry.day) {
                const currentEntry = timetable.find(t => t.id === entry.id);
                if (currentEntry) {
                    const validationEntry = {
                        day: entry.day || currentEntry.day,
                        start_time: entry.start_time || currentEntry.start_time,
                        end_time: entry.end_time || currentEntry.end_time,
                        subject_id: entry.subject_id || currentEntry.subject_id,
                        room_number: entry.room_number || currentEntry.room_number,
                        class_id: entry.class_id || currentEntry.class_id,
                        teacher_id: entry.teacher_id || currentEntry.teacher_id,
                    };

                    const validation = await validateEntry(validationEntry, entry.id);
                    if (!validation.is_valid) {
                        const errorMsg = validation.conflicts.length > 0
                            ? `Time conflict detected with existing ${validation.conflicts[0].existing_entry.subject} class`
                            : validation.errors[0];
                        Alert.alert('Validation Error', errorMsg);
                        return null;
                    }
                }
            }

            const { data, error } = await supabase
                .from('timetable')
                .update({
                    ...entry,
                    updated_by: profile?.id
                })
                .eq('id', entry.id)
                .select(`
          *,
          subject_name:subjects(name),
          class_name:classes(name),
          teacher_name:profiles(full_name),
          teacher_avatar:profiles(avatar_url)
        `)
                .single();

            if (error) throw error;

            // Transform the response to match our type
            const updatedEntry: TimetableEntryWithDetails = {
                ...data,
                subject_name: data.subject_name?.name,
                class_name: data.class_name?.name,
                teacher_name: data.teacher_name?.full_name,
                teacher_avatar: data.teacher_avatar?.avatar_url
            };

            Alert.alert('Success', 'Timetable entry updated successfully');
            return updatedEntry;
        } catch (err: any) {
            console.error('Error updating timetable entry:', err);
            Alert.alert('Error', err.message);
            return null;
        }
    }, [profile?.id, timetable]);

    // Soft delete timetable entry
    const deleteEntry = useCallback(async (id: string): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from('timetable')
                .update({
                    deleted_at: new Date().toISOString(),
                    deleted_by: profile?.id
                })
                .eq('id', id);

            if (error) throw error;

            Alert.alert('Success', 'Timetable entry deleted successfully');
            return true;
        } catch (err: any) {
            console.error('Error deleting timetable entry:', err);
            Alert.alert('Error', err.message);
            return false;
        }
    }, [profile?.id]);

    // Validate timetable entry for conflicts
    const validateEntry = useCallback(async (
        entry: CreateTimetableEntry | UpdateTimetableEntry,
        excludeId?: string
    ): Promise<TimetableValidation> => {
        const errors: string[] = [];
        const conflicts: TimetableConflict[] = [];

        // Basic validation
        if (!entry.day || !entry.start_time || !entry.end_time || !entry.subject_id || !entry.room_number || !entry.class_id) {
            errors.push('All fields are required');
        }

        if (entry.start_time && entry.end_time && entry.start_time >= entry.end_time) {
            errors.push('End time must be after start time');
        }

        // Check for time conflicts within same class only
        if (entry.day && entry.start_time && entry.end_time && entry.class_id) {
            try {
                let query = supabase
                    .from('timetable_view')
                    .select('*')
                    .eq('day', entry.day)
                    .eq('class_id', entry.class_id) // Only check conflicts within same class
                    .or(
                        `and(start_time.lte.${entry.start_time},end_time.gt.${entry.start_time}),` +
                        `and(start_time.lt.${entry.end_time},end_time.gte.${entry.end_time}),` +
                        `and(start_time.gte.${entry.start_time},end_time.lte.${entry.end_time})`
                    );

                if (excludeId) {
                    query = query.neq('id', excludeId);
                }

                const { data: conflictingEntries } = await query;

                if (conflictingEntries && conflictingEntries.length > 0) {
                    conflictingEntries.forEach(conflictEntry => {
                        conflicts.push({
                            existing_entry: conflictEntry,
                            conflicting_time: {
                                start: entry.start_time!,
                                end: entry.end_time!
                            }
                        });
                    });
                }
            } catch (err) {
                console.error('Error checking conflicts:', err);
                errors.push('Unable to validate time conflicts');
            }
        }

        return {
            is_valid: errors.length === 0 && conflicts.length === 0,
            conflicts,
            errors
        };
    }, []);

    // Utility functions
    const getEntriesForDay = useCallback((day: DayOfWeek): TimetableEntryWithDetails[] => {
        return timetable
            .filter(entry => entry.day === day)
            .sort((a, b) => a.start_time.localeCompare(b.start_time));
    }, [timetable]);

    const getEntriesForClass = useCallback((class_id: string): TimetableEntryWithDetails[] => {
        return timetable
            .filter(entry => entry.class_id === class_id)
            .sort((a, b) => {
                const dayOrder = DAYS_ORDER.indexOf(a.day) - DAYS_ORDER.indexOf(b.day);
                return dayOrder !== 0 ? dayOrder : a.start_time.localeCompare(b.start_time);
            });
    }, [timetable]);

    const getEntriesForTeacher = useCallback((teacher_id: string): TimetableEntryWithDetails[] => {
        return timetable
            .filter(entry => entry.teacher_id === teacher_id)
            .sort((a, b) => {
                const dayOrder = DAYS_ORDER.indexOf(a.day) - DAYS_ORDER.indexOf(b.day);
                return dayOrder !== 0 ? dayOrder : a.start_time.localeCompare(b.start_time);
            });
    }, [timetable]);

    const setFilters = useCallback((newFilters: Partial<TimetableFilters>) => {
        setFiltersState(prev => ({ ...prev, ...newFilters }));
    }, []);

    const refreshTimetable = useCallback(async () => {
        await fetchTimetable();
    }, [fetchTimetable]);

    // Effects
    useEffect(() => {
        if (profile) {
            fetchTimetable();
            setupRealtimeSubscription();
        }

        return () => {
            if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe();
            }
        };
    }, [profile, fetchTimetable, setupRealtimeSubscription]);

    useEffect(() => {
        if (profile) {
            fetchTimetable();
        }
    }, [filters, fetchTimetable]);

    return {
        timetable,
        loading,
        error,
        filters,
        setFilters,
        createEntry,
        updateEntry,
        deleteEntry,
        getEntriesForDay,
        getEntriesForClass,
        getEntriesForTeacher,
        validateEntry,
        refreshTimetable
    };
};