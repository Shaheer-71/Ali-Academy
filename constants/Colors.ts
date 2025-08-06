export const Colors = {
  // Primary Colors
  primary: '#274d71',
  secondary: '#b6d509',
  white: '#ffffff',
  
  // Neutral Colors
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  
  // Status Colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Background Colors
  successBg: '#DCFCE7',
  warningBg: '#FEF3C7',
  errorBg: '#FEE2E2',
  infoBg: '#DBEAFE',
  
  // Attendance Colors
  present: '#10B981',
  late: '#F59E0B',
  absent: '#EF4444',
  
  // Shadow
  shadow: 'rgba(0, 0, 0, 0.1)',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
} as const;

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'present':
    case 'completed':
    case 'success':
      return Colors.success;
    case 'late':
    case 'pending':
    case 'warning':
      return Colors.warning;
    case 'absent':
    case 'overdue':
    case 'error':
      return Colors.error;
    default:
      return Colors.gray500;
  }
};

export const getStatusBackgroundColor = (status: string) => {
  switch (status) {
    case 'present':
    case 'completed':
    case 'success':
      return Colors.successBg;
    case 'late':
    case 'pending':
    case 'warning':
      return Colors.warningBg;
    case 'absent':
    case 'overdue':
    case 'error':
      return Colors.errorBg;
    default:
      return Colors.gray100;
  }
};