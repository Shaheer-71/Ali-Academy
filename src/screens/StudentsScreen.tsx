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
    ActivityIndicator,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useDialog } from '@/src/contexts/DialogContext';
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
    Calendar,
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import { modalShell, modalForm } from '@/src/styles/creationModalStyles';
import { Dimensions, TouchableWithoutFeedback } from 'react-native';

const { height } = Dimensions.get('window');
import { supabase } from '@/src/lib/supabase';
import TopSection from '../components/common/TopSections';
import { useScreenAnimation } from '@/src/utils/animations';
import { SwipeableStudentCard } from '@/src/components/students/SwipeableStudentCard';
import StudentDetailModal from '../components/students/modals/StudentDetailModal';
import {
    handleStudentFetchError,
    handleStudentCreateError,
    handleStudentDeleteError,
    handleClassFetchErrorForStudents,
    handleSubjectFetchErrorForStudents,
    handlePasswordStatusFetchError,
    handleValidationError,
} from '@/src/utils/errorHandler/studentErrorHandler';
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
    const { showError: dialogShowError, showSuccess, showConfirm } = useDialog();
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

    // Add/Edit student modal form dropdowns
    type FormDropdown = 'class' | 'subject' | 'gender' | null;
    const [openFormDropdown, setOpenFormDropdown] = useState<FormDropdown>(null);
    const [showDobPicker, setShowDobPicker] = useState(false);
    const toggleFormDropdown = (key: FormDropdown) =>
        setOpenFormDropdown(prev => prev === key ? null : key);
    const chevronStyle = (key: FormDropdown) => ({
        marginLeft: 6,
        transform: [{ rotate: openFormDropdown === key ? '270deg' : '90deg' }] as any,
    });
    const dobStr2Date = (s: string) => {
        if (!s) return new Date();
        const [y, m, d] = s.split('-').map(Number);
        return new Date(y, m - 1, d);
    };
    const date2Str = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    // Filter state
    const [filterVisible, setFilterVisible] = useState(false);
    const [expandedSection, setExpandedSection] = useState<'class' | 'subject' | null>(null);
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
        monthly_fee: '',
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

    // Use dialog when a Modal is already open — ErrorModal renders behind it
    const showModalError = (error: any, handler?: (error: any) => any) => {
        const errorInfo = handler ? handler(error) : {
            title: 'Error',
            message: error?.message || 'An unexpected error occurred'
        };
        dialogShowError(errorInfo.title, errorInfo.message);
    };


    useEffect(() => {
        if ((profile?.role === 'teacher' || profile?.role === 'admin' || profile?.role === 'superadmin')) {
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
            monthly_fee: '',
        });
        setSelectedSubjects([]);
        setSubjects([]);
        setOpenFormDropdown(null);
        setShowDobPicker(false);
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
        if (!newStudent.monthly_fee.trim() || isNaN(parseFloat(newStudent.monthly_fee)) || parseFloat(newStudent.monthly_fee) < 0) {
            dialogShowError('Validation Error', 'Please enter a valid monthly fee amount.');
            return;
        }

        setCreating(true);
        try {
            const result = await createStudentSimple({
                ...newStudent,
                monthly_fee: parseFloat(newStudent.monthly_fee),
            }, profile!.id);

            if (result.success) {
                await addStudent({
                    full_name: newStudent.full_name,
                    roll_number: newStudent.roll_number,
                    class_id: newStudent.class_id,
                    parent_contact: newStudent.parent_contact,
                });

                const studentEmail = result.data?.email;

                showSuccess(
                    'Success',
                    `Student created successfully!\n\nEmail: ${studentEmail}\n\nThe student can now use this email to register and set their password.`,
                    () => {
                        setModalVisible(false);
                        resetForm();
                        fetchStudentsPasswordStatus();
                        refetch();
                    }
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

            showSuccess('Success', 'Student updated successfully', () => {
                setModalVisible(false);
                resetForm();
                refetch();
            });
        } catch (error: any) {
            showModalError(error, handleStudentCreateError);
        } finally {
            setCreating(false);
        }
    };

    const handleDeactivateStudent = (student: any) => {
        showConfirm({
            title: 'Deactivate Student',
            message: `Are you sure you want to deactivate ${student.full_name}?\n\nThis will:\n• Disable the student account\n• Remove all subject enrollments\n• Revoke login access`,
            confirmText: 'Deactivate',
            cancelText: 'Cancel',
            destructive: true,
            onConfirm: async () => {
                try {
                    // 1. Soft-disable student — trigger syncs profiles.is_active
                    //    and student_subject_enrollments.is_active automatically
                    const { error: studentErr } = await supabase
                        .from('students')
                        .update({ is_deleted: true, student_status: 'inactive' })
                        .eq('id', student.id);
                    if (studentErr) throw studentErr;

                    // profiles.is_active is synced automatically by DB trigger

                    showSuccess('Success', 'Student has been deactivated successfully.', refetch);
                } catch (error) {
                    showError(error, handleStudentDeleteError);
                }
            },
        });
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
        setExpandedSection(null);
        if (selectedFilterClass !== 'all') fetchFilterSubjects(selectedFilterClass);
        setFilterVisible(true);
    };

    const toggleSection = (section: 'class' | 'subject') => {
        setExpandedSection(prev => prev === section ? null : section);
    };

    const handlePendingFilterClassSelect = (id: string) => {
        setPendingFilterClass(id);
        setPendingFilterSubject('all');
        fetchFilterSubjects(id);
        setExpandedSection(null);
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

    if (profile?.role !== 'teacher' && profile?.role !== 'admin' && profile?.role !== 'superadmin') {
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

    return (
        <>
            <TopSection onFilterPress={openFilter} isFiltered={isFiltered} />

            {/* Filter Bottom Sheet */}
            <Modal visible={filterVisible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setFilterVisible(false)}>
                <View style={styles.filterOverlay}>
                    <TouchableWithoutFeedback onPress={() => setFilterVisible(false)}>
                        <View style={{ flex: 1 }} />
                    </TouchableWithoutFeedback>
                <View style={[styles.filterSheet, { backgroundColor: colors.cardBackground }]}>
                    <View style={[styles.filterHandle, { backgroundColor: colors.border }]} />

                    <TouchableOpacity style={[styles.addStudentRow, { borderColor: colors.primary }]} onPress={() => { setFilterVisible(false); resetForm(); setModalVisible(true); }}>
                        <Plus size={18} color={colors.primary} />
                        <Text allowFontScaling={false} style={[styles.addStudentText, { color: colors.primary }]}>Add New Student</Text>
                    </TouchableOpacity>

                    <View style={styles.filterSheetHeader}>
                        <Text allowFontScaling={false} style={[styles.filterSheetTitle, { color: colors.text }]}>Filter Students</Text>
                        {isFiltered && (
                            <TouchableOpacity onPress={resetStudentFilter}>
                                <Text allowFontScaling={false} style={styles.filterResetText}>Reset</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <ScrollView style={styles.filterScroll} showsVerticalScrollIndicator={false}>
                        {/* Class accordion */}
                        <TouchableOpacity style={[styles.filterAccordionHeader, { borderColor: colors.border }]} onPress={() => toggleSection('class')}>
                            <Text allowFontScaling={false} style={[styles.filterAccordionLabel, { color: colors.textSecondary }]}>Class</Text>
                            <View style={styles.filterAccordionRight}>
                                <Text allowFontScaling={false} style={[styles.filterAccordionValue, { color: colors.text }]}>
                                    {pendingFilterClass === 'all' ? 'All Classes' : classes.find(c => c.id === pendingFilterClass)?.name ?? 'All Classes'}
                                </Text>
                                <ChevronRight size={16} color={colors.textSecondary} style={{ marginLeft: 6, transform: [{ rotate: expandedSection === 'class' ? '270deg' : '90deg' }] }} />
                            </View>
                        </TouchableOpacity>
                        {expandedSection === 'class' && (
                            <View style={[styles.filterAccordionBody, { borderColor: colors.border }]}>
                                <TouchableOpacity style={[styles.filterOption, { borderBottomColor: colors.border }]} onPress={() => handlePendingFilterClassSelect('all')}>
                                    <Text allowFontScaling={false} style={[styles.filterOptionText, { color: colors.text }]}>All Classes</Text>
                                    {pendingFilterClass === 'all' && <Check size={16} color={colors.primary} />}
                                </TouchableOpacity>
                                {classes.map(c => (
                                    <TouchableOpacity key={c.id} style={[styles.filterOption, { borderBottomColor: colors.border }]} onPress={() => handlePendingFilterClassSelect(c.id)}>
                                        <Text allowFontScaling={false} style={[styles.filterOptionText, { color: colors.text }]}>{c.name}</Text>
                                        {pendingFilterClass === c.id && <Check size={16} color={colors.primary} />}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {/* Subject accordion */}
                        <TouchableOpacity style={[styles.filterAccordionHeader, { borderColor: colors.border }]} onPress={() => toggleSection('subject')}>
                            <Text allowFontScaling={false} style={[styles.filterAccordionLabel, { color: colors.textSecondary }]}>Subject</Text>
                            <View style={styles.filterAccordionRight}>
                                <Text allowFontScaling={false} style={[styles.filterAccordionValue, { color: colors.text }]}>
                                    {pendingFilterSubject === 'all' ? 'All Subjects' : filterSubjects.find(s => s.id === pendingFilterSubject)?.name ?? 'All Subjects'}
                                </Text>
                                <ChevronRight size={16} color={colors.textSecondary} style={{ marginLeft: 6, transform: [{ rotate: expandedSection === 'subject' ? '270deg' : '90deg' }] }} />
                            </View>
                        </TouchableOpacity>
                        {expandedSection === 'subject' && (
                            <View style={[styles.filterAccordionBody, { borderColor: colors.border }]}>
                                <TouchableOpacity style={[styles.filterOption, { borderBottomColor: colors.border }]} onPress={() => { setPendingFilterSubject('all'); setExpandedSection(null); }}>
                                    <Text allowFontScaling={false} style={[styles.filterOptionText, { color: colors.text }]}>All Subjects</Text>
                                    {pendingFilterSubject === 'all' && <Check size={16} color={colors.primary} />}
                                </TouchableOpacity>
                                {filterSubjects.map(s => (
                                    <TouchableOpacity key={s.id} style={[styles.filterOption, { borderBottomColor: colors.border }]} onPress={() => { setPendingFilterSubject(s.id); setExpandedSection(null); }}>
                                        <Text allowFontScaling={false} style={[styles.filterOptionText, { color: colors.text }]}>{s.name}</Text>
                                        {pendingFilterSubject === s.id && <Check size={16} color={colors.primary} />}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </ScrollView>

                    <TouchableOpacity style={[styles.filterApplyBtn, { backgroundColor: colors.primary }]} onPress={applyStudentFilter}>
                        <Text allowFontScaling={false} style={styles.filterApplyBtnText}>Apply Filter</Text>
                    </TouchableOpacity>
                </View>
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
                                        isTeacher={profile?.role === 'teacher' || profile?.role === 'admin' || profile?.role === 'superadmin'}
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
                            transparent
                            statusBarTranslucent
                            visible={modalVisible}
                            onRequestClose={() => { setModalVisible(false); resetForm(); }}
                        >
                            <View style={fm.root}>
                                <TouchableWithoutFeedback onPress={() => { setModalVisible(false); resetForm(); }}>
                                    <View style={{ flex: 1 }} />
                                </TouchableWithoutFeedback>

                                <View style={[modalShell.sheet, { backgroundColor: colors.background }]}>
                                    {/* Header */}
                                    <View style={[modalShell.header, { borderBottomColor: colors.border }]}>
                                        <Text allowFontScaling={false} style={[modalShell.title, { color: colors.text }]}>
                                            {editingStudent ? 'Edit Student' : 'Add New Student'}
                                        </Text>
                                        <TouchableOpacity style={modalShell.closeBtn} onPress={() => { setModalVisible(false); resetForm(); }}>
                                            <X size={24} color={colors.text} />
                                        </TouchableOpacity>
                                    </View>

                                    <ScrollView
                                        style={modalShell.scroll}
                                        keyboardShouldPersistTaps="handled"
                                        automaticallyAdjustKeyboardInsets
                                        contentContainerStyle={modalShell.scrollContent}
                                        showsVerticalScrollIndicator={false}
                                    >
                                        {/* Full Name */}
                                        <View style={modalForm.group}>
                                            <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>Full Name *</Text>
                                            <TextInput
                                                style={[modalForm.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                                value={newStudent.full_name}
                                                onChangeText={t => setNewStudent({ ...newStudent, full_name: t })}
                                                placeholder="Enter student full name"
                                                placeholderTextColor={colors.textSecondary}
                                                allowFontScaling={false}
                                            />
                                        </View>

                                        {/* Roll Number */}
                                        <View style={modalForm.group}>
                                            <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>
                                                Roll Number {editingStudent ? '' : '*'}
                                            </Text>
                                            <TextInput
                                                style={[modalForm.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: editingStudent ? colors.textSecondary : colors.text }]}
                                                value={newStudent.roll_number}
                                                onChangeText={t => !editingStudent && setNewStudent({ ...newStudent, roll_number: t })}
                                                placeholder="Enter roll number"
                                                placeholderTextColor={colors.textSecondary}
                                                editable={!editingStudent}
                                                allowFontScaling={false}
                                            />
                                            <Text allowFontScaling={false} style={[styles.helpText, { color: colors.textSecondary }]}>
                                                {editingStudent
                                                    ? 'Roll number cannot be changed'
                                                    : `Email: ${newStudent.roll_number.toLowerCase() || 'rollno'}@aliacademy.com`}
                                            </Text>
                                        </View>

                                        {/* Phone */}
                                        <View style={modalForm.group}>
                                            <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>Phone Number *</Text>
                                            <TextInput
                                                style={[modalForm.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                                value={newStudent.phone_number}
                                                onChangeText={t => setNewStudent({ ...newStudent, phone_number: t })}
                                                placeholder="Student phone number"
                                                placeholderTextColor={colors.textSecondary}
                                                keyboardType="phone-pad"
                                                allowFontScaling={false}
                                            />
                                        </View>

                                        {/* Class dropdown */}
                                        <View style={modalForm.group}>
                                            <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>Class *</Text>
                                            <TouchableOpacity
                                                style={[fm.accordionHeader, { borderColor: colors.border }]}
                                                onPress={() => toggleFormDropdown('class')}
                                            >
                                                <Text allowFontScaling={false} style={[fm.accordionLabel, { color: colors.textSecondary }]}>Class</Text>
                                                <View style={fm.accordionRight}>
                                                    <Text allowFontScaling={false} style={[fm.accordionValue, { color: newStudent.class_id ? colors.text : colors.textSecondary }]}>
                                                        {newStudent.class_id ? classes.find(c => c.id === newStudent.class_id)?.name ?? 'Select' : 'Select class'}
                                                    </Text>
                                                    <ChevronRight size={16} color={colors.textSecondary} style={chevronStyle('class')} />
                                                </View>
                                            </TouchableOpacity>
                                            {openFormDropdown === 'class' && (
                                                <View style={[fm.accordionBody, { borderColor: colors.border }]}>
                                                    <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={fm.dropdownScroll}>
                                                        {classes.length === 0 ? (
                                                            <View style={fm.option}>
                                                                <Text allowFontScaling={false} style={[fm.optionText, { color: colors.textSecondary }]}>No classes available</Text>
                                                            </View>
                                                        ) : classes.map(cls => (
                                                            <TouchableOpacity
                                                                key={cls.id}
                                                                style={[fm.option, { borderBottomColor: colors.border }]}
                                                                onPress={() => {
                                                                    setNewStudent({ ...newStudent, class_id: cls.id });
                                                                    fetchSubjectsForClass(cls.id);
                                                                    setOpenFormDropdown(null);
                                                                }}
                                                            >
                                                                <Text allowFontScaling={false} style={[fm.optionText, { color: colors.text }]}>{cls.name}</Text>
                                                                {newStudent.class_id === cls.id && <Check size={16} color={colors.primary} />}
                                                            </TouchableOpacity>
                                                        ))}
                                                    </ScrollView>
                                                </View>
                                            )}
                                        </View>

                                        {/* Subject dropdown (multi-select) */}
                                        <View style={modalForm.group}>
                                            <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>
                                                Subjects *{selectedSubjects.length > 0 ? ` (${selectedSubjects.length} selected)` : ''}
                                            </Text>
                                            <TouchableOpacity
                                                style={[fm.accordionHeader, { borderColor: colors.border }, !newStudent.class_id && fm.accordionDisabled]}
                                                onPress={() => newStudent.class_id && toggleFormDropdown('subject')}
                                                disabled={!newStudent.class_id}
                                            >
                                                {loadingSubjects ? (
                                                    <ActivityIndicator size="small" color={colors.primary} style={{ flex: 1 }} />
                                                ) : (
                                                    <>
                                                        <Text allowFontScaling={false} style={[fm.accordionLabel, { color: colors.textSecondary }]}>Subject</Text>
                                                        <View style={fm.accordionRight}>
                                                            <Text allowFontScaling={false} style={[fm.accordionValue, { color: selectedSubjects.length ? colors.text : colors.textSecondary }]} numberOfLines={1}>
                                                                {!newStudent.class_id
                                                                    ? 'Select class first'
                                                                    : selectedSubjects.length
                                                                        ? (() => {
                                                                            const names = subjects.filter(s => selectedSubjects.includes(s.id)).map(s => s.name);
                                                                            return names.length > 2 ? names.slice(0, 2).join(', ') + '...' : names.join(', ');
                                                                          })()
                                                                        : 'Select subjects'}
                                                            </Text>
                                                            <ChevronRight size={16} color={colors.textSecondary} style={chevronStyle('subject')} />
                                                        </View>
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                            {openFormDropdown === 'subject' && subjects.length > 0 && (
                                                <View style={[fm.accordionBody, { borderColor: colors.border }]}>
                                                    <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={fm.dropdownScroll}>
                                                        {subjects.map(sub => (
                                                            <TouchableOpacity
                                                                key={sub.id}
                                                                style={[fm.option, { borderBottomColor: colors.border }]}
                                                                onPress={() => toggleSubject(sub.id)}
                                                            >
                                                                <Text allowFontScaling={false} style={[fm.optionText, { color: colors.text }]}>{sub.name}</Text>
                                                                {selectedSubjects.includes(sub.id) && <Check size={16} color={colors.primary} />}
                                                            </TouchableOpacity>
                                                        ))}
                                                    </ScrollView>
                                                </View>
                                            )}
                                        </View>

                                        {/* Parent Contact */}
                                        <View style={modalForm.group}>
                                            <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>Parent Contact *</Text>
                                            <TextInput
                                                style={[modalForm.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                                value={newStudent.parent_contact}
                                                onChangeText={t => setNewStudent({ ...newStudent, parent_contact: t })}
                                                placeholder="Parent contact number"
                                                placeholderTextColor={colors.textSecondary}
                                                keyboardType="phone-pad"
                                                allowFontScaling={false}
                                            />
                                        </View>

                                        {/* Monthly Fee */}
                                        {!editingStudent && (
                                            <View style={modalForm.group}>
                                                <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>Monthly Fee (Rs) *</Text>
                                                <TextInput
                                                    style={[modalForm.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                                    value={newStudent.monthly_fee}
                                                    onChangeText={t => setNewStudent({ ...newStudent, monthly_fee: t })}
                                                    placeholder="e.g. 3000"
                                                    placeholderTextColor={colors.textSecondary}
                                                    keyboardType="numeric"
                                                    allowFontScaling={false}
                                                />
                                            </View>
                                        )}

                                        {/* Gender dropdown */}
                                        <View style={modalForm.group}>
                                            <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>Gender *</Text>
                                            <TouchableOpacity
                                                style={[fm.accordionHeader, { borderColor: colors.border }]}
                                                onPress={() => toggleFormDropdown('gender')}
                                            >
                                                <Text allowFontScaling={false} style={[fm.accordionLabel, { color: colors.textSecondary }]}>Gender</Text>
                                                <View style={fm.accordionRight}>
                                                    <Text allowFontScaling={false} style={[fm.accordionValue, { color: newStudent.gender ? colors.text : colors.textSecondary }]}>
                                                        {newStudent.gender ? newStudent.gender.charAt(0).toUpperCase() + newStudent.gender.slice(1) : 'Select gender'}
                                                    </Text>
                                                    <ChevronRight size={16} color={colors.textSecondary} style={chevronStyle('gender')} />
                                                </View>
                                            </TouchableOpacity>
                                            {openFormDropdown === 'gender' && (
                                                <View style={[fm.accordionBody, { borderColor: colors.border }]}>
                                                    {(['male', 'female', 'other'] as const).map(g => (
                                                        <TouchableOpacity
                                                            key={g}
                                                            style={[fm.option, { borderBottomColor: colors.border }]}
                                                            onPress={() => { setNewStudent({ ...newStudent, gender: g }); setOpenFormDropdown(null); }}
                                                        >
                                                            <Text allowFontScaling={false} style={[fm.optionText, { color: colors.text }]}>
                                                                {g.charAt(0).toUpperCase() + g.slice(1)}
                                                            </Text>
                                                            {newStudent.gender === g && <Check size={16} color={colors.primary} />}
                                                        </TouchableOpacity>
                                                    ))}
                                                </View>
                                            )}
                                        </View>

                                        {/* Address */}
                                        <View style={modalForm.group}>
                                            <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>Address *</Text>
                                            <TextInput
                                                style={[modalForm.textArea, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                                value={newStudent.address}
                                                onChangeText={t => setNewStudent({ ...newStudent, address: t })}
                                                placeholder="Student home address"
                                                placeholderTextColor={colors.textSecondary}
                                                multiline
                                                numberOfLines={3}
                                                allowFontScaling={false}
                                            />
                                        </View>

                                        {/* Admission Date */}
                                        <View style={modalForm.group}>
                                            <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>Admission Date *</Text>
                                            <TextInput
                                                style={[modalForm.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                                value={newStudent.admission_date}
                                                onChangeText={t => setNewStudent({ ...newStudent, admission_date: t })}
                                                placeholder="YYYY-MM-DD"
                                                placeholderTextColor={colors.textSecondary}
                                                allowFontScaling={false}
                                            />
                                        </View>

                                        {/* Date of Birth — calendar picker */}
                                        <View style={modalForm.group}>
                                            <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>Date of Birth (Optional)</Text>
                                            <TouchableOpacity
                                                style={[fm.accordionHeader, { borderColor: colors.border }]}
                                                onPress={() => setShowDobPicker(true)}
                                            >
                                                <Calendar size={15} color={newStudent.date_of_birth ? colors.primary : colors.textSecondary} />
                                                <Text allowFontScaling={false} style={[fm.fileText, { color: newStudent.date_of_birth ? colors.text : colors.textSecondary, marginLeft: 8 }]}>
                                                    {newStudent.date_of_birth || 'Select date of birth'}
                                                </Text>
                                                {newStudent.date_of_birth && (
                                                    <TouchableOpacity onPress={() => setNewStudent({ ...newStudent, date_of_birth: '' })} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                                        <X size={14} color="#EF4444" />
                                                    </TouchableOpacity>
                                                )}
                                            </TouchableOpacity>
                                            {showDobPicker && Platform.OS === 'android' && (
                                                <DateTimePicker
                                                    value={dobStr2Date(newStudent.date_of_birth)}
                                                    mode="date"
                                                    display="calendar"
                                                    maximumDate={new Date()}
                                                    onChange={(_, d) => {
                                                        setShowDobPicker(false);
                                                        if (d) setNewStudent(prev => ({ ...prev, date_of_birth: date2Str(d) }));
                                                    }}
                                                />
                                            )}
                                        </View>

                                        {/* Emergency Contact */}
                                        <View style={modalForm.group}>
                                            <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>Emergency Contact (Optional)</Text>
                                            <TextInput
                                                style={[modalForm.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                                value={newStudent.emergency_contact}
                                                onChangeText={t => setNewStudent({ ...newStudent, emergency_contact: t })}
                                                placeholder="Emergency contact number"
                                                placeholderTextColor={colors.textSecondary}
                                                keyboardType="phone-pad"
                                                allowFontScaling={false}
                                            />
                                        </View>

                                        {/* Parent Name */}
                                        <View style={modalForm.group}>
                                            <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>Parent/Guardian Name (Optional)</Text>
                                            <TextInput
                                                style={[modalForm.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                                value={newStudent.parent_name}
                                                onChangeText={t => setNewStudent({ ...newStudent, parent_name: t })}
                                                placeholder="Parent/guardian full name"
                                                placeholderTextColor={colors.textSecondary}
                                                allowFontScaling={false}
                                            />
                                        </View>

                                        {/* Medical Conditions */}
                                        <View style={modalForm.group}>
                                            <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>Medical Conditions (Optional)</Text>
                                            <TextInput
                                                style={[modalForm.textArea, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                                value={newStudent.medical_conditions}
                                                onChangeText={t => setNewStudent({ ...newStudent, medical_conditions: t })}
                                                placeholder="Any medical conditions or allergies"
                                                placeholderTextColor={colors.textSecondary}
                                                multiline
                                                numberOfLines={2}
                                                allowFontScaling={false}
                                            />
                                        </View>

                                        {/* Notes */}
                                        <View style={modalForm.group}>
                                            <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>Notes (Optional)</Text>
                                            <TextInput
                                                style={[modalForm.textArea, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                                value={newStudent.notes}
                                                onChangeText={t => setNewStudent({ ...newStudent, notes: t })}
                                                placeholder="Additional notes about the student"
                                                placeholderTextColor={colors.textSecondary}
                                                multiline
                                                numberOfLines={2}
                                                allowFontScaling={false}
                                            />
                                        </View>

                                        {/* Workflow info */}
                                        {!editingStudent && (
                                            <View style={[modalForm.infoBox, { backgroundColor: colors.cardBackground }]}>
                                                <Text allowFontScaling={false} style={[modalForm.infoText, { color: colors.textSecondary }]}>
                                                    Email: {newStudent.roll_number.toLowerCase() || 'rollno'}@aliacademy.com — student will use this to register and set their password.
                                                </Text>
                                            </View>
                                        )}

                                        {/* Submit */}
                                        <TouchableOpacity
                                            style={[modalForm.submitBtn, { backgroundColor: colors.primary }, creating && { opacity: 0.6 }]}
                                            onPress={editingStudent ? handleUpdateStudent : handleAddStudent}
                                            disabled={creating}
                                        >
                                            {creating
                                                ? <ActivityIndicator color="#ffffff" />
                                                : <Text allowFontScaling={false} style={modalForm.submitText}>
                                                    {editingStudent ? 'Save Changes' : 'Add Student'}
                                                  </Text>
                                            }
                                        </TouchableOpacity>
                                    </ScrollView>
                                </View>

                                {/* iOS DOB picker modal */}
                                {showDobPicker && Platform.OS === 'ios' && (
                                    <Modal transparent animationType="fade" onRequestClose={() => setShowDobPicker(false)}>
                                        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                                            <TouchableWithoutFeedback onPress={() => setShowDobPicker(false)}>
                                                <View style={StyleSheet.absoluteFillObject} />
                                            </TouchableWithoutFeedback>
                                            <View style={[fm.pickerSheet, { backgroundColor: colors.cardBackground }]}>
                                                <View style={[fm.pickerHeader, { borderBottomColor: colors.border }]}>
                                                    <Text allowFontScaling={false} style={[fm.pickerTitle, { color: colors.text }]}>Date of Birth</Text>
                                                    <TouchableOpacity onPress={() => setShowDobPicker(false)}>
                                                        <Text allowFontScaling={false} style={[fm.pickerDone, { color: colors.primary }]}>Done</Text>
                                                    </TouchableOpacity>
                                                </View>
                                                <DateTimePicker
                                                    value={dobStr2Date(newStudent.date_of_birth)}
                                                    mode="date"
                                                    display="spinner"
                                                    maximumDate={new Date()}
                                                    textColor={colors.text}
                                                    onChange={(_, d) => { if (d) setNewStudent(prev => ({ ...prev, date_of_birth: date2Str(d) })); }}
                                                />
                                            </View>
                                        </View>
                                    </Modal>
                                )}
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
        justifyContent: 'flex-end',
    },
    filterSheet: {
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
        paddingTop: 12, paddingBottom: 32, height: height * 0.45,
    },
    filterHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
    filterSheetHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8 },
    filterSheetTitle: { flex: 1, fontSize: TextSizes.sectionTitle, fontFamily: 'Inter-SemiBold' },
    filterResetText: { fontSize: TextSizes.filterLabel, fontFamily: 'Inter-Medium', color: '#EF4444' },
    addStudentRow: {
        flexDirection: 'row', alignItems: 'center',
        marginHorizontal: 16, marginBottom: 12,
        paddingVertical: 12, paddingHorizontal: 16,
        borderRadius: 10, borderWidth: 1, gap: 8,
    },
    addStudentText: { fontSize: TextSizes.medium, fontFamily: 'Inter-SemiBold' },
    filterScroll: { flex: 1 },
    filterAccordionHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        marginHorizontal: 16, marginBottom: 8, paddingHorizontal: 14, paddingVertical: 12,
        borderRadius: 10, borderWidth: 1,
    },
    filterAccordionLabel: { fontSize: TextSizes.filterLabel, fontFamily: 'Inter-Medium', flex: 1 },
    filterAccordionValue: { fontSize: TextSizes.filterLabel, fontFamily: 'Inter-SemiBold' },
    filterAccordionRight: { flexDirection: 'row', alignItems: 'center' },
    filterAccordionBody: { marginHorizontal: 16, marginBottom: 8, borderRadius: 10, borderWidth: 1, overflow: 'hidden' },
    filterOption: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth,
    },
    filterOptionText: { fontSize: TextSizes.medium, fontFamily: 'Inter-Regular', flex: 1 },
    filterApplyBtn: { marginHorizontal: 16, marginTop: 8, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
    filterApplyBtnText: { fontSize: TextSizes.medium, fontFamily: 'Inter-SemiBold', color: '#ffffff' },
});

const fm = StyleSheet.create({
    root: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    accordionHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, borderWidth: 1, gap: 8 },
    accordionDisabled: { opacity: 0.5 },
    accordionLabel: { fontSize: TextSizes.filterLabel, fontFamily: 'Inter-Medium', flex: 1 },
    accordionRight: { flexDirection: 'row', alignItems: 'center' },
    accordionValue: { fontSize: TextSizes.filterLabel, fontFamily: 'Inter-SemiBold' },
    accordionBody: { marginTop: 6, borderRadius: 10, borderWidth: 1, overflow: 'hidden' },
    dropdownScroll: { maxHeight: 180 },
    option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
    optionText: { fontSize: TextSizes.medium, fontFamily: 'Inter-Regular', flex: 1 },
    fileText: { flex: 1, fontSize: TextSizes.normal, fontFamily: 'Inter-Regular' },
    pickerSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20 },
    pickerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
    pickerTitle: { fontSize: TextSizes.sectionTitle, fontFamily: 'Inter-SemiBold' },
    pickerDone: { fontSize: TextSizes.medium, fontFamily: 'Inter-SemiBold' },
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