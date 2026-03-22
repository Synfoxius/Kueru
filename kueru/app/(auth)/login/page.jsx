"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginWithEmail, loginWithGoogle } from "@/lib/firebase/auth";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [remember, setRemember] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await loginWithEmail(email, password);
            router.push("/feed");
        } catch (err) {
            setError("Invalid email or password. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = async () => {
        setError("");
        try {
            await loginWithGoogle();
            router.push("/feed");
        } catch (err) {
            setError("Google sign-in failed. Please try again.");
        }
    };

    return (
        <div style={{ display: "flex", height: "100vh", fontFamily: "sans-serif" }}>

            {/* LEFT PANEL — orange branding side */}
            <div style={{
                flex: 1,
                backgroundColor: "#C8522A",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                position: "relative",
                overflow: "hidden",
            }}>
                {/* Decorative circles */}
                <div style={{
                    position: "absolute", top: -60, right: -60,
                    width: 200, height: 200, borderRadius: "50%",
                    backgroundColor: "rgba(255,255,255,0.1)"
                }} />
                <div style={{
                    position: "absolute", bottom: -80, left: -80,
                    width: 250, height: 250, borderRadius: "50%",
                    backgroundColor: "rgba(255,255,255,0.07)"
                }} />

                {/* Logo */}
                <div style={{ textAlign: "center", zIndex: 1 }}>
                    <div style={{
                        fontSize: 80, marginBottom: 8,
                        filter: "drop-shadow(0px 4px 6px rgba(0,0,0,0.2))"
                    }}>🍜</div>
                    <div style={{ fontSize: 28, fontWeight: "bold", letterSpacing: 2 }}>食える</div>
                    <div style={{ fontSize: 22, fontWeight: "600", marginTop: 4 }}>kueru</div>
                    <p style={{ marginTop: 24, fontSize: 14, opacity: 0.85 }}>
                        Share your culinary adventures
                    </p>
                </div>
            </div>

            {/* RIGHT PANEL — login form */}
            <div style={{
                flex: 1,
                backgroundColor: "#F5F0EB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px",
            }}>
                <div style={{ width: "100%", maxWidth: 420 }}>
                    <h1 style={{ fontSize: 32, fontWeight: "800", marginBottom: 8, color: "#1a1a1a" }}>
                        Welcome Back
                    </h1>
                    <p style={{ color: "#666", marginBottom: 36, fontSize: 15 }}>
                        Log in to continue sharing and discovering amazing recipes
                    </p>

                    {/* Error message */}
                    {error && (
                        <div style={{
                            backgroundColor: "#fee2e2", color: "#b91c1c",
                            padding: "10px 14px", borderRadius: 8,
                            marginBottom: 20, fontSize: 14
                        }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin}>
                        {/* Email field */}
                        <label style={{ fontSize: 14, fontWeight: "600", color: "#333" }}>
                            Email Address
                        </label>
                        <div style={{
                            display: "flex", alignItems: "center",
                            border: "1.5px solid #C8522A", borderRadius: 10,
                            backgroundColor: "white", padding: "12px 14px",
                            marginTop: 8, marginBottom: 20, gap: 10,
                        }}>
                            <span style={{ fontSize: 18 }}>✉️</span>
                            <input
                                type="email"
                                placeholder="your.email@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{
                                    border: "none", outline: "none",
                                    backgroundColor: "transparent",
                                    fontSize: 15, flex: 1, color: "#333"
                                }}
                            />
                        </div>

                        {/* Password field */}
                        <label style={{ fontSize: 14, fontWeight: "600", color: "#333" }}>
                            Password
                        </label>
                        <div style={{
                            display: "flex", alignItems: "center",
                            border: "1.5px solid #C8522A", borderRadius: 10,
                            backgroundColor: "white", padding: "12px 14px",
                            marginTop: 8, marginBottom: 16, gap: 10,
                        }}>
                            <span style={{ fontSize: 18 }}>🔒</span>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{
                                    border: "none", outline: "none",
                                    backgroundColor: "transparent",
                                    fontSize: 15, flex: 1, color: "#333"
                                }}
                            />
                            <span
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ cursor: "pointer", fontSize: 18, opacity: 0.6 }}
                            >
                                {showPassword ? "🙈" : "👁️"}
                            </span>
                        </div>

                        {/* Remember me + Forgot password */}
                        <div style={{
                            display: "flex", justifyContent: "space-between",
                            alignItems: "center", marginBottom: 28
                        }}>
                            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
                                <input
                                    type="checkbox"
                                    checked={remember}
                                    onChange={(e) => setRemember(e.target.checked)}
                                />
                                Remember me
                            </label>
                            <a href="/forgot-password" style={{ color: "#C8522A", fontSize: 14, textDecoration: "none", fontWeight: "500" }}>
                                Forgot password?
                            </a>
                        </div>

                        {/* Login button */}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: "100%", padding: "15px",
                                backgroundColor: loading ? "#e0956e" : "#C8522A",
                                color: "white", border: "none",
                                borderRadius: 10, fontSize: 16,
                                fontWeight: "700", cursor: loading ? "not-allowed" : "pointer",
                                marginBottom: 24,
                            }}
                        >
                            {loading ? "Logging in..." : "Log In"}
                        </button>
                    </form>

                    {/* OR divider */}
                    <div style={{
                        display: "flex", alignItems: "center", gap: 12, marginBottom: 24
                    }}>
                        <div style={{ flex: 1, height: 1, backgroundColor: "#ccc" }} />
                        <span style={{ color: "#999", fontSize: 14 }}>OR</span>
                        <div style={{ flex: 1, height: 1, backgroundColor: "#ccc" }} />
                    </div>

                    {/* Google button */}
                    <button
                        onClick={handleGoogle}
                        style={{
                            width: "100%", padding: "15px",
                            backgroundColor: "transparent",
                            border: "1.5px solid #C8522A",
                            borderRadius: 10, fontSize: 15,
                            fontWeight: "600", cursor: "pointer",
                            color: "#333", marginBottom: 32,
                        }}
                    >
                        Continue with Google
                    </button>

                    {/* Sign up link */}
                    <p style={{ textAlign: "center", fontSize: 14, color: "#666" }}>
                        Don't have an account?{" "}
                        <a href="/register" style={{ color: "#C8522A", fontWeight: "600", textDecoration: "none" }}>
                            Sign Up
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}