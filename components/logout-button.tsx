'use client';

import { useRouter } from 'next/navigation';
import { Loader2, LogOut } from 'lucide-react';
import { useState } from 'react';

export function LogoutButton() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleLogout = async () => {
        setLoading(true);
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
            router.refresh();
        } catch {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleLogout}
            className="admin-logout-btn"
            disabled={loading}
            id="logout-button"
        >
            {loading ? (
                <Loader2 size={14} className="login-spinner" />
            ) : (
                <LogOut size={14} />
            )}
            <span>Sign out</span>
        </button>
    );
}
