import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity,
    TextInput, Modal, StyleSheet, ActivityIndicator,
    Keyboard, Platform,
} from 'react-native';
import { X, Trash2, ChevronRight, Clock, BookOpen, MapPin, User } from 'lucide-react-native';
import {
    TimetableEntryWithDetails,
    CreateTimetableEntry,
    UserProfile,
    Class,
    Subject,
    ThemeColors,
    DayOfWeek,
} from '@/src/types/timetable';
import { TextSizes } from '@/src/styles/TextSizes';
import { modalShell, modalForm } from '@/src/styles/creationModalStyles';
import { supabase } from '@/src/lib/supabase';
import { formatTimeForDisplay, timeToMinutes } from '@/src/utils/timetable';

// ── 4:00 PM – 9:00 PM in 15-min steps ─────────────────────────────────────────
const TIME_SLOTS: string[] = (() => {
    const slots: string[] = [];
    for (let h = 16; h <= 21; h++) {
        for (let m = 0; m < 60; m += 15) {
            if (h === 21 && m > 0) break;
            slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
        }
    }
    return slots;
})();

type OpenPicker = 'day' | 'class' | 'subject' | 'start' | 'end' | null;

interface BookedRange { start_time: string; end_time: string; id: string; }

interface TimetableEntryModalProps {
    modalVisible: boolean;
    setModalVisible: (v: boolean) => void;
    editingEntry: TimetableEntryWithDetails | null;
    setEditingEntry: (e: TimetableEntryWithDetails | null) => void;
    newEntry: Partial<CreateTimetableEntry>;
    setNewEntry: (e: Partial<CreateTimetableEntry>) => void;
    profile: UserProfile | null;
    colors: ThemeColors;
    classes: Class[];
    handleAddEntry: () => void;
    handleUpdateEntry: () => void;
    handleDeleteEntry: (e: TimetableEntryWithDetails) => void;
    resetForm: () => void;
}

