import { redirect } from "next/navigation";
import { getSession } from "@/lib/getSession";
import Link from "next/link";

export default async function Dashboard() {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    return (
        <div className="auth-container" style={{ maxWidth: 600 }}>
            <h1 className="auth-title">Dashboard</h1>
            <p className="dashboard-welcome">Welcome, {session.user.email}</p>

            <section className="dashboard-section">
                <h2 className="dashboard-heading">Your Learning Hub</h2>
                <p className="dashboard-text">
                    This is your personal dashboard where you can track your learning progress,
                    manage your account settings, and access all your enrolled courses.
                </p>
            </section>

            <section className="dashboard-section">
                <h2 className="dashboard-heading">Quick Actions</h2>
                <p className="dashboard-text">
                    Ready to continue learning? Head over to the LMS to pick up where you left off
                    or explore new subjects.
                </p>
                <Link href="/lms" className="auth-btn" style={{ display: "inline-block", textDecoration: "none", textAlign: "center" }}>
                    Home
                </Link>
            </section>

            <section className="dashboard-section">
                <h2 className="dashboard-heading">Account Information</h2>
                <p className="dashboard-text">
                    Your account is active and in good standing. You have full access to all
                    course materials and features.
                </p>
            </section>
        </div>
    );
}
