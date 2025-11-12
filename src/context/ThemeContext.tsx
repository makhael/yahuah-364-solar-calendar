
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = "theme-paper-light" | "theme-desert-scroll" | "theme-ocean-blue";

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [theme, setThemeState] = useState<Theme>('theme-paper-light');

    useEffect(() => {
        try {
            const storedTheme = localStorage.getItem('app-theme') as Theme | null;
            if (storedTheme) {
                setThemeState(storedTheme);
            }
        } catch (error) {
            console.error("Could not read theme from localStorage", error);
        }
    }, []);

    const setTheme = (newTheme: Theme) => {
        try {
            localStorage.setItem('app-theme', newTheme);
        } catch (error) {
            console.error("Could not save theme to localStorage", error);
        }
        setThemeState(newTheme);
    };

    useEffect(() => {
        document.body.className = '';
        document.body.classList.add(theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
