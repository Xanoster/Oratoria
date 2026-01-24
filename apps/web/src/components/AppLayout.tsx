'use client';

import Sidebar from './Sidebar';

interface AppLayoutProps {
    children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
    return (
        <div className="min-h-screen bg-[#0A0E1A] flex">
            <Sidebar />
            <main className="flex-1 min-w-0">
                {children}
            </main>
        </div>
    );
}
