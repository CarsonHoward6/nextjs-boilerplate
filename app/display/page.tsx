"use client";

import { useState } from "react";
import { useTheme } from "@/app/context/ThemeContext";
import TransitionLink from "@/app/components/TransitionLink";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function DisplayPage() {
    const { theme, setTheme, fontSize, setFontSize } = useTheme();
    const [saved, setSaved] = useState(false);

    function handleSave() {
        localStorage.setItem("theme", theme);
        localStorage.setItem("fontSize", fontSize);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    }

    return (
        <div className="display-page-wrapper">
            <header className="display-header">
                <h1>Display Settings</h1>
                <TransitionLink href="/lms" className="display-back-link">
                    Back to Courses
                </TransitionLink>
            </header>

            <div className="display-content">
                <div className="settings-card">
                    <h2 className="settings-card-title">Appearance</h2>
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
                    <h2 className="settings-card-title">Text Size</h2>
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
                        <p className="settings-hint">Adjust the base text size for better readability.</p>
                    </div>
                </div>

                <button onClick={handleSave} className="settings-btn">
                    {saved ? "✓ Saved!" : "Save Settings"}
                </button>

                {saved && (
                    <p className="settings-message settings-message-success" style={{ marginTop: "16px" }}>
                        Your display preferences have been saved.
                    </p>
                )}
            </div>
            <SpeedInsights />
        </div>
    );
}