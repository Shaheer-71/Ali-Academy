// src/styles/creationModalStyles.ts
// Shared visual tokens for every "create/add" bottom-sheet modal.
// All creation modals (Lecture, Assignment, Timetable, …) MUST use these styles
// for their common UI elements so they look identical.

import { StyleSheet } from 'react-native';
import { TextSizes } from './TextSizes';

// ─── Shell (overlay + sheet + header) ────────────────────────────────────────
export const modalShell = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    sheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '75%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: TextSizes.modalTitle,
        fontFamily: 'Inter-SemiBold',
    },
    closeBtn: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scroll: {
        paddingHorizontal: 24,
    },
    scrollContent: {
        paddingTop: 16,
        paddingBottom: 24,
    },
});

// ─── Form fields ──────────────────────────────────────────────────────────────
export const modalForm = StyleSheet.create({
    // Wrapper for each field (label + control)
    group: {
        marginBottom: 20,
    },
    label: {
        fontSize: TextSizes.filterLabel,
        fontFamily: 'Inter-Medium',
        marginBottom: 8,
    },
    hint: {
        fontSize: TextSizes.filterLabel,
        fontFamily: 'Inter-Regular',
    },

    // Single-line text input
    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 14,
        fontSize: TextSizes.normal,
        fontFamily: 'Inter-Regular',
    },

    // Multi-line text area
    textArea: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 14,
        fontSize: TextSizes.normal,
        fontFamily: 'Inter-Regular',
        textAlignVertical: 'top',
        minHeight: 90,
    },

    // Chip selector row (class / subject / assign-to pills)
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderWidth: 1,
        borderRadius: 10,
    },
    chipText: {
        fontSize: TextSizes.normal,
        fontFamily: 'Inter-Medium',
    },

    // Dropdown picker row (single-select trigger — chevron on right)
    pickerRow: {
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
    },
    pickerValue: {
        flex: 1,
        fontSize: TextSizes.normal,
        fontFamily: 'Inter-Regular',
    },

    // Dropdown list
    dropdown: {
        marginTop: 4,
        borderWidth: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    dropdownScroll: {
        maxHeight: 200,
    },
    dropdownOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 13,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    dropdownOptionText: {
        fontSize: TextSizes.normal,
        fontFamily: 'Inter-Regular',
        flex: 1,
    },
    dropdownEmptyOption: {
        paddingHorizontal: 14,
        paddingVertical: 13,
    },

    // File picker button
    filePicker: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        gap: 8,
    },
    filePickerText: {
        flex: 1,
        fontSize: TextSizes.normal,
        fontFamily: 'Inter-Regular',
    },
    fileSize: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Regular',
        marginTop: 4,
    },

    // Info / read-only note box
    infoBox: {
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 12,
        marginBottom: 20,
    },
    infoText: {
        fontSize: TextSizes.filterLabel,
        fontFamily: 'Inter-Regular',
        lineHeight: 18,
    },

    // Submit button
    submitBtn: {
        height: 50,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
    },
    submitText: {
        color: '#ffffff',
        fontSize: TextSizes.buttonText,
        fontFamily: 'Inter-SemiBold',
    },

    // Tag shown next to a booked/conflict time slot
    slotTag: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Medium',
    },

    // Two time pickers side by side
    timeRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
});
