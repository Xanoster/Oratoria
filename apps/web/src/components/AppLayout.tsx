'use client';

import Sidebar from './Sidebar';

interface AppLayoutProps {
    children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
    return (
        <div className="min-h-screen bg-[#0A0E1A]">
            <Sidebar />
            <main className="ml-64 min-h-screen">
                {children}
            </main>
        </div>
    );
}
