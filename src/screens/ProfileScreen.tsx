// screens/ProfileScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, BadgeCheck, GraduationCap, Phone, CircleCheck, CalendarDays, Hash, VenetianMask, Cake, MapPin, Users as UsersIcon, User } from 'lucide-react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import TopSections from '@/src/components/common/TopSections';
import { TextSizes } from '@/src/styles/TextSizes';

interface InfoRowData {
  key: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  value: string;
}

function InfoCard({ rows, colors }: { rows: InfoRowData[]; colors: ReturnType<typeof useTheme>['colors'] }) {
  return (
    <View style={[styles.infoCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      {rows.map((row, index) => (
        <React.Fragment key={row.key}>
          {index > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
          <View style={styles.infoRow}>
            <row.icon size={18} color={colors.textSecondary} />
            <View style={{ flex: 1 }}>
              <Text allowFontScaling={false} style={[styles.infoLabel, { color: colors.textSecondary }]}>{row.label}</Text>
              <Text allowFontScaling={false} style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>
                {row.value}
              </Text>
            </View>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

const formatDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

const capitalize = (value?: string | null) => {
  if (!value) return null;
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export default function ProfileScreen() {
  const { profile, student } = useAuth();
  const { colors } = useTheme();

  const className = student?.classes?.name;

  const accountRows: InfoRowData[] = [
    { key: 'name', icon: User, label: 'Full Name', value: profile?.full_name || '—' },
    { key: 'email', icon: Mail, label: 'Email', value: profile?.email || '—' },
    { key: 'role', icon: BadgeCheck, label: 'Role', value: capitalize(profile?.role) || '—' },
  ];

  if (profile?.contact_number) {
    accountRows.push({ key: 'contact', icon: Phone, label: 'Contact Number', value: profile.contact_number });
  }
  if (className) {
    accountRows.push({ key: 'class', icon: GraduationCap, label: 'Class', value: className });
  }
  if (profile?.is_active !== undefined && profile?.is_active !== null) {
    accountRows.push({ key: 'status', icon: CircleCheck, label: 'Account Status', value: profile.is_active ? 'Active' : 'Inactive' });
  }
  const memberSince = formatDate(profile?.created_at);
  if (memberSince) {
    accountRows.push({ key: 'since', icon: CalendarDays, label: 'Member Since', value: memberSince });
  }

  const studentRows: InfoRowData[] = [];
  if (student?.roll_number) {
    studentRows.push({ key: 'roll', icon: Hash, label: 'Roll Number', value: student.roll_number });
  }
  if (student?.gender) {
    studentRows.push({ key: 'gender', icon: VenetianMask, label: 'Gender', value: capitalize(student.gender) || '—' });
  }
  const dob = formatDate(student?.date_of_birth);
  if (dob) {
    studentRows.push({ key: 'dob', icon: Cake, label: 'Date of Birth', value: dob });
  }
  const admissionDate = formatDate(student?.admission_date);
  if (admissionDate) {
    studentRows.push({ key: 'admission', icon: CalendarDays, label: 'Admission Date', value: admissionDate });
  }
  if (student?.address) {
    studentRows.push({ key: 'address', icon: MapPin, label: 'Address', value: student.address });
  }
  if (student?.parent_name) {
    studentRows.push({ key: 'parent', icon: UsersIcon, label: 'Parent / Guardian', value: student.parent_name });
  }
  if (student?.parent_contact) {
    studentRows.push({ key: 'parentContact', icon: Phone, label: 'Parent Contact', value: student.parent_contact });
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right', 'bottom']}>
      <TopSections showNotifications={true} />
      <View style={[styles.sheet, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <View style={[styles.profileCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <View style={[styles.profileAvatar, { backgroundColor: colors.primary }]}>
                <Text allowFontScaling={false} style={styles.profileInitial}>
                  {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text allowFontScaling={false} style={[styles.profileName, { color: colors.text }]}>
                  {profile?.full_name || 'User'}
                </Text>
                <View style={styles.profileDetails}>
                  <View style={styles.profileDetail}>
                    <Mail size={14} color={colors.textSecondary} />
                    <Text allowFontScaling={false} style={[styles.profileDetailText, { color: colors.textSecondary }]}>
                      {profile?.email || 'No email'}
                    </Text>
                  </View>
                  {profile?.contact_number && (
                    <View style={styles.profileDetail}>
                      <Phone size={14} color={colors.textSecondary} />
                      <Text allowFontScaling={false} style={[styles.profileDetailText, { color: colors.textSecondary }]}>
                        {profile.contact_number}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={[styles.roleContainer, { backgroundColor: colors.primary }]}>
                  <Text allowFontScaling={false} style={styles.roleText}>
                    {profile?.role?.toUpperCase() || 'STUDENT'}
                  </Text>
                </View>
              </View>
            </View>

            <Text allowFontScaling={false} style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
            <InfoCard rows={accountRows} colors={colors} />

            {studentRows.length > 0 && (
              <>
                <Text allowFontScaling={false} style={[styles.sectionTitle, { color: colors.text, marginTop: 8 }]}>Student Details</Text>
                <InfoCard rows={studentRows} colors={colors} />
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sheet: {
    flex: 1,
    marginTop: -24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  content: { paddingTop: 20, paddingBottom: 120 },
  section: { paddingHorizontal: 20, gap: 12 },
  sectionTitle: {
    fontSize: TextSizes.sectionTitle,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  profileCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    alignSelf: 'center',
  },
  profileInitial: {
    fontSize: TextSizes.xlarge,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: TextSizes.xlarge,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  profileDetails: {
    alignItems: 'center',
    marginBottom: 12,
  },
  profileDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  profileDetailText: {
    fontSize: TextSizes.medium,
    fontFamily: 'Inter-Regular',
    marginLeft: 6,
  },
  roleContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleText: {
    fontSize: TextSizes.small,
    fontFamily: 'Inter-SemiBold',
    color: '#b6d509',
  },
  infoCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 30 },
  infoLabel: {
    fontSize: TextSizes.tiny,
    fontFamily: 'Inter-Regular',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: TextSizes.filterLabel,
    fontFamily: 'Inter-SemiBold',
  },
});
