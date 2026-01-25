'use client';

import Sidebar from './Sidebar';

interface AppLayoutProps {
    children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
    return (
        <div className="min-h-screen bg-[#F0FDF4] flex">
            <Sidebar />
            <main className="flex-1 min-w-0">
                {children}
            </main>
        </div>
    );
}
