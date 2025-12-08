"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
    const router = useRouter();
    const [status, setStatus] = useState<"loading" | "verified" | "error">("loading");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleCallback = async () => {
            try {
                const supabase = getSupabase();

                // Get the auth code from the URL
                const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(
                    window.location.href
                );

                if (exchangeError) {
                    console.error("Error exchanging code:", exchangeError);
                    setError(exchangeError.message);
                    setStatus("error");
                    return;
                }

                if (data.user) {
                    setStatus("verified");
                }
            } catch (err) {
                console.error("Callback error:", err);
                setError(err instanceof Error ? err.message : "Unknown error");
                setStatus("error");
            }
        };

        handleCallback();
    }, [router]);

    return (
        <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            background: "#667eea"
        }}>
            <div style={{
                background: "white",
                borderRadius: "16px",
                padding: "48px",
                maxWidth: "500px",
                textAlign: "center",
                boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
            }}>
                {status === "loading" && (
                    <>
                        <div style={{
                            width: "60px",
                            height: "60px",
                            border: "4px solid #f3f3f3",
                            borderTop: "4px solid #667eea",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                            margin: "0 auto 24px"
                        }} />
                        <h1 style={{ fontSize: "24px", marginBottom: "12px", color: "#333" }}>
                            Verifying Email...
                        </h1>
                        <p style={{ color: "#666", fontSize: "16px" }}>
                            Please wait while we verify your email address.
                        </p>
                    </>
                )}

                {status === "verified" && (
                    <>
                        <div style={{
                            width: "80px",
                            height: "80px",
                            background: "#10b981",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 24px"
                        }}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                        <h1 style={{ fontSize: "32px", marginBottom: "12px", color: "#10b981", fontWeight: "700" }}>
                            Authorized
                        </h1>
                        <p style={{ color: "#666", fontSize: "18px", marginBottom: "24px" }}>
                            Your email has been successfully verified.
                        </p>
                        <button
                            onClick={() => router.push("/")}
                            style={{
                                padding: "12px 32px",
                                background: "#667eea",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                fontSize: "16px",
                                fontWeight: "600",
                                cursor: "pointer",
                                transition: "background 0.2s"
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = "#5568d3"}
                            onMouseOut={(e) => e.currentTarget.style.background = "#667eea"}
                        >
                            Continue Home
                        </button>
                    </>
                )}

                {status === "error" && (
                    <>
                        <div style={{
                            width: "80px",
                            height: "80px",
                            background: "#ef4444",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 24px"
                        }}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </div>
                        <h1 style={{ fontSize: "28px", marginBottom: "12px", color: "#ef4444" }}>
                            Verification Failed
                        </h1>
                        <p style={{ color: "#666", fontSize: "16px", marginBottom: "16px" }}>
                            {error || "Unable to verify your email. The link may have expired."}
                        </p>
                        <button
                            onClick={() => router.push("/signup")}
                            style={{
                                padding: "12px 24px",
                                background: "#667eea",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                fontSize: "16px",
                                fontWeight: "600",
                                cursor: "pointer"
                            }}
                        >
                            Back to Sign Up
                        </button>
                    </>
                )}
            </div>

            <style jsx>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
