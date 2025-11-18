import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { UserProfile, StudentProfile } from '@/src/lib/auth';
import * as Notifications from 'expo-notifications';

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
      if (!user || profileFetched) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setProfile(data);
        setProfileFetched(true);
      } catch (error) {
        console.warn('Error fetching profile:', error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, profileFetched]);

  useEffect(() => {
    const fetchStudentInfo = async () => {

      if (!profile) {
        console.log('⏩ No profile found yet, skipping student fetch.');
        return;
      }

      if (profile.role?.toLowerCase() !== 'student') {
        console.log(`⏩ Role is not "student" (actual: ${profile.role}), skipping student fetch.`);
        return;
      }

      if (profileStudentFetched) {
        console.log('⏩ Student data already fetched once, skipping.');
        return;
      }

      try {
        setLoading(true);

        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('id', profile.id)
          .single();

        if (error) {
          throw error;
        }

        if (!data) {
          console.warn('⚠️ No student record found for email:', profile.email);
        } else {
          console.log('✅ Student data fetched:', data);
        }

        setStudent(data);
        setProfileStudentFetched(true);
      } catch (error) {
        console.warn('🔥 Error fetching student info:', error);
        setStudent(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentInfo();
  }, [profile, profileStudentFetched]);

  const deleteDeviceToken = async (userId: string) => {
    try {
      console.log('🗑️ [DEVICE] Deleting device token for user:', userId);

      // Get current device's Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync();
      const currentToken = tokenData.data;

      if (!currentToken) {
        console.log('⚠️ [DEVICE] No token found to delete');
        return;
      }

      // Delete this specific device from database
      const { error } = await supabase
        .from('devices')
        .delete()
        .eq('user_id', userId)
        .eq('token', currentToken);

      if (error) {
        console.log('❌ [DEVICE] Error deleting token:', error.message);
      } else {
        console.log('✅ [DEVICE] Device token deleted successfully');
      }
    } catch (error) {
      console.log('❌ [DEVICE] Error in deleteDeviceToken:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
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
    setProfileFetched(false);


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
