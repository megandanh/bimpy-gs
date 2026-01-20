import React, { useEffect } from 'react';

interface StarBackgroundProps {
    starCount: number;
    starSpeed: number;
    starSize: number;
    twinkle: boolean;
    pixelationFactor?: number;
}

const StarBackground: React.FC<StarBackgroundProps> = ({
    starCount,
    starSpeed,
    starSize,
    twinkle = true,
    pixelationFactor = 1,
}) => {
    useEffect(() => {
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.pointerEvents = 'none';
        container.style.backgroundRepeat = 'repeat';
        container.style.backgroundSize = 'cover';
        container.style.opacity = '1';
        container.style.zIndex = '0';

        document.body.appendChild(container);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        if (!ctx) return;

        const rect = document.body.getBoundingClientRect();
        const canvasWidth = Math.floor(rect.width);
        const canvasHeight = Math.floor(rect.height);

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        type Star = {
        x: number;
        y: number;
        r: number;
        baseAlpha: number;
        twinklePhase: number;
        twinkleSpeed: number;
        speed: number;
        };

        const stars: Star[] = [];

        for (let i = 0; i < starCount; i++) {
        const r = (Math.random() * 1.6 + 0.4) * starSize;
        stars.push({
            x: Math.random() * canvasWidth,
            y: Math.random() * canvasHeight,
            r,
            baseAlpha: 0.3 + Math.random() * 0.7,
            twinklePhase: Math.random() * Math.PI * 2,
            twinkleSpeed: 0.01 + Math.random() * 0.02,
            speed: (0.15 + Math.random() * 0.85) * starSpeed,
        });
        }
        const drawStars = () => {
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);

            ctx.fillStyle = "rgba(0,0,0,1)";
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);

            for (const s of stars) {
                const alpha =
                twinkle
                    ? Math.min(
                        1,
                        Math.max(0, s.baseAlpha + 0.25 * Math.sin(s.twinklePhase))
                    )
                    : s.baseAlpha;
                
                // star glow
                const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 3);
                glow.addColorStop(0, `rgba(255,255,255,${alpha})`);
                glow.addColorStop(1, `rgba(255,255,255,0)`);

                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
                ctx.fill();

                // star core
                ctx.fillStyle = `rgba(255,255,255,${Math.min(1, alpha + 0.15)})`;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fill();
            }
        };

        const updateStars = () => {
        for (const s of stars) {
            s.x -= s.speed;
            if (s.x < -10) {
            s.x = canvasWidth + 10;
            s.y = Math.random() * canvasHeight;
            }
            if (twinkle) s.twinklePhase += s.twinkleSpeed;
        }
        };

        let rafId = 0;

        const animate = () => {
            drawStars();
            updateStars();

            if (pixelationFactor > 1) {
                const scaledCanvas = document.createElement("canvas");
                const scaledCtx = scaledCanvas.getContext("2d");
                if (scaledCtx) {
                    scaledCanvas.width = canvasWidth * pixelationFactor;
                    scaledCanvas.height = canvasHeight * pixelationFactor;

                    scaledCtx.imageSmoothingEnabled = true;
                    scaledCtx.drawImage(
                        canvas,
                        0,
                        0,
                        canvasWidth,
                        canvasHeight,
                        0,
                        0,
                        scaledCanvas.width,
                        scaledCanvas.height
                    );

                    container.style.backgroundImage = `url(${scaledCanvas.toDataURL()})`;
                }
            } else {
                container.style.backgroundImage = `url(${canvas.toDataURL()})`;
            }

            rafId = requestAnimationFrame(animate);
        };

        animate();

        const onResize = () => {
        const w = Math.max(200, Math.floor(document.body.getBoundingClientRect().width / 3));
        const h = Math.max(200, Math.floor(document.body.getBoundingClientRect().height / 3));
        canvas.width = w;
        canvas.height = h;
        };

        window.addEventListener("resize", onResize);

        return () => {
        cancelAnimationFrame(rafId);
        window.removeEventListener("resize", onResize);
        document.body.removeChild(container);
        };
    }, [starCount, starSpeed, starSize, twinkle, pixelationFactor]);

    return null;
    };

    export default StarBackground;