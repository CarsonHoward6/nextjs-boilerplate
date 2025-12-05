"use client";
import { useState } from "react";
import { getSupabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLoading } from "@/app/context/LoadingContext";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();
    const { startLoading, stopLoading } = useLoading();

    async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const supabase = getSupabase();
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
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
                await supabase.from("user_profiles").insert({
                    id: data.user.id,
                    email: data.user.email || email,
                    username: data.user.user_metadata?.username || email.split("@")[0],
                    first_name: data.user.user_metadata?.first_name || null,
                    last_name: data.user.user_metadata?.last_name || null,
                    full_name: data.user.user_metadata?.full_name || null
                });
            }

            // Create login notification for user
            await supabase.from("notifications").insert({
                user_id: data.user.id,
                message: `You logged in successfully`,
                notification_type: "login"
            });

            startLoading();
            setTimeout(() => {
                router.push("/welcome");
                setTimeout(() => stopLoading(), 1000);
            }, 50);
        }
    }

    return (
        <div className="auth-container">
            <h1 className="auth-title">Login</h1>

            <form className="auth-form" onSubmit={handleLogin}>
                <input
                    className="auth-input"
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
