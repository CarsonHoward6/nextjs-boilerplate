"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const settingsLinks = [
    {
        href: "/settings/account",
        label: "Account Information",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
            </svg>
        )
    },
    {
        href: "/settings/email",
        label: "Change Email",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
            </svg>
        )
    },
    {
        href: "/settings/password",
        label: "Change Password",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
        )
    },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.replace("/login");
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="settings-wrapper">
                <header className="settings-header">
                    <h1>Settings</h1>
                </header>
                <div className="settings-layout">
                    <div className="settings-loading">
                        <p>Loading...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="settings-wrapper">
            <header className="settings-header">
                <h1>Settings</h1>
            </header>
            <div className="settings-layout">
                <aside className="settings-sidebar">
                    <nav className="settings-nav">
                        {settingsLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`settings-nav-item ${pathname === link.href ? "active" : ""}`}
                            >
                                <span className="settings-nav-icon">{link.icon}</span>
                                <span className="settings-nav-label">{link.label}</span>
                            </Link>
                        ))}
                    </nav>
                </aside>
                <main className="settings-content">
                    {children}
                </main>
            </div>
        </div>
    );
}
