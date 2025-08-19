// contexts/LoadingContext.tsx
import React, { createContext, useContext, useState } from 'react';

interface LoadingContextType {
    isAnalyticsLoading: boolean;
    setAnalyticsLoading: (loading: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
    const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);

    const setAnalyticsLoading = (loading: boolean) => {
        setIsAnalyticsLoading(loading);
    };

    return (
        <LoadingContext.Provider value={{ isAnalyticsLoading, setAnalyticsLoading }}>
            {children}
        </LoadingContext.Provider>
    );
}

export function useLoading() {
    const context = useContext(LoadingContext);
    if (context === undefined) {
        throw new Error('useLoading must be used within a LoadingProvider');
    }
    return context;
}