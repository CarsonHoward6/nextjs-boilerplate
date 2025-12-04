"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/app/context/AuthContext";

export default function ChangeEmailPage() {
    const { user } = useAuth();
    const [newEmail, setNewEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        if (!newEmail.trim()) {
            setMessage({ type: "error", text: "Please enter a new email address." });
            setLoading(false);
            return;
        }

        if (newEmail === user?.email) {
            setMessage({ type: "error", text: "New email must be different from your current email." });
            setLoading(false);
            return;
        }

        const supabase = getSupabase();
        const { error } = await supabase.auth.updateUser({ email: newEmail });

        if (error) {
            setMessage({ type: "error", text: error.message });
        } else {
            setMessage({
                type: "success",
                text: "Confirmation email sent! Please check both your old and new email addresses to confirm the change."
            });
            setNewEmail("");
        }

        setLoading(false);
    }

    return (
        <div className="settings-page">
            <h1 className="settings-page-title">Change Email</h1>

            <div className="settings-card">
                <h2 className="settings-card-title">Current Email</h2>
                <div className="settings-field">
                    <p className="settings-value">{user?.email}</p>
                </div>
            </div>

            <div className="settings-card">
                <h2 className="settings-card-title">Update Email Address</h2>
                <form onSubmit={handleSubmit} className="settings-form">
                    <div className="settings-field">
                        <label className="settings-label" htmlFor="newEmail">New Email Address</label>
                        <input
                            id="newEmail"
                            type="email"
                            className="settings-input"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            placeholder="Enter new email address"
                            disabled={loading}
                        />
                        <p className="settings-hint">A confirmation will be sent to both your old and new email.</p>
                    </div>

                    {message && (
                        <div className={`settings-message ${message.type === "success" ? "settings-message-success" : "settings-message-error"}`}>
                            {message.text}
                        </div>
                    )}

                    <button type="submit" className="settings-btn" disabled={loading}>
                        {loading ? "Updating..." : "Update Email"}
                    </button>
                </form>
            </div>
        </div>
    );
}
