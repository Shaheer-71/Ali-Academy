// src/hooks/useLectures.ts
import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/contexts/AuthContext';
import { Lecture, Class, Subject, ClassSubject } from '@/src/types/lectures';

// Main hook for lectures
export function useLectures(selectedClassId?: string) {
    const { profile } = useAuth();
    const [lectures, setLectures] = useState<Lecture[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchLectures = async () => {
        try {
            let query = supabase
                .from('lectures')
                .select(`
          *,
          classes (name),
          subjects (name),
          profiles (full_name)
        `)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            // Filter by class if selected
            if (selectedClassId) {
                query = query.eq('class_id', selectedClassId);
            }

            const { data, error } = await query;
            if (error) throw error;

            // Get view status for current user
            if (data && profile) {
                const lectureIds = data.map(lecture => lecture.id);
                const { data: viewData } = await supabase
                    .from('lecture_views')
                    .select('lecture_id, view_type')
                    .in('lecture_id', lectureIds)
                    .eq('user_id', profile.id);

                const viewMap = new Map();
                const downloadMap = new Map();

                viewData?.forEach(view => {
                    if (view.view_type === 'view') {
                        viewMap.set(view.lecture_id, true);
                    } else if (view.view_type === 'download') {
                        downloadMap.set(view.lecture_id, true);
                    }
                });

                const lecturesWithStatus = data.map(lecture => ({
                    ...lecture,
                    has_viewed: viewMap.has(lecture.id),
                    has_downloaded: downloadMap.has(lecture.id),
                }));

                setLectures(lecturesWithStatus);
            } else {
                setLectures(data || []);
            }
        } catch (error) {
            console.warn('Error fetching lectures:', error);
            Alert.alert('Error', 'Failed to load lectures');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (profile) {
            fetchLectures();
        }
    }, [profile, selectedClassId]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchLectures();
    };

    return { lectures, loading, refreshing, onRefresh };
}

// Hook for classes
export function useClasses() {
    const { profile } = useAuth();
    const [classes, setClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                let query = supabase.from('classes').select('*').order('name');

                // If teacher, get only their classes
                if ((profile?.role === 'teacher' || profile?.role === 'admin')) {
                    query = query.eq('teacher_id', profile.id);
                }

                const { data, error } = await query;
                if (error) throw error;
                setClasses(data || []);
            } catch (error) {
                console.warn('Error fetching classes:', error);
            } finally {
                setLoading(false);
            }
        };

        if (profile) {
            fetchClasses();
        }
    }, [profile]);

    return { classes, loading };
}

// Hook for subjects
export function useSubjects() {
    const [subjects, setSubjects] = useState<Subject[]>([]);

    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const { data, error } = await supabase
                    .from('subjects')
                    .select('*')
                    .eq('is_active', true)
                    .order('name');

                if (error) throw error;
                setSubjects(data || []);
            } catch (error) {
                console.warn('Error fetching subjects:', error);
            }
        };

        fetchSubjects();
    }, []);

    return { subjects };
}

// Hook for class subjects
export function useClassSubjects() {
    const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);

    const fetchClassSubjects = async (classId: string) => {
        try {
            const { data, error } = await supabase
                .from('classes_subjects')
                .select(`
          *,
          subjects (*)
        `)
                .eq('class_id', classId)
                .eq('is_active', true);

            if (error) throw error;
            const subjects = data || [];
            setClassSubjects(subjects);
            return subjects;
        } catch (error) {
            console.warn('Error fetching class subjects:', error);
            return [];
        }
    };

    return { classSubjects, fetchClassSubjects };
}