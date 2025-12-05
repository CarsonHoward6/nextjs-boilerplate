"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { getSupabase } from "@/lib/supabase";

interface Notification {
    id: string;
    message: string;
    notification_type: string;
    created_at: string;
    read: boolean;
}

export default function NotificationsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loadingNotifications, setLoadingNotifications] = useState(true);

    useEffect(() => {
        if (!loading && !user) {
            router.replace("/login");
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            fetchNotifications();
        }
    }, [user]);

    async function fetchNotifications() {
        if (!user) return;

        const supabase = getSupabase();
        const { data, error } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(50);

        if (error) {
            console.error("Error fetching notifications:", error);
        } else {
            setNotifications(data || []);
        }

        setLoadingNotifications(false);
    }

    async function markAsRead(id: string) {
        const supabase = getSupabase();
        await (supabase
            .from("notifications") as any)
            .update({ read: true })
            .eq("id", id);

        setNotifications(notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
        ));
    }

    async function markAllAsRead() {
        if (!user) return;

        const supabase = getSupabase();
        await (supabase
            .from("notifications") as any)
            .update({ read: true })
            .eq("user_id", user.id)
            .eq("read", false);

        setNotifications(notifications.map(n => ({ ...n, read: true })));
    }

    function getNotificationIcon(type: string) {
        switch (type) {
            case "login":
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3" />
                    </svg>
                );
            case "course_assigned":
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                );
            case "student_assigned":
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                );
            default:
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                );
        }
    }

    function formatTime(timestamp: string) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    }

    if (loading || loadingNotifications) {
        return (
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100vh"
            }}>
                Loading...
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div style={{
            minHeight: "100vh",
            background: "var(--bg-primary, #fafafa)",
            padding: "20px"
        }}>
            <div style={{
                maxWidth: "800px",
                margin: "0 auto"
            }}>
                <header style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "24px"
                }}>
                    <div>
                        <h1 style={{ fontSize: "32px", marginBottom: "8px" }}>Notifications</h1>
                        <p style={{ color: "var(--text-secondary, #666)" }}>
                            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: "12px" }}>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                style={{
                                    padding: "10px 20px",
                                    background: "#3b82f6",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    cursor: "pointer"
                                }}
                            >
                                Mark all as read
                            </button>
                        )}
                        <a
                            href="/lms"
                            style={{
                                padding: "10px 20px",
                                background: "var(--bg-secondary, #e5e7eb)",
                                color: "var(--text-primary, #333)",
                                border: "none",
                                borderRadius: "8px",
                                fontSize: "14px",
                                fontWeight: "600",
                                textDecoration: "none",
                                display: "inline-block"
                            }}
                        >
                            Back to Courses
                        </a>
                    </div>
                </header>

                <div style={{
                    background: "white",
                    borderRadius: "12px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                }}>
                    {notifications.length === 0 ? (
                        <div style={{
                            padding: "48px",
                            textAlign: "center",
                            color: "var(--text-secondary, #666)"
                        }}>
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ margin: "0 auto 16px", opacity: 0.3 }}>
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                            <p style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px" }}>
                                No notifications yet
                            </p>
                            <p style={{ fontSize: "14px" }}>
                                When you get notifications, they'll show up here
                            </p>
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <div
                                key={notification.id}
                                onClick={() => !notification.read && markAsRead(notification.id)}
                                style={{
                                    padding: "16px 20px",
                                    borderBottom: "1px solid var(--border, #e5e7eb)",
                                    display: "flex",
                                    alignItems: "start",
                                    gap: "16px",
                                    background: notification.read ? "white" : "#eff6ff",
                                    cursor: notification.read ? "default" : "pointer",
                                    transition: "background 0.2s"
                                }}
                            >
                                <div style={{
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "50%",
                                    background: notification.read ? "#e5e7eb" : "#3b82f6",
                                    color: notification.read ? "#6b7280" : "white",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0
                                }}>
                                    {getNotificationIcon(notification.notification_type)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{
                                        fontSize: "15px",
                                        color: "var(--text-primary, #333)",
                                        marginBottom: "4px",
                                        fontWeight: notification.read ? "normal" : "600"
                                    }}>
                                        {notification.message}
                                    </p>
                                    <p style={{
                                        fontSize: "13px",
                                        color: "var(--text-secondary, #6b7280)"
                                    }}>
                                        {formatTime(notification.created_at)}
                                    </p>
                                </div>
                                {!notification.read && (
                                    <div style={{
                                        width: "8px",
                                        height: "8px",
                                        borderRadius: "50%",
                                        background: "#3b82f6",
                                        marginTop: "6px"
                                    }} />
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
