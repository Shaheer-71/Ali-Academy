// contexts/TimetableContext.tsx

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useTimetable } from '@/hooks/useTimetable';
import { TimetableContextType, TimetableEntryWithDetails } from '@/types/timetable';

const TimetableContext = createContext<TimetableContextType | undefined>(undefined);

interface TimetableProviderProps {
    children: React.ReactNode;
}

export const TimetableProvider: React.FC<TimetableProviderProps> = ({ children }) => {
    const timetableHook = useTimetable();
    const subscribersRef = useRef<Array<(timetable: TimetableEntryWithDetails[]) => void>>([]);

    // Subscribe function for components that want real-time updates
    const subscribe = (callback: (timetable: TimetableEntryWithDetails[]) => void) => {
        subscribersRef.current.push(callback);

        // Return unsubscribe function
        return () => {
            subscribersRef.current = subscribersRef.current.filter(cb => cb !== callback);
        };
    };

    // Unsubscribe all
    const unsubscribe = () => {
        subscribersRef.current = [];
    };

    // Notify all subscribers when timetable changes
    useEffect(() => {
        subscribersRef.current.forEach(callback => {
            callback(timetableHook.timetable);
        });
    }, [timetableHook.timetable]);

    const contextValue: TimetableContextType = {
        ...timetableHook,
        subscribe,
        unsubscribe,
    };

    return (
        <TimetableContext.Provider value={contextValue}>
            {children}
        </TimetableContext.Provider>
    );
};

export const useTimetableContext = (): TimetableContextType => {
    const context = useContext(TimetableContext);
    if (context === undefined) {
        throw new Error('useTimetableContext must be used within a TimetableProvider');
    }
    return context;
};

// HOC for components that need timetable data
export const withTimetable = <P extends object>(
    Component: React.ComponentType<P>
): React.FC<P> => {
    return (props: P) => (
        <TimetableProvider>
            <Component {...props} />
        </TimetableProvider>
    );
};