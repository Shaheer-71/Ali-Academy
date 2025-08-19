// hooks/useTeacherAnalytics.ts - FIXED TYPE ISSUES
import { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { StudentPerformance, ClassAnalytics, Class } from '../types/analytics';

// Define proper types for Supabase responses
type StudentWithClass = {
    id: string;
    full_name: string;
    roll_number: string | null;
    class_id: string;
    classes: {
        id: string;
        name: string;
    };
};


export const useTeacherAnalytics = (profileId: string | undefined, selectedClass: string = 'all') => {
    const [studentPerformances, setStudentPerformances] = useState<StudentPerformance[]>([]);
    const [classAnalytics, setClassAnalytics] = useState<ClassAnalytics[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!profileId) {
            setLoading(false);
            return;
        }

        const fetchAllData = async () => {
            try {
                setLoading(true);
                setError(null);

                console.log('=== Starting Teacher Analytics Fetch ===');
                console.log('Profile ID:', profileId);
                console.log('Selected Class:', selectedClass);

                console.log('Step 1: Fetching classes...');
                const { data: classesData, error: classesError } = await supabase
                    .from('classes')
                    .select('*')
                    .eq('teacher_id', profileId)
                    .order('name');

                if (classesError) {
                    console.error('Classes fetch error:', classesError);
                    throw new Error('Failed to fetch classes: ' + classesError.message);
                }

                const teacherClasses = (classesData || []) as Class[];
                console.log('Teacher classes found:', teacherClasses);
                setClasses(teacherClasses);

                if (teacherClasses.length === 0) {
                    console.log('No classes found for this teacher');
                    setError('No classes assigned to you yet.');
                    setStudentPerformances([]);
                    setClassAnalytics([]);
                    setLoading(false);
                    return;
                }

                // Step 2: Determine which classes to analyze
                let classIds: string[] = [];
                if (selectedClass === 'all') {
                    classIds = teacherClasses.map(c => c.id);
                } else {
                    const selectedClassExists = teacherClasses.find(c => c.id === selectedClass);
                    if (selectedClassExists) {
                        classIds = [selectedClass];
                    } else {
                        console.error('Selected class not found or not assigned to teacher');
                        classIds = teacherClasses.map(c => c.id);
                    }
                }

                console.log('Step 2: Class IDs to analyze:', classIds);

                if (classIds.length === 0) {
                    setStudentPerformances([]);
                    setClassAnalytics([]);
                    setLoading(false);
                    return;
                }

                // Step 3: Fetch students from selected classes - FIXED TYPE HANDLING
                console.log('Step 3: Fetching students...');
                const { data: studentsRaw, error: studentsError } = await supabase
                    .from('students')
                    .select(`
                        id,
                        full_name,
                        roll_number,
                        class_id,
                        classes!inner(id, name)
                    `)
                    .in('class_id', classIds)
                    .eq('is_deleted', false);

                if (studentsError) {
                    console.error('Students fetch error:', studentsError);
                    throw new Error('Failed to fetch students: ' + studentsError.message);
                }

                // CRITICAL FIX: Transform the data to ensure correct structure
                const students = (studentsRaw as any[])?.map((student: any) => ({
                    id: student.id,
                    full_name: student.full_name,
                    roll_number: student.roll_number,
                    class_id: student.class_id,
                    classes: {
                        id: student.classes.id,
                        name: student.classes.name
                    }
                })) || [] as StudentWithClass[];

                console.log('Students found:', students.length, students);

                if (students.length === 0) {
                    console.log('No students found in selected classes');
                    setStudentPerformances([]);
                    setClassAnalytics([]);
                    setLoading(false);
                    return;
                }

                // Step 4: Fetch performance data for each student
                console.log('Step 4: Fetching performance data...');
                const performanceData: StudentPerformance[] = [];

                for (const student of students) {
                    console.log(`Fetching data for student: ${student.full_name}`);
                    
                    try {
                        // Get attendance for this student
                        const { data: attendanceData } = await supabase
                            .from('attendance')
                            .select('status')
                            .eq('student_id', student.id);

                        const totalDays = attendanceData?.length || 0;
                        const presentDays = attendanceData?.filter(r => r.status === 'present').length || 0;
                        const attendance_rate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

                        // Get quiz results for this student in this class
                        const { data: quizResultsData } = await supabase
                            .from('quiz_results')
                            .select(`
                                percentage,
                                quizzes!inner(class_id)
                            `)
                            .eq('student_id', student.id)
                            .eq('quizzes.class_id', student.class_id);

                        const quizResults = quizResultsData || [];
                        const percentages = quizResults.map((r: any) => r.percentage || 0);
                        const average_grade = percentages.length > 0 ? 
                            Math.round(percentages.reduce((sum, p) => sum + p, 0) / percentages.length) : 0;

                        // Get total quizzes for this class
                        const { data: totalQuizzesData } = await supabase
                            .from('quizzes')
                            .select('id')
                            .eq('class_id', student.class_id);

                        const total_assignments = totalQuizzesData?.length || 0;
                        const assignments_completed = quizResults.length;

                        const studentPerformance: StudentPerformance = {
                            id: student.id,
                            full_name: student.full_name,
                            roll_number: student.roll_number || 'N/A',
                            attendance_rate,
                            average_grade,
                            assignments_completed,
                            total_assignments,
                            class_name: student.classes.name // NOW THIS WORKS
                        };

                        performanceData.push(studentPerformance);
                        console.log(`Performance for ${student.full_name}:`, studentPerformance);

                    } catch (studentError) {
                        console.error(`Error fetching data for student ${student.full_name}:`, studentError);
                        // Add default data for this student
                        performanceData.push({
                            id: student.id,
                            full_name: student.full_name,
                            roll_number: student.roll_number || 'N/A',
                            attendance_rate: 0,
                            average_grade: 0,
                            assignments_completed: 0,
                            total_assignments: 0,
                            class_name: student.classes.name // This works now too
                        });
                    }
                }

                console.log('All performance data:', performanceData);
                setStudentPerformances(performanceData);

                // Step 5: Calculate class analytics
                console.log('Step 5: Calculating class analytics...');
                const analyticsData: ClassAnalytics[] = [];

                for (const classId of classIds) {
                    const className = teacherClasses.find(c => c.id === classId)?.name || 'Unknown Class';
                    const classStudents = students.filter(s => s.class_id === classId);
                    const classPerformances = performanceData.filter(p => 
                        classStudents.some(s => s.id === p.id)
                    );

                    const total_students = classStudents.length;
                    const average_attendance = classPerformances.length > 0 ? 
                        Math.round(classPerformances.reduce((sum, p) => sum + p.attendance_rate, 0) / classPerformances.length) : 0;
                    const average_grade = classPerformances.length > 0 ? 
                        Math.round(classPerformances.reduce((sum, p) => sum + p.average_grade, 0) / classPerformances.length) : 0;

                    const topPerformer = classPerformances.length > 0 ? 
                        classPerformances.reduce((top, current) => 
                            current.average_grade > top.average_grade ? current : top
                        ) : null;

                    const classAnalytic: ClassAnalytics = {
                        class_id: classId,
                        class_name: className,
                        total_students,
                        average_attendance,
                        average_grade,
                        top_performer: topPerformer?.full_name || 'N/A'
                    };

                    analyticsData.push(classAnalytic);
                    console.log(`Analytics for ${className}:`, classAnalytic);
                }

                console.log('All class analytics:', analyticsData);
                setClassAnalytics(analyticsData);

                console.log('=== Teacher Analytics Fetch Complete ===');

            } catch (err) {
                console.error('Error in fetchAllData:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [profileId, selectedClass]);

    return { 
        studentPerformances, 
        classAnalytics, 
        classes, 
        loading, 
        error 
    };
};