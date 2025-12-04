"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase";

export default function ChangePasswordPage() {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        if (!newPassword.trim()) {
            setMessage({ type: "error", text: "Please enter a new password." });
            setLoading(false);
            return;
        }

        if (newPassword.length < 6) {
            setMessage({ type: "error", text: "Password must be at least 6 characters long." });
            setLoading(false);
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage({ type: "error", text: "Passwords do not match." });
            setLoading(false);
            return;
        }

        const supabase = getSupabase();
        const { error } = await supabase.auth.updateUser({ password: newPassword });

        if (error) {
            setMessage({ type: "error", text: error.message });
        } else {
            setMessage({ type: "success", text: "Password updated successfully!" });
            setNewPassword("");
            setConfirmPassword("");
        }

        setLoading(false);
    }

    return (
        <div className="settings-page">
            <h1 className="settings-page-title">Change Password</h1>

            <div className="settings-card">
                <h2 className="settings-card-title">Update Your Password</h2>
                <form onSubmit={handleSubmit} className="settings-form">
                    <div className="settings-field">
                        <label className="settings-label" htmlFor="newPassword">New Password</label>
                        <input
                            id="newPassword"
                            type="password"
                            className="settings-input"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            disabled={loading}
                        />
                        <p className="settings-hint">Password must be at least 6 characters long.</p>
                    </div>

                    <div className="settings-field">
                        <label className="settings-label" htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            className="settings-input"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            disabled={loading}
                        />
                    </div>

                    {message && (
                        <div className={`settings-message ${message.type === "success" ? "settings-message-success" : "settings-message-error"}`}>
                            {message.text}
                        </div>
                    )}

                    <button type="submit" className="settings-btn" disabled={loading}>
                        {loading ? "Updating..." : "Update Password"}
                    </button>
                </form>
            </div>
        </div>
    );
}
