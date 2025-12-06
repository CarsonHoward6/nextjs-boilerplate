"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { getSupabase } from "@/lib/supabase";

export default function WelcomePage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [firstName, setFirstName] = useState<string | null>(null);
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.replace("/login");
            return;
        }

        if (user) {
            // Fetch user's first name
            const fetchUserName = async () => {
                const supabase = getSupabase();
                const { data: profileData } = await supabase
                    .from("user_profiles")
                    .select("first_name, username")
                    .eq("id", user.id)
                    .maybeSingle() as { data: { first_name?: string; username?: string } | null };

                const name = profileData?.first_name || profileData?.username || user.email?.split("@")[0] || "User";
                setFirstName(name);

                // Trigger animation
                setTimeout(() => setShow(true), 100);

                // Redirect to LMS after 3 seconds
                setTimeout(() => {
                    router.push("/lms");
                }, 3000);
            };

            fetchUserName();
        }
    }, [user, loading, router]);

    if (loading || !firstName) {
        return (
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100vh",
                background: "linear-gradient(135deg, #5f7a39 0%, #4b5e2e 100%)"
            }}>
                <div style={{
                    width: "48px",
                    height: "48px",
                    border: "4px solid rgba(255,255,255,0.3)",
                    borderTop: "4px solid white",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite"
                }} />
                <style jsx>{`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            background: "linear-gradient(135deg, #5f7a39 0%, #4b5e2e 100%)",
            padding: "20px",
            overflow: "hidden",
            position: "relative"
        }}>
            {/* Animated background circles */}
            <div style={{
                position: "absolute",
                width: "300px",
                height: "300px",
                background: "rgba(255, 255, 255, 0.1)",
                borderRadius: "50%",
                top: "-150px",
                left: "-150px",
                animation: "float 6s ease-in-out infinite"
            }} />
            <div style={{
                position: "absolute",
                width: "400px",
                height: "400px",
                background: "rgba(255, 255, 255, 0.1)",
                borderRadius: "50%",
                bottom: "-200px",
                right: "-200px",
                animation: "float 8s ease-in-out infinite reverse"
            }} />

            <div style={{
                textAlign: "center",
                position: "relative",
                zIndex: 10,
                opacity: show ? 1 : 0,
                transform: show ? "scale(1) translateY(0)" : "scale(0.9) translateY(20px)",
                transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)"
            }}>
                {/* Welcome Icon */}
                <div style={{
                    width: "120px",
                    height: "120px",
                    background: "rgba(255, 255, 255, 0.2)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 32px",
                    backdropFilter: "blur(10px)",
                    border: "2px solid rgba(255, 255, 255, 0.3)",
                    animation: show ? "pulse 2s ease-in-out infinite" : "none"
                }}>
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                </div>

                {/* Welcome Text */}
                <h1 style={{
                    fontSize: "clamp(32px, 8vw, 64px)",
                    fontWeight: "700",
                    color: "white",
                    marginBottom: "16px",
                    letterSpacing: "-0.02em",
                    textShadow: "0 4px 20px rgba(0, 0, 0, 0.2)"
                }}>
                    Welcome back,
                </h1>
                <h2 style={{
                    fontSize: "clamp(28px, 7vw, 56px)",
                    fontWeight: "700",
                    color: "white",
                    marginBottom: "32px",
                    letterSpacing: "-0.02em)",
                    textShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
                    background: "linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text"
                }}>
                    {firstName}!
                </h2>

                {/* Loading dots */}
                <div style={{
                    display: "flex",
                    gap: "8px",
                    justifyContent: "center",
                    marginTop: "40px"
                }}>
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            style={{
                                width: "12px",
                                height: "12px",
                                background: "rgba(255, 255, 255, 0.8)",
                                borderRadius: "50%",
                                animation: `bounce 1.4s ease-in-out ${i * 0.2}s infinite`
                            }}
                        />
                    ))}
                </div>
                <p style={{
                    color: "rgba(255, 255, 255, 0.9)",
                    fontSize: "16px",
                    marginTop: "16px",
                    fontWeight: "500"
                }}>
                    Loading your dashboard...
                </p>
            </div>

            <style jsx>{`
                @keyframes float {
                    0%, 100% {
                        transform: translateY(0) scale(1);
                    }
                    50% {
                        transform: translateY(-20px) scale(1.05);
                    }
                }

                @keyframes pulse {
                    0%, 100% {
                        transform: scale(1);
                        box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4);
                    }
                    50% {
                        transform: scale(1.05);
                        box-shadow: 0 0 0 20px rgba(255, 255, 255, 0);
                    }
                }

                @keyframes bounce {
                    0%, 80%, 100% {
                        transform: translateY(0);
                    }
                    40% {
                        transform: translateY(-12px);
                    }
                }
            `}</style>
        </div>
    );
}
