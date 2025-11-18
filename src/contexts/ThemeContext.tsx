import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeColors {
    primary: string;
    secondary: string;
    background: string;
    cardBackground: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    info: string;
}

interface ThemeContextType {
    isDark: boolean;
    toggleTheme: () => void;
    colors: ThemeColors;
}

const lightColors: ThemeColors = {
    primary: '#1F3F4A',        // Logo dark teal
    secondary: '#A4C400',      // Logo lime green
    background: '#FFFFFF',
    cardBackground: '#F4F7F8', // Light smooth teal-gray
    text: '#1F3F4A',
    textSecondary: '#5A7A80',  // Light teal-gray for clean UI
    border: '#D5DFE1',
    success: '#A4C400',
    warning: '#A4C400',
    error: '#1F3F4A',          // Stays consistent to your color identity
    info: '#4E767F',           // Medium teal (professional & subtle)
};

const darkColors: ThemeColors = {
    primary: '#3E6D73',        // Muted teal accent (professional + matches logo)
    secondary: '#2A5055',      // Darker teal for depth

    background: '#0D0D0F',     // Ultra-clean professional dark
    cardBackground: '#161618', // Slightly raised card surface

    text: '#E6E6E6',           // Soft white (not harsh)
    textSecondary: '#9AA1A4',  // Elegant gray for secondary text

    border: '#242628',         // Subtle, premium border

    success: '#3E6D73',        // Keep teal tone for consistency
    warning: '#3E6D73',
    error: '#E6E6E6',
    info: '#3E6D73',
};


const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('theme');
            if (savedTheme) {
                setIsDark(savedTheme === 'dark');
            }
        } catch (error) {
            console.warn('Error loading theme:', error);
        }
    };

    const toggleTheme = async () => {
        try {
            const newTheme = !isDark;
            setIsDark(newTheme);
            await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
        } catch (error) {
            console.warn('Error saving theme:', error);
        }
    };

    const colors = isDark ? darkColors : lightColors;

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme, colors }}>
            {children}
        </ThemeContext.Provider>
    );
};