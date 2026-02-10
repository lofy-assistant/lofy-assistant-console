import { getSessionFromCookie } from '@/lib/session';
import { Users, Calendar, Bell, Database } from 'lucide-react';

export default async function DashboardPage() {
    const session = await getSessionFromCookie();

    return (
        <div>
            <div className="dashboard-greeting">
                <h1>Welcome back, {session?.displayName || session?.name || 'Admin'}</h1>
                <p>Here&apos;s an overview of your admin console.</p>
            </div>

            <div className="dashboard-cards">
                <div className="dashboard-card">
                    <div className="dashboard-card-icon dashboard-card-icon--primary">
                        <Users size={18} />
                    </div>
                    <h3>User Management</h3>
                    <p>View and manage all registered users in the system.</p>
                </div>

                <div className="dashboard-card">
                    <div className="dashboard-card-icon dashboard-card-icon--blue">
                        <Calendar size={18} />
                    </div>
                    <h3>Events</h3>
                    <p>Monitor calendar events and scheduling activity.</p>
                </div>

                <div className="dashboard-card">
                    <div className="dashboard-card-icon dashboard-card-icon--purple">
                        <Bell size={18} />
                    </div>
                    <h3>Reminders</h3>
                    <p>Track and oversee user reminders and notifications.</p>
                </div>

                <div className="dashboard-card">
                    <div className="dashboard-card-icon dashboard-card-icon--amber">
                        <Database size={18} />
                    </div>
                    <h3>Analytics</h3>
                    <p>View platform usage statistics and insights.</p>
                </div>
            </div>
        </div>
    );
}