export default function TimetableEntryModal({
    modalVisible,
    setModalVisible,
    editingEntry,
    setEditingEntry,
    newEntry,
    setNewEntry,
    profile,
    colors,
    classes,
    handleAddEntry,
    handleDeleteEntry,
    resetForm,
}: TimetableEntryModalProps) {
    const canDelete = profile?.role === 'superadmin' || (profile?.role === 'teacher' && editingEntry?.teacher_id === profile?.id);

    const [openPicker, setOpenPicker] = useState<OpenPicker>(null);
    const [modalSubjects, setModalSubjects] = useState<Subject[]>([]);
    const [bookedRanges, setBookedRanges] = useState<BookedRange[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    useEffect(() => {
        const show = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            e => setKeyboardHeight(e.endCoordinates.height)
        );
        const hide = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setKeyboardHeight(0)
        );
        return () => { show.remove(); hide.remove(); };
    }, []);

    useEffect(() => {
        if (newEntry.class_id && profile?.id) {
            fetchSubjectsForClass(newEntry.class_id);
        } else {
            setModalSubjects([]);
        }
    }, [newEntry.class_id]);

    useEffect(() => {
        if (newEntry.day && newEntry.class_id) {
            fetchBookedSlots(newEntry.day, newEntry.class_id);
        } else {
            setBookedRanges([]);
        }
    }, [newEntry.day, newEntry.class_id]);

    const fetchSubjectsForClass = async (classId: string) => {
        if (!profile?.id) return;
        try {
            if (profile.role === 'superadmin') {
                const { data } = await supabase.from('subjects').select('id, name').eq('is_active', true).order('name');
                setModalSubjects((data || []) as Subject[]);
                return;
            }
            const { data } = await supabase
                .from('teacher_subject_enrollments')
                .select('subjects (id, name)')
                .eq('teacher_id', profile.id)
                .eq('class_id', classId)
                .eq('is_active', true);
            const unique: Subject[] = Array.from(
                new Map(
                    (data || []).map((i: any) => i.subjects).filter(Boolean).map((s: any) => [s.id, s])
                ).values()
            );
            setModalSubjects(unique);
        } catch { setModalSubjects([]); }
    };

    const fetchBookedSlots = async (day: DayOfWeek, classId: string) => {
        if (!profile?.id) return;
        setLoadingSlots(true);
        try {
            const { data: classBusy } = await supabase
                .from('timetable').select('id, start_time, end_time')
                .eq('day', day).eq('class_id', classId).is('deleted_at', null);
            const { data: teacherBusy } = await supabase
                .from('timetable').select('id, start_time, end_time')
                .eq('day', day).eq('teacher_id', profile.id).is('deleted_at', null);

            const all = [...(classBusy || []), ...(teacherBusy || [])];
            const seen = new Set<string>();
            const ranges: BookedRange[] = [];
            for (const r of all) {
                if (seen.has(r.id)) continue;
                seen.add(r.id);
                ranges.push(r);
            }
            setBookedRanges(ranges);
        } catch { setBookedRanges([]); }
        finally { setLoadingSlots(false); }
    };

    const trimTime = (t: string) => t.substring(0, 5);

    const isStartDisabled = (slot: string): boolean => {
        const s = timeToMinutes(slot);
        return bookedRanges.some(b => {
            const bs = timeToMinutes(trimTime(b.start_time));
            const be = timeToMinutes(trimTime(b.end_time));
            return s >= bs && s < be;
        });
    };

    const isEndDisabled = (slot: string): boolean => {
        if (!newEntry.start_time) return true;
        const startMins = timeToMinutes(newEntry.start_time);
        const slotMins = timeToMinutes(slot);
        if (slotMins <= startMins) return true;
        return bookedRanges.some(b => {
            const bs = timeToMinutes(trimTime(b.start_time));
            const be = timeToMinutes(trimTime(b.end_time));
            return startMins < be && bs < slotMins;
        });
    };

    const toggle = (picker: OpenPicker) =>
        setOpenPicker(prev => (prev === picker ? null : picker));

    const closeModal = () => {
        setModalVisible(false);
        setEditingEntry(null);
        setOpenPicker(null);
        setModalSubjects([]);
        setBookedRanges([]);
        resetForm();
    };

    const WEEK_DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const selectedClassName = classes.find(c => c.id === newEntry.class_id)?.name;
    const selectedSubjectName = modalSubjects.find(s => s.name === newEntry.subject)?.name;

    const PickerRow = ({ label, value, placeholder, onPress, isOpen }: {
        label: string; value?: string; placeholder: string; onPress: () => void; isOpen: boolean;
    }) => (
        <TouchableOpacity
            style={[modalForm.pickerRow, { backgroundColor: colors.cardBackground, borderColor: isOpen ? colors.primary : colors.border }]}
            onPress={onPress} activeOpacity={0.8}
        >
            <Text allowFontScaling={false} style={[modalForm.pickerValue, { color: value ? colors.text : colors.textSecondary }]}>
                {value || placeholder}
            </Text>
            <ChevronRight size={16} color={colors.textSecondary} style={{ transform: [{ rotate: isOpen ? '270deg' : '90deg' }] }} />
        </TouchableOpacity>
    );

    // ── View mode (existing entry — delete only) ───────────────────────────────
    if (editingEntry) {
        return (
            <Modal animationType="fade" transparent visible={modalVisible}
                onRequestClose={closeModal} statusBarTranslucent presentationStyle="overFullScreen">
                <View style={s.overlay}>
                    <View style={[s.detailSheet, { backgroundColor: colors.background }]}>
                        {/* Header */}
                        <View style={[modalShell.header, { borderBottomColor: colors.border }]}>
                            <Text allowFontScaling={false} style={[modalShell.title, { color: colors.text }]}>
                                Entry Details
                            </Text>
                            <TouchableOpacity style={modalShell.closeBtn} onPress={closeModal}>
                                <X size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={s.detailBody}>
                            {/* Subject */}
                            <View style={[s.detailCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                                <BookOpen size={18} color={colors.primary} />
                                <View style={s.detailTextGroup}>
                                    <Text allowFontScaling={false} style={[s.detailLabel, { color: colors.textSecondary }]}>Subject</Text>
                                    <Text allowFontScaling={false} style={[s.detailValue, { color: colors.text }]}>{editingEntry.subject_name}</Text>
                                </View>
                            </View>

                            {/* Class */}
                            <View style={[s.detailCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                                <User size={18} color={colors.primary} />
                                <View style={s.detailTextGroup}>
                                    <Text allowFontScaling={false} style={[s.detailLabel, { color: colors.textSecondary }]}>Class</Text>
                                    <Text allowFontScaling={false} style={[s.detailValue, { color: colors.text }]}>{editingEntry.class_name}</Text>
                                </View>
                            </View>

                            {/* Day */}
                            <View style={[s.detailCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                                <Clock size={18} color={colors.primary} />
                                <View style={s.detailTextGroup}>
                                    <Text allowFontScaling={false} style={[s.detailLabel, { color: colors.text }]}>Day & Time</Text>
                                    <Text allowFontScaling={false} style={[s.detailValue, { color: colors.text }]}>
                                        {editingEntry.day} · {formatTimeForDisplay(editingEntry.start_time.substring(0, 5), true)} – {formatTimeForDisplay(editingEntry.end_time.substring(0, 5), true)}
                                    </Text>
                                </View>
                            </View>

                            {/* Room */}
                            <View style={[s.detailCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                                <MapPin size={18} color={colors.primary} />
                                <View style={s.detailTextGroup}>
                                    <Text allowFontScaling={false} style={[s.detailLabel, { color: colors.textSecondary }]}>Room</Text>
                                    <Text allowFontScaling={false} style={[s.detailValue, { color: colors.text }]}>{editingEntry.room_number}</Text>
                                </View>
                            </View>

                            {/* Delete */}
                            {canDelete && (
                                <TouchableOpacity
                                    style={[s.deleteBtn, { backgroundColor: '#EF4444', marginTop: 8 }]}
                                    onPress={() => handleDeleteEntry(editingEntry)}
                                >
                                    <Trash2 size={18} color="#fff" />
                                    <Text allowFontScaling={false} style={modalForm.submitText}>Delete Entry</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
            </Modal>
        );
    }

    // ── Add mode (new entry — full form) ──────────────────────────────────────
    return (
        <Modal animationType="fade" transparent visible={modalVisible}
            onRequestClose={closeModal} statusBarTranslucent presentationStyle="overFullScreen">
            <View style={s.overlay}>
                <View style={[s.sheet, { backgroundColor: colors.background }]}>
                    <View style={[modalShell.header, { borderBottomColor: colors.border }]}>
                        <Text allowFontScaling={false} style={[modalShell.title, { color: colors.text }]}>Add Timetable Entry</Text>
                        <TouchableOpacity style={modalShell.closeBtn} onPress={closeModal}>
                            <X size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={modalShell.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={[modalShell.scrollContent, { paddingBottom: keyboardHeight + 24 }]}>

                        {/* Step 1: Day */}
                        <View style={modalForm.group}>
                            <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>Day</Text>
                            <PickerRow label="Day" value={newEntry.day} placeholder="Select day"
                                onPress={() => toggle('day')} isOpen={openPicker === 'day'} />
                            {openPicker === 'day' && (
                                <View style={[modalForm.dropdown, { borderColor: colors.border, backgroundColor: colors.cardBackground }]}>
                                    {WEEK_DAYS.map(day => (
                                        <TouchableOpacity key={day}
                                            style={[modalForm.dropdownOption, { borderBottomColor: colors.border },
                                                newEntry.day === day && { backgroundColor: colors.primary + '18' }]}
                                            onPress={() => {
                                                setNewEntry({ ...newEntry, day, class_id: '', subject: '', start_time: '', end_time: '' });
                                                setOpenPicker(null);
                                            }}>
                                            <Text allowFontScaling={false} style={[modalForm.dropdownOptionText, { color: newEntry.day === day ? colors.primary : colors.text }]}>
                                                {day}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>

                        {/* Step 2: Class */}
                        {newEntry.day && (
                            <View style={modalForm.group}>
                                <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>Class</Text>
                                <PickerRow label="Class" value={selectedClassName} placeholder="Select class"
                                    onPress={() => toggle('class')} isOpen={openPicker === 'class'} />
                                {openPicker === 'class' && (
                                    <View style={[modalForm.dropdown, { borderColor: colors.border, backgroundColor: colors.cardBackground }]}>
                                        {classes.map(c => (
                                            <TouchableOpacity key={c.id}
                                                style={[modalForm.dropdownOption, { borderBottomColor: colors.border },
                                                    newEntry.class_id === c.id && { backgroundColor: colors.primary + '18' }]}
                                                onPress={() => {
                                                    setNewEntry({ ...newEntry, class_id: c.id, subject: '', start_time: '', end_time: '' });
                                                    setOpenPicker(null);
                                                }}>
                                                <Text allowFontScaling={false} style={[modalForm.dropdownOptionText, { color: newEntry.class_id === c.id ? colors.primary : colors.text }]}>
                                                    {c.name}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Step 3: Subject */}
                        {newEntry.day && newEntry.class_id && (
                            <View style={modalForm.group}>
                                <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>Subject</Text>
                                <PickerRow label="Subject" value={selectedSubjectName} placeholder="Select subject"
                                    onPress={() => toggle('subject')} isOpen={openPicker === 'subject'} />
                                {openPicker === 'subject' && (
                                    <View style={[modalForm.dropdown, { borderColor: colors.border, backgroundColor: colors.cardBackground }]}>
                                        {modalSubjects.length === 0 ? (
                                            <View style={modalForm.dropdownEmptyOption}>
                                                <Text allowFontScaling={false} style={[modalForm.dropdownOptionText, { color: colors.textSecondary }]}>No subjects found</Text>
                                            </View>
                                        ) : modalSubjects.map(sub => (
                                            <TouchableOpacity key={sub.id}
                                                style={[modalForm.dropdownOption, { borderBottomColor: colors.border },
                                                    newEntry.subject === sub.name && { backgroundColor: colors.primary + '18' }]}
                                                onPress={() => {
                                                    setNewEntry({ ...newEntry, subject: sub.name, start_time: '', end_time: '' });
                                                    setOpenPicker(null);
                                                }}>
                                                <Text allowFontScaling={false} style={[modalForm.dropdownOptionText, { color: newEntry.subject === sub.name ? colors.primary : colors.text }]}>
                                                    {sub.name}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Step 4 & 5: Time */}
                        {newEntry.day && newEntry.class_id && newEntry.subject && (
                            <>
                                {loadingSlots ? (
                                    <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} />
                                ) : (
                                    <View style={modalForm.timeRow}>
                                        {/* Start Time */}
                                        <View style={[modalForm.group, { flex: 1, marginRight: 8 }]}>
                                            <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>Start Time</Text>
                                            <PickerRow label="Start"
                                                value={newEntry.start_time ? formatTimeForDisplay(newEntry.start_time, true) : undefined}
                                                placeholder="Select time"
                                                onPress={() => toggle('start')} isOpen={openPicker === 'start'} />
                                            {openPicker === 'start' && (
                                                <View style={[modalForm.dropdown, { borderColor: colors.border, backgroundColor: colors.cardBackground }]}>
                                                    <ScrollView style={modalForm.dropdownScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                                                        {TIME_SLOTS.map(slot => {
                                                            const disabled = isStartDisabled(slot);
                                                            return (
                                                                <TouchableOpacity key={slot}
                                                                    style={[modalForm.dropdownOption, { borderBottomColor: colors.border },
                                                                        disabled && { opacity: 0.35 },
                                                                        newEntry.start_time === slot && { backgroundColor: colors.primary + '18' }]}
                                                                    onPress={() => {
                                                                        if (disabled) return;
                                                                        setNewEntry({ ...newEntry, start_time: slot, end_time: '' });
                                                                        setOpenPicker(null);
                                                                    }}
                                                                    activeOpacity={disabled ? 1 : 0.7}>
                                                                    <Text allowFontScaling={false} style={[modalForm.dropdownOptionText,
                                                                        { color: disabled ? colors.textSecondary : newEntry.start_time === slot ? colors.primary : colors.text }]}>
                                                                        {formatTimeForDisplay(slot, true)}
                                                                    </Text>
                                                                    {disabled && <Text allowFontScaling={false} style={[modalForm.slotTag, { color: '#EF4444' }]}>Booked</Text>}
                                                                </TouchableOpacity>
                                                            );
                                                        })}
                                                    </ScrollView>
                                                </View>
                                            )}
                                        </View>

                                        {/* End Time */}
                                        <View style={[modalForm.group, { flex: 1, marginLeft: 8 }]}>
                                            <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>End Time</Text>
                                            <PickerRow label="End"
                                                value={newEntry.end_time ? formatTimeForDisplay(newEntry.end_time, true) : undefined}
                                                placeholder="Select time"
                                                onPress={() => { if (newEntry.start_time) toggle('end'); }}
                                                isOpen={openPicker === 'end'} />
                                            {openPicker === 'end' && (
                                                <View style={[modalForm.dropdown, { borderColor: colors.border, backgroundColor: colors.cardBackground }]}>
                                                    <ScrollView style={modalForm.dropdownScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                                                        {TIME_SLOTS.map(slot => {
                                                            const disabled = isEndDisabled(slot);
                                                            return (
                                                                <TouchableOpacity key={slot}
                                                                    style={[modalForm.dropdownOption, { borderBottomColor: colors.border },
                                                                        disabled && { opacity: 0.35 },
                                                                        newEntry.end_time === slot && { backgroundColor: colors.primary + '18' }]}
                                                                    onPress={() => {
                                                                        if (disabled) return;
                                                                        setNewEntry({ ...newEntry, end_time: slot });
                                                                        setOpenPicker(null);
                                                                    }}
                                                                    activeOpacity={disabled ? 1 : 0.7}>
                                                                    <Text allowFontScaling={false} style={[modalForm.dropdownOptionText,
                                                                        { color: disabled ? colors.textSecondary : newEntry.end_time === slot ? colors.primary : colors.text }]}>
                                                                        {formatTimeForDisplay(slot, true)}
                                                                    </Text>
                                                                    {disabled && timeToMinutes(slot) > timeToMinutes(newEntry.start_time || '00:00') && (
                                                                        <Text allowFontScaling={false} style={[modalForm.slotTag, { color: '#EF4444' }]}>Conflict</Text>
                                                                    )}
                                                                </TouchableOpacity>
                                                            );
                                                        })}
                                                    </ScrollView>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                )}
                            </>
                        )}

                        {/* Room Number */}
                        {newEntry.day && newEntry.class_id && newEntry.subject && (
                            <View style={modalForm.group}>
                                <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>Room Number</Text>
                                <TextInput
                                    style={[modalForm.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                    value={newEntry.room_number || ''}
                                    onChangeText={text => setNewEntry({ ...newEntry, room_number: text })}
                                    placeholder="e.g. Room 101"
                                    placeholderTextColor={colors.textSecondary}
                                />
                            </View>
                        )}

                        {/* Add button */}
                        <TouchableOpacity
                            style={[modalForm.submitBtn, { backgroundColor: colors.primary }]}
                            onPress={handleAddEntry}>
                            <Text allowFontScaling={false} style={modalForm.submitText}>Add to Timetable</Text>
                        </TouchableOpacity>

                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const s = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
    detailSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%' },

    // Detail view
    detailBody: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32, gap: 10 },
    detailCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    },
    detailTextGroup: { flex: 1 },
    detailLabel: { fontSize: TextSizes.small, fontFamily: 'Inter-Regular', marginBottom: 2 },
    detailValue: { fontSize: TextSizes.medium, fontFamily: 'Inter-SemiBold' },

    deleteBtn: {
        height: 50, borderRadius: 12,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    },
});
