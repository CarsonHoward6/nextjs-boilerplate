"use client";
import { useState } from "react";
import { getSupabase } from "@/lib/supabase";
import Link from "next/link";

export default function SignupPage() {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");

    async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");

        // Validation
        if (!firstName || !lastName || !username || !email || !password || !confirmPassword) {
            setError("All fields are required");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        if (username.length < 3) {
            setError("Username must be at least 3 characters");
            return;
        }

        const supabase = getSupabase();

        // Sign up user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    first_name: firstName,
                    last_name: lastName,
                    username: username,
                    full_name: `${firstName} ${lastName}`
                }
            }
        });

        if (authError) {
            setError(authError.message);
            return;
        }

        if (authData.user) {
            // Create user profile
            const { error: profileError } = await supabase
                .from("user_profiles")
                .insert({
                    id: authData.user.id,
                    email: email,
                    username: username,
                    first_name: firstName,
                    last_name: lastName,
                    full_name: `${firstName} ${lastName}`
                });

            if (profileError) {
                console.error("Profile creation error:", profileError);
            }
        }

        alert("Account created! Check your email to verify your account.");
    }

    return (
        <div className="auth-container">
            <h1 className="auth-title">Create Account</h1>

            {error && (
                <div style={{
                    padding: "12px",
                    background: "#fee",
                    border: "1px solid #c33",
                    borderRadius: "8px",
                    color: "#c33",
                    marginBottom: "16px",
                    textAlign: "center"
                }}>
                    {error}
                </div>
            )}

            <form className="auth-form" onSubmit={handleSignup}>
                <input
                    className="auth-input"
                    type="text"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                />

                <input
                    className="auth-input"
                    type="text"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                />

                <input
                    className="auth-input"
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />

                <input
                    className="auth-input"
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <input
                    className="auth-input"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <input
                    className="auth-input"
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
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



