import React, { useState, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import './AppleNotesAnimation.css';
import { textVariants } from '../lib/constants';
import { createRippleEffect, createRevealEffect } from '../lib/animation';

const AppleNotesAnimation = () => {
    const [currentVariant, setCurrentVariant] = useState('original');
    const [isRewriting, setIsRewriting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [disableTransition, setDisableTransition] = useState(false);
    const [textLines, setTextLines] = useState(textVariants.original.split('\n'));
    const [animationState, setAnimationState] = useState('');
    const [newTextLines, setNewTextLines] = useState([]);
    const [lineAnimationControls, setLineAnimationControls] = useState([]);
    
    // Sequential style switching
    const styleSequence = ['professional', 'casual', 'creative'];
    const [currentStyleIndex, setCurrentStyleIndex] = useState(0);
    
    // Create animation controls for up to 20 lines (should cover most cases)
    const animationControls = Array.from({ length: 20 }, () => useAnimation());

    const containerRef = useRef(null);
    const textContainerRef = useRef(null);
    const textContentRef = useRef(null);
    const finalContentRef = useRef(null);
    const blurContentRef = useRef(null);
    const arcPathRef = useRef(null);
    const wipePathRef = useRef(null);
    const hideWipePathRef = useRef(null);
    const colorBandRef = useRef(null);

    const getContainerHeight = (texts) => {
        const containerNode = textContainerRef.current;
        if (!containerNode) return 0;

        const tempDiv = document.createElement('div');
        const computedStyle = window.getComputedStyle(containerNode);
        
        tempDiv.style.width = computedStyle.width;
        tempDiv.style.padding = computedStyle.padding;
        tempDiv.style.border = computedStyle.border;
        tempDiv.style.boxSizing = computedStyle.boxSizing;

        tempDiv.style.position = 'absolute';
        tempDiv.style.visibility = 'hidden';
        tempDiv.style.left = "-9999px";

        const textMarkup = texts.map(text => `<span class="text-line">${text}</span>`).join('');
        tempDiv.innerHTML = `<div class="text-content">${textMarkup}</div>`;

        document.body.appendChild(tempDiv);
        const height = tempDiv.offsetHeight;
        document.body.removeChild(tempDiv);
        
        return height;
    };

    const startRewrite = async (variant) => {
        if (isRewriting || variant === currentVariant) return;

        setIsRewriting(true);
        setTimeout(() => setIsLoading(true), 400);

        const container = textContainerRef.current;
        const newTexts = textVariants[variant].split('\n');

        // Set up new text lines and animation controls
        setNewTextLines(newTexts);
        const controls = animationControls.slice(0, newTexts.length);
        setLineAnimationControls(controls);

        const currentTextLines = Array.from(textContentRef.current.querySelectorAll('.text-line'));
        const blurContent = blurContentRef.current;
        const newBlurHtml = currentTextLines.map(line => `<span class="text-overlay-line">${line.textContent}</span>`).join('');
        blurContent.innerHTML = newBlurHtml;

        setAnimationState('rewriting');
        await new Promise(resolve => setTimeout(resolve, 0));

        await createRippleEffect(arcPathRef, container.offsetHeight, container.offsetWidth);

        const newHeight = getContainerHeight(newTexts);

        setAnimationState('revealing');
        
        container.style.transition = 'min-height 1.2s ease-in-out';
        container.style.minHeight = newHeight + 'px';
        
        await new Promise(resolve => setTimeout(resolve, 0));
        
        await createRevealEffect({
            containerRef: textContainerRef,
            wipePathRef,
            hideWipePathRef,
            colorBandRef,
            textContentRef,
            finalContentRef,
            lineAnimationControls: controls,
        });

        // --- Start of new reset logic ---
        setDisableTransition(true);

        // Wait for a short moment to ensure all visual updates are complete
        await new Promise(resolve => setTimeout(resolve, 100));

        requestAnimationFrame(() => {
            if (textContainerRef.current) {
                textContainerRef.current.style.transition = '';
            }
    
            if (wipePathRef.current) wipePathRef.current.setAttribute('d', 'M 0,0 H 0 V 0 A 1,1 0 0,0 0,0 Z');
            if (hideWipePathRef.current) hideWipePathRef.current.setAttribute('d', 'M 0,0 H 0 V 0 A 1,1 0 0,0 0,0 Z');
            if (colorBandRef.current) colorBandRef.current.style.transform = 'translateY(-100%)';
            
            animationControls.forEach(control => control.set({ y: 0 }));
            
            setAnimationState('');
            setNewTextLines([]);
            setLineAnimationControls([]);

            requestAnimationFrame(() => {
                setDisableTransition(false);
            });
        });
        // --- End of new reset logic ---

        setTextLines(newTexts);
        setCurrentVariant(variant);
        setIsRewriting(false);
        setIsLoading(false);
    };

    const handleSequentialRewrite = async () => {
        const nextStyle = styleSequence[currentStyleIndex];
        await startRewrite(nextStyle);
        
        // Move to next style in sequence
        setCurrentStyleIndex((prevIndex) => (prevIndex + 1) % styleSequence.length);
    };

    const resetText = () => {
        if (isRewriting) return;

        const container = textContainerRef.current;
        const originalTexts = textVariants.original.split('\n');
        
        setTextLines(originalTexts);
        setCurrentVariant('original');
        setDisableTransition(true);

        // Clear the new text lines and reset animations
        setNewTextLines([]);
        setLineAnimationControls([]);
        animationControls.forEach(control => control.set({ y: 0 }));

        const blurContent = blurContentRef.current;
        if (blurContent) {
            const originalHtml = originalTexts.map(text => `<span class="text-overlay-line">${text}</span>`).join('');
            blurContent.innerHTML = originalHtml;
        }

        const newHeight = getContainerHeight(originalTexts);

        if(container) {
            container.style.transition = 'min-height 0.5s ease-in-out';
            container.style.minHeight = newHeight + 'px';
            
            setTimeout(() => {
                if (textContainerRef.current) {
                    textContainerRef.current.style.transition = '';
                    textContainerRef.current.style.minHeight = '';
                }
                setDisableTransition(false);
            }, 500);
        }
    };

  return (
    <div className="page-wrapper">
        <div className="container" ref={containerRef}>
            <div className="window-header">
                <div className="window-controls">
                    <span className="dot red"></span>
                    <span className="dot yellow"></span>
                    <span className="dot green"></span>
                </div>
            </div>
            <div className="window-body">
                <div className={`text-container ${animationState} variant-${currentVariant} ${disableTransition ? 'no-transition' : ''}`} ref={textContainerRef}>
                    <svg className="arc-svg" viewBox={`0 0 ${textContainerRef.current?.offsetWidth || 600} ${textContainerRef.current?.offsetHeight || 400}`}>
                        <defs>
                            <filter id="blur">
                                <feGaussianBlur in="SourceGraphic" stdDeviation="25"/>
                            </filter>
                            <mask id="arcMask">
                                <rect width="100%" height="100%" fill="black"/>
                                <path ref={arcPathRef} id="arcPath" d="M 0,300 A 300,150 0 0,1 600,300" fill="none" stroke="white" strokeWidth="120" filter="url(#blur)"/>
                            </mask>
                            <mask id="revealMask">
                                <rect width="100%" height="100%" fill="black"/>
                                <path ref={wipePathRef} id="wipePath" d="M 0,0 H 0 V 0 A 1,1 0 0,0 0,0 Z" fill="white"/>
                            </mask>
                            <mask id="hideMask">
                                <rect width="100%" height="100%" fill="white"/>
                                <path ref={hideWipePathRef} id="hideWipePath" d="M 0,0 H 0 V 0 A 1,1 0 0,0 0,0 Z" fill="black"/>
                            </mask>
                        </defs>
                    </svg>
                    <div className="text-content" ref={textContentRef}>
                        {textLines.map((line, index) => (
                            <span key={index} className="text-line">{line}</span>
                        ))}
                    </div>
                    <div className="color-band" ref={colorBandRef} id="colorBand"></div>
                    <div className="text-overlay" id="rippleOverlay">
                        <div className="text-overlay-content" ref={blurContentRef} id="blurContent"></div>
                    </div>
                    <div className="text-overlay" id="revealOverlay">
                        <div className="text-overlay-content" ref={finalContentRef} id="finalContent">
                            {newTextLines.map((line, index) => (
                                <motion.span
                                    key={`${currentVariant}-${index}`}
                                    className="text-overlay-line"
                                    initial={{ y: 0 }}
                                    animate={lineAnimationControls[index] || animationControls[index]}
                                >
                                    {line}
                                </motion.span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div className="controls">
            <button className={`btn ai-rewrite ${isLoading ? 'loading' : ''}`} onClick={handleSequentialRewrite} disabled={isRewriting}>
                <div className="btn-content">
                    <svg width="20" height="20" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M49.6273 9.28499C56.318 -3.17014 73.8234 -3.07492 80.3846 9.45228L86.1607 20.4805L99.2913 19.0642C112.515 17.638 122.4 31.2398 117.273 43.8056L112.432 55.6691L122.812 65.4834C131.91 74.0854 128.521 89.5478 116.706 93.3405L103.142 97.6947L102.416 112.16C101.782 124.802 88.0549 132.03 77.6488 125.2L64.1198 116.322L50.1826 125.401C39.813 132.157 26.1749 125.004 25.4657 112.437L24.6305 97.6376L11.3805 93.4681C-0.668991 89.6764 -3.98463 73.8148 5.49284 65.3021L15.7753 56.0664L10.862 43.3939C6.0127 30.8864 15.846 17.5696 28.9161 18.944L43.6086 20.4892L49.6273 9.28499ZM39.9433 27.3122L28.2011 26.0774C20.359 25.2527 14.459 33.2428 17.3686 40.7473L21.3624 51.0481L25.6923 47.159C30.2815 43.0369 34.1339 38.1268 37.0764 32.6492L39.9433 27.3122ZM24.105 58.1221L30.3081 52.5505C35.5093 47.8788 39.8753 42.314 43.2101 36.106L47.5067 28.1076L58.9663 29.3127C63.059 29.7431 67.1842 29.7376 71.2758 29.2963L82.2154 28.1164L86.5584 36.4087C89.6881 42.3842 93.7694 47.7829 98.6341 52.3823L104.083 57.5343L101.307 64.3381C98.6651 70.8128 97.1347 77.7062 96.7831 84.7144L96.4004 92.3442L87.1069 95.3275C82.1256 96.9266 77.3714 99.19 72.9666 102.06L64.1336 107.814L55.6224 102.229C51.0766 99.2452 46.1555 96.9094 40.9947 95.2855L31.3389 92.247L30.872 83.9739C30.5046 77.4635 29.1195 71.0558 26.7697 64.995L24.105 58.1221ZM18.5179 63.1404L10.1087 70.6936C4.75185 75.5051 6.62589 84.4704 13.4365 86.6135L24.1995 90.0004L23.8827 84.3877C23.5586 78.6433 22.3365 72.9894 20.2631 67.6416L18.5179 63.1404ZM31.7699 99.8842L32.4549 112.023C32.8558 119.126 40.5643 123.169 46.4254 119.351L57.6213 112.057L51.8455 108.266C47.8345 105.634 43.4924 103.573 38.9388 102.14L31.7699 99.8842ZM70.6321 112.079L81.4257 119.163C87.3074 123.023 95.0663 118.937 95.4248 111.792L96.0172 99.9819L89.2006 102.17C84.8054 103.581 80.6105 105.578 76.7239 108.11L70.6321 112.079ZM103.525 90.057L114.612 86.4979C121.29 84.3541 123.206 75.6145 118.064 70.7525L109.559 62.7112L107.766 67.1033C105.435 72.8163 104.085 78.8987 103.775 85.0823L103.525 90.057ZM106.957 50.4923L110.813 41.0405C113.89 33.501 107.958 25.3399 100.024 26.1956L89.7352 27.3054L92.7277 33.0188C95.4892 38.2913 99.0903 43.0548 103.383 47.1132L106.957 50.4923ZM78.6408 21.2915L70.5427 22.165C66.9324 22.5543 63.2925 22.5592 59.6814 22.1794L51.172 21.2845L55.761 12.7418C59.7754 5.26873 70.2787 5.32586 74.2154 12.8422L78.6408 21.2915Z" fill="currentColor"/>
                    </svg>
                    <span>Rewrite</span>
                </div>
                <div className="loading-indicator">
                    <div className="spinner"></div>
                </div>
            </button>
            <button className={`btn secondary ${isRewriting ? 'loading' : ''}`} onClick={resetText} disabled={isRewriting}>Reset</button>
        </div>
    </div>
  );
};

export default AppleNotesAnimation;
