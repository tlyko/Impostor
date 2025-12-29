import { useEffect, useRef } from 'react';

export const useSoundEffects = () => {
    const joinSound = useRef<HTMLAudioElement | null>(null);
    const startSound = useRef<HTMLAudioElement | null>(null);
    const voteSound = useRef<HTMLAudioElement | null>(null);
    const winSound = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Initialize audio objects with expected paths
        // Users should place .mp3 files in public/sounds/
        joinSound.current = new Audio('/sounds/join.mp3');
        startSound.current = new Audio('/sounds/start.mp3');
        voteSound.current = new Audio('/sounds/vote.mp3');
        winSound.current = new Audio('/sounds/win.mp3');

        // Optional: Preload
        joinSound.current.load();
        startSound.current.load();
        voteSound.current.load();
        winSound.current.load();
    }, []);

    const play = (soundRef: React.MutableRefObject<HTMLAudioElement | null>) => {
        if (soundRef.current) {
            soundRef.current.currentTime = 0;
            soundRef.current.play().catch(e => {
                // Ignore errors if autoplay is blocked or file is missing
                console.log('Audio play prevented or missing:', e);
            });
        }
    };

    return {
        playJoin: () => play(joinSound),
        playStart: () => play(startSound),
        playVote: () => play(voteSound),
        playWin: () => play(winSound),
    };
};
