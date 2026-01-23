'use client';

import { useRef } from 'react';
import styles from './AudioPlayer.module.css';

interface AudioPlayerProps {
    src: string;
    durationMs?: number;
    showWaveform?: boolean;
}

export default function AudioPlayer({ src, durationMs, showWaveform = false }: AudioPlayerProps) {
    const audioRef = useRef<HTMLAudioElement>(null);

    function handlePlay() {
        audioRef.current?.play();
    }

    function handlePause() {
        audioRef.current?.pause();
    }

    function handleRewind() {
        if (audioRef.current) {
            audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 3);
        }
    }

    function handleForward() {
        if (audioRef.current) {
            audioRef.current.currentTime = audioRef.current.currentTime + 3;
        }
    }

    return (
        <div className={styles.player}>
            <audio ref={audioRef} src={src} />

            {showWaveform && (
                <div className={styles.waveform} aria-hidden="true">
                    {/* Simplified waveform visualization */}
                    {Array.from({ length: 20 }).map((_, i) => (
                        <div
                            key={i}
                            className={styles.waveformBar}
                            style={{ height: `${20 + Math.random() * 60}%` }}
                        />
                    ))}
                </div>
            )}

            <div className={styles.controls}>
                <button
                    type="button"
                    onClick={handleRewind}
                    className={styles.controlBtn}
                    aria-label="Rewind 3 seconds"
                >
                    ⏪
                </button>

                <button
                    type="button"
                    onClick={handlePlay}
                    className={styles.playBtn}
                    aria-label="Play lesson audio"
                >
                    ▶️
                </button>

                <button
                    type="button"
                    onClick={handlePause}
                    className={styles.pauseBtn}
                    aria-label="Pause"
                >
                    ⏸
                </button>

                <button
                    type="button"
                    onClick={handleForward}
                    className={styles.controlBtn}
                    aria-label="Forward 3 seconds"
                >
                    ⏩
                </button>
            </div>

            {durationMs && (
                <div className={styles.duration}>
                    {Math.floor(durationMs / 60000)}:{String(Math.floor((durationMs % 60000) / 1000)).padStart(2, '0')}
                </div>
            )}
        </div>
    );
}
