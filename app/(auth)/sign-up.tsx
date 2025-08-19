import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/contexts/AuthContext';
import { validateStudentEmail, completeStudentRegistration } from '@/src/lib/auth';
import { GraduationCap, Eye, EyeOff, CheckCircle, User, BookOpen } from 'lucide-react-native';

interface StudentData {
    id: string;
    full_name: string;
    roll_number: string;
    email: string;
    classes: {
        name: string;
    };
}

export default function SignUpScreen() {
    const [step, setStep] = useState(1); // 1: Email, 2: Password, 3: Success
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [studentData, setStudentData] = useState<StudentData | null>(null);
    const { signIn } = useAuth();

    const handleEmailValidation = async () => {
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        setLoading(true);
        try {
            const result = await validateStudentEmail(email.toLowerCase().trim());
            
            if (result.isValid && result.student) {
                setStudentData(result?.student);
                setStep(2);
            } else {
                Alert.alert('Email Not Found', result.message);
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to validate email');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSet = async () => {
        // Validation
        if (!password.trim()) {
            Alert.alert('Error', 'Please enter a password');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters long');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const result = await completeStudentRegistration(email, password);
            
            if (result.success) {
                setStep(3);
            } else {
                Alert.alert('Error', result.message);
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to set password');
        } finally {
            setLoading(false);
        }
    };

    const handleSignIn = async () => {
        try {
            setLoading(true);
            await signIn(email, password);
        } catch (error: any) {
            Alert.alert('Sign In Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setStep(1);
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setStudentData(null);
        setShowPassword(false);
        setShowConfirmPassword(false);
    };

    const renderEmailStep = () => (
        <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
                <GraduationCap size={32} color="#274d71" />
                <Text style={styles.stepTitle}>Student Registration</Text>
                <Text style={styles.stepDescription}>
                    Enter the email address provided by your teacher
                </Text>
            </View>

            <View style={styles.inputContainer}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email Address</Text>
                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="your.email@example.com"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        onSubmitEditing={handleEmailValidation}
                        returnKeyType="next"
                    />
                </View>
            </View>

            <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleEmailValidation}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#ffffff" />
                ) : (
                    <Text style={styles.buttonText}>Continue</Text>
                )}
            </TouchableOpacity>
        </View>
    );

    const renderPasswordStep = () => (
        <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
                <CheckCircle size={32} color="#10B981" />
                <Text style={styles.stepTitle}>Set Your Password</Text>
                <Text style={styles.stepDescription}>
                    Create a secure password for your account
                </Text>
            </View>

            {/* Student Info Display */}
            {studentData && (
                <View style={styles.studentInfoCard}>
                    <View style={styles.studentInfoHeader}>
                        <User size={20} color="#274d71" />
                        <Text style={styles.studentInfoTitle}>Student Information</Text>
                    </View>
                    <Text style={styles.studentName}>{studentData.full_name}</Text>
                    <Text style={styles.studentDetails}>
                        Roll: {studentData.roll_number} • Class: {studentData.classes.name}
                    </Text>
                    <Text style={styles.studentEmail}>{studentData.email}</Text>
                </View>
            )}

            <View style={styles.inputContainer}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Password</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Enter password"
                            placeholderTextColor="#9CA3AF"
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                            returnKeyType="next"
                        />
                        <TouchableOpacity
                            style={styles.eyeButton}
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? (
                                <EyeOff size={20} color="#9CA3AF" />
                            ) : (
                                <Eye size={20} color="#9CA3AF" />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Confirm Password</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholder="Confirm password"
                            placeholderTextColor="#9CA3AF"
                            secureTextEntry={!showConfirmPassword}
                            autoCapitalize="none"
                            returnKeyType="done"
                            onSubmitEditing={handlePasswordSet}
                        />
                        <TouchableOpacity
                            style={styles.eyeButton}
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                            {showConfirmPassword ? (
                                <EyeOff size={20} color="#9CA3AF" />
                            ) : (
                                <Eye size={20} color="#9CA3AF" />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <View style={styles.passwordRequirements}>
                <Text style={styles.requirementsTitle}>Password Requirements:</Text>
                <Text style={styles.requirementItem}>• At least 6 characters long</Text>
                <Text style={styles.requirementItem}>• Should be easy to remember</Text>
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => setStep(1)}
                >
                    <Text style={styles.secondaryButtonText}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, { flex: 1 }, loading && styles.buttonDisabled]}
                    onPress={handlePasswordSet}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <Text style={styles.buttonText}>Set Password</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderSuccessStep = () => (
        <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
                <CheckCircle size={48} color="#10B981" />
                <Text style={styles.stepTitle}>Registration Complete!</Text>
                <Text style={styles.stepDescription}>
                    Your account has been set up successfully
                </Text>
            </View>

            {studentData && (
                <View style={styles.successCard}>
                    <BookOpen size={32} color="#274d71" />
                    <Text style={styles.successName}>Welcome, {studentData.full_name}!</Text>
                    <Text style={styles.successDetails}>
                        You can now access your student portal
                    </Text>
                </View>
            )}

            <TouchableOpacity
                style={styles.button}
                onPress={handleSignIn}
            >
                <Text style={styles.buttonText}>Sign In Now</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.secondaryButton}
                onPress={resetForm}
            >
                <Text style={styles.secondaryButtonText}>Register Another Student</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Progress Indicator */}
                    <View style={styles.progressContainer}>
                        <View style={styles.progressSteps}>
                            <View style={[
                                styles.progressStep,
                                { backgroundColor: step >= 1 ? '#274d71' : '#E5E7EB' }
                            ]}>
                                <Text style={[
                                    styles.progressStepText,
                                    { color: step >= 1 ? '#ffffff' : '#9CA3AF' }
                                ]}>1</Text>
                            </View>
                            <View style={[
                                styles.progressLine,
                                { backgroundColor: step >= 2 ? '#274d71' : '#E5E7EB' }
                            ]} />
                            <View style={[
                                styles.progressStep,
                                { backgroundColor: step >= 2 ? '#274d71' : '#E5E7EB' }
                            ]}>
                                <Text style={[
                                    styles.progressStepText,
                                    { color: step >= 2 ? '#ffffff' : '#9CA3AF' }
                                ]}>2</Text>
                            </View>
                            <View style={[
                                styles.progressLine,
                                { backgroundColor: step >= 3 ? '#274d71' : '#E5E7EB' }
                            ]} />
                            <View style={[
                                styles.progressStep,
                                { backgroundColor: step >= 3 ? '#274d71' : '#E5E7EB' }
                            ]}>
                                <Text style={[
                                    styles.progressStepText,
                                    { color: step >= 3 ? '#ffffff' : '#9CA3AF' }
                                ]}>3</Text>
                            </View>
                        </View>
                        <View style={styles.progressLabels}>
                            <Text style={styles.progressLabel}>Email</Text>
                            <Text style={styles.progressLabel}>Password</Text>
                            <Text style={styles.progressLabel}>Complete</Text>
                        </View>
                    </View>

                    {/* Step Content */}
                    {step === 1 && renderEmailStep()}
                    {step === 2 && renderPasswordStep()}
                    {step === 3 && renderSuccessStep()}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 40,
    },
    progressContainer: {
        marginBottom: 40,
    },
    progressSteps: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    progressStep: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressStepText: {
        fontSize: 14,
        fontFamily: 'Inter-SemiBold',
    },
    progressLine: {
        width: 60,
        height: 2,
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    progressLabel: {
        fontSize: 12,
        fontFamily: 'Inter-Medium',
        color: '#6B7280',
    },
    stepContainer: {
        flex: 1,
    },
    stepHeader: {
        alignItems: 'center',
        marginBottom: 32,
    },
    stepTitle: {
        fontSize: 24,
        fontFamily: 'Inter-SemiBold',
        color: '#274d71',
        marginTop: 16,
        marginBottom: 8,
    },
    stepDescription: {
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
    },
    inputContainer: {
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        height: 50,
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        color: '#111827',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
    },
    passwordInput: {
        flex: 1,
        height: 50,
        paddingHorizontal: 16,
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        color: '#111827',
    },
    eyeButton: {
        padding: 15,
    },
    studentInfoCard: {
        backgroundColor: '#F0F9FF',
        borderWidth: 1,
        borderColor: '#0EA5E9',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
    },
    studentInfoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    studentInfoTitle: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        color: '#374151',
        marginLeft: 8,
    },
    studentName: {
        fontSize: 18,
        fontFamily: 'Inter-SemiBold',
        color: '#274d71',
        marginBottom: 4,
    },
    studentDetails: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        color: '#6B7280',
        marginBottom: 2,
    },
    studentEmail: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        color: '#6B7280',
    },
    passwordRequirements: {
        marginBottom: 24,
    },
    requirementsTitle: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        color: '#374151',
        marginBottom: 8,
    },
    requirementItem: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        color: '#6B7280',
        marginBottom: 4,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        height: 50,
        backgroundColor: '#274d71',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
    },
    secondaryButton: {
        height: 50,
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        minWidth: 80,
    },
    secondaryButtonText: {
        color: '#374151',
        fontSize: 16,
        fontFamily: 'Inter-Medium',
    },
    successCard: {
        backgroundColor: '#F0F9FF',
        borderWidth: 1,
        borderColor: '#0EA5E9',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 32,
    },
    successName: {
        fontSize: 20,
        fontFamily: 'Inter-SemiBold',
        color: '#274d71',
        marginTop: 16,
        marginBottom: 8,
    },
    successDetails: {
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        color: '#6B7280',
        textAlign: 'center',
    },
});