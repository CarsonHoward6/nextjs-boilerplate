"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { getSupabase } from "@/lib/supabase";
import TransitionLink from "@/app/components/TransitionLink";

type UserRole = "admin" | "teacher" | "student" | "teacher_assistant";

interface User {
    id: string;
    email: string;
    full_name: string | null;
    created_at: string;
    last_sign_in_at: string | null;
    roles: UserRole[];
    sections: { id: string; title: string; course: string }[];
    courses: { id: string; title: string }[];
}

interface Course {
    id: string; // Changed to string for UUID
    title: string;
}

interface Section {
    id: string;
    title: string;
    course_id: string;
    year: number;
    semester: string;
}

interface LoginNotification {
    id: string;
    email: string;
    timestamp: string;
}

export default function AdminPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"users" | "assign" | "notifications" | "submissions">("users");
    const [users, setUsers] = useState<User[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [loginNotifications, setLoginNotifications] = useState<LoginNotification[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [showCourseModal, setShowCourseModal] = useState(false);
    const [selectedRole, setSelectedRole] = useState<UserRole>("student");
    const [selectedCourse, setSelectedCourse] = useState<string>("");
    const [selectedCourseRole, setSelectedCourseRole] = useState<UserRole>("student");
    const [error, setError] = useState<string | null>(null);

    // Submissions state
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);

    const ADMIN_EMAIL = "carsonhoward6@gmail.com";

    // Redirect if not admin
    useEffect(() => {
        if (!loading && (!user || user.email !== ADMIN_EMAIL)) {
            router.replace("/lms");
        }
    }, [user, loading, router]);

    const fetchLoginNotifications = useCallback(async () => {
        try {
            // Get all auth users with their last sign in times via API route
            const response = await fetch("/api/admin/users");
            const data = await response.json();

            if (data.users) {
                interface AuthUser {
                    id: string;
                    email?: string;
                    last_sign_in_at?: string;
                }

                const notifications = data.users
                    .filter((u: AuthUser) => u.last_sign_in_at) // Only users who have logged in
                    .sort((a: AuthUser, b: AuthUser) => {
                        const timeA = a.last_sign_in_at ? new Date(a.last_sign_in_at).getTime() : 0;
                        const timeB = b.last_sign_in_at ? new Date(b.last_sign_in_at).getTime() : 0;
                        return timeB - timeA; // Most recent first
                    })
                    .slice(0, 20) // Get last 20 logins
                    .map((u: AuthUser, index: number) => ({
                        id: `${index}-${u.id}`,
                        email: u.email || "Unknown",
                        timestamp: u.last_sign_in_at || ""
                    }));

                setLoginNotifications(notifications);
            }
        } catch (err) {
            console.error("Error fetching login notifications:", err);
        }
    }, []);

    const fetchSubmissions = useCallback(async () => {
        setLoadingSubmissions(true);
        try {
            const response = await fetch('/api/submissions');
            if (response.ok) {
                const data = await response.json();
                setSubmissions(data);
            }
        } catch (err) {
            console.error("Error fetching submissions:", err);
        }
        setLoadingSubmissions(false);
    }, []);

    const fetchData = useCallback(async () => {
        setLoadingData(true);
        setError(null);

        try {
            const supabase = getSupabase();

            // Fetch user data with roles and courses via API (uses service role to bypass RLS)
            const usersResponse = await fetch("/api/admin/users-data");
            const usersData = await usersResponse.json();

            if (!usersResponse.ok || usersData.error) {
                console.error("Error fetching user data:", usersData.error);
                setError("Failed to load user data from database");
                setUsers([]);
            } else if (usersData.users) {
                // Transform API response to match existing User interface
                const transformedUsers = usersData.users.map((apiUser: any) => ({
                    id: apiUser.id,
                    email: apiUser.email || "No email",
                    full_name: apiUser.full_name || null,
                    created_at: apiUser.created_at,
                    last_sign_in_at: null, // Not included in users-data API
                    roles: apiUser.roles || [],
                    sections: [], // Sections fetched separately if needed
                    courses: apiUser.courses || []
                }));

                // Sort by most recent first
                transformedUsers.sort((a: User, b: User) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );

                setUsers(transformedUsers);
            }

            // Fetch courses
            const { data: coursesData, error: coursesError } = await supabase
                .from("course")
                .select("id, title")
                .order("title", { ascending: true });

            if (coursesError) {
                console.error("Error fetching courses:", coursesError);
            }
            setCourses(coursesData || []);

            // Fetch other data
            await fetchLoginNotifications();
            if (activeTab === 'submissions') {
                await fetchSubmissions();
            }

            setLoadingData(false);
        } catch (err) {
            console.error("Error fetching admin data:", err);
            setError("Failed to load data");
            setLoadingData(false);
        }
    }, [fetchLoginNotifications, activeTab, fetchSubmissions]);

    // Initial fetch
    useEffect(() => {
        if (user && user.email === ADMIN_EMAIL) {
            fetchData();
        }
    }, [user, fetchData]);

    // Realtime subscriptions for Admin
    useEffect(() => {
        if (!user || user.email !== ADMIN_EMAIL) return;

        const supabase = getSupabase();
        const channel = (supabase as any)
            .channel('admin-dashboard-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'user_profiles' }, () => {
                console.log('Realtime change: user_profiles');
                fetchData();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, () => {
                console.log('Realtime change: user_roles');
                fetchData();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'user_courses' }, () => {
                console.log('Realtime change: user_courses');
                fetchData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, fetchData]);

    // Poll for login notifications every 30 seconds
    useEffect(() => {
        if (user?.email === ADMIN_EMAIL) {
            const interval = setInterval(fetchLoginNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user, fetchLoginNotifications]);

    async function addRole(userId: string, role: UserRole) {
        const user = users.find(u => u.id === userId);
        const userEmail = user?.email;

        // Check if user already has this role
        if (user?.roles.includes(role)) {
            alert(`User already has the ${role} role`);
            return;
        }

        // Ensure user_profile exists
        const profileResponse = await fetch("/api/admin/profiles", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, email: userEmail })
        });

        if (!profileResponse.ok) {
            const errorData = await profileResponse.json();
            alert("Error creating user profile: " + (errorData.details || errorData.error));
            return;
        }

        // Add role via API
        const response = await fetch("/api/admin/roles", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, role })
        });

        if (response.ok) {
            await fetchData();
            setShowRoleModal(false);
        } else {
            const errorData = await response.json();
            alert("Error adding role: " + (errorData.details || errorData.error));
        }
    }

    async function removeRole(userId: string, role: UserRole) {
        const response = await fetch("/api/admin/roles", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, role })
        });

        if (response.ok) {
            await fetchData();
        } else {
            const errorData = await response.json();
            alert("Error removing role: " + (errorData.details || errorData.error));
        }
    }


    async function assignCourse(userId: string, courseId: string, role: UserRole) {
        const user = users.find(u => u.id === userId);
        const userEmail = user?.email;
        const course = courses.find(c => c.id === courseId);

        // Check if user already has this course with this role
        const alreadyAssigned = user?.courses.some(c => c.id === courseId);
        if (alreadyAssigned) {
            alert(`User already has ${course?.title || 'this course'} assigned`);
            return;
        }

        // Ensure profile exists
        const profileResponse = await fetch("/api/admin/profiles", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, email: userEmail })
        });

        if (!profileResponse.ok) {
            const errorData = await profileResponse.json();
            alert("Error creating user profile: " + (errorData.details || errorData.error));
            return;
        }

        // Assign course via API
        const response = await fetch("/api/admin/courses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId,
                courseId,
                role,
                userEmail,
                courseTitle: course?.title
            })
        });

        if (response.ok) {
            console.log("Successfully assigned course");
            await fetchData();
            setShowCourseModal(false);
            setSelectedCourse("");
        } else {
            const errorData = await response.json();
            alert("Error assigning course: " + (errorData.details || errorData.error));
        }
    }

    async function removeCourse(userId: string, courseId: string) {
        const response = await fetch("/api/admin/courses", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, courseId })
        });

        if (response.ok) {
            await fetchData();
        } else {
            const errorData = await response.json();
            alert("Error removing course: " + (errorData.details || errorData.error));
        }
    }

    function formatTimeAgo(timestamp: string) {
        if (!timestamp) return "Never";

        const now = new Date().getTime();
        const then = new Date(timestamp).getTime();
        const diff = now - then;

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        return `${days} day${days > 1 ? 's' : ''} ago`;
    }

    if (loading || loadingData) {
        return (
            <div className="admin-wrapper">
                <div className="admin-loading">Loading admin panel...</div>
            </div>
        );
    }

    if (!user || user.email !== ADMIN_EMAIL) {
        return null;
    }

    const selectedUserData = users.find(u => u.id === selectedUser);

    return (
        <div className="admin-wrapper">
            <header className="admin-header">
                <h1>Admin Panel</h1>
                <TransitionLink href="/lms" className="admin-back-link">
                    Back to Courses
                </TransitionLink>
            </header>

            {/* Tabs */}
            <div className="admin-tabs">
                <button
                    className={`admin-tab ${activeTab === "users" ? "active" : ""}`}
                    onClick={() => setActiveTab("users")}
                >
                    All Users ({users.length})
                </button>
                <button
                    className={`admin-tab ${activeTab === "assign" ? "active" : ""}`}
                    onClick={() => setActiveTab("assign")}
                >
                    Assign Roles & Courses
                </button>
                <button
                    className={`admin-tab ${activeTab === "notifications" ? "active" : ""}`}
                    onClick={() => setActiveTab("notifications")}
                >
                    Login Activity ({loginNotifications.length})
                </button>
                <button
                    className={`admin-tab ${activeTab === "submissions" ? "active" : ""}`}
                    onClick={() => setActiveTab("submissions")}
                >
                    Student Submissions ({submissions.length})
                </button>
            </div>

            <div className="admin-content">
                {error && (
                    <div className="admin-error-message">
                        {error}
                    </div>
                )}

                {activeTab === "users" && (
                    <>
                        <div className="admin-stats">
                            <div className="admin-stat-card">
                                <h3>Total Users</h3>
                                <p className="admin-stat-number">{users.length}</p>
                            </div>
                            <div className="admin-stat-card">
                                <h3>Available Courses</h3>
                                <p className="admin-stat-number">{courses.length}</p>
                            </div>
                        </div>

                        <div className="admin-users-section">
                            <h2>All Registered Users</h2>
                            {users.length === 0 ? (
                                <p className="admin-empty-state">No users found. Users will appear after they sign up.</p>
                            ) : (
                                <div className="admin-users-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Email</th>
                                                <th>Name</th>
                                                <th>Roles</th>
                                                <th>Courses</th>
                                                <th>Last Login</th>
                                                <th>Joined</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map((u) => (
                                                <tr key={u.id}>
                                                    <td>{u.email}</td>
                                                    <td>{u.full_name || "-"}</td>
                                                    <td>
                                                        <div className="admin-roles-list">
                                                            {u.roles.length > 0 ? (
                                                                u.roles.map((role, idx) => (
                                                                    <span key={role + idx} className="admin-role-badge">
                                                                        {role}
                                                                        <button
                                                                            className="admin-role-remove"
                                                                            onClick={() => removeRole(u.id, role)}
                                                                            title="Remove role"
                                                                        >
                                                                            ×
                                                                        </button>
                                                                    </span>
                                                                ))
                                                            ) : (
                                                                <span className="admin-empty">No roles</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="admin-sections-list">
                                                            {u.courses.length > 0 && u.courses.map((course, idx) => (
                                                                <span key={course.id || idx} className="admin-section-badge" style={{ background: '#e0f2fe' }}>
                                                                    {course.title || 'Untitled'}
                                                                    <button
                                                                        className="admin-section-remove"
                                                                        onClick={() => removeCourse(u.id, course.id)}
                                                                        title="Remove course"
                                                                    >
                                                                        ×
                                                                    </button>
                                                                </span>
                                                            ))}
                                                            {u.courses.length === 0 && (
                                                                <span className="admin-empty">None</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>{formatTimeAgo(u.last_sign_in_at || "")}</td>
                                                    <td>{new Date(u.created_at).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {activeTab === "assign" && (
                    <div className="admin-assign-section">
                        <h2>Assign Roles & Courses to Users</h2>
                        {users.length === 0 ? (
                            <p className="admin-empty-state">No users available to assign roles or courses.</p>
                        ) : (
                            <div className="admin-assign-grid">
                                {users.map((u) => (
                                    <div key={u.id} className="admin-assign-card">
                                        <div className="admin-assign-card-header">
                                            <h3>{u.email}</h3>
                                            <p className="admin-assign-name">{u.full_name || "No name set"}</p>
                                        </div>
                                        <div className="admin-assign-card-body">
                                            <div className="admin-assign-section">
                                                <h4>Current Roles:</h4>
                                                <div className="admin-roles-list">
                                                    {u.roles.length > 0 ? (
                                                        u.roles.map((role, idx) => (
                                                            <span key={role + idx} className="admin-role-badge">
                                                                {role}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="admin-empty">None</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="admin-assign-section">
                                                <h4>Current Courses:</h4>
                                                <div className="admin-sections-list">
                                                    {u.courses.length > 0 && u.courses.map((course, idx) => (
                                                        <span key={course.id || idx} className="admin-section-badge" style={{ background: '#e0f2fe' }}>
                                                            {course.title || 'Untitled'}
                                                        </span>
                                                    ))}
                                                    {u.courses.length === 0 && (
                                                        <span className="admin-empty">None</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="admin-assign-card-actions">
                                            <button
                                                className="admin-action-btn"
                                                onClick={() => {
                                                    setSelectedUser(u.id);
                                                    setShowRoleModal(true);
                                                }}
                                            >
                                                Add Role
                                            </button>
                                            <button
                                                className="admin-action-btn"
                                                onClick={() => {
                                                    setSelectedUser(u.id);
                                                    setSelectedCourse("");
                                                    setSelectedCourseRole("student");
                                                    setShowCourseModal(true);
                                                }}
                                            >
                                                Assign Course
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Role Modal */}
                {showRoleModal && selectedUserData && (
                    <div className="admin-modal-overlay" onClick={() => setShowRoleModal(false)}>
                        <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                            <h3>Add Role to {selectedUserData.email}</h3>
                            <div className="admin-modal-content">
                                <label>Select Role:</label>
                                <select
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                                    className="admin-select"
                                >
                                    <option value="student">Student</option>
                                    <option value="teacher">Teacher</option>
                                    <option value="teacher_assistant">Teacher Assistant</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="admin-modal-actions">
                                <button
                                    className="admin-modal-btn admin-modal-btn-primary"
                                    onClick={() => addRole(selectedUser!, selectedRole)}
                                >
                                    Add Role
                                </button>
                                <button
                                    className="admin-modal-btn admin-modal-btn-secondary"
                                    onClick={() => setShowRoleModal(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Course Modal */}
                {showCourseModal && selectedUserData && (
                    <div className="admin-modal-overlay" onClick={() => setShowCourseModal(false)}>
                        <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                            <h3>Assign Course to {selectedUserData.email}</h3>
                            <div className="admin-modal-content">
                                <label>Select Course:</label>
                                <select
                                    value={selectedCourse}
                                    onChange={(e) => setSelectedCourse(e.target.value)}
                                    className="admin-select"
                                >
                                    <option value="">Choose a course...</option>
                                    {courses.map(course => (
                                        <option key={course.id} value={course.id}>
                                            {course.title}
                                        </option>
                                    ))}
                                </select>

                                <label>Role in Course:</label>
                                <select
                                    value={selectedCourseRole}
                                    onChange={(e) => setSelectedCourseRole(e.target.value as UserRole)}
                                    className="admin-select"
                                >
                                    <option value="student">Student</option>
                                    <option value="teacher">Teacher</option>
                                    <option value="teacher_assistant">Teacher Assistant</option>
                                </select>
                            </div>
                            <div className="admin-modal-actions">
                                <button
                                    className="admin-modal-btn admin-modal-btn-primary"
                                    onClick={() => assignCourse(selectedUser!, selectedCourse, selectedCourseRole)}
                                    disabled={!selectedCourse}
                                >
                                    Assign Course
                                </button>
                                <button
                                    className="admin-modal-btn admin-modal-btn-secondary"
                                    onClick={() => {
                                        setShowCourseModal(false);
                                        setSelectedCourse("");
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            );
}