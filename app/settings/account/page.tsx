"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { getSupabase } from "@/lib/supabase";

export default function AccountPage() {
    const { user } = useAuth();
    const [roles, setRoles] = useState<string[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(true);

    useEffect(() => {
        async function fetchRoles() {
            if (!user) return;

            const supabase = getSupabase();
            const { data } = await ((supabase as any)
                .from("user_roles")
                .select("role")
                .eq("user_id", user.id));

            if (data) {
                setRoles(data.map((r: any) => r.role));
            }
            setLoadingRoles(false);
        }

        fetchRoles();
    }, [user]);

    if (!user) return null;

    const createdAt = user.created_at
        ? new Date(user.created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        })
        : "Unknown";

    const lastSignIn = user.last_sign_in_at
        ? new Date(user.last_sign_in_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        })
        : "Unknown";

    return (
        <div className="settings-page">
            <h1 className="settings-page-title">Account Information</h1>

            <div className="settings-card">
                <h2 className="settings-card-title">Profile Details</h2>

                <div className="settings-grid">
                    <div className="settings-field">
                        <label className="settings-label">Email Address</label>
                        <p className="settings-value">{user.email}</p>
                    </div>

                    <div className="settings-field">
                        <label className="settings-label">Email Status</label>
                        <p className="settings-value">
                            {user.email_confirmed_at ? (
                                <span className="settings-badge settings-badge-success">Verified</span>
                            ) : (
                                <span className="settings-badge settings-badge-warning">Not Verified</span>
                            )}
                        </p>
                    </div>

                    <div className="settings-field">
                        <label className="settings-label">Account Role(s)</label>
                        <p className="settings-value">
                            {loadingRoles ? (
                                "Loading..."
                            ) : roles.length > 0 ? (
                                roles.map((role, index) => (
                                    <span key={index} className="settings-badge settings-badge-info" style={{ marginRight: "8px" }}>
                                        {role}
                                    </span>
                                ))
                            ) : (
                                <span className="settings-badge">No role assigned</span>
                            )}
                        </p>
                    </div>
                </div>
            </div>

            <div className="settings-card">
                <h2 className="settings-card-title">Account Details</h2>

                <div className="settings-grid">
                    <div className="settings-field">
                        <label className="settings-label">Account Created</label>
                        <p className="settings-value">{createdAt}</p>
                    </div>

                    <div className="settings-field">
                        <label className="settings-label">Last Sign In</label>
                        <p className="settings-value">{lastSignIn}</p>
                    </div>
                </div>

                <div className="settings-field">
                    <label className="settings-label">User ID</label>
                    <p className="settings-value settings-value-mono">{user.id}</p>
                </div>
            </div>
        </div>
    );
}