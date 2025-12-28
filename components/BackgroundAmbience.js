'use client';

import { useEffect, useRef, useState } from 'react';

export default function BackgroundAmbience() {
    const bgLayerRef = useRef(null);
    const [images, setImages] = useState([]);

    useEffect(() => {
        const fetchImages = async () => {
            try {

                const res = await fetch('/images.json');
                if (res.ok) {
                    const data = await res.json();
                    setImages(data);
                }
            } catch (e) {
                console.error("Failed to load background images:", e);
            }
        };
        fetchImages();
    }, []);

    useEffect(() => {
        if (!bgLayerRef.current || images.length === 0) return;

        bgLayerRef.current.innerHTML = '';
        const count = Math.floor(Math.random() * 21) + 40;

        for (let i = 0; i < count; i++) {
            const imgPath = images[Math.floor(Math.random() * images.length)];
            const img = document.createElement('img');
            img.src = imgPath;

            const size = Math.floor(Math.random() * 500) + 500;
            const top = Math.floor(Math.random() * 140) - 20;
            const left = Math.floor(Math.random() * 140) - 20;
            const rotate = Math.floor(Math.random() * 180) - 90;

            img.style.position = 'absolute';
            img.style.width = `${size}px`;
            img.style.top = `${top}%`;
            img.style.left = `${left}%`;
            img.style.transform = `translate(-50%, -50%) rotate(${rotate}deg)`;
            img.style.opacity = '1';
            // Use arbitrary values for Tailwind v4 compatibility if needed, or standard classes
            img.className = "rounded shadow-2xl border-4 border-white/5 pointer-events-none";

            bgLayerRef.current.appendChild(img);
        }
    }, [images]);

    return (
        <div
            ref={bgLayerRef}
            className="fixed inset-0 -z-10 pointer-events-none overflow-hidden"
            aria-hidden="true"
        />
    );
}
