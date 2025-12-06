"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { getSupabase } from "@/lib/supabase";

export default function UsernamePage() {
    const { user } = useAuth();
    const [currentUsername, setCurrentUsername] = useState<string>("");
    const [newUsername, setNewUsername] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        async function fetchUsername() {
            if (!user) return;

            const supabase = getSupabase();
            const { data } = await ((supabase as any)
                .from("user_profiles")
                .select("username")
                .eq("id", user.id)
                .maybeSingle());

            if (data) {
                setCurrentUsername(data.username || "");
            }
        }

        fetchUsername();
    }, [user]);

    async function handleUsernameChange(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!user) return;

        if (!newUsername.trim()) {
            setMessage({ type: "error", text: "Username cannot be empty" });
            return;
        }

        if (newUsername.length < 3) {
            setMessage({ type: "error", text: "Username must be at least 3 characters" });
            return;
        }

        setLoading(true);
        setMessage(null);

        const supabase = getSupabase();

        // Check if username is already taken
        const { data: existingUser } = await ((supabase as any)
            .from("user_profiles")
            .select("id")
            .eq("username", newUsername)
            .maybeSingle());

        if (existingUser && existingUser.id !== user.id) {
            setMessage({ type: "error", text: "Username is already taken" });
            setLoading(false);
            return;
        }

        // Update username
        const { error } = await ((supabase as any)
            .from("user_profiles")
            .update({ username: newUsername })
            .eq("id", user.id));

        if (error) {
            setMessage({ type: "error", text: error.message });
        } else {
            setCurrentUsername(newUsername);
            setNewUsername("");
            setMessage({ type: "success", text: "Username updated successfully!" });
        }

        setLoading(false);
    }

    if (!user) return null;

    return (
        <div className="settings-page">
            <h1 className="settings-page-title">Change Username</h1>

            <div className="settings-card">
                <h2 className="settings-card-title">Current Username</h2>
                <p className="settings-value">{currentUsername || "Not set"}</p>
            </div>

            <div className="settings-card">
                <h2 className="settings-card-title">Update Username</h2>

                <form onSubmit={handleUsernameChange}>
                    <div className="settings-form-group">
                        <label className="settings-label" htmlFor="new-username">
                            New Username
                        </label>
                        <input
                            id="new-username"
                            className="settings-input"
                            type="text"
                            placeholder="Enter new username"
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            disabled={loading}
                        />
                        <p className="settings-hint">
                            Username must be at least 3 characters and unique
                        </p>
                    </div>

                    {message && (
                        <div className={`settings-message settings-message-${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="settings-button"
                        disabled={loading || !newUsername.trim()}
                    >
                        {loading ? "Updating..." : "Update Username"}
                    </button>
                </form>
            </div>
        </div>
    );
}
