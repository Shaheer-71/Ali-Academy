import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { UserProfile, StudentProfile } from '@/src/lib/auth';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

interface AuthContextType {
  user: any;
  profile: UserProfile | null;
  student: StudentProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [student, setStudent] = useState<StudentProfile | any>(null);
  const [loading, setLoading] = useState(true);
  const [profileFetched, setProfileFetched] = useState(false); // prevent infinite fetch
  const [profileStudentFetched, setProfileStudentFetched] = useState(false); // prevent infinite fetch

  // Fetch user session on mount
  useEffect(() => {
    const getSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.warn('Error fetching session:', error);
      }
      setUser(session?.user ?? null);
      setLoading(false);
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setProfileFetched(false); // allow re-fetching profile on login
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch user profile when user is set
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.email || profileFetched) return;

      try {
        setLoading(true);
        // Query by email because teacher-created profiles use a different UUID
        // than the one Supabase assigns to the auth user at registration time.
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', user.email)
          .single();

        if (error) throw error;
        setProfile(data);
        setProfileFetched(true);
      } catch (error: any) {
        console.warn('Error fetching profile:', error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id, profileFetched]);

  useEffect(() => {
    const fetchStudentInfo = async () => {
      if (!profile?.email || profile.role?.toLowerCase() !== 'student' || profileStudentFetched) return;

      try {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('email', profile.email)
          .eq('is_deleted', false)
          .single();

        if (error) throw error;

        setStudent(data ?? null);
        setProfileStudentFetched(true);
      } catch (error) {
        console.warn('Error fetching student info:', error);
        setStudent(null);
        setProfileStudentFetched(true);
      }
    };

    fetchStudentInfo();
  }, [profile?.email, profileStudentFetched]);

  const deleteDeviceToken = async (userId: string) => {
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });
      const currentToken = tokenData.data;
      if (!currentToken) return;

      const { error } = await supabase
        .from('devices')
        .delete()
        .eq('user_id', userId)
        .eq('token', currentToken);

      if (error) console.warn('Error deleting device token:', error.message);
    } catch (error) {
      console.warn('Error in deleteDeviceToken:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    const normalizedEmail = email.toLowerCase().trim();

    // Check disability BEFORE signing in — if signInWithPassword fires first,
    // the auth state change navigates away before the error modal can show.
    //
    // We check students table (accessible via anon key) rather than profiles
    // because profiles RLS may block reads before authentication.
    const { data: studentCheck } = await supabase
      .from('students')
      .select('is_deleted, student_status')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (studentCheck && (studentCheck.is_deleted || studentCheck.student_status === 'inactive')) {
      throw new Error('ACCOUNT_DISABLED');
    }

    const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    if (error) throw error;
  };

  const signOut = async () => {
    if (user?.id) {
      await deleteDeviceToken(user.id);
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setProfile(null);
    setStudent(null);
    setProfileFetched(false);
    setProfileStudentFetched(false);


  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        student,
        loading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
