"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
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
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) {
            alert(error.message);
        } else {
            startLoading();
            setTimeout(() => {
                router.push("/lms");
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
