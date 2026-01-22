import React from 'react';
import DashboardLayout from '@/app/dashboard/layout';
import { getOrCreateDefaultUser } from '@/lib/auth';
import { getProfileData } from '@/lib/profile';
import ProfileForm from '@/components/profile/ProfileForm';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
    const user = await getOrCreateDefaultUser();
    const profileData = await getProfileData(user.id);

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="font-serif text-3xl font-bold text-[#2d1b0e]">My Profile</h1>
                        <p className="text-[#5c4a3a]">Manage your account and settings</p>
                    </div>
                </div>

                <ProfileForm initialData={profileData} />
            </div>
        </DashboardLayout>
    );
}
