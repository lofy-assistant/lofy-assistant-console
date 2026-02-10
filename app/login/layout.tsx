import type { Metadata } from 'next';
import './login.css';

export const metadata: Metadata = {
    title: 'Sign In — Lofy Console',
    description: 'Sign in to the Lofy admin console.',
};

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
