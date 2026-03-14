// Updated StudentsScreen component
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Modal,
    Alert,
    ActivityIndicator,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useStudents } from '@/src/hooks/useStudents';
import { createStudentSimple, getStudentsWithoutPasswords } from '@/src/lib/api/simple-student-creation';
import {
    Plus,
    Users,
    Phone,
    Hash,
    BookOpen,
    X,
    AlertCircle,
    ChevronRight,
    Check,
} from 'lucide-react-native';
import { Dimensions, TouchableWithoutFeedback } from 'react-native';
import { supabase } from '@/src/lib/supabase';
import TopSection from '../common/TopSections';
import { useScreenAnimation } from '@/src/utils/animations';
import { SwipeableStudentCard } from '@/src/components/students/SwipeableStudentCard';
import StudentDetailModal from '../students/StudentDetailModal';
import {
    handleStudentFetchError,
    handleStudentCreateError,
    handleStudentDeleteError,
    handleClassFetchErrorForStudents,
    handleSubjectFetchErrorForStudents,
    handlePasswordStatusFetchError,
    handleValidationError,
} from '@/src/utils/errorHandler/studentErrorHandling';
import { ErrorModal } from '@/src/components/common/ErrorModal';
import { RefreshControl } from 'react-native';
import { SkeletonBox } from '@/src/components/common/Skeleton';



interface Class {
    id: string;
    name: string;
}

interface Subject {
    id: string;
    name: string;
}

interface StudentsWithoutPasswords {
    id: string;
    full_name: string;
    email: string;
    roll_number: string;
    hasPassword: boolean;
    registrationCompleted: boolean;
    classes: { name: string };
}

