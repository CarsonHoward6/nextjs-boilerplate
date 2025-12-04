"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import "./announcements.css";

interface Announcement {
    id: string;
    section_id: string;
    author_id: string;
    title: string;
    content: string;
    priority: "low" | "normal" | "high" | "urgent";
    is_pinned: boolean;
    is_read: boolean;
    created_at: string;
    updated_at: string;
    author: {
        id: string;
        full_name: string | null;
        email: string;
    };
}

interface AnnouncementsProps {
    sectionId: string;
    sectionTitle: string;
    onClose: () => void;
}

export default function Announcements({ sectionId, sectionTitle, onClose }: AnnouncementsProps) {
    const { user } = useAuth();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [isTeacher, setIsTeacher] = useState(false);

    // Create announcement form
    const [newTitle, setNewTitle] = useState("");
    const [newContent, setNewContent] = useState("");
    const [newPriority, setNewPriority] = useState<"low" | "normal" | "high" | "urgent">("normal");
    const [newIsPinned, setNewIsPinned] = useState(false);
    const [creating, setCreating] = useState(false);

    const checkTeacherStatus = useCallback(async () => {
        if (!user || !sectionId) return;

        try {
            const response = await fetch(`/api/sections/${sectionId}/role`);
            if (response.ok) {
                const data = await response.json();
                setIsTeacher(data.role === "teacher" || data.role === "teacher_assistant");
            }
        } catch (err) {
            console.error("Error checking teacher status:", err);
        }
    }, [user, sectionId]);

    const fetchAnnouncements = useCallback(async () => {
        if (!sectionId) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/announcements?section_id=${sectionId}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch announcements");
            }

            setAnnouncements(data.announcements || []);
        } catch (err) {
            console.error("Error fetching announcements:", err);
            setError(err instanceof Error ? err.message : "Failed to fetch announcements");
        } finally {
            setLoading(false);
        }
    }, [sectionId]);

    useEffect(() => {
        fetchAnnouncements();
        checkTeacherStatus();
    }, [fetchAnnouncements, checkTeacherStatus]);

    async function markAsRead(announcementId: string) {
        try {
            const response = await fetch(`/api/announcements/${announcementId}/mark-read`, {
                method: "POST"
            });

            if (!response.ok) {
                throw new Error("Failed to mark as read");
            }

            // Update local state
            setAnnouncements(prev =>
                prev.map(a => (a.id === announcementId ? { ...a, is_read: true } : a))
            );
        } catch (err) {
            console.error("Error marking announcement as read:", err);
        }
    }

    async function deleteAnnouncement(announcementId: string) {
        if (!confirm("Are you sure you want to delete this announcement?")) {
            return;
        }

        try {
            const response = await fetch(`/api/announcements/${announcementId}`, {
                method: "DELETE"
            });

            if (!response.ok) {
                throw new Error("Failed to delete announcement");
            }

            // Remove from local state
            setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
        } catch (err) {
            console.error("Error deleting announcement:", err);
            alert("Failed to delete announcement: " + (err instanceof Error ? err.message : "Unknown error"));
        }
    }

    function toggleExpanded(announcementId: string) {
        if (expandedId === announcementId) {
            setExpandedId(null);
        } else {
            setExpandedId(announcementId);

            // Mark as read when expanding
            const announcement = announcements.find(a => a.id === announcementId);
            if (announcement && !announcement.is_read) {
                markAsRead(announcementId);
            }
        }
    }

    async function createAnnouncement() {
        if (!newTitle.trim() || !newContent.trim()) {
            alert("Please fill in both title and content");
            return;
        }

        setCreating(true);

        try {
            const response = await fetch("/api/announcements", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    section_id: sectionId,
                    title: newTitle,
                    content: newContent,
                    priority: newPriority,
                    is_pinned: newIsPinned
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to create announcement");
            }

            // Add new announcement to the list
            setAnnouncements(prev => [{ ...data.announcement, is_read: true }, ...prev]);

            // Reset form
            setNewTitle("");
            setNewContent("");
            setNewPriority("normal");
            setNewIsPinned(false);
            setShowCreateForm(false);
        } catch (err) {
            console.error("Error creating announcement:", err);
            alert("Failed to create announcement: " + (err instanceof Error ? err.message : "Unknown error"));
        } finally {
            setCreating(false);
        }
    }

    function formatTimeAgo(timestamp: string) {
        const now = new Date().getTime();
        const then = new Date(timestamp).getTime();
        const diff = now - then;

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return new Date(timestamp).toLocaleDateString();
    }

    const unreadCount = announcements.filter(a => !a.is_read).length;

    return (
        <div className="announcements-overlay" onClick={onClose}>
            <div className="announcements-panel" onClick={(e) => e.stopPropagation()}>
                <div className="announcements-header">
                    <div>
                        <h2>Announcements</h2>
                        <p className="announcements-section-title">{sectionTitle}</p>
                    </div>
                    <button className="announcements-close" onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {unreadCount > 0 && !showCreateForm && (
                    <div className="announcements-unread-banner">
                        {unreadCount} unread announcement{unreadCount !== 1 ? "s" : ""}
                    </div>
                )}

                {isTeacher && !showCreateForm && (
                    <div className="announcements-create-btn-container">
                        <button className="announcements-create-btn" onClick={() => setShowCreateForm(true)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Create Announcement
                        </button>
                    </div>
                )}

                {showCreateForm && (
                    <div className="announcements-create-form">
                        <h3>Create New Announcement</h3>

                        <input
                            type="text"
                            placeholder="Announcement title..."
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="create-form-input"
                            maxLength={200}
                        />

                        <textarea
                            placeholder="Announcement content..."
                            value={newContent}
                            onChange={(e) => setNewContent(e.target.value)}
                            className="create-form-textarea"
                            rows={4}
                        />

                        <div className="create-form-options">
                            <div className="create-form-field">
                                <label>Priority:</label>
                                <select
                                    value={newPriority}
                                    onChange={(e) => setNewPriority(e.target.value as "low" | "normal" | "high" | "urgent")}
                                    className="create-form-select"
                                >
                                    <option value="low">Low</option>
                                    <option value="normal">Normal</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>

                            <div className="create-form-field">
                                <label className="create-form-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={newIsPinned}
                                        onChange={(e) => setNewIsPinned(e.target.checked)}
                                    />
                                    <span>Pin to top</span>
                                </label>
                            </div>
                        </div>

                        <div className="create-form-actions">
                            <button
                                className="create-form-cancel"
                                onClick={() => setShowCreateForm(false)}
                                disabled={creating}
                            >
                                Cancel
                            </button>
                            <button
                                className="create-form-submit"
                                onClick={createAnnouncement}
                                disabled={creating}
                            >
                                {creating ? "Creating..." : "Create & Notify Students"}
                            </button>
                        </div>
                    </div>
                )}

                <div className="announcements-content">
                    {loading && (
                        <div className="announcements-loading">
                            <div className="spinner"></div>
                            Loading announcements...
                        </div>
                    )}

                    {error && (
                        <div className="announcements-error">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            {error}
                        </div>
                    )}

                    {!loading && !error && announcements.length === 0 && (
                        <div className="announcements-empty">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                            <p>No announcements yet</p>
                        </div>
                    )}

                    {!loading && !error && announcements.length > 0 && (
                        <div className="announcements-list">
                            {announcements.map((announcement) => (
                                <div
                                    key={announcement.id}
                                    className={`announcement-card ${!announcement.is_read ? "unread" : ""} ${
                                        announcement.is_pinned ? "pinned" : ""
                                    } priority-${announcement.priority}`}
                                >
                                    <div
                                        className="announcement-card-header"
                                        onClick={() => toggleExpanded(announcement.id)}
                                    >
                                        <div className="announcement-card-header-left">
                                            {announcement.is_pinned && (
                                                <svg className="pin-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z"/>
                                                </svg>
                                            )}
                                            {!announcement.is_read && <div className="unread-dot"></div>}
                                            <h3>{announcement.title}</h3>
                                        </div>
                                        <div className="announcement-card-header-right">
                                            <span className={`priority-badge priority-${announcement.priority}`}>
                                                {announcement.priority}
                                            </span>
                                            <svg
                                                className={`chevron ${expandedId === announcement.id ? "expanded" : ""}`}
                                                width="20"
                                                height="20"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                            >
                                                <polyline points="6 9 12 15 18 9" />
                                            </svg>
                                        </div>
                                    </div>

                                    {expandedId === announcement.id && (
                                        <div className="announcement-card-body">
                                            <p className="announcement-content">{announcement.content}</p>

                                            <div className="announcement-meta">
                                                <div className="announcement-author">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                        <circle cx="12" cy="7" r="4" />
                                                    </svg>
                                                    {announcement.author.full_name || announcement.author.email}
                                                </div>
                                                <div className="announcement-time">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <circle cx="12" cy="12" r="10" />
                                                        <polyline points="12 6 12 12 16 14" />
                                                    </svg>
                                                    {formatTimeAgo(announcement.created_at)}
                                                </div>
                                            </div>

                                            {user?.id === announcement.author_id && (
                                                <div className="announcement-actions">
                                                    <button
                                                        className="announcement-delete-btn"
                                                        onClick={() => deleteAnnouncement(announcement.id)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}