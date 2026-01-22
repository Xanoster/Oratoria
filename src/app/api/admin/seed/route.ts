import { NextRequest, NextResponse } from 'next/server';
import { seedRoleplayScenarios } from '@/lib/seed-roleplay';

export async function GET(request: NextRequest) {
    try {
        await seedRoleplayScenarios();
        return NextResponse.json({ success: true, message: 'Roleplay scenarios seeded' });
    } catch (error) {
        // Log error
        console.error('Seeding error:', error);
        return NextResponse.json({ success: false, error: 'Failed to seed' }, { status: 500 });
    }
}
