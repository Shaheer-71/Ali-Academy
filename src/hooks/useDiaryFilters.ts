// hooks/useDiaryFilters.ts
import { useState, useMemo } from 'react';

interface DiaryAssignment {
    id: string;
    title: string;
    description: string;
    due_date: string;
    file_url?: string;
    class_id?: string;
    student_id?: string;
    subject_id?: string;
    created_at: string;
    classes?: { name: string };
    students?: { full_name: string };
}

export const useDiaryFilters = (assignments: DiaryAssignment[], profile: any) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

    const filteredAssignments = useMemo(() => {
        return assignments.filter(assignment => {
            const matchesSearch =
                assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                assignment.description.toLowerCase().includes(searchQuery.toLowerCase());

            if (!matchesSearch) return false;

            if (profile?.role === 'student' && selectedSubject) {
                return assignment.subject_id === selectedSubject;
            }

            return true;
        });
    }, [assignments, searchQuery, selectedSubject, profile]);

    return {
        searchQuery,
        setSearchQuery,
        selectedSubject,
        setSelectedSubject,
        filteredAssignments,
    };
};