export default function StudentsScreen() {
    const { profile } = useAuth();
    const { colors } = useTheme();
    const { students, loading, addStudent, refetch } = useStudents();
    const [classes, setClasses] = useState<Class[]>([]);
    const [studentsWithoutPasswords, setStudentsWithoutPasswords] = useState<StudentsWithoutPasswords[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [passwordStatusModalVisible, setPasswordStatusModalVisible] = useState(false);
    const [creating, setCreating] = useState(false);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [loadingSubjects, setLoadingSubjects] = useState(false);
    const screenStyle = useScreenAnimation();
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showStudentModal, setShowStudentModal] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [editingStudent, setEditingStudent] = useState<any>(null);
    const [openCardId, setOpenCardId] = useState<string | null>(null);
    const [scrollEnabled, setScrollEnabled] = useState(true);

    // Filter state
    const [filterVisible, setFilterVisible] = useState(false);
    const [filterStep, setFilterStep] = useState<'class' | 'subject'>('class');
    const [pendingFilterClass, setPendingFilterClass] = useState('all');
    const [pendingFilterSubject, setPendingFilterSubject] = useState('all');
    const [selectedFilterClass, setSelectedFilterClass] = useState('all');
    const [selectedFilterSubject, setSelectedFilterSubject] = useState('all');
    const [filterSubjects, setFilterSubjects] = useState<Subject[]>([]);
    const [enrolledStudentIds, setEnrolledStudentIds] = useState<Set<string> | null>(null);


    const [newStudent, setNewStudent] = useState({
        full_name: '',
        roll_number: '',
        phone_number: '',
        parent_contact: '',
        class_id: '',
        subject_ids: [] as string[],
        gender: '' as 'male' | 'female' | 'other' | '',
        address: '',
        admission_date: new Date().toISOString().split('T')[0],
        date_of_birth: '',
        emergency_contact: '',
        parent_name: '',
        medical_conditions: '',
        notes: '',
    });

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([
            refetch(),                    // reload students
            fetchClasses(),               // reload classes
            fetchStudentsPasswordStatus() // reload pending students
        ]);
        setRefreshing(false);
    };

    const [errorModal, setErrorModal] = useState({
        visible: false,
        title: '',
        message: '',
    });

    const showError = (error: any, handler?: (error: any) => any) => {
        const errorInfo = handler ? handler(error) : {
            title: 'Error',
            message: error?.message || 'An unexpected error occurred'
        };
        setErrorModal({
            visible: true,
            title: errorInfo.title,
            message: errorInfo.message,
        });
    };

    // Use Alert.alert when a Modal is already open — ErrorModal renders behind it
    const showModalError = (error: any, handler?: (error: any) => any) => {
        const errorInfo = handler ? handler(error) : {
            title: 'Error',
            message: error?.message || 'An unexpected error occurred'
        };
        Alert.alert(errorInfo.title, errorInfo.message);
    };


    useEffect(() => {
        if ((profile?.role === 'teacher' || profile?.role === 'admin')) {
            fetchClasses();
            fetchStudentsPasswordStatus();
        }
    }, [profile]);

    const fetchClasses = async () => {
        try {
            const { data, error } = await supabase
                .from('classes')
                .select('*')
                .order('name');
            if (error) throw error;
            setClasses(data || []);
            // No default class selection — user must pick a class first
        } catch (error) {
            console.warn('Error fetching classes:', error);
            showError(error, handleClassFetchErrorForStudents);
        }
    };

    const fetchSubjectsForClass = async (classId: string) => {
        if (!classId) {
            setSubjects([]);
            setSelectedSubjects([]);
            return;
        }

        setLoadingSubjects(true);
        try {
            const { data, error } = await supabase
                .from('classes_subjects')
                .select('subject_id, subjects(id, name)')
                .eq('class_id', classId)
                .eq('is_active', true);

            if (error) throw error;

            if (!data || data.length === 0) {
                setSubjects([]);
                setSelectedSubjects([]);
                showError(
                    { message: 'No subjects assigned to this class yet' },
                    handleSubjectFetchErrorForStudents
                );
                return;
            }

            const subjectsData = data
                .map((row: any) => row.subjects)
                .filter(Boolean)
                .sort((a: any, b: any) => a.name.localeCompare(b.name));

            setSubjects(subjectsData);
            setSelectedSubjects([]);
        } catch (error) {
            console.warn('Error fetching subjects:', error);
            showError(error, handleSubjectFetchErrorForStudents);
            setSubjects([]);
        } finally {
            setLoadingSubjects(false);
        }
    };

    const fetchStudentsPasswordStatus = async () => {
        try {
            const studentsWithoutPass = await getStudentsWithoutPasswords();
            setStudentsWithoutPasswords(studentsWithoutPass);
        } catch (error) {
            console.warn('Error fetching students without passwords:', error);
            showError(error, handlePasswordStatusFetchError);
        }
    };

    const resetForm = () => {
        setEditingStudent(null);
        setNewStudent({
            full_name: '',
            roll_number: '',
            phone_number: '',
            parent_contact: '',
            class_id: '',
            subject_ids: [],
            gender: '' as 'male' | 'female' | 'other' | '',
            address: '',
            admission_date: new Date().toISOString().split('T')[0],
            date_of_birth: '',
            emergency_contact: '',
            parent_name: '',
            medical_conditions: '',
            notes: '',
        });
        setSelectedSubjects([]);
        setSubjects([]);
    };

    const handleAddStudent = async () => {
        if (!newStudent.full_name.trim()) {
            showModalError({ field: 'full_name' }, () => handleValidationError('full_name'));
            return;
        }
        if (!newStudent.roll_number.trim()) {
            showModalError({ field: 'roll_number' }, () => handleValidationError('roll_number'));
            return;
        }
        if (!newStudent.phone_number.trim()) {
            showModalError({ field: 'phone_number' }, () => handleValidationError('phone_number'));
            return;
        }
        if (!newStudent.class_id) {
            showModalError({ field: 'class_id' }, () => handleValidationError('class_id'));
            return;
        }
        if (!newStudent.parent_contact.trim()) {
            showModalError({ field: 'parent_contact' }, () => handleValidationError('parent_contact'));
            return;
        }
        if (!newStudent.gender) {
            showModalError({ field: 'gender' }, () => handleValidationError('gender'));
            return;
        }
        if (!newStudent.address.trim()) {
            showModalError({ field: 'address' }, () => handleValidationError('address'));
            return;
        }
        if (!newStudent.admission_date) {
            showModalError({ field: 'admission_date' }, () => handleValidationError('admission_date'));
            return;
        }
        if (!newStudent.subject_ids || newStudent.subject_ids.length === 0) {
            showModalError({ field: 'subject_ids' }, () => handleValidationError('subject_ids'));
            return;
        }

        setCreating(true);
        try {
            const result = await createStudentSimple(newStudent, profile!.id);

            if (result.success) {
                await addStudent({
                    full_name: newStudent.full_name,
                    roll_number: newStudent.roll_number,
                    class_id: newStudent.class_id,
                    parent_contact: newStudent.parent_contact,
                });

                const studentEmail = result.data?.email;

                Alert.alert(
                    'Success',
                    `Student created successfully!\n\nEmail: ${studentEmail}\n\nThe student can now use this email to register and set their password.`,
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                setModalVisible(false);
                                resetForm();
                                fetchStudentsPasswordStatus();
                                refetch();
                            },
                        },
                    ]
                );
            } else {
                showModalError({ message: result.error }, handleStudentCreateError);
            }
        } catch (error: any) {
            showModalError(error, handleStudentCreateError);
        } finally {
            setCreating(false);
        }
    };

    const handleEditStudent = async (student: any) => {
        setEditingStudent(student);
        setNewStudent({
            full_name: student.full_name || '',
            roll_number: student.roll_number || '',
            phone_number: student.phone_number || '',
            parent_contact: student.parent_contact || '',
            class_id: student.class_id || '',
            subject_ids: [],
            gender: student.gender || '',
            address: student.address || '',
            admission_date: student.admission_date || '',
            date_of_birth: student.date_of_birth || '',
            emergency_contact: student.emergency_contact || '',
            parent_name: student.parent_name || '',
            medical_conditions: student.medical_conditions || '',
            notes: student.notes || '',
        });

        // Load subjects for the student's class then pre-select enrolled ones
        if (student.class_id) {
            setLoadingSubjects(true);
            try {
                const [classSubjectsRes, enrolledRes] = await Promise.all([
                    supabase
                        .from('classes_subjects')
                        .select('subject_id, subjects(id, name)')
                        .eq('class_id', student.class_id)
                        .eq('is_active', true),
                    supabase
                        .from('student_subject_enrollments')
                        .select('subject_id')
                        .eq('student_id', student.id)
                        .eq('is_active', true),
                ]);

                const subjectsData = (classSubjectsRes.data || [])
                    .map((row: any) => row.subjects)
                    .filter(Boolean);
                setSubjects(subjectsData);

                const enrolledIds = (enrolledRes.data || []).map((r: any) => r.subject_id);
                setSelectedSubjects(enrolledIds);
                setNewStudent(prev => ({ ...prev, subject_ids: enrolledIds }));
            } catch (e) {
                console.warn('Error loading subjects for edit:', e);
            } finally {
                setLoadingSubjects(false);
            }
        }

        setModalVisible(true);
    };

    const handleUpdateStudent = async () => {
        if (!editingStudent) return;
        if (!newStudent.full_name.trim()) {
            showModalError({ field: 'full_name' }, () => handleValidationError('full_name'));
            return;
        }
        if (selectedSubjects.length === 0) {
            showModalError({ field: 'subject_ids' }, () => handleValidationError('subject_ids'));
            return;
        }

        setCreating(true);
        try {
            const classChanged = newStudent.class_id !== editingStudent.class_id;

            // 1. Update students table
            const { error: studentErr } = await supabase
                .from('students')
                .update({
                    full_name: newStudent.full_name.trim(),
                    class_id: newStudent.class_id || null,
                    phone_number: newStudent.phone_number.trim() || null,
                    parent_contact: newStudent.parent_contact.trim() || null,
                    gender: newStudent.gender || null,
                    address: newStudent.address.trim() || null,
                    admission_date: newStudent.admission_date || null,
                    date_of_birth: newStudent.date_of_birth || null,
                    emergency_contact: newStudent.emergency_contact.trim() || null,
                    parent_name: newStudent.parent_name.trim() || null,
                    medical_conditions: newStudent.medical_conditions.trim() || null,
                    notes: newStudent.notes.trim() || null,
                })
                .eq('id', editingStudent.id);
            if (studentErr) throw studentErr;

            // 2. Update profiles table (full_name + contact_number)
            await supabase
                .from('profiles')
                .update({
                    full_name: newStudent.full_name.trim(),
                    contact_number: newStudent.phone_number.trim() || null,
                })
                .eq('email', `${editingStudent.roll_number.toLowerCase()}@aliacademy.com`);

            // 3. Smart subject enrollment update — no hard deletes
            const { data: existingEnrollments } = await supabase
                .from('student_subject_enrollments')
                .select('id, subject_id, is_active')
                .eq('student_id', editingStudent.id);

            const existingMap = new Map(
                (existingEnrollments || []).map((e: any) => [e.subject_id, e])
            );

            const toEnable: string[]  = [];  // exists but inactive → re-enable
            const toInsert: string[]  = [];  // doesn't exist → insert fresh
            const toDisable: string[] = [];  // active but not in new selection → disable

            for (const subject_id of selectedSubjects) {
                const row = existingMap.get(subject_id);
                if (row) {
                    if (!row.is_active) toEnable.push(subject_id);
                    // already active → nothing to do
                } else {
                    toInsert.push(subject_id);
                }
            }

            for (const [subject_id, row] of existingMap as Map<string, any>) {
                if (!selectedSubjects.includes(subject_id) && row.is_active) {
                    toDisable.push(subject_id);
                }
            }

            if (toEnable.length > 0) {
                await supabase
                    .from('student_subject_enrollments')
                    .update({ is_active: true })
                    .eq('student_id', editingStudent.id)
                    .in('subject_id', toEnable);
            }

            if (toInsert.length > 0) {
                const { error: insertErr } = await supabase
                    .from('student_subject_enrollments')
                    .insert(toInsert.map(subject_id => ({
                        student_id: editingStudent.id,
                        class_id: newStudent.class_id,
                        subject_id,
                        is_active: true,
                    })));
                if (insertErr) throw insertErr;
            }

            if (toDisable.length > 0) {
                await supabase
                    .from('student_subject_enrollments')
                    .update({ is_active: false })
                    .eq('student_id', editingStudent.id)
                    .in('subject_id', toDisable);
            }

            Alert.alert('Success', 'Student updated successfully', [{
                text: 'OK', onPress: () => {
                    setModalVisible(false);
                    resetForm();
                    refetch();
                }
            }]);
        } catch (error: any) {
            showModalError(error, handleStudentCreateError);
        } finally {
            setCreating(false);
        }
    };

    const handleDeactivateStudent = (student: any) => {
        Alert.alert(
            'Deactivate Student',
            `Are you sure you want to deactivate ${student.full_name}?\n\nThis will:\n• Disable the student account\n• Remove all subject enrollments\n• Revoke login access`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Deactivate',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // 1. Soft-disable student — trigger syncs profiles.is_active
                            //    and student_subject_enrollments.is_active automatically
                            const { error: studentErr } = await supabase
                                .from('students')
                                .update({ is_deleted: true, student_status: 'inactive' })
                                .eq('id', student.id);
                            if (studentErr) throw studentErr;

                            // profiles.is_active is synced automatically by DB trigger

                            Alert.alert('Success', 'Student has been deactivated successfully.');
                            refetch();
                        } catch (error) {
                            showError(error, handleStudentDeleteError);
                        }
                    },
                },
            ]
        );
    };

    const handleStudentPress = (student) => {
        setSelectedStudent(student);
        setShowStudentModal(true);
    };


    const isFiltered = selectedFilterClass !== 'all' || selectedFilterSubject !== 'all';

    const fetchFilterSubjects = async (classId: string) => {
        if (classId === 'all') { setFilterSubjects([]); return; }
        try {
            const { data } = await supabase
                .from('classes_subjects')
                .select('subject_id, subjects(id, name)')
                .eq('class_id', classId)
                .eq('is_active', true);
            setFilterSubjects(
                (data || []).map((r: any) => r.subjects).filter(Boolean)
                    .sort((a: any, b: any) => a.name.localeCompare(b.name))
            );
        } catch {
            setFilterSubjects([]);
        }
    };

    const openFilter = () => {
        setPendingFilterClass(selectedFilterClass);
        setPendingFilterSubject(selectedFilterSubject);
        setFilterStep('class');
        if (selectedFilterClass !== 'all') fetchFilterSubjects(selectedFilterClass);
        setFilterVisible(true);
    };

    const handlePendingFilterClassSelect = (id: string) => {
        setPendingFilterClass(id);
        setPendingFilterSubject('all');
        fetchFilterSubjects(id);
        setFilterStep('subject');
    };

    const applyStudentFilter = async () => {
        setSelectedFilterClass(pendingFilterClass);
        setSelectedFilterSubject(pendingFilterSubject);
        if (pendingFilterSubject !== 'all') {
            const { data } = await supabase
                .from('student_subject_enrollments')
                .select('student_id')
                .eq('subject_id', pendingFilterSubject)
                .eq('is_active', true);
            setEnrolledStudentIds(new Set((data || []).map((r: any) => r.student_id)));
        } else {
            setEnrolledStudentIds(null);
        }
        setFilterVisible(false);
    };

    const resetStudentFilter = () => {
        setPendingFilterClass('all');
        setPendingFilterSubject('all');
        setSelectedFilterClass('all');
        setSelectedFilterSubject('all');
        setEnrolledStudentIds(null);
        setFilterVisible(false);
    };

    const filteredStudents = students.filter((student) => {
        const matchesSearch =
            student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.roll_number.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesClass = selectedFilterClass === 'all' || student.class_id === selectedFilterClass;
        const matchesSubject = !enrolledStudentIds || enrolledStudentIds.has(student.id);
        return matchesSearch && matchesClass && matchesSubject;
    });

    const toggleSubject = (subjectId: string) => {
        const newSelection = selectedSubjects.includes(subjectId)
            ? selectedSubjects.filter(id => id !== subjectId)
            : [...selectedSubjects, subjectId];

        setSelectedSubjects(newSelection);
        setNewStudent(prev => ({ ...prev, subject_ids: newSelection }));
    };

    if (profile?.role !== 'teacher' && profile?.role !== 'admin') {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                    <View style={styles.errorContainer}>
                        <Text allowFontScaling={false} style={[styles.errorText, { color: colors.text }]}>Access Denied</Text>
                        <Text allowFontScaling={false} style={[styles.errorSubtext, { color: colors.textSecondary }]}>
                            This section is only available for teachers and administrators.
                        </Text>
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    const { height } = Dimensions.get('window');

    return (
        <>
            <TopSection onFilterPress={openFilter} isFiltered={isFiltered} />

            {/* Filter Bottom Sheet */}
            <Modal
                visible={filterVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setFilterVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setFilterVisible(false)}>
                    <View style={styles.filterOverlay} />
                </TouchableWithoutFeedback>
                <View style={[styles.filterSheet, { backgroundColor: colors.cardBackground }]}>
                    <View style={[styles.filterHandle, { backgroundColor: colors.border }]} />

                    {/* Add Student — always at top */}
                    <TouchableOpacity
                        style={[styles.addStudentRow, { borderBottomColor: colors.border }]}
                        onPress={() => {
                            setFilterVisible(false);
                            resetForm();
                            setModalVisible(true);
                        }}
                    >
                        <View style={[styles.addStudentIcon, { backgroundColor: colors.primary + '15' }]}>
                            <Plus size={18} color={colors.primary} />
                        </View>
                        <Text allowFontScaling={false} style={[styles.addStudentText, { color: colors.primary }]}>
                            Add New Student
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.filterSheetHeader}>
                        {filterStep === 'subject' && (
                            <TouchableOpacity onPress={() => setFilterStep('class')} style={styles.filterBackBtn}>
                                <ChevronRight size={20} color={colors.textSecondary} style={{ transform: [{ rotate: '180deg' }] }} />
                            </TouchableOpacity>
                        )}
                        <Text allowFontScaling={false} style={[styles.filterSheetTitle, { color: colors.text }]}>
                            {filterStep === 'class' ? 'Filter by Class' : 'Filter by Subject'}
                        </Text>
                        {isFiltered && (
                            <TouchableOpacity onPress={resetStudentFilter}>
                                <Text allowFontScaling={false} style={styles.filterResetText}>Reset</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <ScrollView style={{ maxHeight: height * 0.35 }} showsVerticalScrollIndicator={false}>
                        {filterStep === 'class' ? (
                            <>
                                <TouchableOpacity
                                    style={[styles.filterOption, { borderBottomColor: colors.border }]}
                                    onPress={() => handlePendingFilterClassSelect('all')}
                                >
                                    <Text allowFontScaling={false} style={[styles.filterOptionText, { color: colors.text }]}>All Classes</Text>
                                    <View style={styles.filterOptionRight}>
                                        {pendingFilterClass === 'all' && <Check size={16} color={colors.primary} />}
                                        <ChevronRight size={16} color={colors.textSecondary} style={{ marginLeft: 4 }} />
                                    </View>
                                </TouchableOpacity>
                                {classes.map((c) => (
                                    <TouchableOpacity
                                        key={c.id}
                                        style={[styles.filterOption, { borderBottomColor: colors.border }]}
                                        onPress={() => handlePendingFilterClassSelect(c.id)}
                                    >
                                        <Text allowFontScaling={false} style={[styles.filterOptionText, { color: colors.text }]}>{c.name}</Text>
                                        <View style={styles.filterOptionRight}>
                                            {pendingFilterClass === c.id && <Check size={16} color={colors.primary} />}
                                            <ChevronRight size={16} color={colors.textSecondary} style={{ marginLeft: 4 }} />
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </>
                        ) : (
                            <>
                                <TouchableOpacity
                                    style={[styles.filterOption, { borderBottomColor: colors.border }]}
                                    onPress={() => setPendingFilterSubject('all')}
                                >
                                    <Text allowFontScaling={false} style={[styles.filterOptionText, { color: colors.text }]}>All Subjects</Text>
                                    {pendingFilterSubject === 'all' && <Check size={16} color={colors.primary} />}
                                </TouchableOpacity>
                                {filterSubjects.map((s) => (
                                    <TouchableOpacity
                                        key={s.id}
                                        style={[styles.filterOption, { borderBottomColor: colors.border }]}
                                        onPress={() => setPendingFilterSubject(s.id)}
                                    >
                                        <Text allowFontScaling={false} style={[styles.filterOptionText, { color: colors.text }]}>{s.name}</Text>
                                        {pendingFilterSubject === s.id && <Check size={16} color={colors.primary} />}
                                    </TouchableOpacity>
                                ))}
                            </>
                        )}
                    </ScrollView>

                    <TouchableOpacity
                        style={[styles.filterApplyBtn, { backgroundColor: colors.primary }]}
                        onPress={applyStudentFilter}
                    >
                        <Text allowFontScaling={false} style={styles.filterApplyBtnText}>Apply Filter</Text>
                    </TouchableOpacity>
                </View>
            </Modal>

            <Animated.View style={[{ flex: 1 }, screenStyle]}>
                <View style={[styles.container, { backgroundColor: colors.background }]}>
                    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right']}>


                        <ErrorModal
                            visible={errorModal.visible}
                            title={errorModal.title}
                            message={errorModal.message}
                            onClose={() => setErrorModal({ ...errorModal, visible: false })}
                        />


                        {studentsWithoutPasswords.length > 0 && (
                            <TouchableOpacity
                                style={[styles.alertBanner, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}
                                onPress={() => setPasswordStatusModalVisible(true)}
                            >
                                <AlertCircle size={20} color="#F59E0B" />
                                <Text allowFontScaling={false} style={[styles.alertText, { color: '#92400E' }]}>
                                    {studentsWithoutPasswords.length} student(s) pending registration
                                </Text>
                                <Text allowFontScaling={false} style={[styles.alertAction, { color: '#F59E0B' }]}>View Details</Text>
                            </TouchableOpacity>
                        )}

                        <ScrollView
                            style={styles.scrollView}
                            contentContainerStyle={{ paddingBottom: 100 }}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                            scrollEnabled={scrollEnabled}
                            refreshControl={
                                <RefreshControl
                                    refreshing={refreshing}
                                    onRefresh={onRefresh}
                                    colors={[colors.primary]}                   // Android indicator color
                                    tintColor={colors.primary}                  // iOS indicator color
                                    progressBackgroundColor={colors.cardBackground}
                                />
                            }
                        >
                            {loading ? (
                                <View style={styles.skeletonContainer}>
                                    {[...Array(6)].map((_, i) => (
                                        <View key={i} style={styles.skeletonCard}>
                                            {/* Avatar + name row */}
                                            <View style={styles.skeletonHeader}>
                                                <SkeletonBox width={40} height={40} borderRadius={8} />
                                                <View style={{ flex: 1, gap: 8 }}>
                                                    <SkeletonBox width="60%" height={14} borderRadius={6} />
                                                    <View style={{ flexDirection: 'row', gap: 10 }}>
                                                        <SkeletonBox width={70} height={12} borderRadius={4} />
                                                        <SkeletonBox width={80} height={12} borderRadius={4} />
                                                    </View>
                                                </View>
                                            </View>
                                            {/* Contact row */}
                                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                                <SkeletonBox width="45%" height={32} borderRadius={6} />
                                                <SkeletonBox width="45%" height={32} borderRadius={6} />
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            ) : filteredStudents.length === 0 ? (
                                <View style={styles.emptyContainer}>
                                    <Users size={48} color={colors.textSecondary} />
                                    <Text allowFontScaling={false} style={[styles.emptyText, { color: colors.text }]}>No students found</Text>
                                    <Text allowFontScaling={false} style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                                        {searchQuery ? 'Try adjusting your search' : 'Add your first student to get started'}
                                    </Text>
                                </View>
                            ) : (
                                filteredStudents.map((student) => (
                                    <SwipeableStudentCard
                                        key={student.id}
                                        student={student}
                                        colors={colors}
                                        isTeacher={profile?.role === 'teacher' || profile?.role === 'admin'}
                                        isOpen={openCardId === student.id}
                                        onSwipeOpen={(id) => setOpenCardId(id)}
                                        onSwipeClose={() => setOpenCardId(null)}
                                        onGestureStart={() => setScrollEnabled(false)}
                                        onGestureEnd={() => setScrollEnabled(true)}
                                        onEdit={handleEditStudent}
                                        onDeactivate={handleDeactivateStudent}
                                        onPress={handleStudentPress}
                                    />
                                ))
                            )}

                            <StudentDetailModal
                                visible={showStudentModal}
                                onClose={() => setShowStudentModal(false)}
                                student={selectedStudent}
                            />

                        </ScrollView>

                        {/* Add Student Modal */}
                        <Modal
                            animationType="fade"
                            transparent={true}
                            visible={modalVisible}
                            onRequestClose={() => { setModalVisible(false); resetForm(); }}
                            statusBarTranslucent={true}  // ← ADD THIS
                            presentationStyle="overFullScreen"
                        >
                            <View style={styles.modalOverlay}>
                                <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                                    <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                                        <Text allowFontScaling={false} style={[styles.modalTitle, { color: colors.text }]}>{editingStudent ? 'Edit Student' : 'Add New Student'}</Text>
                                        <TouchableOpacity
                                            style={styles.closeButton}
                                            onPress={() => { setModalVisible(false); resetForm(); }}
                                        >
                                            <X size={24} color={colors.textSecondary} />
                                        </TouchableOpacity>
                                    </View>

                                    <ScrollView style={styles.modalScrollView}>
                                        {/* <Text allowFontScaling={false} style={[styles.sectionTitle, { color: colors.text }]}>Student Information</Text> */}

                                        <View style={styles.inputGroup}>
                                            <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>Full Name *</Text>
                                            <TextInput
                                                style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                                value={newStudent.full_name}
                                                onChangeText={(text) => setNewStudent({ ...newStudent, full_name: text })}
                                                placeholder="Enter student full name"
                                                placeholderTextColor={colors.textSecondary}
                                            />
                                        </View>

                                        <View style={styles.inputGroup}>
                                            <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>Roll Number {editingStudent ? '' : '*'}</Text>
                                            <TextInput
                                                style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: editingStudent ? colors.textSecondary : colors.text }]}
                                                value={newStudent.roll_number}
                                                onChangeText={(text) => !editingStudent && setNewStudent({ ...newStudent, roll_number: text })}
                                                placeholder="Enter roll number"
                                                placeholderTextColor={colors.textSecondary}
                                                editable={!editingStudent}
                                            />
                                            <Text allowFontScaling={false} style={[styles.helpText, { color: colors.textSecondary }]}>
                                                {editingStudent ? 'Roll number cannot be changed (tied to login email)' : `Email will be: ${newStudent.roll_number.toLowerCase()}@aliacademy.com`}
                                            </Text>
                                        </View>

                                        <View style={styles.inputGroup}>
                                            <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>Phone Number *</Text>
                                            <TextInput
                                                style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                                value={newStudent.phone_number}
                                                onChangeText={(text) => setNewStudent({ ...newStudent, phone_number: text })}
                                                placeholder="Student phone number"
                                                placeholderTextColor={colors.textSecondary}
                                                keyboardType="phone-pad"
                                            />
                                        </View>

                                        <View style={styles.inputGroup}>
                                            <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>Class *</Text>
                                            {classes.length === 0 ? (
                                                <Text allowFontScaling={false} style={[styles.label, { color: colors.textSecondary }]}>No classes available</Text>
                                            ) : (
                                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                                    <View style={styles.classOptions}>
                                                        {classes.map((classItem) => (
                                                            <TouchableOpacity
                                                                key={classItem.id}
                                                                style={[
                                                                    styles.classOption,
                                                                    { backgroundColor: colors.cardBackground, borderColor: colors.border },
                                                                    newStudent.class_id === classItem.id && { backgroundColor: colors.primary, borderColor: colors.primary },
                                                                ]}
                                                                onPress={
                                                                    () => {
                                                                        setNewStudent({ ...newStudent, class_id: classItem.id })
                                                                        fetchSubjectsForClass(classItem.id);
                                                                    }
                                                                }>
                                                                <Text
                                                                    style={[
                                                                        styles.classOptionText,
                                                                        { color: colors.text },
                                                                        newStudent.class_id === classItem.id && { color: '#ffffff' },
                                                                    ]}
                                                                >
                                                                    {classItem.name}
                                                                </Text>
                                                            </TouchableOpacity>
                                                        ))}
                                                    </View>
                                                </ScrollView>
                                            )}
                                        </View>

                                        <View style={styles.inputGroup}>
                                            <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>
                                                Subjects * {selectedSubjects.length > 0 && `(${selectedSubjects.length} selected)`}
                                            </Text>

                                            {!newStudent.class_id ? (
                                                <Text allowFontScaling={false} style={[styles.helpText, { color: colors.textSecondary }]}>
                                                    Please select a class first
                                                </Text>
                                            ) : loadingSubjects ? (
                                                <View style={styles.loadingContainer}>
                                                    <ActivityIndicator size="small" color={colors.primary} />
                                                    <Text allowFontScaling={false} style={[styles.loadingText, { color: colors.textSecondary }]}>
                                                        Loading subjects...
                                                    </Text>
                                                </View>
                                            ) : subjects.length === 0 ? (
                                                <Text allowFontScaling={false} style={[styles.helpText, { color: colors.error || '#EF4444' }]}>
                                                    No subjects available for this class. Please assign teachers to subjects first.
                                                </Text>
                                            ) : (
                                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                                    <View style={styles.classOptions}>
                                                        {subjects.map((subject) => (
                                                            <TouchableOpacity
                                                                key={subject.id}
                                                                style={[
                                                                    styles.classOption,
                                                                    { backgroundColor: colors.cardBackground, borderColor: colors.border },
                                                                    selectedSubjects.includes(subject.id) && {
                                                                        backgroundColor: colors.primary,
                                                                        borderColor: colors.primary
                                                                    },
                                                                ]}
                                                                onPress={() => toggleSubject(subject.id)}
                                                            >
                                                                <Text
                                                                    style={[
                                                                        styles.classOptionText,
                                                                        { color: colors.text },
                                                                        selectedSubjects.includes(subject.id) && { color: '#ffffff' },
                                                                    ]}
                                                                >
                                                                    {subject.name}
                                                                </Text>
                                                            </TouchableOpacity>
                                                        ))}
                                                    </View>
                                                </ScrollView>
                                            )}

                                            {selectedSubjects.length > 0 && (
                                                <Text allowFontScaling={false} style={[styles.helpText, { color: colors.textSecondary, marginTop: 8 }]}>
                                                    Selected: {subjects
                                                        .filter(s => selectedSubjects.includes(s.id))
                                                        .map(s => s.name)
                                                        .join(', ')}
                                                </Text>
                                            )}
                                        </View>


                                        <View style={styles.inputGroup}>
                                            <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>Parent Contact *</Text>
                                            <TextInput
                                                style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                                value={newStudent.parent_contact}
                                                onChangeText={(text) => setNewStudent({ ...newStudent, parent_contact: text })}
                                                placeholder="Parent contact number"
                                                placeholderTextColor={colors.textSecondary}
                                                keyboardType="phone-pad"
                                            />
                                        </View>

                                        <View style={styles.inputGroup}>
                                            <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>Gender *</Text>
                                            <View style={styles.genderOptions}>
                                                {[
                                                    { value: 'male', label: 'Male' },
                                                    { value: 'female', label: 'Female' },
                                                    { value: 'other', label: 'Other' },
                                                ].map((gender) => (
                                                    <TouchableOpacity
                                                        key={gender.value}
                                                        style={[
                                                            styles.genderOption,
                                                            { backgroundColor: colors.cardBackground, borderColor: colors.border },
                                                            newStudent.gender === gender.value && { backgroundColor: colors.primary, borderColor: colors.primary },
                                                        ]}
                                                        onPress={() => setNewStudent({ ...newStudent, gender: gender.value as any })}
                                                    >
                                                        <Text
                                                            style={[
                                                                styles.genderOptionText,
                                                                { color: colors.text },
                                                                newStudent.gender === gender.value && { color: '#ffffff' },
                                                            ]}
                                                        >
                                                            {gender.label}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>

                                        <View style={styles.inputGroup}>
                                            <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>Address *</Text>
                                            <TextInput
                                                style={[styles.textArea, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                                value={newStudent.address}
                                                onChangeText={(text) => setNewStudent({ ...newStudent, address: text })}
                                                placeholder="Student home address"
                                                placeholderTextColor={colors.textSecondary}
                                                multiline
                                                numberOfLines={3}
                                            />
                                        </View>

                                        <View style={styles.inputGroup}>
                                            <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>Admission Date *</Text>
                                            <TextInput
                                                style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                                value={newStudent.admission_date}
                                                onChangeText={(text) => setNewStudent({ ...newStudent, admission_date: text })}
                                                placeholder="YYYY-MM-DD"
                                                placeholderTextColor={colors.textSecondary}
                                            />
                                        </View>

                                        <Text allowFontScaling={false} style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>Additional Information (Optional)</Text>

                                        <View style={styles.inputGroup}>
                                            <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>Date of Birth</Text>
                                            <TextInput
                                                style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                                value={newStudent.date_of_birth}
                                                onChangeText={(text) => setNewStudent({ ...newStudent, date_of_birth: text })}
                                                placeholder="YYYY-MM-DD"
                                                placeholderTextColor={colors.textSecondary}
                                            />
                                        </View>

                                        <View style={styles.inputGroup}>
                                            <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>Emergency Contact</Text>
                                            <TextInput
                                                style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                                value={newStudent.emergency_contact}
                                                onChangeText={(text) => setNewStudent({ ...newStudent, emergency_contact: text })}
                                                placeholder="Emergency contact number"
                                                placeholderTextColor={colors.textSecondary}
                                                keyboardType="phone-pad"
                                            />
                                        </View>

                                        <View style={styles.inputGroup}>
                                            <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>Parent/Guardian Name</Text>
                                            <TextInput
                                                style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                                value={newStudent.parent_name}
                                                onChangeText={(text) => setNewStudent({ ...newStudent, parent_name: text })}
                                                placeholder="Parent/guardian full name"
                                                placeholderTextColor={colors.textSecondary}
                                            />
                                        </View>

                                        <View style={styles.inputGroup}>
                                            <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>Medical Conditions</Text>
                                            <TextInput
                                                style={[styles.textArea, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                                value={newStudent.medical_conditions}
                                                onChangeText={(text) => setNewStudent({ ...newStudent, medical_conditions: text })}
                                                placeholder="Any medical conditions or allergies"
                                                placeholderTextColor={colors.textSecondary}
                                                multiline
                                                numberOfLines={2}
                                            />
                                        </View>

                                        <View style={styles.inputGroup}>
                                            <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>Notes</Text>
                                            <TextInput
                                                style={[styles.textArea, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                                value={newStudent.notes}
                                                onChangeText={(text) => setNewStudent({ ...newStudent, notes: text })}
                                                placeholder="Additional notes about the student"
                                                placeholderTextColor={colors.textSecondary}
                                                multiline
                                                numberOfLines={2}
                                            />
                                        </View>

                                        {/* Info box about workflow — only shown when adding */}
                                        {!editingStudent && <View style={[styles.infoBox, { backgroundColor: '#EBF8FF', borderColor: '#3182CE' }]}>
                                            <Text allowFontScaling={false} style={[styles.infoTitle, { color: '#2C5282' }]}>How it works:</Text>
                                            <Text allowFontScaling={false} style={[styles.infoText, { color: '#2A4A6B' }]}>
                                                1. Student record is created with email: {newStudent.roll_number.toLowerCase()}@aliacademy.com{'\n'}
                                                2. Student uses this email in the registration screen{'\n'}
                                                3. Student sets their own password{'\n'}
                                                4. Auth account is created automatically
                                            </Text>
                                        </View>}

                                        <TouchableOpacity
                                            style={[styles.submitButton, { backgroundColor: colors.primary }]}
                                            onPress={editingStudent ? handleUpdateStudent : handleAddStudent}
                                            disabled={creating}
                                        >
                                            {creating ? (
                                                <ActivityIndicator color="#ffffff" />
                                            ) : (
                                                <Text allowFontScaling={false} style={styles.submitButtonText}>
                                                    {editingStudent ? 'Save Changes' : 'Create Student (No Password)'}
                                                </Text>
                                            )}
                                        </TouchableOpacity>
                                    </ScrollView>
                                </View>
                            </View>
                        </Modal>

                        {/* Pending Registration Modal */}
                        <Modal
                            animationType="fade"
                            transparent={true}
                            visible={passwordStatusModalVisible}
                            onRequestClose={() => setPasswordStatusModalVisible(false)}
                            statusBarTranslucent={true}  // ← ADD THIS
                            presentationStyle="overFullScreen"
                        >
                            <View style={styles.modalOverlay}>
                                <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                                    <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                                        <Text allowFontScaling={false} style={[styles.modalTitle, { color: colors.text }]}>Students Pending Registration</Text>
                                        <TouchableOpacity
                                            style={styles.closeButton}
                                            onPress={() => setPasswordStatusModalVisible(false)}
                                        >
                                            <X size={24} color={colors.textSecondary} />
                                        </TouchableOpacity>
                                    </View>
                                    <ScrollView style={styles.modalScrollView}>
                                        <Text allowFontScaling={false} style={[styles.infoText, { color: colors.textSecondary, marginBottom: 16 }]}>
                                            These students need to use their email to register and set their password.
                                        </Text>
                                        {studentsWithoutPasswords.map((student) => (
                                            <View
                                                key={student.id}
                                                style={[styles.pendingStudentCard, { borderColor: colors.border, backgroundColor: colors.cardBackground }]}
                                            >
                                                <View style={styles.pendingStudentInfo}>
                                                    <Text allowFontScaling={false} style={[styles.pendingStudentName, { color: colors.text }]}>
                                                        {student.full_name}
                                                    </Text>
                                                    <Text allowFontScaling={false} style={[styles.pendingStudentDetails, { color: colors.textSecondary }]}>
                                                        Roll: {student.roll_number} | Class: {student.classes.name}
                                                    </Text>
                                                    <Text allowFontScaling={false} style={[styles.pendingStudentEmail, { color: colors.primary }]}>
                                                        📧 {student.email}
                                                    </Text>
                                                    <Text allowFontScaling={false} style={[styles.pendingStudentStatus, { color: '#F59E0B' }]}>
                                                        ⏳ Waiting for registration
                                                    </Text>
                                                </View>
                                            </View>
                                        ))}
                                    </ScrollView>
                                </View>
                            </View>
                        </Modal>
                    </SafeAreaView>
                </View>
            </Animated.View>
        </>
    );
}

import { TextSizes } from '@/src/styles/TextSizes';


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    // Error
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    errorText: {
        fontSize: TextSizes.header,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 8,
    },
    errorSubtext: {
        fontSize: TextSizes.normal,
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
    },

    // Header & Search
    alertBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 4,
    },
    alertText: {
        flex: 1,
        fontSize: TextSizes.bannerSubtitle,
        fontFamily: 'Inter-Medium',
        marginLeft: 8,
    },
    alertAction: {
        fontSize: TextSizes.bannerTitle,
        fontFamily: 'Inter-SemiBold',
    },

    // Scroll / loading / empty
    scrollView: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    skeletonContainer: {
        paddingHorizontal: 16,
        paddingTop: 12,
        gap: 12,
    },
    skeletonCard: {
        borderRadius: 12,
        padding: 16,
        gap: 12,
    },
    skeletonHeader: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: TextSizes.large,
        fontFamily: 'Inter-SemiBold',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: TextSizes.normal,
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
    },

    // Student card
    studentCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    studentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    studentAvatar: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    studentInitial: {
        fontSize: TextSizes.large,
        fontFamily: 'Inter-SemiBold',
        color: '#ffffff',
    },
    studentInfo: {
        flex: 1,
    },
    studentName: {
        fontSize: TextSizes.large,
        fontFamily: 'Inter-SemiBold',
    },
    studentDetails: {
        flexDirection: 'row',
        gap: 16,
        flexWrap: 'wrap',
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailText: {
        fontSize: TextSizes.normal,
        fontFamily: 'Inter-Regular',
        marginLeft: 4,
    },
    contactInfo: {
        paddingTop: 12,
        borderTopWidth: 1,
        gap: 8,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    contactText: {
        fontSize: TextSizes.medium,
        fontFamily: 'Inter-Medium',
        marginLeft: 8,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '65%',

    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: TextSizes.modalTitle,
        fontFamily: 'Inter-SemiBold',
    },
    closeButton: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalScrollView: {
        paddingHorizontal: 24,
        // paddingTop: 24,

    },

    // Form inputs
    sectionTitle: {
        fontSize: TextSizes.sectionTitle,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 16,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: TextSizes.filterLabel,
        fontFamily: 'Inter-Medium',
        marginBottom: 8,
    },
    input: {
        height: 48,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        fontSize: TextSizes.normal,
        fontFamily: 'Inter-Regular',
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: TextSizes.normal,
        fontFamily: 'Inter-Regular',
        textAlignVertical: 'top',
    },

    // Class & gender options
    classOptions: {
        flexDirection: 'row',
        gap: 8,
    },
    classOption: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderRadius: 8,
    },
    classOptionText: {
        fontSize: TextSizes.filterLabel,
        fontFamily: 'Inter-Medium',
    },
    genderOptions: {
        flexDirection: 'row',
        gap: 8,
    },
    genderOption: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderRadius: 8,
        alignItems: 'center',
    },
    genderOptionText: {
        fontSize: TextSizes.filterLabel,
        fontFamily: 'Inter-Medium',
    },

    // Submit button
    submitButton: {
        height: 50,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        marginBottom: 16,
    },
    submitButtonText: {
        color: '#ffffff',
        fontSize: TextSizes.buttonText,
        fontFamily: 'Inter-SemiBold',
    },

    // Helper / info text
    helpText: {
        fontSize: TextSizes.tiny,
        fontFamily: 'Inter-Regular',
        marginTop: 4,
        fontStyle: 'italic',
    },
    infoBox: {
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: 20,
    },
    infoTitle: {
        fontSize: TextSizes.modalTitle,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 8,
    },
    infoText: {
        fontSize: TextSizes.modalText,
        fontFamily: 'Inter-Regular',
        lineHeight: 18,
    },

    // Pending registration modal
    pendingStudentCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    pendingStudentInfo: {
        flex: 1,
    },
    pendingStudentName: {
        fontSize: TextSizes.modalTitle,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 4,
    },
    pendingStudentDetails: {
        fontSize: TextSizes.modalText,
        fontFamily: 'Inter-Regular',
        marginBottom: 4,
    },
    pendingStudentEmail: {
        fontSize: TextSizes.modalText,
        fontFamily: 'Inter-Medium',
        marginBottom: 4,
    },
    pendingStudentStatus: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Medium',
    },
    // ── Filter bottom sheet ─────────────────────────────────────────
    filterOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    filterSheet: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 12,
        paddingBottom: 32,
    },
    filterHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 12,
    },
    filterSheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    filterBackBtn: {
        marginRight: 8,
        padding: 2,
    },
    filterSheetTitle: {
        flex: 1,
        fontSize: TextSizes.sectionTitle,
        fontFamily: 'Inter-SemiBold',
    },
    filterResetText: {
        fontSize: TextSizes.filterLabel,
        fontFamily: 'Inter-Medium',
        color: '#EF4444',
    },
    addStudentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        gap: 12,
    },
    addStudentIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addStudentText: {
        fontSize: TextSizes.medium,
        fontFamily: 'Inter-SemiBold',
    },
    filterOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    filterOptionText: {
        fontSize: TextSizes.medium,
        fontFamily: 'Inter-Regular',
        flex: 1,
    },
    filterOptionRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    filterApplyBtn: {
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
    },
    filterApplyBtnText: {
        fontSize: TextSizes.medium,
        fontFamily: 'Inter-SemiBold',
        color: '#ffffff',
    },
});

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         marginBottom: 10
//     },
//     errorContainer: {
//         flex: 1,
//         alignItems: 'center',
//         justifyContent: 'center',
//         paddingHorizontal: 24,
//     },
//     errorText: {
//         fontSize: TextSizes.header,
//         fontFamily: 'Inter-SemiBold',
//         marginBottom: 8,
//     },
//     errorSubtext: {
//         fontSize: TextSizes.normal,
//         fontFamily: 'Inter-Regular',
//         textAlign: 'center',
//     },
//     headerContainer: {
//         paddingHorizontal: 24,
//         paddingTop: 5,
//     },
//     searchContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         marginBottom: 16,
//     },
//     searchInputContainer: {
//         flex: 1,
//         flexDirection: 'row',
//         alignItems: 'center',
//         borderRadius: 12,
//         paddingHorizontal: 12,
//         borderWidth: 1,
//         marginRight: 12,
//         height: 48,
//     },
//     searchInput: {
//         flex: 1,
//         fontSize: TextSizes.normal + 4,
//         fontFamily: 'Inter-Regular',
//         marginLeft: 12,
//     },
//     addButton: {
//         width: 48,
//         height: 48,
//         borderRadius: 12,
//         alignItems: 'center',
//         justifyContent: 'center',
//     },
//     alertBanner: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         padding: 12,
//         borderRadius: 8,
//         borderWidth: 1,
//         marginBottom: 16,
//     },
//     alertText: {
//         flex: 1,
//         fontSize: TextSizes.bannerSubtitle,
//         fontFamily: 'Inter-Medium',
//         marginLeft: 8,
//     },
//     alertAction: {
//         fontSize: TextSizes.bannerTitle,
//         fontFamily: 'Inter-SemiBold',
//     },
//     scrollView: {
//         flex: 1,
//         paddingHorizontal: 24,
//     },
//     loadingContainer: {
//         alignItems: 'center',
//         justifyContent: 'center',
//         paddingVertical: 60,
//     },
//     loadingText: {
//         fontSize: TextSizes.modalText,
//         fontFamily: 'Inter-Regular',
//         marginTop: 12,
//     },
//     emptyContainer: {
//         alignItems: 'center',
//         justifyContent: 'center',
//         paddingVertical: 60,
//     },
//     emptyText: {
//         fontSize: TextSizes.large,
//         fontFamily: 'Inter-SemiBold',
//         marginTop: 16,
//         marginBottom: 8,
//     },
//     emptySubtext: {
//         fontSize: TextSizes.normal,
//         fontFamily: 'Inter-Regular',
//         textAlign: 'center',
//     },
//     modalOverlay: {
//         flex: 1,
//         backgroundColor: 'rgba(0, 0, 0, 0.5)',
//         justifyContent: 'flex-end',
//     },
//     modalContent: {
//         borderTopLeftRadius: 24,
//         borderTopRightRadius: 24,
//         maxHeight: '65%',
//     },
//     modalHeader: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         paddingHorizontal: 24,
//         paddingTop: 24,
//         paddingBottom: 16,
//         borderBottomWidth: 1,
//     },
//     modalTitle: {
//         fontSize: TextSizes.modalTitle,
//         fontFamily: 'Inter-SemiBold',
//     },
//     closeButton: {
//         width: 32,
//         height: 32,
//         alignItems: 'center',
//         justifyContent: 'center',
//     },
//     modalScrollView: {
//         paddingHorizontal: 24,
//         paddingVertical: 24,
//     },
// });