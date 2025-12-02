"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/app/context/ThemeContext";

type ColorScheme = "indigo" | "green" | "blue" | "purple" | "orange";

export default function DisplaySettingsPage() {
    const { theme, setTheme, fontSize, setFontSize, siteTheme, setSiteTheme } = useTheme();
    const [colorScheme, setColorScheme] = useState<ColorScheme>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("colorScheme") as ColorScheme;
            return saved || "indigo";
        }
        return "indigo";
    });
    const [saved, setSaved] = useState(false);

    // Apply color scheme
    useEffect(() => {
        const root = document.documentElement;
        root.classList.remove("scheme-indigo", "scheme-green", "scheme-blue", "scheme-purple", "scheme-orange");
        root.classList.add(`scheme-${colorScheme}`);
    }, [colorScheme]);

    function handleSave() {
        localStorage.setItem("theme", theme);
        localStorage.setItem("fontSize", fontSize);
        localStorage.setItem("colorScheme", colorScheme);
        localStorage.setItem("siteTheme", siteTheme);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    }

    return (
        <div className="settings-page">
            <h1 className="settings-page-title">Display Settings</h1>

            <div className="settings-card">
                <h2 className="settings-card-title">Theme</h2>
                <div className="settings-field">
                    <label className="settings-label">Appearance Mode</label>
                    <div className="settings-toggle-group">
                        <button
                            className={`settings-toggle-btn ${theme === "light" ? "active" : ""}`}
                            onClick={() => setTheme("light")}
                        >
                            Light
                        </button>
                        <button
                            className={`settings-toggle-btn ${theme === "dark" ? "active" : ""}`}
                            onClick={() => setTheme("dark")}
                        >
                            Dark
                        </button>
                        <button
                            className={`settings-toggle-btn ${theme === "system" ? "active" : ""}`}
                            onClick={() => setTheme("system")}
                        >
                            System
                        </button>
                    </div>
                    <p className="settings-hint">Choose how the app appears. System uses your device preference.</p>
                </div>
            </div>

            <div className="settings-card">
                <h2 className="settings-card-title">Typography</h2>
                <div className="settings-field">
                    <label className="settings-label">Font Size</label>
                    <div className="settings-toggle-group">
                        <button
                            className={`settings-toggle-btn ${fontSize === "small" ? "active" : ""}`}
                            onClick={() => setFontSize("small")}
                        >
                            Small
                        </button>
                        <button
                            className={`settings-toggle-btn ${fontSize === "medium" ? "active" : ""}`}
                            onClick={() => setFontSize("medium")}
                        >
                            Medium
                        </button>
                        <button
                            className={`settings-toggle-btn ${fontSize === "large" ? "active" : ""}`}
                            onClick={() => setFontSize("large")}
                        >
                            Large
                        </button>
                    </div>
                    <p className="settings-hint">Adjust the base font size across the application.</p>
                </div>
            </div>

            <div className="settings-card">
                <h2 className="settings-card-title">Website Theme</h2>
                <div className="settings-field">
                    <label className="settings-label">Primary Color</label>
                    <div className="settings-site-color-grid">
                        <button
                            className={`settings-site-color-btn site-color-green ${siteTheme === "green" ? "active" : ""}`}
                            onClick={() => setSiteTheme("green")}
                            title="Green"
                        />
                        <button
                            className={`settings-site-color-btn site-color-blue ${siteTheme === "blue" ? "active" : ""}`}
                            onClick={() => setSiteTheme("blue")}
                            title="Blue"
                        />
                        <button
                            className={`settings-site-color-btn site-color-purple ${siteTheme === "purple" ? "active" : ""}`}
                            onClick={() => setSiteTheme("purple")}
                            title="Purple"
                        />
                        <button
                            className={`settings-site-color-btn site-color-red ${siteTheme === "red" ? "active" : ""}`}
                            onClick={() => setSiteTheme("red")}
                            title="Red"
                        />
                        <button
                            className={`settings-site-color-btn site-color-orange ${siteTheme === "orange" ? "active" : ""}`}
                            onClick={() => setSiteTheme("orange")}
                            title="Orange"
                        />
                        <button
                            className={`settings-site-color-btn site-color-teal ${siteTheme === "teal" ? "active" : ""}`}
                            onClick={() => setSiteTheme("teal")}
                            title="Teal"
                        />
                    </div>
                    <p className="settings-hint">Change the main color theme of the website (header, sidebar, buttons).</p>
                </div>
            </div>

            <div className="settings-card">
                <h2 className="settings-card-title">Accent Color</h2>
                <div className="settings-field">
                    <label className="settings-label">Accent Color</label>
                    <div className="settings-color-grid">
                        <button
                            className={`settings-color-btn settings-color-indigo ${colorScheme === "indigo" ? "active" : ""}`}
                            onClick={() => setColorScheme("indigo")}
                            title="Indigo"
                        />
                        <button
                            className={`settings-color-btn settings-color-green ${colorScheme === "green" ? "active" : ""}`}
                            onClick={() => setColorScheme("green")}
                            title="Green"
                        />
                        <button
                            className={`settings-color-btn settings-color-blue ${colorScheme === "blue" ? "active" : ""}`}
                            onClick={() => setColorScheme("blue")}
                            title="Blue"
                        />
                        <button
                            className={`settings-color-btn settings-color-purple ${colorScheme === "purple" ? "active" : ""}`}
                            onClick={() => setColorScheme("purple")}
                            title="Purple"
                        />
                        <button
                            className={`settings-color-btn settings-color-orange ${colorScheme === "orange" ? "active" : ""}`}
                            onClick={() => setColorScheme("orange")}
                            title="Orange"
                        />
                    </div>
                    <p className="settings-hint">Customize the accent color for buttons and highlights.</p>
                </div>
            </div>

            <button onClick={handleSave} className="settings-btn">
                {saved ? "Saved!" : "Save Settings"}
            </button>
        </div>
    );
}