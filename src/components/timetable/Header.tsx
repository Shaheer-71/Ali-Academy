// import React from 'react';
// import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
// import { Plus, Search } from 'lucide-react-native';
// import { UserProfile, ThemeColors, TimetableEntryWithDetails } from '@/src/types/timetable';

// interface HeaderProps {
//     profile: UserProfile | null;
//     colors: ThemeColors;
//     searchQuery: string;
//     setSearchQuery: (query: string) => void;
//     setModalVisible: (visible: boolean) => void;
//     resetForm: () => void;
//     setEditingEntry: (entry: TimetableEntryWithDetails | null) => void;
// }

// export default function Header({ 
//     profile, 
//     colors, 
//     searchQuery, 
//     setSearchQuery, 
//     setModalVisible, 
//     resetForm, 
//     setEditingEntry 
// }: HeaderProps) {
//     return (
//         <View style={styles.header}>
//             <View style={styles.searchContainer}>
//                 <View style={[styles.searchInputContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border}]}>
//                     <Search size={20} color={colors.textSecondary} />
//                     <TextInput
//                         style={[styles.searchInput, { color: colors.text }]}
//                         placeholder="Search lecture..."
//                         value={searchQuery}
//                         onChangeText={setSearchQuery}
//                         placeholderTextColor={colors.textSecondary}
//                     />
//                 </View>
//                 {(profile?.role === 'teacher' || profile?.role === 'admin') && ( // Only teachers can add entries
//                     <TouchableOpacity
//                         style={[styles.addHeaderButton, { backgroundColor: colors.primary }]}
//                         onPress={() => {
//                             resetForm();
//                             setEditingEntry(null);
//                             setModalVisible(true);
//                         }}
//                     >
//                         <Plus size={20} color="#ffffff" />
//                     </TouchableOpacity>
//                 )}

//             </View>
//         </View>
//     );
// }

// const styles = StyleSheet.create({
//     header: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         // alignItems: 'center',
//         paddingHorizontal: 24,
//         paddingBottom: 0,
//         flex:1
//     },
//     searchContainer: {
//         paddingHorizontal: 0,
//         marginBottom: 16,
//         flexDirection: "row",
//         justifyContent: 'center',
//         alignContent: 'center',
//         alignItems: "center",
//         flex: 1,
//     },
//     searchInputContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         borderRadius: 12,
//         paddingHorizontal: 16,
//         borderWidth: 1,
//         flex: 1
//     },
//     searchInput: {
//         flex: 1,
//         height: 48,
//         fontSize: 16,
//         fontFamily: 'Inter-Regular',
//         marginLeft: 12,
//     },
//     addHeaderButton: {
//         width: 48,
//         height: 48,
//         borderRadius: 12,
//         alignItems: 'center',
//         justifyContent: 'center',
//         marginLeft: 5
//     },
// });







// Header.tsx - FIXED
import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Plus, Search } from 'lucide-react-native';
import { UserProfile, ThemeColors, TimetableEntryWithDetails } from '@/src/types/timetable';

interface HeaderProps {
    profile: UserProfile | null;
    colors: ThemeColors;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    setModalVisible: (visible: boolean) => void;
    resetForm: () => void;
    setEditingEntry: (entry: TimetableEntryWithDetails | null) => void;
}

export default function Header({
    profile,
    colors,
    searchQuery,
    setSearchQuery,
    setModalVisible,
    resetForm,
    setEditingEntry
}: HeaderProps) {
    return (
        <View style={styles.header}>
            <View style={[styles.searchInputContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <Search size={20} color={colors.textSecondary} />
                <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder="Search lecture..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor={colors.textSecondary}
                />
            </View>
            {(profile?.role === 'teacher') && (
                <TouchableOpacity
                    style={[styles.addHeaderButton, { backgroundColor: colors.primary }]}
                    onPress={() => {
                        resetForm();
                        setEditingEntry(null);
                        setModalVisible(true);
                    }}
                >
                    <Plus size={20} color="#ffffff" />
                </TouchableOpacity>
            )}
        </View>
    );
}

import { TextSizes } from '@/src/styles/TextSizes';
const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        flex: 1
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        flex: 1,
        height: 48,
    },
    searchInput: {
        flex: 1,
        height: 48,
        fontSize: TextSizes.medium,
        fontFamily: 'Inter-Regular',
        marginLeft: 12,
    },
    addHeaderButton: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
