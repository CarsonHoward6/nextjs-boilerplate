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
    const [showSectionModal, setShowSectionModal] = useState(false);
    const [selectedRole, setSelectedRole] = useState<UserRole>("student");
    const [selectedSection, setSelectedSection] = useState<string>("");
    const [selectedSectionRole, setSelectedSectionRole] = useState<UserRole>("student");
    const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
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

            // Fetch ALL auth users via API route
            const response = await fetch("/api/admin/users");
            const data = await response.json();

            if (!response.ok || data.error) {
                console.error("Error fetching auth users:", data.error);
                setError("Failed to load users from authentication system");
                setUsers([]);
            } else if (data.users) {
                interface AuthUser {
                    id: string;
                    email?: string;
                    created_at: string;
                    last_sign_in_at?: string;
                }

                // Process all authenticated users
                const usersWithDetails = await Promise.all(
                    data.users.map(async (authUser: AuthUser) => {
                        // Get profile if exists
                        const { data: profile } = await supabase
                            .from("user_profiles")
                            .select("full_name")
                            .eq("id", authUser.id)
                            .maybeSingle() as { data: { full_name: string | null } | null };

                        // Get roles
                        const { data: rolesData } = await supabase
                            .from("user_roles")
                            .select("role")
                            .eq("user_id", authUser.id) as { data: { role: string }[] | null };

                        // Get sections
                        interface SectionWithCourse {
                            section_id: string;
                            section: {
                                id: string;
                                title: string;
                                course: {
                                    title: string;
                                }[];
                            }[];
                        }

                        const { data: sectionsData } = await supabase
                            .from("user_sections")
                            .select(`
                                section_id,
                                section:section_id (
                                    id,
                                    title,
                                    course:course_id (
                                        title
                                    )
                                )
                            `)
                            .eq("user_id", authUser.id) as { data: SectionWithCourse[] | null };

                        // Fetch course assignments (without sections)
                        interface CourseAssignment {
                            course_id: string;
                            course: {
                                id: string;
                                title: string;
                            }[];
                        }

                        const { data: coursesData } = await supabase
                            .from("user_courses")
                            .select(`
                                course_id,
                                course:course_id (
                                    id,
                                    title
                                )
                            `)
                            .eq("user_id", authUser.id) as { data: CourseAssignment[] | null };

                        return {
                            id: authUser.id,
                            email: authUser.email || "No email",
                            full_name: profile?.full_name || null,
                            created_at: authUser.created_at,
                            last_sign_in_at: authUser.last_sign_in_at,
                            roles: rolesData?.map(r => r.role) || [],
                            sections: sectionsData?.map(s => {
                                const section = Array.isArray(s.section) ? s.section[0] : s.section;
                                const course = section?.course ? (Array.isArray(section.course) ? section.course[0] : section.course) : null;
                                return {
                                    id: section?.id || "",
                                    title: section?.title || "",
                                    course: course?.title || ""
                                };
                            }).filter(s => s.id) || [],
                            courses: coursesData?.map(c => {
                                const course = Array.isArray(c.course) ? c.course[0] : c.course;
                                return {
                                    id: course?.id || "",
                                    title: course?.title || ""
                                };
                            }).filter(c => c.id) || []
                        };
                    })
                );

                // Sort by most recent first
                usersWithDetails.sort((a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );

                setUsers(usersWithDetails);
            }

            // Fetch courses from database
            const { data: coursesData, error: coursesError } = await supabase
                .from("course")
                .select("id, title")
                .order("title", { ascending: true });

            if (coursesError) {
                console.error("Error fetching courses:", coursesError);
                setError("Failed to load courses. Make sure to run: npx tsx scripts/seed-course-sections.ts");
            }
            setCourses(coursesData || []);

            // Fetch sections from database (course pages stored as sections)
            const { data: sectionsData, error: sectionsError } = await supabase
                .from("section")
                .select("id, title, course_id, year, semester")
                .order("course_id", { ascending: true });

            if (sectionsError) {
                console.error("Error fetching sections:", sectionsError);
                setError("Failed to load course sections. Make sure to run: npx tsx scripts/seed-course-sections.ts");
            }
            setSections(sectionsData || []);

            // Fetch login notifications
            await fetchLoginNotifications();

            // Fetch submissions if on submissions tab
            if (activeTab === 'submissions') {
                await fetchSubmissions();
            }

        } catch (err) {
            console.error("Error in fetchData:", err);
            setError("Error loading data. Please check console for details.");
        }

        setLoadingData(false);
    }, [fetchLoginNotifications, activeTab, fetchSubmissions]);

    // Fetch all data
    useEffect(() => {
        if (user?.email === ADMIN_EMAIL) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            fetchData();
        }
    }, [user, fetchData, ADMIN_EMAIL]);

    // Poll for login notifications every 30 seconds
    useEffect(() => {
        if (user?.email === ADMIN_EMAIL) {
            const interval = setInterval(fetchLoginNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user, fetchLoginNotifications, ADMIN_EMAIL]);

    async function addRole(userId: string, role: UserRole) {
        const userEmail = users.find(u => u.id === userId)?.email;

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

    async function assignSection(userId: string, sectionId: string, role: UserRole) {
        console.log("Assigning section:", { userId, sectionId, role });

        const userEmail = users.find(u => u.id === userId)?.email;

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

        // Get section and course details for notification
        const section = sections.find(s => s.id === sectionId);
        const course = courses.find(c => c.id === section?.course_id);

        // Assign section via API (which also handles notifications)
        const response = await fetch("/api/admin/sections", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId,
                sectionId,
                role,
                userEmail,
                sectionTitle: section?.title,
                courseTitle: course?.title
            })
        });

        if (response.ok) {
            console.log("Successfully assigned section");
            await fetchData();
            setShowSectionModal(false);
            setSelectedSection("");
            setSelectedCourse(null);
        } else {
            const errorData = await response.json();
            alert("Error assigning section: " + (errorData.details || errorData.error));
        }
    }

    async function removeSection(userId: string, sectionId: string) {
        const response = await fetch("/api/admin/sections", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, sectionId })
        });

        if (response.ok) {
            await fetchData();
        } else {
            const errorData = await response.json();
            alert("Error removing section: " + (errorData.details || errorData.error));
        }
    }

    async function assignCourse(userId: string, courseId: string, role: UserRole) {
        const userEmail = users.find(u => u.id === userId)?.email;
        const course = courses.find(c => c.id === courseId);

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
            setShowSectionModal(false);
            setSelectedSection("");
            setSelectedCourse(null);
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
                            <div className="admin-stat-card">
                                <h3>Course Sections</h3>
                                <p className="admin-stat-number">{sections.length}</p>
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
                                                <th>Sections</th>
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
                                                                u.roles.map(role => (
                                                                    <span key={role} className="admin-role-badge">
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
                                                            {u.courses.length > 0 && u.courses.map(course => (
                                                                <span key={course.id} className="admin-section-badge" style={{ background: '#e0f2fe' }}>
                                                                    {course.title} (Course)
                                                                    <button
                                                                        className="admin-section-remove"
                                                                        onClick={() => removeCourse(u.id, course.id)}
                                                                        title="Remove course"
                                                                    >
                                                                        ×
                                                                    </button>
                                                                </span>
                                                            ))}
                                                            {u.sections.length > 0 && u.sections.map(section => (
                                                                <span key={section.id} className="admin-section-badge">
                                                                    {section.course} - {section.title}
                                                                    <button
                                                                        className="admin-section-remove"
                                                                        onClick={() => removeSection(u.id, section.id)}
                                                                        title="Remove section"
                                                                    >
                                                                        ×
                                                                    </button>
                                                                </span>
                                                            ))}
                                                            {u.sections.length === 0 && u.courses.length === 0 && (
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
                                                        u.roles.map(role => (
                                                            <span key={role} className="admin-role-badge">
                                                                {role}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="admin-empty">None</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="admin-assign-section">
                                                <h4>Current Courses & Sections:</h4>
                                                <div className="admin-sections-list">
                                                    {u.courses.length > 0 && u.courses.map(course => (
                                                        <span key={course.id} className="admin-section-badge" style={{ background: '#e0f2fe' }}>
                                                            {course.title} (Course)
                                                        </span>
                                                    ))}
                                                    {u.sections.length > 0 && u.sections.map(section => (
                                                        <span key={section.id} className="admin-section-badge">
                                                            {section.course} - {section.title}
                                                        </span>
                                                    ))}
                                                    {u.sections.length === 0 && u.courses.length === 0 && (
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
                                                    setSelectedCourse(null);
                                                    setSelectedSection("");
                                                    setSelectedSectionRole("student");
                                                    setShowSectionModal(true);
                                                }}
                                            >
                                                Assign Section
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "notifications" && (
                    <div className="admin-notifications-section">
                        <h2>Recent Login Activity</h2>
                        {loginNotifications.length === 0 ? (
                            <p className="admin-empty-state">No login activity to display yet.</p>
                        ) : (
                            <div className="admin-notifications-list">
                                {loginNotifications.map((notification) => (
                                    <div key={notification.id} className="admin-notification-item">
                                        <div className="admin-notification-icon">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                <circle cx="12" cy="7" r="4" />
                                            </svg>
                                        </div>
                                        <div className="admin-notification-content">
                                            <p className="admin-notification-email">{notification.email}</p>
                                            <p className="admin-notification-time">
                                                Last login: {formatTimeAgo(notification.timestamp)}
                                                <span style={{ marginLeft: '8px', color: '#9ca3af' }}>
                                                    ({new Date(notification.timestamp).toLocaleString()})
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "submissions" && (
                    <div className="admin-users-section">
                        <h2>Student Assignment Submissions</h2>
                        <p style={{ marginBottom: "20px", color: "#6e6e73" }}>
                            All student submissions across all courses and assignments.
                        </p>
                        {loadingSubmissions ? (
                            <p className="admin-empty-state">Loading submissions...</p>
                        ) : submissions.length === 0 ? (
                            <p className="admin-empty-state">No submissions yet.</p>
                        ) : (
                            <div className="admin-users-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Student</th>
                                            <th>Course ID</th>
                                            <th>Assignment ID</th>
                                            <th>Problem ID</th>
                                            <th>Answer Preview</th>
                                            <th>Submitted</th>
                                            <th>Updated</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {submissions.map((sub) => (
                                            <tr key={sub.id}>
                                                <td>{sub.user_profiles?.username || sub.user_profiles?.email || sub.user_id}</td>
                                                <td>{sub.course_id}</td>
                                                <td>{sub.assignment_id}</td>
                                                <td>{sub.problem_id}</td>
                                                <td style={{ maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {sub.answer.substring(0, 50)}{sub.answer.length > 50 ? '...' : ''}
                                                </td>
                                                <td>{new Date(sub.submitted_at).toLocaleString()}</td>
                                                <td>{new Date(sub.updated_at).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

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

            {/* Section Modal */}
            {showSectionModal && selectedUserData && (
                <div className="admin-modal-overlay" onClick={() => setShowSectionModal(false)}>
                    <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Assign Section to {selectedUserData.email}</h3>
                        <div className="admin-modal-content">
                            <label>Step 1: Select Course:</label>
                            <select
                                value={selectedCourse || ""}
                                onChange={(e) => {
                                    setSelectedCourse(e.target.value || null);
                                    setSelectedSection(""); // Reset section when course changes
                                }}
                                className="admin-select"
                            >
                                <option value="">Choose a course first...</option>
                                {courses.map(course => (
                                    <option key={course.id} value={course.id}>
                                        {course.title}
                                    </option>
                                ))}
                            </select>

                            {selectedCourse && (
                                <>
                                    <label>Step 2: Select Section (Class):</label>
                                    {sections.filter(section => section.course_id === selectedCourse).length === 0 ? (
                                        <div style={{ padding: "12px", background: "#fef3c7", border: "1px solid #f59e0b", borderRadius: "8px", marginBottom: "12px" }}>
                                            <p style={{ margin: 0, fontSize: "14px", color: "#92400e" }}>
                                                No sections/classes available for this course. You need to create sections in the database first.
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <select
                                                value={selectedSection}
                                                onChange={(e) => setSelectedSection(e.target.value)}
                                                className="admin-select"
                                            >
                                                <option value="">Choose a section...</option>
                                                {sections
                                                    .filter(section => section.course_id === selectedCourse)
                                                    .map(section => (
                                                        <option key={section.id} value={section.id}>
                                                            {section.title} ({section.year} {section.semester})
                                                        </option>
                                                    ))}
                                            </select>

                                            <label>Role in Section:</label>
                                            <select
                                                value={selectedSectionRole}
                                                onChange={(e) => setSelectedSectionRole(e.target.value as UserRole)}
                                                className="admin-select"
                                            >
                                                <option value="student">Student</option>
                                                <option value="teacher">Teacher</option>
                                                <option value="teacher_assistant">Teacher Assistant</option>
                                            </select>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                        <div className="admin-modal-actions">
                            {selectedCourse && !selectedSection && (
                                <button
                                    className="admin-modal-btn admin-modal-btn-secondary"
                                    onClick={() => assignCourse(selectedUser!, selectedCourse, selectedSectionRole)}
                                    style={{ marginRight: '8px' }}
                                >
                                    Assign Course Only (No Section)
                                </button>
                            )}
                            <button
                                className="admin-modal-btn admin-modal-btn-primary"
                                onClick={() => assignSection(selectedUser!, selectedSection, selectedSectionRole)}
                                disabled={!selectedSection}
                            >
                                Assign Section
                            </button>
                            <button
                                className="admin-modal-btn admin-modal-btn-secondary"
                                onClick={() => {
                                    setShowSectionModal(false);
                                    setSelectedSection("");
                                    setSelectedCourse(null);
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