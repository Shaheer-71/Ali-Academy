import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useDialog } from '@/src/contexts/DialogContext';
import { supabase } from '@/src/lib/supabase';
import { UserX, UserCheck, RefreshCw } from 'lucide-react-native';
import TopSections from '@/src/components/common/TopSections';
import { useScreenAnimation } from '@/src/utils/animations';
import { TextSizes } from '@/src/styles/TextSizes';
import { RefreshControl } from 'react-native';

export default function ActivateUsersScreen() {
    const { colors } = useTheme();
    const { showError, showSuccess, showConfirm } = useDialog();
    const screenStyle = useScreenAnimation();
    const [inactiveStudents, setInactiveStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [reactivating, setReactivating] = useState<string | null>(null);

    const fetchInactiveStudents = useCallback(async () => {
        try {
            const { data } = await supabase
                .from('students')
                .select('id, full_name, roll_number, phone_number, classes(name)')
                .eq('is_deleted', true)
                .order('full_name');
            setInactiveStudents(data || []);
        } catch {
            // silent
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchInactiveStudents();
    }, [fetchInactiveStudents]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchInactiveStudents();
    };

    const handleReactivate = (student: any) => {
        showConfirm({
            title: 'Reactivate Student',
            message: `Reactivate ${student.full_name}?\n\nThey will be able to log in again using their original credentials.`,
            confirmText: 'Reactivate',
            cancelText: 'Cancel',
            onConfirm: async () => {
                setReactivating(student.id);
                try {
                    // 1. Re-enable student record
                    const { error: stuErr } = await supabase
                        .from('students')
                        .update({ is_deleted: false, student_status: 'active' })
                        .eq('id', student.id);
                    if (stuErr) throw stuErr;

                    // trigger syncs profiles.is_active and enrollments automatically

                    showSuccess('Success', `${student.full_name} has been reactivated.`, fetchInactiveStudents);
                } catch (e: any) {
                    showError('Error', e?.message || 'Failed to reactivate student.');
                } finally {
                    setReactivating(null);
                }
            },
        });
    };

    return (
        <Animated.View style={[{ flex: 1 }, screenStyle, { backgroundColor: colors.background }]}>
            <TopSections />
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right']}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[colors.primary]}
                            tintColor={colors.primary}
                        />
                    }
                >
                    {loading ? (
                        <View style={styles.centered}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    ) : inactiveStudents.length === 0 ? (
                        <View style={styles.centered}>
                            <UserCheck size={48} color={colors.textSecondary} />
                            <Text allowFontScaling={false} style={[styles.emptyTitle, { color: colors.text }]}>
                                All students are active
                            </Text>
                            <Text allowFontScaling={false} style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                                No deactivated accounts found
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.list}>
                            <Text allowFontScaling={false} style={[styles.countText, { color: colors.textSecondary }]}>
                                {inactiveStudents.length} deactivated {inactiveStudents.length === 1 ? 'student' : 'students'}
                            </Text>
                            {inactiveStudents.map((student) => (
                                <View
                                    key={student.id}
                                    style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                                >
                                    <View style={styles.cardLeft}>
                                        <View style={styles.avatar}>
                                            <UserX size={20} color="#EF4444" />
                                        </View>
                                        <View style={styles.info}>
                                            <Text allowFontScaling={false} style={[styles.name, { color: colors.text }]}>
                                                {student.full_name}
                                            </Text>
                                            <Text allowFontScaling={false} style={[styles.meta, { color: colors.textSecondary }]}>
                                                {student.roll_number}
                                                {student.classes?.name ? ` • ${student.classes.name}` : ''}
                                            </Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.reactivateBtn, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}
                                        onPress={() => handleReactivate(student)}
                                        disabled={reactivating === student.id}
                                    >
                                        {reactivating === student.id ? (
                                            <ActivityIndicator size="small" color={colors.primary} />
                                        ) : (
                                            <>
                                                <UserCheck size={14} color={colors.primary} />
                                                <Text allowFontScaling={false} style={[styles.reactivateBtnText, { color: colors.primary }]}>
                                                    Reactivate
                                                </Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingBottom: 100,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
        gap: 12,
    },
    emptyTitle: {
        fontSize: TextSizes.large,
        fontFamily: 'Inter-SemiBold',
        marginTop: 8,
    },
    emptySubtitle: {
        fontSize: TextSizes.medium,
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
    },
    list: {
        paddingTop: 8,
    },
    countText: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Regular',
        marginBottom: 12,
        marginLeft: 4,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
    },
    cardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#FEF2F2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: TextSizes.medium,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 2,
    },
    meta: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Regular',
    },
    reactivateBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        minWidth: 100,
        justifyContent: 'center',
    },
    reactivateBtnText: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-SemiBold',
    },
});
