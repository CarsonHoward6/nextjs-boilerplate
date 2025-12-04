"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark" | "system";
type FontSize = "small" | "medium" | "large";
type SiteTheme = "green" | "blue" | "purple" | "red" | "orange" | "teal";

interface ThemeContextType {
    theme: Theme;
    fontSize: FontSize;
    siteTheme: SiteTheme;
    setTheme: (theme: Theme) => void;
    setFontSize: (fontSize: FontSize) => void;
    setSiteTheme: (siteTheme: SiteTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window !== "undefined") {
            return (localStorage.getItem("theme") as Theme) || "system";
        }
        return "system";
    });
    const [fontSize, setFontSize] = useState<FontSize>(() => {
        if (typeof window !== "undefined") {
            return (localStorage.getItem("fontSize") as FontSize) || "medium";
        }
        return "medium";
    });
    const [siteTheme, setSiteTheme] = useState<SiteTheme>(() => {
        if (typeof window !== "undefined") {
            return (localStorage.getItem("siteTheme") as SiteTheme) || "green";
        }
        return "green";
    });
    const [loaded, setLoaded] = useState(false);

    // Mark as loaded on mount
    useEffect(() => {
        setLoaded(true);
    }, []);

    // Apply theme
    useEffect(() => {
        if (!loaded) return;
        const root = document.documentElement;

        if (theme === "dark") {
            root.classList.add("dark-mode");
            root.classList.remove("light-mode");
        } else if (theme === "light") {
            root.classList.remove("dark-mode");
            root.classList.add("light-mode");
        } else {
            root.classList.remove("dark-mode", "light-mode");
        }
    }, [theme, loaded]);

    // Apply font size
    useEffect(() => {
        if (!loaded) return;
        const root = document.documentElement;
        root.classList.remove("font-small", "font-medium", "font-large");
        root.classList.add(`font-${fontSize}`);
    }, [fontSize, loaded]);

    // Apply site theme
    useEffect(() => {
        if (!loaded) return;
        const root = document.documentElement;
        root.classList.remove("site-green", "site-blue", "site-purple", "site-red", "site-orange", "site-teal");
        root.classList.add(`site-${siteTheme}`);
    }, [siteTheme, loaded]);

    return (
        <ThemeContext.Provider value={{ theme, fontSize, siteTheme, setTheme, setFontSize, setSiteTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}