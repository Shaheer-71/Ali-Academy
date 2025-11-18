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

                const { data: classesIDData, error: classesIDError } = await supabase
                    .from('teacher_subject_enrollments')
                    .select('class_id , subject_id')
                    .eq('teacher_id', profileId)

                if (classesIDError) {
                    console.warn('Enrollments fetch error:', classesIDError);
                    throw new Error('Unable to load your class assignments. Please check your internet connection and try again.');
                }

                let classIDs = classesIDData?.map(item => item.class_id) || [];
                let subjectIDs = classesIDData?.map(item => item.subject_id) || [];

                const { data: studentIDData, error: studentIDError } = await supabase
                    .from('student_subject_enrollments')
                    .select('student_id , class_id')
                    .in('class_id', classIDs)
                    .in('subject_id', subjectIDs);

                let studentsenrolledId = studentIDData?.map(item => item.student_id) || [];

                console.log('Fetched class IDs from enrollments:', classIDs);
                console.log('Fetched student IDs from enrollments:', studentsenrolledId);

                const { data: classesData, error: classesError } = await supabase
                    .from('classes')
                    .select('*')
                    .in('id', classIDs)
                    .order('name');

                if (classesError) {
                    console.warn('Classes fetch error:', classesError);
                    throw new Error('Unable to load class information. Please try refreshing the page.');
                }

                const teacherClasses = (classesData || []) as Class[];
                setClasses(teacherClasses);

                if (teacherClasses.length === 0) {
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
                        console.warn('Selected class not found or not assigned to teacher');
                        classIds = teacherClasses.map(c => c.id);
                    }
                }


                if (classIds.length === 0) {
                    setStudentPerformances([]);
                    setClassAnalytics([]);
                    setLoading(false);
                    return;
                }

                // Step 3: Fetch students from selected classes - FIXED TYPE HANDLING
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
                    .in('id', studentsenrolledId)
                    .eq('is_deleted', false);

                if (studentsError) {
                    console.warn('Students fetch error:', studentsError);
                    throw new Error('Unable to load student information from the selected classes. Please try again.');
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


                if (students.length === 0) {
                    setStudentPerformances([]);
                    setClassAnalytics([]);
                    setLoading(false);
                    return;
                }

                // Step 4: Fetch performance data for each student
                const performanceData: StudentPerformance[] = [];

                for (const student of students) {

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

                    } catch (studentError) {
                        console.warn(`Error fetching data for student ${student.full_name}:`, studentError);
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

                setStudentPerformances(performanceData);

                // Step 5: Calculate class analytics
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
                }

                setClassAnalytics(analyticsData);


            } catch (err) {
                console.warn('Error in fetchAllData:', err);
                setError(err instanceof Error ? err.message : 'Unable to load analytics data. Please check your internet connection and try again.');
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