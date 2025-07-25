import React, { useState, useRef, useLayoutEffect } from 'react';
import './AppleNotesAnimation.css';
import { textVariants } from '../lib/constants';
import { createRippleEffect, createRevealEffect } from '../lib/animation';

const AppleNotesAnimation = () => {
    const [currentVariant, setCurrentVariant] = useState('original');
    const [isRewriting, setIsRewriting] = useState(false);
    const [isFinishing, setIsFinishing] = useState(false);
    const [disableTransition, setDisableTransition] = useState(false);
    const [textLines, setTextLines] = useState(textVariants.original);
    const [animationState, setAnimationState] = useState('');

    const containerRef = useRef(null);
    const textContainerRef = useRef(null);
    const textContentRef = useRef(null);
    const finalContentRef = useRef(null);
    const blurContentRef = useRef(null);
    const arcPathRef = useRef(null);
    const wipePathRef = useRef(null);
    const hideWipePathRef = useRef(null);
    const colorBandRef = useRef(null);

    useLayoutEffect(() => {
        if (!isFinishing) return;

        const container = textContainerRef.current;
        if (!container) return;
        
        setDisableTransition(true);

        requestAnimationFrame(() => {
            if (finalContentRef.current) finalContentRef.current.innerHTML = '';
            container.style.transition = '';
    
            if (wipePathRef.current) wipePathRef.current.setAttribute('d', 'M 0,0 H 0 V 0 A 1,1 0 0,0 0,0 Z');
            if (hideWipePathRef.current) hideWipePathRef.current.setAttribute('d', 'M 0,0 H 0 V 0 A 1,1 0 0,0 0,0 Z');
            if (colorBandRef.current) colorBandRef.current.style.transform = 'translateY(-100%)';
            
            setAnimationState('');
            setIsFinishing(false);

            requestAnimationFrame(() => {
                setDisableTransition(false);
            });
        });
    }, [isFinishing]);

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
        const container = textContainerRef.current;
        const newTexts = textVariants[variant];

        const currentTextLines = Array.from(textContentRef.current.querySelectorAll('.text-line'));
        const blurContent = blurContentRef.current;
        const newBlurHtml = currentTextLines.map(line => `<span class="text-overlay-line">${line.textContent}</span>`).join('');
        blurContent.innerHTML = newBlurHtml;

        setAnimationState('rewriting');
        await new Promise(resolve => setTimeout(resolve, 0));

        await createRippleEffect(arcPathRef, container.offsetHeight, container.offsetWidth);

        const finalContent = finalContentRef.current;
        const newHtml = newTexts.map(text => `<span class="text-overlay-line">${text}</span>`).join('');
        finalContent.innerHTML = newHtml;

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
        });

        setTextLines(newTexts);
        setCurrentVariant(variant);
        setIsRewriting(false);
        setIsFinishing(true);
    };

    const resetText = () => {
        if (isRewriting) return;

        const container = textContainerRef.current;
        const originalTexts = textVariants.original;
        
        setTextLines(originalTexts);
        setCurrentVariant('original');
        setDisableTransition(true);

        if(finalContentRef.current) finalContentRef.current.innerHTML = '';

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
                        <div className="text-overlay-content" ref={finalContentRef} id="finalContent"></div>
                    </div>
                </div>
            </div>
        </div>
        <div className="controls">
            <button className={`btn ${isRewriting ? 'loading' : ''}`} onClick={() => startRewrite('professional')} disabled={isRewriting}>
                <span>Make Professional</span>
                <div className="loading-indicator">
                    <div className="spinner"></div>
                </div>
            </button>
            <button className={`btn ${isRewriting ? 'loading' : ''}`} onClick={() => startRewrite('casual')} disabled={isRewriting}>
                <span>Make Casual</span>
                <div className="loading-indicator">
                    <div className="spinner"></div>
                </div>
            </button>
            <button className={`btn ${isRewriting ? 'loading' : ''}`} onClick={() => startRewrite('creative')} disabled={isRewriting}>
                <span>Make Creative</span>
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