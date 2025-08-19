// hooks/useTimetable.ts - REFACTORED WITHOUT USELESS LOGIC

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/contexts/AuthContext';
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
} from '@/src/types/timetable';
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
        if (!profile) return;

        try {
            setLoading(true);
            setError(null);

            let query = supabase
                .from('timetable_view')
                .select('*')
                .order('day', { ascending: true })
                .order('start_time', { ascending: true });

            // Apply role-based filters
            if (profile.role === 'student') {
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
            } else if (profile.role === 'parent') {
                const { data: studentData } = await supabase
                    .from('students')
                    .select('class_id')
                    .eq('parent_id', profile.id)
                    .single();

                if (studentData?.class_id) {
                    query = query.eq('class_id', studentData.class_id);
                } else {
                    setTimetable([]);
                    setLoading(false);
                    return;
                }
            } else if (profile.role === 'teacher' && filters.class_id) {
                query = query.eq('class_id', filters.class_id);
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
            setError(err.message || 'Failed to fetch timetable');
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
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'timetable'
            }, () => {
                fetchTimetable();
            })
            .subscribe();
    }, [fetchTimetable]);

    // Get subject ID from name
    const getSubjectId = async (subjectName: string): Promise<string | null> => {
        const { data } = await supabase
            .from('subjects')
            .select('id')
            .eq('name', subjectName)
            .single();
        return data?.id || null;
    };

    // Create timetable entry
    const createEntry = useCallback(async (entry: CreateTimetableEntry): Promise<TimetableEntryWithDetails | null> => {
        if (!profile?.id) return null;

        try {
            // Validate entry
            const validation = await validateEntry(entry);
            if (!validation.is_valid) {
                const errorMsg = validation.conflicts.length > 0
                    ? `Time conflict with ${validation.conflicts[0].existing_entry.subject_name}`
                    : validation.errors[0];
                Alert.alert('Validation Error', errorMsg);
                return null;
            }

            // Get subject ID
            const subjectId = await getSubjectId(entry.subject);
            if (!subjectId) {
                Alert.alert('Error', 'Subject not found');
                return null;
            }

            const { data, error } = await supabase
                .from('timetable')
                .insert({
                    day: entry.day,
                    start_time: entry.start_time,
                    end_time: entry.end_time,
                    subject_id: subjectId,
                    room_number: entry.room_number,
                    class_id: entry.class_id,
                    teacher_id: entry.teacher_id,
                    created_by: profile.id
                })
                .select()
                .single();

            if (error) throw error;

            // Get complete entry with details
            const { data: completeEntry } = await supabase
                .from('timetable_view')
                .select('*')
                .eq('id', data.id)
                .single();

            if (completeEntry) {
                Alert.alert('Success', 'Timetable entry created');
                return completeEntry;
            }
            return null;
        } catch (err: any) {
            console.error('Error creating entry:', err);
            Alert.alert('Error', err.message || 'Failed to create entry');
            return null;
        }
    }, [profile?.id]);

    // Update timetable entry
    const updateEntry = useCallback(async (entry: UpdateTimetableEntry): Promise<TimetableEntryWithDetails | null> => {
        if (!profile?.id || !entry.id) return null;

        try {
            // Validate if time/day changed
            if (entry.start_time || entry.end_time || entry.day) {
                const currentEntry = timetable.find(t => t.id === entry.id);
                if (currentEntry) {
                    const validationEntry: CreateTimetableEntry = {
                        day: entry.day || currentEntry.day,
                        start_time: entry.start_time || currentEntry.start_time,
                        end_time: entry.end_time || currentEntry.end_time,
                        subject: entry.subject || currentEntry.subject_name,
                        room_number: entry.room_number || currentEntry.room_number,
                        class_id: entry.class_id || currentEntry.class_id,
                        teacher_id: entry.teacher_id || currentEntry.teacher_id,
                    };

                    const validation = await validateEntry(validationEntry, entry.id);
                    if (!validation.is_valid) {
                        const errorMsg = validation.conflicts.length > 0
                            ? `Time conflict with ${validation.conflicts[0].existing_entry.subject_name}`
                            : validation.errors[0];
                        Alert.alert('Validation Error', errorMsg);
                        return null;
                    }
                }
            }

            // Prepare update data
            const updateData: any = { updated_by: profile.id };

            if (entry.day) updateData.day = entry.day;
            if (entry.start_time) updateData.start_time = entry.start_time;
            if (entry.end_time) updateData.end_time = entry.end_time;
            if (entry.room_number) updateData.room_number = entry.room_number;
            if (entry.class_id) updateData.class_id = entry.class_id;
            if (entry.teacher_id) updateData.teacher_id = entry.teacher_id;

            if (entry.subject) {
                const subjectId = await getSubjectId(entry.subject);
                if (!subjectId) {
                    Alert.alert('Error', 'Subject not found');
                    return null;
                }
                updateData.subject_id = subjectId;
            }

            const { error } = await supabase
                .from('timetable')
                .update(updateData)
                .eq('id', entry.id);

            if (error) throw error;

            // Get updated entry
            const { data: completeEntry } = await supabase
                .from('timetable_view')
                .select('*')
                .eq('id', entry.id)
                .single();

            if (completeEntry) {
                Alert.alert('Success', 'Entry updated');
                return completeEntry;
            }
            return null;
        } catch (err: any) {
            console.error('Error updating entry:', err);
            Alert.alert('Error', err.message || 'Failed to update entry');
            return null;
        }
    }, [profile?.id, timetable]);

    // Delete timetable entry (soft delete)
    const deleteEntry = useCallback(async (id: string): Promise<boolean> => {
        if (!profile?.id) return false;

        try {
            const { error } = await supabase
                .from('timetable')
                .update({
                    deleted_at: new Date().toISOString(),
                    deleted_by: profile.id
                })
                .eq('id', id);

            if (error) throw error;

            Alert.alert('Success', 'Entry deleted');
            return true;
        } catch (err: any) {
            console.error('Error deleting entry:', err);
            Alert.alert('Error', err.message || 'Failed to delete entry');
            return false;
        }
    }, [profile?.id]);

    // Validate entry for conflicts
    const validateEntry = useCallback(async (
        entry: CreateTimetableEntry | UpdateTimetableEntry,
        excludeId?: string
    ): Promise<TimetableValidation> => {
        const errors: string[] = [];
        const conflicts: TimetableConflict[] = [];

        // Basic validation
        if (!entry.day || !entry.start_time || !entry.end_time || !entry.subject || !entry.room_number || !entry.class_id) {
            errors.push('All fields are required');
        }

        if (entry.start_time && entry.end_time && entry.start_time >= entry.end_time) {
            errors.push('End time must be after start time');
        }

        // Check conflicts within same class
        if (entry.day && entry.start_time && entry.end_time && entry.class_id) {
            try {
                let query = supabase
                    .from('timetable_view')
                    .select('*')
                    .eq('day', entry.day)
                    .eq('class_id', entry.class_id)
                    .or(
                        `and(start_time.lte.${entry.start_time},end_time.gt.${entry.start_time}),` +
                        `and(start_time.lt.${entry.end_time},end_time.gte.${entry.end_time}),` +
                        `and(start_time.gte.${entry.start_time},end_time.lte.${entry.end_time})`
                    );

                if (excludeId) {
                    query = query.neq('id', excludeId);
                }

                const { data: conflictingEntries } = await query;

                if (conflictingEntries?.length) {
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