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
        const maxRipples = 3;

        function animateRipple() {
            if (rippleCount >= maxRipples) {
                resolve();
                return;
            }

            const startY = rippleHeight + 120;
            const endY = -120;
            const centerX = containerWidth / 2;

            let currentY = startY;
            const duration = 1800;
            const startTime = Date.now();

            function updateArc() {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                const easeProgress = progress < 0.5
                    ? 4 * progress * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 3) / 2;

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

            if (progress < 1) {
                requestAnimationFrame(updateReveal);
            } else {
                resolve();
            }
        }

        requestAnimationFrame(updateReveal);
    });
} 