'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './onboarding.module.css';

type Step = 'welcome' | 'goal' | 'time' | 'background' | 'ready';

const GOALS = [
    { id: 'work', label: 'Job / Work' },
    { id: 'integration', label: 'Integration / Residency' },
    { id: 'exam', label: 'Exam (Goethe/TELC)' },
    { id: 'everyday', label: 'Everyday conversation' },
];

const TIME_OPTIONS = [
    { id: '10', label: '10 minutes/day' },
    { id: '15', label: '15 minutes/day' },
    { id: '30', label: '30 minutes/day' },
];

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('welcome');
    const [formData, setFormData] = useState({
        goal: '',
        timeCommitment: '15',
        nativeLanguage: 'English',
        priorStudy: false,
        priorStudyYears: 0,
    });

    function handleNext() {
        const steps: Step[] = ['welcome', 'goal', 'time', 'background', 'ready'];
        const currentIndex = steps.indexOf(step);
        if (currentIndex < steps.length - 1) {
            setStep(steps[currentIndex + 1]);
        }
    }

    function handleBack() {
        const steps: Step[] = ['welcome', 'goal', 'time', 'background', 'ready'];
        const currentIndex = steps.indexOf(step);
        if (currentIndex > 0) {
            setStep(steps[currentIndex - 1]);
        }
    }

    async function handleStartPlacement() {
        // Save onboarding data to localStorage
        localStorage.setItem('onboarding:data', JSON.stringify(formData));
        router.push('/placement');
    }

    return (
        <main className={styles.main}>
            <div className={styles.container}>
                {/* Progress Indicator */}
                <div className={styles.progress}>
                    {['welcome', 'goal', 'time', 'background', 'ready'].map((s, i) => (
                        <div
                            key={s}
                            className={`${styles.progressDot} ${['welcome', 'goal', 'time', 'background', 'ready'].indexOf(step) >= i
                                    ? styles.active
                                    : ''
                                }`}
                        />
                    ))}
                </div>

                {/* Welcome */}
                {step === 'welcome' && (
                    <div className={styles.stepContent}>
                        <h1>Welcome to Oratoria</h1>
                        <p className="text-muted">
                            Let's set up your personalized learning experience. This will take about 2 minutes.
                        </p>
                        <button onClick={handleNext} className="btn btn-primary btn-lg mt-6">
                            Continue
                        </button>
                    </div>
                )}

                {/* Goal Selection */}
                {step === 'goal' && (
                    <div className={styles.stepContent}>
                        <h1>What's your main goal?</h1>
                        <p className={styles.tip}>
                            Why we ask: We adapt lessons to save your time and focus on what matters most.
                        </p>

                        <div className={styles.radioGroup} role="radiogroup" aria-label="Learning goal">
                            {GOALS.map((goal) => (
                                <label key={goal.id} className={styles.radioOption}>
                                    <input
                                        type="radio"
                                        name="goal"
                                        value={goal.id}
                                        checked={formData.goal === goal.id}
                                        onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                                    />
                                    <span className={styles.radioLabel}>{goal.label}</span>
                                </label>
                            ))}
                        </div>

                        <div className={styles.buttonRow}>
                            <button onClick={handleBack} className="btn btn-secondary">
                                Back
                            </button>
                            <button
                                onClick={handleNext}
                                className="btn btn-primary"
                                disabled={!formData.goal}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {/* Time Commitment */}
                {step === 'time' && (
                    <div className={styles.stepContent}>
                        <h1>How much time can you commit?</h1>
                        <p className="text-muted">We recommend 15-30 minutes for optimal progress.</p>

                        <div className={styles.radioGroup} role="radiogroup" aria-label="Time commitment">
                            {TIME_OPTIONS.map((option) => (
                                <label key={option.id} className={styles.radioOption}>
                                    <input
                                        type="radio"
                                        name="time"
                                        value={option.id}
                                        checked={formData.timeCommitment === option.id}
                                        onChange={(e) => setFormData({ ...formData, timeCommitment: e.target.value })}
                                    />
                                    <span className={styles.radioLabel}>{option.label}</span>
                                </label>
                            ))}
                        </div>

                        <div className={styles.buttonRow}>
                            <button onClick={handleBack} className="btn btn-secondary">
                                Back
                            </button>
                            <button onClick={handleNext} className="btn btn-primary">
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {/* Language Background */}
                {step === 'background' && (
                    <div className={styles.stepContent}>
                        <h1>Your language background</h1>

                        <div className={styles.field}>
                            <label htmlFor="nativeLanguage" className="label">Native language</label>
                            <select
                                id="nativeLanguage"
                                className="input"
                                value={formData.nativeLanguage}
                                onChange={(e) => setFormData({ ...formData, nativeLanguage: e.target.value })}
                            >
                                <option value="English">English</option>
                                <option value="Spanish">Spanish</option>
                                <option value="French">French</option>
                                <option value="Italian">Italian</option>
                                <option value="Portuguese">Portuguese</option>
                                <option value="Turkish">Turkish</option>
                                <option value="Arabic">Arabic</option>
                                <option value="Chinese">Chinese</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <label className={styles.checkbox}>
                            <input
                                type="checkbox"
                                checked={formData.priorStudy}
                                onChange={(e) => setFormData({ ...formData, priorStudy: e.target.checked })}
                            />
                            <span>I have studied German before</span>
                        </label>

                        {formData.priorStudy && (
                            <div className={styles.field}>
                                <label htmlFor="years" className="label">Years of study</label>
                                <input
                                    id="years"
                                    type="number"
                                    className="input"
                                    min="0"
                                    max="20"
                                    value={formData.priorStudyYears}
                                    onChange={(e) => setFormData({ ...formData, priorStudyYears: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        )}

                        <div className={styles.buttonRow}>
                            <button onClick={handleBack} className="btn btn-secondary">
                                Back
                            </button>
                            <button onClick={handleNext} className="btn btn-primary">
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {/* Ready for Placement */}
                {step === 'ready' && (
                    <div className={styles.stepContent}>
                        <div className={styles.readyIcon}>🎤</div>
                        <h1>Ready for your placement?</h1>
                        <p className="text-muted mb-6">
                            We'll ask you to speak in German for about 5 minutes. This helps us understand
                            your current level and create a personalized learning path.
                        </p>

                        <div className={styles.micNote}>
                            <p>
                                <strong>Microphone Required</strong><br />
                                Please allow microphone access when prompted.
                            </p>
                        </div>

                        <div className={styles.buttonRow}>
                            <button onClick={handleBack} className="btn btn-secondary">
                                Back
                            </button>
                            <button onClick={handleStartPlacement} className="btn btn-primary btn-lg">
                                Run placement
                            </button>
                        </div>
                    </div>
                )}

                {/* Skip link */}
                <div className={styles.skipLink}>
                    <Link href="/auth/login">Already have an account? Log in</Link>
                </div>
            </div>
        </main>
    );
}
