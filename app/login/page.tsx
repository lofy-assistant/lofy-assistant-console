'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, Lock, User, AlertCircle } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [lofyId, setLofyId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        startTransition(async () => {
            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ lofy_id: lofyId, password }),
                });

                const data = await res.json();

                if (!res.ok) {
                    setError(data.error || 'An unexpected error occurred.');
                    return;
                }

                router.push('/dashboard');
                router.refresh();
            } catch {
                setError('Unable to connect. Please try again later.');
            }
        });
    };

    return (
        <div className="login-page">
            {/* Animated background */}
            <div className="login-bg">
                <div className="login-bg-orb login-bg-orb--1" />
                <div className="login-bg-orb login-bg-orb--2" />
                <div className="login-bg-orb login-bg-orb--3" />
                <div className="login-bg-grid" />
            </div>

            <div className="login-container">
                {/* Brand */}
                <div className="login-brand">
                    <div className="login-brand-icon">
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                            <rect width="32" height="32" rx="8" className="login-brand-bg" />
                            <path
                                d="M8 12L16 8L24 12V20L16 24L8 20V12Z"
                                className="login-brand-shape"
                                strokeWidth="1.5"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M16 8V24M8 12L24 20M24 12L8 20"
                                className="login-brand-lines"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                            />
                        </svg>
                    </div>
                    <h1 className="login-title">Lofy Console</h1>
                    <p className="login-subtitle">Sign in to your admin account</p>
                </div>

                {/* Card */}
                <div className="login-card">
                    <form onSubmit={handleLogin} className="login-form" id="login-form">
                        {/* Error message */}
                        {error && (
                            <div className="login-error" role="alert" id="login-error">
                                <AlertCircle size={14} />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Lofy ID Field */}
                        <div className="login-field">
                            <label htmlFor="lofy_id" className="login-label">
                                Lofy ID
                            </label>
                            <div className="login-input-wrapper">
                                <User size={14} className="login-input-icon" />
                                <input
                                    id="lofy_id"
                                    name="lofy_id"
                                    type="text"
                                    autoComplete="username"
                                    required
                                    value={lofyId}
                                    onChange={(e) => setLofyId(e.target.value)}
                                    placeholder="Enter your Lofy ID"
                                    className="login-input"
                                    disabled={isPending}
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="login-field">
                            <label htmlFor="password" className="login-label">
                                Password
                            </label>
                            <div className="login-input-wrapper">
                                <Lock size={14} className="login-input-icon" />
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="login-input login-input--password"
                                    disabled={isPending}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="login-toggle-password"
                                    tabIndex={-1}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    id="toggle-password"
                                >
                                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            className="login-submit"
                            disabled={isPending || !lofyId || !password}
                            id="login-submit"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 size={14} className="login-spinner" />
                                    Signing in…
                                </>
                            ) : (
                                'Sign in'
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <p className="login-footer">
                    Admin access only. Contact your administrator for credentials.
                </p>
            </div>
        </div>
    );
}
