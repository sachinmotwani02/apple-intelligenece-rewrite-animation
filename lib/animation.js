/**
 * Creates a ripple effect animation.
 * @param {React.RefObject} arcPathRef - Ref for the SVG path of the arc.
 * @param {number} rippleHeight - The height of the ripple effect.
 * @param {number} containerWidth - The width of the container.
 * @returns {Promise<void>} - A promise that resolves when the animation is complete.
 */
export function createRippleEffect(arcPathRef, rippleHeight, containerWidth) {
    return new Promise(resolve => {
        let rippleCount = 0;
        const maxRipples = 2; // Reduced from 3 to 2

        function animateRipple() {
            if (rippleCount >= maxRipples) {
                resolve();
                return;
            }

            const startY = rippleHeight + 120;
            const endY = -120;
            const centerX = containerWidth / 2;

            let currentY = startY;
            const duration = 1200; // Increased speed from 1800 to 1200
            const startTime = Date.now();

            function updateArc() {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Ease-out cubic for smoother deceleration
                const easeProgress = 1 - Math.pow(1 - progress, 3);

                currentY = startY + (endY - startY) * easeProgress;

                const arcY = currentY;
                const arcWidth = containerWidth * 1.5;
                const arcHeight = 100;
                const leftX = -(arcWidth - containerWidth) / 2;
                const rightX = leftX + arcWidth;

                if (arcPathRef.current) {
                    arcPathRef.current.setAttribute('d', `M ${leftX},${arcY} A ${arcWidth / 2},${arcHeight} 0 0,1 ${rightX},${arcY}`);
                }

                if (progress < 1) {
                    requestAnimationFrame(updateArc);
                } else {
                    rippleCount++;
                    setTimeout(() => {
                        animateRipple();
                    }, 300);
                }
            }
            requestAnimationFrame(updateArc);
        }
        animateRipple();
    });
}

/**
 * Creates a reveal effect animation.
 * @param {object} refs - An object containing all the necessary refs.
 * @returns {Promise<void>} - A promise that resolves when the animation is complete.
 */
export function createRevealEffect({
    containerRef,
    wipePathRef,
    hideWipePathRef,
    colorBandRef,
    lineAnimationControls = [],
}) {
    return new Promise(resolve => {
        const container = containerRef.current;
        const wipePath = wipePathRef.current;
        const hideWipePath = hideWipePathRef.current;
        const colorBand = colorBandRef.current;

        const containerHeight = container.offsetHeight;
        const containerWidth = container.offsetWidth;

        const startY = -80;
        const endY = containerHeight + 80;
        const duration = 1200;
        const startTime = Date.now();
        
        // Calculate line positions for triggering animations
        const lineHeight = 24; // Approximate line height
        const lineCount = lineAnimationControls.length;
        const triggeredLines = new Set();

        function updateReveal() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 4);
            const currentY = startY + (endY - startY) * easeProgress;

            const d_path = `M 0,0 H ${containerWidth} V ${currentY} A ${containerWidth / 2},50 0 0,1 0,${currentY} Z`;

            if (wipePath) wipePath.setAttribute('d', d_path);
            if (hideWipePath) hideWipePath.setAttribute('d', d_path);

            if (colorBand) {
                colorBand.style.transform = `translateY(${currentY - 40}px)`;
            }

            // Trigger line animations when wipe reaches each line
            if (lineAnimationControls.length > 0) {
                for (let i = 0; i < lineCount; i++) {
                    const lineY = 40 + (i * lineHeight); // Approximate line position
                    if (currentY >= lineY && !triggeredLines.has(i)) { // Wait until line is fully revealed
                        triggeredLines.add(i);
                        
                        // Staggered spring animation with delay based on line index
                        const delay = i * 0.04; // Even tighter stagger for snappier feel
                        
                                                setTimeout(() => {
                            if (lineAnimationControls[i] && lineAnimationControls[i].start) {
                                // Single spring animation with overshoot for natural bounce effect
                                lineAnimationControls[i].start({
                                    y: 0, // Target position (original)
                                    transition: {
                                        type: "spring",
                                        stiffness: 100,  // Slightly higher for quicker settling
                                        damping: 12,     // Higher damping for faster settling
                                        mass: 0.65,       // Lower mass for quicker response
                                        velocity: -1000 // Reduced velocity for controlled motion
                                    }
                                });
                            }
                        }, delay * 600); // Faster overall timing
                    }
                }
            }

            if (progress < 1) {
                requestAnimationFrame(updateReveal);
            } else {
                resolve();
            }
        }

        requestAnimationFrame(updateReveal);
    });
} 