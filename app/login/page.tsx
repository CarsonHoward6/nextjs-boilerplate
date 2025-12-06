"use client";
import { useState } from "react";
import { getSupabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLoading } from "@/app/context/LoadingContext";

export default function LoginPage() {
    const [emailOrUsername, setEmailOrUsername] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();
    const { startLoading, stopLoading } = useLoading();

    async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const supabase = getSupabase();

        // Check if input is email or username
        let loginEmail = emailOrUsername;

        // If not an email (no @ symbol), treat as username and lookup email
        if (!emailOrUsername.includes("@")) {
            const { data: profileData } = await supabase
                .from("user_profiles")
                .select("email")
                .eq("username", emailOrUsername)
                .maybeSingle() as { data: { email: string } | null };

            if (!profileData) {
                alert("Username not found. Please check your username or use your email address.");
                return;
            }

            loginEmail = profileData.email;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email: loginEmail,
            password,
        });
        if (error) {
            alert(error.message);
        } else if (data.user && !data.user.email_confirmed_at) {
            alert("Please verify your email before logging in. Check your inbox for the confirmation link.");
        } else if (data.user) {
            // Ensure user profile exists
            const { data: existingProfile } = await supabase
                .from("user_profiles")
                .select("*")
                .eq("id", data.user.id)
                .maybeSingle();

            if (!existingProfile) {
                // Create profile if it doesn't exist
                await (supabase.from("user_profiles") as any).insert({
                    id: data.user.id,
                    email: data.user.email || loginEmail,
                    username: data.user.user_metadata?.username || loginEmail.split("@")[0],
                    first_name: data.user.user_metadata?.first_name || null,
                    last_name: data.user.user_metadata?.last_name || null,
                    full_name: data.user.user_metadata?.full_name || null
                });
            }

            // Create login notification for user
            await (supabase.from("notifications") as any).insert({
                user_id: data.user.id,
                message: `You logged in successfully`,
                notification_type: "login"
            });

            router.push("/welcome");
        }
    }

    return (
        <div className="auth-container">
            <h1 className="auth-title">Login</h1>

            <form className="auth-form" onSubmit={handleLogin}>
                <input
                    className="auth-input"
                    type="text"
                    placeholder="Email or Username"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                />

                <input
                    className="auth-input"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button className="auth-btn" type="submit">
                    Login
                </button>
            </form>

            <p className="auth-link">
                Don’t have an account? <Link href="/signup">Sign up</Link>
            </p>
        </div>
    );
}
