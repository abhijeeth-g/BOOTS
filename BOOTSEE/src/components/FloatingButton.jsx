import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const FloatingButton = ({ 
  children, 
  className = "", 
  onClick,
  hoverScale = 1.05,
  hoverY = -5,
  glowColor = "rgba(255, 20, 147, 0.5)",
  delay = 0
}) => {
  const buttonRef = useRef(null);
  const timelineRef = useRef(null);
  
  useEffect(() => {
    const button = buttonRef.current;
    
    if (!button) return;
    
    // Create a timeline for the floating animation
    const tl = gsap.timeline({ repeat: -1, yoyo: true });
    timelineRef.current = tl;
    
    // Add the floating animation
    tl.to(button, {
      y: -10,
      duration: 1.5,
      ease: "sine.inOut"
    })
    .to(button, {
      y: 0,
      duration: 1.5,
      ease: "sine.inOut"
    });
    
    // Initial animation
    gsap.from(button, {
      y: 50,
      opacity: 0,
      scale: 0.8,
      duration: 0.8,
      delay: delay,
      ease: "back.out(1.7)"
    });
    
    // Add hover effects
    button.addEventListener('mouseenter', () => {
      gsap.to(button, {
        scale: hoverScale,
        y: hoverY,
        boxShadow: `0 10px 25px ${glowColor}`,
        duration: 0.3,
        ease: "power2.out"
      });
      
      // Pause the floating animation
      tl.pause();
    });
    
    button.addEventListener('mouseleave', () => {
      gsap.to(button, {
        scale: 1,
        y: 0,
        boxShadow: `0 5px 15px rgba(0, 0, 0, 0.2)`,
        duration: 0.3,
        ease: "power2.out"
      });
      
      // Resume the floating animation
      tl.resume();
    });
    
    // Cleanup
    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
      
      button.removeEventListener('mouseenter', () => {});
      button.removeEventListener('mouseleave', () => {});
    };
  }, [delay, hoverScale, hoverY, glowColor]);
  
  return (
    <button
      ref={buttonRef}
      className={`transform-gpu ${className}`}
      onClick={onClick}
      style={{
        willChange: 'transform',
        transition: 'box-shadow 0.3s ease',
      }}
    >
      {children}
    </button>
  );
};

export default FloatingButton;
