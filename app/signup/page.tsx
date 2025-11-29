"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function SignupPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    async function handleSignup(e) {
        e.preventDefault();
        const { error } = await supabase.auth.signUp({
            email,
            password,
        });
        if (error) alert(error.message);
        else alert("Check your email to confirm your account.");
    }

    return (
        <div className="auth-container">
            <h1 className="auth-title">Create Account</h1>

            <form className="auth-form" onSubmit={handleSignup}>
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
                    Sign Up
                </button>
            </form>

            <p className="auth-link">
                Already have an account? <Link href="/login">Login</Link>
            </p>
        </div>
    );
}



