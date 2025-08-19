// Updated StudentsScreen component
import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useStudents } from '@/src/hooks/useStudents';
import { createStudentSimple, getStudentsWithoutPasswords } from '@/src/lib/api/simple-student-creation';
import {
    Plus,
    Search,
    Users,
    Phone,
    Hash,
    BookOpen,
    X,
    AlertCircle,
} from 'lucide-react-native';
import { supabase } from '@/src/lib/supabase';
import TopSection from '../common/TopSections';

interface Class {
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

    const [newStudent, setNewStudent] = useState({
        full_name: '',
        roll_number: '',
        phone_number: '',
        parent_contact: '',
        class_id: '',
        gender: '' as 'male' | 'female' | 'other' | '',
        address: '',
        admission_date: new Date().toISOString().split('T')[0],
        date_of_birth: '',
        emergency_contact: '',
        parent_name: '',
        medical_conditions: '',
        notes: '',
    });

    useEffect(() => {
        if (profile?.role === 'teacher') {
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
            if (data && data.length > 0) {
                setNewStudent((prev) => ({ ...prev, class_id: data[0].id }));
            }
        } catch (error) {
            console.error('Error fetching classes:', error);
            Alert.alert('Error', 'Failed to load classes');
        }
    };

    const fetchStudentsPasswordStatus = async () => {
        try {
            const studentsWithoutPass = await getStudentsWithoutPasswords();
            setStudentsWithoutPasswords(studentsWithoutPass);
        } catch (error) {
            console.error('Error fetching students without passwords:', error);
        }
    };

    const resetForm = () => {
        setNewStudent({
            full_name: '',
            roll_number: '',
            phone_number: '',
            parent_contact: '',
            class_id: classes.length > 0 ? classes[0].id : '',
            gender: '' as 'male' | 'female' | 'other' | '',
            address: '',
            admission_date: new Date().toISOString().split('T')[0],
            date_of_birth: '',
            emergency_contact: '',
            parent_name: '',
            medical_conditions: '',
            notes: '',
        });
    };

    const handleAddStudent = async () => {
        // Validation
        if (!newStudent.full_name.trim()) {
            Alert.alert('Error', 'Student name is required');
            return;
        }
        if (!newStudent.roll_number.trim()) {
            Alert.alert('Error', 'Roll number is required');
            return;
        }
        if (!newStudent.phone_number.trim()) {
            Alert.alert('Error', 'Student phone number is required');
            return;
        }
        if (!newStudent.class_id) {
            Alert.alert('Error', 'Please select a class');
            return;
        }
        if (!newStudent.parent_contact.trim()) {
            Alert.alert('Error', 'Parent contact is required');
            return;
        }
        if (!newStudent.gender) {
            Alert.alert('Error', 'Please select gender');
            return;
        }
        if (!newStudent.address.trim()) {
            Alert.alert('Error', 'Address is required');
            return;
        }
        if (!newStudent.admission_date) {
            Alert.alert('Error', 'Admission date is required');
            return;
        }

        setCreating(true);
        try {
            const result = await createStudentSimple(newStudent, profile!.id);

            if (result.success) {
                // Add to local students list
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
                                fetchStudentsPasswordStatus(); // Refresh pending list
                                refetch(); // Refresh students list
                            },
                        },
                    ]
                );
            } else {
                Alert.alert('Error', result.error || 'Failed to create student');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to create student');
        } finally {
            setCreating(false);
        }
    };

    const filteredStudents = students.filter(
        (student) =>
            student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.roll_number.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (profile?.role !== 'teacher') {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                    <View style={styles.errorContainer}>
                        <Text style={[styles.errorText, { color: colors.text }]}>Access Denied</Text>
                        <Text style={[styles.errorSubtext, { color: colors.textSecondary }]}>
                            This section is only available for teachers and administrators.
                        </Text>
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    return (
        <>
            <TopSection />
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right']}>
                    <View style={styles.headerContainer}>
                        <View style={styles.searchContainer}>
                            <View style={[styles.searchInputContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                                <Search size={20} color={colors.textSecondary} />
                                <TextInput
                                    style={[styles.searchInput, { color: colors.text }]}
                                    placeholder="Search students..."
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    placeholderTextColor={colors.textSecondary}
                                />
                            </View>
                            <TouchableOpacity
                                style={[styles.addButton, { backgroundColor: colors.primary }]}
                                onPress={() => {
                                    resetForm();
                                    setModalVisible(true);
                                }}
                            >
                                <Plus size={20} color="#ffffff" />
                            </TouchableOpacity>
                        </View>

                        {/* Pending Registration Banner */}
                        {studentsWithoutPasswords.length > 0 && (
                            <TouchableOpacity
                                style={[styles.alertBanner, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}
                                onPress={() => setPasswordStatusModalVisible(true)}
                            >
                                <AlertCircle size={20} color="#F59E0B" />
                                <Text style={[styles.alertText, { color: '#92400E' }]}>
                                    {studentsWithoutPasswords.length} student(s) pending registration
                                </Text>
                                <Text style={[styles.alertAction, { color: '#F59E0B' }]}>View Details</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Student List */}
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={{ paddingBottom: 50 }}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={colors.primary} />
                                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading students...</Text>
                            </View>
                        ) : filteredStudents.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Users size={48} color={colors.textSecondary} />
                                <Text style={[styles.emptyText, { color: colors.text }]}>No students found</Text>
                                <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                                    {searchQuery ? 'Try adjusting your search' : 'Add your first student to get started'}
                                </Text>
                            </View>
                        ) : (
                            filteredStudents.map((student) => (
                                <TouchableOpacity
                                    key={student.id}
                                    style={[styles.studentCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                                    onPress={() => console.log('Student details not implemented yet')}
                                >
                                    <View style={styles.studentHeader}>
                                        <View style={[styles.studentAvatar, { backgroundColor: colors.primary }]}>
                                            <Text style={styles.studentInitial}>{student.full_name.charAt(0).toUpperCase()}</Text>
                                        </View>
                                        <View style={styles.studentInfo}>
                                            <Text style={[styles.studentName, { color: colors.text }]}>{student.full_name}</Text>
                                            <View style={styles.studentDetails}>
                                                <View style={styles.detailItem}>
                                                    <Hash size={14} color={colors.textSecondary} />
                                                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>{student.roll_number}</Text>
                                                </View>
                                                <View style={styles.detailItem}>
                                                    <BookOpen size={14} color={colors.textSecondary} />
                                                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>{student.classes?.name}</Text>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                    <View style={[styles.contactInfo, { borderTopColor: colors.border }]}>
                                        <View style={styles.contactRow}>
                                            <Phone size={16} color={colors.textSecondary} />
                                            <Text style={[styles.contactText, { color: colors.text }]}>{student.phone_number || 'N/A'}</Text>
                                        </View>
                                        <View style={styles.contactRow}>
                                            <Phone size={16} color={colors.textSecondary} />
                                            <Text style={[styles.contactText, { color: colors.text }]}>Parent: {student.parent_contact}</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))
                        )}
                    </ScrollView>

                    {/* Add Student Modal */}
                    <Modal
                        animationType="fade"
                        transparent={true}
                        visible={modalVisible}
                        onRequestClose={() => setModalVisible(false)}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                                <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                                    <Text style={[styles.modalTitle, { color: colors.text }]}>Add New Student</Text>
                                    <TouchableOpacity
                                        style={styles.closeButton}
                                        onPress={() => setModalVisible(false)}
                                    >
                                        <X size={24} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>

                                <ScrollView style={styles.modalScrollView}>
                                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Student Information</Text>

                                    <View style={styles.inputGroup}>
                                        <Text style={[styles.label, { color: colors.text }]}>Full Name *</Text>
                                        <TextInput
                                            style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                            value={newStudent.full_name}
                                            onChangeText={(text) => setNewStudent({ ...newStudent, full_name: text })}
                                            placeholder="Enter student full name"
                                            placeholderTextColor={colors.textSecondary}
                                        />
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={[styles.label, { color: colors.text }]}>Roll Number *</Text>
                                        <TextInput
                                            style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                            value={newStudent.roll_number}
                                            onChangeText={(text) => setNewStudent({ ...newStudent, roll_number: text })}
                                            placeholder="Enter roll number"
                                            placeholderTextColor={colors.textSecondary}
                                        />
                                        <Text style={[styles.helpText, { color: colors.textSecondary }]}>
                                            Email will be: {newStudent.roll_number.toLowerCase()}@aliacademy.edu
                                        </Text>
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={[styles.label, { color: colors.text }]}>Phone Number *</Text>
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
                                        <Text style={[styles.label, { color: colors.text }]}>Class *</Text>
                                        {classes.length === 0 ? (
                                            <Text style={[styles.label, { color: colors.textSecondary }]}>No classes available</Text>
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
                                                            onPress={() => setNewStudent({ ...newStudent, class_id: classItem.id })}
                                                        >
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
                                        <Text style={[styles.label, { color: colors.text }]}>Parent Contact *</Text>
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
                                        <Text style={[styles.label, { color: colors.text }]}>Gender *</Text>
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
                                        <Text style={[styles.label, { color: colors.text }]}>Address *</Text>
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
                                        <Text style={[styles.label, { color: colors.text }]}>Admission Date *</Text>
                                        <TextInput
                                            style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                            value={newStudent.admission_date}
                                            onChangeText={(text) => setNewStudent({ ...newStudent, admission_date: text })}
                                            placeholder="YYYY-MM-DD"
                                            placeholderTextColor={colors.textSecondary}
                                        />
                                    </View>

                                    <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>Additional Information (Optional)</Text>

                                    <View style={styles.inputGroup}>
                                        <Text style={[styles.label, { color: colors.text }]}>Date of Birth</Text>
                                        <TextInput
                                            style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                            value={newStudent.date_of_birth}
                                            onChangeText={(text) => setNewStudent({ ...newStudent, date_of_birth: text })}
                                            placeholder="YYYY-MM-DD"
                                            placeholderTextColor={colors.textSecondary}
                                        />
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={[styles.label, { color: colors.text }]}>Emergency Contact</Text>
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
                                        <Text style={[styles.label, { color: colors.text }]}>Parent/Guardian Name</Text>
                                        <TextInput
                                            style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                            value={newStudent.parent_name}
                                            onChangeText={(text) => setNewStudent({ ...newStudent, parent_name: text })}
                                            placeholder="Parent/guardian full name"
                                            placeholderTextColor={colors.textSecondary}
                                        />
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={[styles.label, { color: colors.text }]}>Medical Conditions</Text>
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
                                        <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
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

                                    {/* Info box about workflow */}
                                    <View style={[styles.infoBox, { backgroundColor: '#EBF8FF', borderColor: '#3182CE' }]}>
                                        <Text style={[styles.infoTitle, { color: '#2C5282' }]}>How it works:</Text>
                                        <Text style={[styles.infoText, { color: '#2A4A6B' }]}>
                                            1. Student record is created with email: {newStudent.roll_number.toLowerCase()}@aliacademy.edu{'\n'}
                                            2. Student uses this email in the registration screen{'\n'}
                                            3. Student sets their own password{'\n'}
                                            4. Auth account is created automatically
                                        </Text>
                                    </View>

                                    <TouchableOpacity
                                        style={[styles.submitButton, { backgroundColor: colors.primary }]}
                                        onPress={handleAddStudent}
                                        disabled={creating}
                                    >
                                        {creating ? (
                                            <ActivityIndicator color="#ffffff" />
                                        ) : (
                                            <Text style={styles.submitButtonText}>Create Student (No Password)</Text>
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
                    >
                        <View style={styles.modalOverlay}>
                            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                                <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                                    <Text style={[styles.modalTitle, { color: colors.text }]}>Students Pending Registration</Text>
                                    <TouchableOpacity
                                        style={styles.closeButton}
                                        onPress={() => setPasswordStatusModalVisible(false)}
                                    >
                                        <X size={24} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                                <ScrollView style={styles.modalScrollView}>
                                    <Text style={[styles.infoText, { color: colors.textSecondary, marginBottom: 16 }]}>
                                        These students need to use their email to register and set their password.
                                    </Text>
                                    {studentsWithoutPasswords.map((student) => (
                                        <View
                                            key={student.id}
                                            style={[styles.pendingStudentCard, { borderColor: colors.border, backgroundColor: colors.cardBackground }]}
                                        >
                                            <View style={styles.pendingStudentInfo}>
                                                <Text style={[styles.pendingStudentName, { color: colors.text }]}>
                                                    {student.full_name}
                                                </Text>
                                                <Text style={[styles.pendingStudentDetails, { color: colors.textSecondary }]}>
                                                    Roll: {student.roll_number} | Class: {student.classes.name}
                                                </Text>
                                                <Text style={[styles.pendingStudentEmail, { color: colors.primary }]}>
                                                    📧 {student.email}
                                                </Text>
                                                <Text style={[styles.pendingStudentStatus, { color: '#F59E0B' }]}>
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
        </>
    );
}

// Updated styles
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    errorText: {
        fontSize: 24,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 8,
    },
    errorSubtext: {
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
    },
    headerContainer: {
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        height: 48,
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        marginLeft: 12,
    },
    addButton: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    alertBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: 16,
    },
    alertText: {
        flex: 1,
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        marginLeft: 8,
    },
    alertAction: {
        fontSize: 14,
        fontFamily: 'Inter-SemiBold',
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 24,
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        marginTop: 12,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 18,
        fontFamily: 'Inter-SemiBold',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
    },
    studentCard: {
        borderRadius: 16,
        padding: 20,
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
        fontSize: 20,
        fontFamily: 'Inter-SemiBold',
        color: '#ffffff',
    },
    studentInfo: {
        flex: 1,
    },
    studentName: {
        fontSize: 18,
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
        fontSize: 14,
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
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        marginLeft: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
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
        fontSize: 20,
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
        paddingVertical: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 16,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        marginBottom: 8,
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        fontFamily: 'Inter-Regular',
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        textAlignVertical: 'top',
    },
    classOptions: {
        flexDirection: 'row',
        gap: 8,
    },
    classOption: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderRadius: 8,
    },
    classOptionText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
    },
    genderOptions: {
        flexDirection: 'row',
        gap: 8,
    },
    genderOption: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderRadius: 8,
        alignItems: 'center',
    },
    genderOptionText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
    },
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
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
    },
    infoText: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
    },
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
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 4,
    },
    pendingStudentDetails: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        marginBottom: 4,
    },
    pendingStudentEmail: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        marginBottom: 4,
    },
    pendingStudentStatus: {
        fontSize: 12,
        fontFamily: 'Inter-Medium',
    },
    helpText: {
        fontSize: 12,
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
        fontSize: 14,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
        lineHeight: 18,
    },

});