'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './settings.module.css';
import AppLayout from '@/components/AppLayout';

interface UserSettings {
    name: string;
    email: string;
    prefs: {
        correctionDepth: 'minimal' | 'standard' | 'full';
        correctionTiming: 'immediate' | 'summary';
        timeCommitment: number;
    };
}

export default function SettingsPage() {
    const router = useRouter();
    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    useEffect(() => {
        async function fetchSettings() {
            try {
                const res = await fetch('/api/v1/user/me', {
                    credentials: 'include',
                });

                if (res.status === 401) {
                    router.push('/auth');
                    return;
                }

                if (res.ok) {
                    setSettings(await res.json());
                } else {
                    throw new Error('Failed to load profile');
                }
            } catch (error) {
                console.error('Failed to fetch settings:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchSettings();
    }, []);

    async function handleSave() {
        if (!settings) return;

        setSaving(true);

        try {
            await fetch('/api/v1/user/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    name: settings.name,
                    prefs: settings.prefs,
                }),
            });
        } catch (error) {
            console.error('Failed to save settings:', error);
        } finally {
            setSaving(false);
        }
    }

    async function handleDeleteVoiceData() {
        if (deleteConfirmText !== 'DELETE MY VOICE DATA') return;

        try {
            await fetch('/api/v1/user/voice-data', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ confirmation: deleteConfirmText }),
            });

            setShowDeleteConfirm(false);
            setDeleteConfirmText('');
            alert('Voice data deleted successfully');
        } catch (error) {
            console.error('Failed to delete voice data:', error);
        }
    }

    async function handleLogout() {
        try {
            await fetch('/api/v1/auth/logout', {
                method: 'POST',
                credentials: 'include',
            });
            router.push('/');
        } catch (error) {
            console.error('Failed to logout:', error);
        }
    }

    if (loading) {
        return (
            <AppLayout>
                <main className={styles.main}>
                    <div className={styles.loading}>Loading settings...</div>
                </main>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <main className={styles.main}>
                <div className={styles.container}>
                    <header className={styles.header}>
                        <Link href="/learn" className={styles.backLink}>← Back</Link>
                        <h1>Settings</h1>
                    </header>

                    {/* Preferences Section */}
                    <section className={styles.section}>
                        <h2>Learning Preferences</h2>

                        <div className={styles.field}>
                            <label className="label">Feedback depth</label>
                            <div className={styles.radioGroup}>
                                {(['minimal', 'standard', 'full'] as const).map((option) => (
                                    <label key={option} className={styles.radio}>
                                        <input
                                            type="radio"
                                            name="correctionDepth"
                                            value={option}
                                            checked={settings?.prefs.correctionDepth === option}
                                            onChange={(e) => setSettings(s => s ? {
                                                ...s,
                                                prefs: { ...s.prefs, correctionDepth: e.target.value as any }
                                            } : null)}
                                        />
                                        <span className={styles.radioLabel}>
                                            {option === 'minimal' ? 'Minimal' : option === 'standard' ? 'Standard' : 'Full explanations'}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className={styles.field}>
                            <label className="label">Correction timing</label>
                            <div className={styles.radioGroup}>
                                <label className={styles.radio}>
                                    <input
                                        type="radio"
                                        name="correctionTiming"
                                        value="immediate"
                                        checked={settings?.prefs.correctionTiming === 'immediate'}
                                        onChange={() => setSettings(s => s ? {
                                            ...s,
                                            prefs: { ...s.prefs, correctionTiming: 'immediate' }
                                        } : null)}
                                    />
                                    <span className={styles.radioLabel}>Immediate</span>
                                </label>
                                <label className={styles.radio}>
                                    <input
                                        type="radio"
                                        name="correctionTiming"
                                        value="summary"
                                        checked={settings?.prefs.correctionTiming === 'summary'}
                                        onChange={() => setSettings(s => s ? {
                                            ...s,
                                            prefs: { ...s.prefs, correctionTiming: 'summary' }
                                        } : null)}
                                    />
                                    <span className={styles.radioLabel}>Summary after session</span>
                                </label>
                            </div>
                        </div>
                    </section>

                    {/* Actions */}
                    <div className={styles.actions}>
                        <button
                            className="btn btn-primary"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : 'Save changes'}
                        </button>
                    </div>
                </div>
            </main>
        </AppLayout>
    );
}
