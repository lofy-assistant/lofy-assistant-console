import type { Metadata } from 'next';
import { getSessionFromCookie } from '@/lib/session';
import { redirect } from 'next/navigation';
import { LogoutButton } from '@/components/logout-button';
import './admin.css';

export const metadata: Metadata = {
    title: 'Dashboard — Lofy Console',
    description: 'Lofy admin dashboard.',
};

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSessionFromCookie();
    if (!session) {
        redirect('/login');
    }

    return (
        <div className="admin-layout">
            <header className="admin-header">
                <div className="admin-header-inner">
                    <div className="admin-header-brand">
                        <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                            <rect width="32" height="32" rx="8" style={{ fill: 'oklch(0.44 0.10 157)' }} />
                            <path
                                d="M8 12L16 8L24 12V20L16 24L8 20V12Z"
                                style={{ fill: 'none', stroke: 'oklch(0.92 0.01 167)', strokeWidth: 1.5, strokeLinejoin: 'round' as const }}
                            />
                        </svg>
                        <span className="admin-header-title">Lofy Console</span>
                    </div>
                    <div className="admin-header-user">
                        <span className="admin-header-name">{session.displayName || session.name}</span>
                        <LogoutButton />
                    </div>
                </div>
            </header>

            <main className="admin-main">
                {children}
            </main>
        </div>
    );
}
