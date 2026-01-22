/**
 * ORATORIA Lesson Page - FIXED
 * 
 * FIXES APPLIED:
 * 1. Removed automatic phase transitions - user explicitly controls flow
 * 2. Simplified UI - removed redundant phase indicator
 * 3. Fixed speech validation - only final results count
 * 4. Improved error handling and recovery
 */

'use client';

import { useLessonEngine, LessonSentence } from '@/lib/lesson/lesson-engine';
import { Outcome } from '@/types';

// Sample sentences
const SAMPLE_SENTENCES: LessonSentence[] = [
    {
        id: '1',
        germanText: 'Ich möchte einen Kaffee bestellen.',
        englishText: 'I would like to order a coffee.',
    },
    {
        id: '2',
        germanText: 'Wo ist der Bahnhof?',
        englishText: 'Where is the train station?',
    },
    {
        id: '3',
        germanText: 'Das Wetter ist heute sehr schön.',
        englishText: 'The weather is very nice today.',
    },
    {
        id: '4',
        germanText: 'Ich arbeite bei einer großen Firma.',
        englishText: 'I work at a large company.',
    },
    {
        id: '5',
        germanText: 'Können Sie mir bitte helfen?',
        englishText: 'Can you please help me?',
    },
];

export default function LessonPage() {
    const lesson = useLessonEngine(SAMPLE_SENTENCES);

    if (!lesson.currentSentence) {
        return (
            <div className="lesson-complete">
                <h1>🎉 Lesson Complete</h1>
                <p>You&apos;ve completed all {SAMPLE_SENTENCES.length} sentences.</p>
                <button className="btn-primary" onClick={() => window.location.href = '/'}>
                    Back to Home
                </button>
            </div>
        );
    }

    // Determine current view based on what's been done
    const showFeedback = lesson.feedback !== null;
    const showComplete = lesson.currentSessionState?.hasSRSUpdate || false;

    return (
        <div className="lesson-container">
            {/* Simple progress bar */}
            <header className="lesson-header">
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${((lesson.currentIndex + 1) / lesson.totalSentences) * 100}%` }}
                    />
                </div>
                <span className="progress-text">
                    {lesson.currentIndex + 1} / {lesson.totalSentences}
                </span>
            </header>

            <main className="lesson-main">
                {/* STEP 1: Show sentence */}
                {!showFeedback && !showComplete && (
                    <div className="phase-content">
                        <div className="sentence-card">
                            <p className="german-text">{lesson.currentSentence.germanText}</p>
                            <p className="english-text">{lesson.currentSentence.englishText}</p>
                        </div>

                        <button className="btn-secondary" onClick={lesson.playAudio}>
                            🔊 Listen
                        </button>

                        <div className="divider">Now say it in German:</div>

                        {/* Speech Input */}
                        <div className="input-section">
                            <button
                                className={`record-button ${lesson.isRecording ? 'recording' : ''}`}
                                onClick={lesson.isRecording ? lesson.stopRecording : lesson.startRecording}
                                disabled={!lesson.speechSupported}
                            >
                                {lesson.isRecording ? '⏹ Stop' : '🎤 Record'}
                            </button>

                            {!lesson.speechSupported && (
                                <p className="helper-text warning">
                                    Microphone not available. Use text input below.
                                </p>
                            )}

                            {lesson.transcript && (
                                <div className="transcript">
                                    <label>You said:</label>
                                    <p>{lesson.transcript}</p>
                                </div>
                            )}
                        </div>

                        {/* Text fallback */}
                        <div className="text-input-section">
                            <label className="text-input-label">Or type your answer:</label>
                            <textarea
                                value={lesson.typedInput}
                                onChange={(e) => lesson.setTypedInput(e.target.value)}
                                placeholder="Type the German sentence..."
                                rows={2}
                            />
                            <button
                                className="btn-secondary btn-small"
                                onClick={lesson.submitTypedInput}
                                disabled={!lesson.typedInput.trim()}
                            >
                                Submit Text
                            </button>
                        </div>

                        {/* Check button */}
                        <button
                            className="btn-primary btn-large"
                            onClick={lesson.generateFeedback}
                            disabled={!lesson.currentSessionState?.hasOutput}
                        >
                            Check Answer
                        </button>

                        {!lesson.currentSessionState?.hasOutput && (
                            <p className="helper-text">
                                Record or type your answer to continue
                            </p>
                        )}
                    </div>
                )}

                {/* STEP 2: Show feedback */}
                {showFeedback && !showComplete && lesson.feedback && (
                    <div className="phase-content feedback-phase">
                        <div className={`outcome-badge ${lesson.feedback.outcome}`}>
                            {lesson.feedback.outcome === Outcome.SUCCESS && '✅ Correct!'}
                            {lesson.feedback.outcome === Outcome.PARTIAL && '🔶 Almost!'}
                            {lesson.feedback.outcome === Outcome.FAIL && '❌ Not quite'}
                        </div>

                        <div className="correction-card">
                            <label>Correct answer:</label>
                            <p className="correct-text">{lesson.feedback.grammarAnalysis.correctedText}</p>
                        </div>

                        {lesson.feedback.grammarAnalysis.errors.length > 0 && (
                            <div className="error-details">
                                <h3>Issues found:</h3>
                                {lesson.feedback.grammarAnalysis.errors.slice(0, 2).map((error, idx) => (
                                    <div key={idx} className="error-item">
                                        <span className="error-type">{error.type}</span>
                                        <p className="error-explanation">{error.explanation}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="self-assessment">
                            <p>How well did you know this?</p>
                            <div className="assessment-buttons">
                                <button onClick={() => lesson.updateSRS(0)} className="btn-fail">
                                    ✗ Didn&apos;t know
                                </button>
                                <button onClick={() => lesson.updateSRS(0.5)} className="btn-partial">
                                    ~ Partial
                                </button>
                                <button onClick={() => lesson.updateSRS(1)} className="btn-success">
                                    ✓ Knew it
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 3: Ready for next */}
                {showComplete && (
                    <div className="phase-content complete-phase">
                        <div className="complete-icon">
                            {lesson.feedback?.outcome === Outcome.SUCCESS && '🌟'}
                            {lesson.feedback?.outcome === Outcome.PARTIAL && '👍'}
                            {lesson.feedback?.outcome === Outcome.FAIL && '💪'}
                        </div>

                        <h2>Progress Saved</h2>

                        <button className="btn-primary btn-large" onClick={lesson.goToNext}>
                            {lesson.currentIndex === lesson.totalSentences - 1 ? 'Finish Lesson' : 'Next →'}
                        </button>
                    </div>
                )}
            </main>

            {/* Error toast */}
            {lesson.error && (
                <div className="error-toast" onClick={() => lesson.setError(null)}>
                    {lesson.error}
                </div>
            )}
        </div>
    );
}
