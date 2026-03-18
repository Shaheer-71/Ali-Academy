import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
    ActivityIndicator,
    RefreshControl,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import {
    Check,
    Clock,
    DollarSign,
    ChevronDown,
    X,
} from 'lucide-react-native';
import { supabase } from '@/src/lib/supabase';
import { TextSizes } from '@/src/styles/TextSizes';
import { useScreenAnimation } from '@/src/utils/animations';
import TopSections from '@/src/components/common/TopSections';

const MONTHS = [
    'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December',
];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

interface FeeRecord {
    id: string;
    month: number;
    year: number;
    amount_paid: string | null;
    payment_status: string;
    payment_date: string | null;
    payment_method: string | null;
    notes: string | null;
    receipt_number: string | null;
}

interface StudentFeeInfo {
    amount_due: number | null;
    class_name: string | null;
}

export default function StudentFeeScreen() {
    const { profile } = useAuth();
    const { colors } = useTheme();
    const screenStyle = useScreenAnimation();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [feeRecords, setFeeRecords] = useState<FeeRecord[]>([]);
    const [studentFeeInfo, setStudentFeeInfo] = useState<StudentFeeInfo>({ amount_due: null, class_name: null });

    // Filters
    const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
    const [selectedMonth, setSelectedMonth] = useState<number | null>(null); // null = all months
    const [filterVisible, setFilterVisible] = useState(false);
    const [yearOpen, setYearOpen] = useState(false);
    const [monthOpen, setMonthOpen] = useState(false);

    // Detail modal
    const [selectedRecord, setSelectedRecord] = useState<FeeRecord | null>(null);
    const [detailVisible, setDetailVisible] = useState(false);

    const fetchData = useCallback(async () => {
        if (!profile?.email) return;
        setLoading(true);
        try {
            // No student_id filter — RLS scopes to this student's records
            const { data: fsData } = await supabase
                .from('fee_structures')
                .select('amount, class_id, classes(name)')
                .eq('academic_year', CURRENT_YEAR)
                .maybeSingle();


            const fs = fsData as any;
            setStudentFeeInfo({
                amount_due: fs?.amount ?? null,
                class_name: fs?.classes?.name ?? null,
            });
        } catch (err) {
            console.warn('[FeeScreen] Error fetching fee structure:', err);
        }

        try {
            // No student_id filter — RLS already scopes this to the logged-in student's records only.
            // Filtering by student.id would miss payments saved under a legacy student UUID.
            const { data: payments, error } = await supabase
                .from('fee_payments')
                .select('id, month, year, amount_paid, payment_status, payment_date, payment_method, notes, receipt_number')
                .order('year', { ascending: false })
                .order('month', { ascending: false });

            if (error) throw error;
            setFeeRecords(payments || []);
        } catch (err) {
            console.warn('[FeeScreen] Error fetching fee payments:', err);
        } finally {
            setLoading(false);
        }
    }, [profile?.email]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    // Apply filters
    const filteredRecords = feeRecords.filter(r => {
        if (r.year !== selectedYear) return false;
        if (selectedMonth !== null && r.month !== selectedMonth) return false;
        return true;
    });

    // Stats for selected year
    const yearRecords = feeRecords.filter(r => r.year === selectedYear);
    const paidCount = yearRecords.filter(r => r.payment_status === 'paid').length;
    const unpaidCount = yearRecords.filter(r => r.payment_status !== 'paid').length;

    const handleCardPress = (record: FeeRecord) => {
        setSelectedRecord(record);
        setDetailVisible(true);
    };

    const isFiltered = selectedMonth !== null || selectedYear !== CURRENT_YEAR;

    return (
        <Animated.View style={[{ flex: 1, backgroundColor: colors.background }, screenStyle]}>
            <TopSections
                onFilterPress={() => { setFilterVisible(true); setYearOpen(false); setMonthOpen(false); }}
                isFiltered={isFiltered}
            />

            <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'bottom']}>
                {/* Summary Card */}
                {studentFeeInfo.amount_due != null && (
                    <View 
                    style={[styles.summaryCard, { backgroundColor: colors.secondary + '20', borderColor: colors.secondary }]}
                    >
                        <DollarSign size={18} color={colors.secondary} />
                        <View style={{ flex: 1 }}>
                            <Text allowFontScaling={false} style={[styles.summaryLabel, { color: colors.secondary }]}>
                                Monthly Fee
                            </Text>
                            <Text allowFontScaling={false} style={[styles.summaryAmount, { color: colors.secondary }]}>
                                Rs. {studentFeeInfo.amount_due}
                                {studentFeeInfo.class_name ? ` · ${studentFeeInfo.class_name}` : ''}
                            </Text>
                        </View>
                        <View style={styles.summaryStats}>
                            <View style={styles.statItem}>
                                <Text allowFontScaling={false} style={[styles.statVal, { color: colors.secondary }]}>{paidCount}</Text>
                                <Text allowFontScaling={false} style={[styles.statLbl, { color: colors.secondary }]}>Paid</Text>
                            </View>
                            <View style={[styles.statDivider, { backgroundColor: colors.secondary + '40' }]} />
                            <View style={styles.statItem}>
                                <Text allowFontScaling={false} style={[styles.statVal, { color: colors.textSecondary }]}>{unpaidCount}</Text>
                                <Text allowFontScaling={false} style={[styles.statLbl, { color: colors.textSecondary }]}>Unpaid</Text>
                            </View>
                        </View>
                    </View>
                )}


                {/* Records List */}
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
                    }
                >
                    {loading ? (
                        <View style={styles.centered}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    ) : filteredRecords.length === 0 ? (
                        <View style={styles.centered}>
                            <DollarSign size={44} color={colors.textSecondary} />
                            <Text allowFontScaling={false} style={[styles.emptyTitle, { color: colors.text }]}>
                                No records found
                            </Text>
                            <Text allowFontScaling={false} style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                                No fee records for {selectedMonth !== null ? `${MONTHS[selectedMonth - 1]} ` : ''}{selectedYear}
                            </Text>
                        </View>
                    ) : (
                        filteredRecords.map(record => (
                            <FeeRecordCard
                                key={record.id}
                                record={record}
                                colors={colors}
                                amountDue={studentFeeInfo.amount_due}
                                onPress={() => handleCardPress(record)}
                            />
                        ))
                    )}
                </ScrollView>
            </SafeAreaView>

            {/* Detail Modal */}
            <Modal
                visible={detailVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setDetailVisible(false)}
                statusBarTranslucent
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setDetailVisible(false)}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        style={[styles.detailSheet, { backgroundColor: colors.background }]}
                        onPress={e => e.stopPropagation()}
                    >
                        {selectedRecord && (
                            <>
                                {/* Sheet Header */}
                                <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
                                    <View>
                                        <Text allowFontScaling={false} style={[styles.sheetTitle, { color: colors.text }]}>
                                            {MONTHS[selectedRecord.month - 1]} {selectedRecord.year}
                                        </Text>
                                        <Text allowFontScaling={false} style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
                                            Fee Details
                                        </Text>
                                    </View>
                                    <TouchableOpacity onPress={() => setDetailVisible(false)}>
                                        <X size={22} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>

                                {/* Status Banner */}
                                <View style={[
                                    styles.statusBanner,
                                    {
                                        backgroundColor: selectedRecord.payment_status === 'paid'
                                            ? colors.secondary + '20'
                                            : colors.cardBackground,
                                        borderColor: selectedRecord.payment_status === 'paid'
                                            ? colors.secondary
                                            : colors.border,
                                    },
                                ]}>
                                    {selectedRecord.payment_status === 'paid'
                                        ? <Check size={18} color={colors.secondary} />
                                        : <Clock size={18} color={colors.textSecondary} />
                                    }
                                    <Text allowFontScaling={false} style={[
                                        styles.statusBannerText,
                                        { color: selectedRecord.payment_status === 'paid' ? colors.secondary : colors.textSecondary },
                                    ]}>
                                        {selectedRecord.payment_status === 'paid' ? 'Fee Paid' : 'Fee Unpaid'}
                                    </Text>
                                </View>

                                {/* Detail Rows */}
                                <View style={[styles.detailCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                                    <DetailRow
                                        label="Amount"
                                        value={selectedRecord.amount_paid
                                            ? `Rs. ${selectedRecord.amount_paid}`
                                            : studentFeeInfo.amount_due
                                                ? `Rs. ${studentFeeInfo.amount_due}`
                                                : '—'}
                                        colors={colors}
                                    />
                                    <DetailRow
                                        label="Month"
                                        value={`${MONTHS[selectedRecord.month - 1]} ${selectedRecord.year}`}
                                        colors={colors}
                                    />
                                    {selectedRecord.payment_date && (
                                        <DetailRow
                                            label="Paid On"
                                            value={new Date(selectedRecord.payment_date).toLocaleDateString('en-PK', {
                                                day: 'numeric', month: 'long', year: 'numeric',
                                            })}
                                            colors={colors}
                                        />
                                    )}
                                    {selectedRecord.payment_method && (
                                        <DetailRow
                                            label="Method"
                                            value={selectedRecord.payment_method.charAt(0).toUpperCase() + selectedRecord.payment_method.slice(1)}
                                            colors={colors}
                                        />
                                    )}
                                    {selectedRecord.receipt_number && (
                                        <DetailRow
                                            label="Receipt #"
                                            value={selectedRecord.receipt_number}
                                            colors={colors}
                                        />
                                    )}
                                    {selectedRecord.notes && (
                                        <DetailRow
                                            label="Note"
                                            value={selectedRecord.notes}
                                            colors={colors}
                                            isLast
                                        />
                                    )}
                                </View>
                            </>
                        )}
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {/* Filter Modal */}
            <Modal
                visible={filterVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setFilterVisible(false)}
                statusBarTranslucent
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => { setFilterVisible(false); setYearOpen(false); setMonthOpen(false); }}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        style={[styles.detailSheet, { backgroundColor: colors.background }]}
                        onPress={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
                            <Text allowFontScaling={false} style={[styles.sheetTitle, { color: colors.text }]}>Filter</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                                {isFiltered && (
                                    <TouchableOpacity onPress={() => { setSelectedYear(CURRENT_YEAR); setSelectedMonth(null); }}>
                                        <Text allowFontScaling={false} style={{ color: colors.primary, fontFamily: 'Inter-Medium', fontSize: TextSizes.small }}>Reset</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity onPress={() => { setFilterVisible(false); setYearOpen(false); setMonthOpen(false); }}>
                                    <X size={22} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}>
                            {/* Year Dropdown */}
                            <Text allowFontScaling={false} style={[styles.dropdownLabel, { color: colors.textSecondary }]}>Year</Text>
                            <TouchableOpacity
                                style={[styles.filterBtn, { backgroundColor: colors.cardBackground, borderColor: yearOpen ? colors.primary : colors.border }]}
                                onPress={() => { setYearOpen(p => !p); setMonthOpen(false); }}
                            >
                                <Text allowFontScaling={false} style={[styles.filterBtnText, { color: colors.text }]}>{selectedYear}</Text>
                                <ChevronDown size={14} color={colors.textSecondary} style={{ transform: [{ rotate: yearOpen ? '180deg' : '0deg' }] }} />
                            </TouchableOpacity>
                            {yearOpen && (
                                <View style={[styles.dropdownList, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                                    {YEARS.map(y => (
                                        <TouchableOpacity
                                            key={y}
                                            style={[styles.dropdownItem, y === selectedYear && { backgroundColor: colors.primary + '15' }]}
                                            onPress={() => { setSelectedYear(y); setYearOpen(false); }}
                                        >
                                            <Text allowFontScaling={false} style={[styles.dropdownItemText, { color: y === selectedYear ? colors.primary : colors.text }]}>{y}</Text>
                                            {y === selectedYear && <Check size={14} color={colors.primary} />}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {/* Month Dropdown */}
                            <Text allowFontScaling={false} style={[styles.dropdownLabel, { color: colors.textSecondary }]}>Month</Text>
                            <TouchableOpacity
                                style={[styles.filterBtn, { backgroundColor: colors.cardBackground, borderColor: monthOpen ? colors.primary : colors.border }]}
                                onPress={() => { setMonthOpen(p => !p); setYearOpen(false); }}
                            >
                                <Text allowFontScaling={false} style={[styles.filterBtnText, { color: colors.text }]}>
                                    {selectedMonth !== null ? MONTHS[selectedMonth - 1] : 'All Months'}
                                </Text>
                                <ChevronDown size={14} color={colors.textSecondary} style={{ transform: [{ rotate: monthOpen ? '180deg' : '0deg' }] }} />
                            </TouchableOpacity>
                            {monthOpen && (
                                <ScrollView
                                    style={[styles.dropdownList, { backgroundColor: colors.cardBackground, borderColor: colors.border, maxHeight: 132 }]}
                                    nestedScrollEnabled
                                    showsVerticalScrollIndicator={false}
                                >
                                    <TouchableOpacity
                                        style={[styles.dropdownItem, selectedMonth === null && { backgroundColor: colors.primary + '15' }]}
                                        onPress={() => { setSelectedMonth(null); setMonthOpen(false); }}
                                    >
                                        <Text allowFontScaling={false} style={[styles.dropdownItemText, { color: selectedMonth === null ? colors.primary : colors.text }]}>All Months</Text>
                                        {selectedMonth === null && <Check size={14} color={colors.primary} />}
                                    </TouchableOpacity>
                                    {MONTHS.map((m, i) => (
                                        <TouchableOpacity
                                            key={m}
                                            style={[styles.dropdownItem, selectedMonth === i + 1 && { backgroundColor: colors.primary + '15' }]}
                                            onPress={() => { setSelectedMonth(i + 1); setMonthOpen(false); }}
                                        >
                                            <Text allowFontScaling={false} style={[styles.dropdownItemText, { color: selectedMonth === i + 1 ? colors.primary : colors.text }]}>{m}</Text>
                                            {selectedMonth === i + 1 && <Check size={14} color={colors.primary} />}
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            )}
                        </ScrollView>

                        <TouchableOpacity
                            style={[styles.applyBtn, { backgroundColor: colors.primary }]}
                            onPress={() => { setFilterVisible(false); setYearOpen(false); setMonthOpen(false); }}
                        >
                            <Text allowFontScaling={false} style={styles.applyBtnText}>Apply</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </Animated.View>
    );
}

// ── Fee Record Card ─────────────────────────────────────────────────────────
interface FeeRecordCardProps {
    record: FeeRecord;
    colors: any;
    amountDue: number | null;
    onPress: () => void;
}

const FeeRecordCard: React.FC<FeeRecordCardProps> = ({ record, colors, amountDue, onPress }) => {
    const isPaid = record.payment_status === 'paid';
    const displayAmount = record.amount_paid ?? (amountDue != null ? String(amountDue) : null);

    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View 
            style={[styles.cardAccent, { backgroundColor: isPaid ? colors.primary : colors.border }]} />
            <View style={styles.cardBody}>
                <View style={styles.cardRow}>
                    <Text allowFontScaling={false} style={[styles.cardMonth, { color: colors.text }]}>
                        {MONTHS[record.month - 1]}
                    </Text>
                    <View style={[
                        styles.badge,
                        isPaid
                            ? { backgroundColor: colors.secondary + '20', borderColor: colors.secondary }
                            : { backgroundColor: colors.cardBackground, borderColor: colors.border },
                    ]}>
                        <Text allowFontScaling={false} style={[styles.badgeText, { color: isPaid ? colors.secondary : colors.textSecondary }]}>
                            {isPaid ? 'Paid' : 'Unpaid'}
                        </Text>
                    </View>
                </View>
                <View style={styles.cardMeta}>
                    <Text allowFontScaling={false} style={[styles.cardYear, { color: colors.textSecondary }]}>
                        {record.year}
                    </Text>
                    {displayAmount && (
                        <Text allowFontScaling={false} style={[styles.cardAmount, { color: colors.textSecondary }]}>
                            Rs. {displayAmount}
                        </Text>
                    )}
                </View>
            </View>
            {isPaid
                ? <Check size={16} color={colors.secondary} style={{ marginRight: 14 }} />
                : <Clock size={16} color={colors.border} style={{ marginRight: 14 }} />
            }
        </TouchableOpacity>
    );
};

// ── Detail Row ──────────────────────────────────────────────────────────────
const DetailRow = ({ label, value, colors, isLast = false }: any) => (
    <View style={[styles.detailRow, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
        <Text allowFontScaling={false} style={[styles.detailLabel, { color: colors.textSecondary }]}>{label}</Text>
        <Text allowFontScaling={false} style={[styles.detailValue, { color: colors.text }]}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    dropdownLabel: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-SemiBold',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginTop: 18,
        marginBottom: 8,
    },
    filterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 11,
        borderRadius: 10,
        borderWidth: 1,
    },
    filterBtnText: {
        flex: 1,
        fontSize: TextSizes.normal,
        fontFamily: 'Inter-Medium',
    },
    dropdownList: {
        borderWidth: 1,
        borderRadius: 10,
        marginTop: 4,
        marginBottom: 4,
        overflow: 'hidden',
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 11,
    },
    dropdownItemText: {
        fontSize: TextSizes.normal,
        fontFamily: 'Inter-Regular',
    },
    applyBtn: {
        marginHorizontal: 0,
        marginTop: 20,
        marginBottom: 8,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginLeft: 16,
        marginRight: 16,
    },
    applyBtnText: {
        color: '#fff',
        fontSize: TextSizes.normal,
        fontFamily: 'Inter-SemiBold',
    },
    summaryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 4,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
    },
    summaryLabel: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Medium',
    },
    summaryAmount: {
        fontSize: TextSizes.header,
        fontFamily: 'Inter-SemiBold',
    },
    summaryStats: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    statItem: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    statVal: {
        fontSize: TextSizes.header,
        fontFamily: 'Inter-SemiBold',
        textAlign: 'center',
    },
    statLbl: {
        fontSize: TextSizes.tiny,
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
    },
    statDivider: {
        width: 1,
        height: 28,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 40,
        gap: 10,
    },
    centered: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        gap: 12,
    },
    emptyTitle: {
        fontSize: TextSizes.sectionTitle,
        fontFamily: 'Inter-SemiBold',
    },
    emptySubtitle: {
        fontSize: TextSizes.normal,
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
    },
    cardAccent: {
        width: 4,
        alignSelf: 'stretch',
    },
    cardBody: {
        flex: 1,
        paddingHorizontal: 14,
        paddingVertical: 12,
        gap: 4,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    cardMonth: {
        fontSize: TextSizes.header,
        fontFamily: 'Inter-SemiBold',
    },
    cardMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    cardYear: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Regular',
    },
    cardAmount: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Regular',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 1,
    },
    badgeText: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-SemiBold',
    },
    // Modal
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'flex-end',
    },
    detailSheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    sheetTitle: {
        fontSize: TextSizes.large,
        fontFamily: 'Inter-SemiBold',
    },
    sheetSubtitle: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Regular',
        marginTop: 2,
    },
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginHorizontal: 24,
        marginTop: 16,
        marginBottom: 4,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
    },
    statusBannerText: {
        fontSize: TextSizes.header,
        fontFamily: 'Inter-SemiBold',
    },
    detailCard: {
        marginHorizontal: 24,
        marginTop: 12,
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 13,
    },
    detailLabel: {
        fontSize: TextSizes.normal,
        fontFamily: 'Inter-Regular',
    },
    detailValue: {
        fontSize: TextSizes.normal,
        fontFamily: 'Inter-Medium',
        textAlign: 'right',
        flex: 1,
        marginLeft: 16,
    },
});
