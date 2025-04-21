import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const FloatingElement = ({ children, delay = 0, duration = 2, distance = 15, rotation = 5, scale = 0.05 }) => {
  const elementRef = useRef(null);
  const timelineRef = useRef(null);
  
  useEffect(() => {
    const element = elementRef.current;
    
    if (element) {
      // Create a timeline for continuous animation
      const tl = gsap.timeline({ repeat: -1, yoyo: true });
      timelineRef.current = tl;
      
      // Random starting point in the timeline to create variation
      const startPosition = Math.random();
      
      // Create the floating animation
      tl.to(element, {
        y: `-=${distance}`,
        x: `+=${distance / 3}`,
        rotation: `+=${rotation}`,
        scale: `+=${scale}`,
        duration: duration,
        ease: "sine.inOut",
      })
      .to(element, {
        y: `+=${distance}`,
        x: `-=${distance / 2}`,
        rotation: `-=${rotation * 1.5}`,
        scale: `-=${scale}`,
        duration: duration * 1.2,
        ease: "sine.inOut",
      })
      .to(element, {
        y: `-=${distance / 2}`,
        x: `+=${distance / 6}`,
        rotation: `+=${rotation / 2}`,
        scale: `+=${scale / 2}`,
        duration: duration * 0.8,
        ease: "sine.inOut",
      });
      
      // Start the timeline at a random position for variety
      tl.progress(startPosition).play();
      
      // Add hover effect
      element.addEventListener('mouseenter', () => {
        gsap.to(element, {
          scale: 1.1,
          duration: 0.3,
          ease: "back.out(1.7)",
          overwrite: "auto"
        });
        
        // Pause the floating animation
        tl.pause();
      });
      
      element.addEventListener('mouseleave', () => {
        gsap.to(element, {
          scale: 1,
          duration: 0.5,
          ease: "elastic.out(1, 0.3)",
          overwrite: "auto"
        });
        
        // Resume the floating animation
        tl.play();
      });
      
      // Initial animation
      gsap.from(element, {
        y: 50,
        opacity: 0,
        scale: 0.8,
        duration: 1,
        ease: "back.out(1.7)",
        delay: delay
      });
    }
    
    return () => {
      // Clean up animation
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
    };
  }, [delay, duration, distance, rotation, scale]);
  
  return (
    <div 
      ref={elementRef} 
      className="inline-block transform-gpu"
      style={{ 
        willChange: 'transform',
        transformStyle: 'preserve-3d',
      }}
    >
      {children}
    </div>
  );
};

export default FloatingElement;
