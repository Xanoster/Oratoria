import { Navbar } from '@/components/Navbar';

export default function LessonLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-[#faf8f5]">
            <Navbar />
            {children}
        </div>
    );
}
