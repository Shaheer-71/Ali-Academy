// components/diary/styles.ts
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 20,
    },
    title: {
        fontSize: 28,
        fontFamily: 'Inter-SemiBold',
    },
    addButton: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 5
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 24,
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        fontSize: 16,
        fontFamily: 'Inter-Regular',
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
    swipeContainer: {
        marginBottom: 12,
        position: 'relative',
    },
    actionButtons: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        width: 60,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    actionButtonText: {
        color: '#ffffff',
        fontSize: 12,
        fontFamily: 'Inter-Medium',
        marginTop: 4,
    },
    assignmentCard: {
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    overdueCard: {
        borderColor: '#FEE2E2',
        backgroundColor: '#FEF2F2',
    },
    assignmentHeader: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    assignmentInfo: {
        flex: 1,
    },
    assignmentTitle: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 6,
    },
    assignmentDetails: {
        flexDirection: 'row',
        gap: 16,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailText: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
        marginLeft: 4,
    },
    overdueText: {
        color: '#EF4444',
        fontFamily: 'Inter-Medium',
    },
    assignmentDescription: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        lineHeight: 20,
        marginBottom: 12,
    },
    attachmentButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        alignSelf: 'flex-start',
        gap: 6,
        marginBottom: 8,
    },
    attachmentText: {
        fontSize: 12,
        fontFamily: 'Inter-Medium',
    },
    overdueLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEE2E2',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
        alignSelf: 'flex-start',
        gap: 4,
    },
    overdueLabelText: {
        fontSize: 10,
        fontFamily: 'Inter-SemiBold',
        color: '#EF4444',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '85%',
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
        marginBottom: 50,
        paddingTop: 20
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
        height: 100,
        textAlignVertical: 'top',
        paddingTop: 16,
    },
    assignToButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    assignToButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderWidth: 1,
        borderRadius: 8,
        gap: 6,
    },
    assignToButtonText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
    },
    options: {
        flexDirection: 'row',
        gap: 8,
    },
    option: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderRadius: 8,
    },
    optionText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
    },
    filePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        gap: 8,
    },
    filePickerText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
    },
    submitButton: {
        height: 50,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
    },
    searchContainer: {
        paddingHorizontal: 24,
        marginBottom: 20,
        flexDirection: "row",
        justifyContent: 'center',
        alignContent: 'center',
        alignItems: "center"
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        flex: 1
    },
    searchInput: {
        flex: 1,
        height: 48,
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        marginLeft: 12,
    },

    // Detail Modal Styles
    detailModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    detailModalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
    },
    detailModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    detailModalTitle: {
        fontSize: 20,
        fontFamily: 'Inter-SemiBold',
    },
    detailModalScrollView: {
        paddingHorizontal: 24,
        paddingTop: 20,
    },
    detailSection: {
        marginBottom: 24,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 12,
        fontFamily: 'Inter-Medium',
        textTransform: 'uppercase',
        marginBottom: 6,
    },
    detailValue: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 4,
    },
    detailDescription: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        lineHeight: 22,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginBottom: 16,
        gap: 6,
    },
    statusBadgeText: {
        fontSize: 12,
        fontFamily: 'Inter-SemiBold',
        color: '#EF4444',
    },
    attachmentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    attachmentTitle: {
        fontSize: 14,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 2,
    },
    attachmentSubtitle: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
    },
    createdDate: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 30,
    },
    detailCloseButton: {
        height: 50,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 24,
        marginBottom: 24,
    },
    detailCloseButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
    },
});

export default styles;