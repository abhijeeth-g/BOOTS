import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

const FloatingElement = ({ children, delay = 0, duration = 2, distance = 15, rotation = 5, scale = 0.05 }) => {
  const elementRef = useRef(null);
  const timelineRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const element = elementRef.current;

    if (element) {
      // Set initial state to ensure content is visible
      gsap.set(element, {
        opacity: 1,
        scale: 1,
        rotation: 0,
        x: 0,
        y: 0
      });

      // Delay starting the animation to ensure content is rendered first
      const startAnimationTimeout = setTimeout(() => {
        setIsAnimating(true);

        // Create a timeline for continuous animation with reduced intensity
        const tl = gsap.timeline({
          repeat: -1,
          yoyo: true,
          defaults: {
            ease: "sine.inOut",
            overwrite: "auto"
          }
        });

        timelineRef.current = tl;

        // Use smaller values for more subtle animation
        const safeDistance = Math.min(distance, 10);
        const safeRotation = Math.min(rotation, 3);
        const safeScale = Math.min(scale, 0.03);

        // Create the floating animation with more subtle movements
        tl.to(element, {
          y: `-=${safeDistance}`,
          x: `+=${safeDistance / 4}`,
          rotation: `+=${safeRotation}`,
          scale: 1 + safeScale,
          duration: duration,
        })
        .to(element, {
          y: `+=${safeDistance}`,
          x: `-=${safeDistance / 4}`,
          rotation: `-=${safeRotation}`,
          scale: 1 - (safeScale / 2),
          duration: duration * 1.2,
        })
        .to(element, {
          y: 0,
          x: 0,
          rotation: 0,
          scale: 1,
          duration: duration * 0.8,
        });

        // Start the animation
        tl.play();

        // Add hover effect with more subtle changes
        const handleMouseEnter = () => {
          if (timelineRef.current) {
            timelineRef.current.pause();
          }

          gsap.to(element, {
            scale: 1.05,
            duration: 0.3,
            ease: "back.out(1.7)",
            overwrite: "auto"
          });
        };

        const handleMouseLeave = () => {
          gsap.to(element, {
            scale: 1,
            duration: 0.3,
            ease: "power2.out",
            overwrite: "auto",
            onComplete: () => {
              if (timelineRef.current && isAnimating) {
                timelineRef.current.play();
              }
            }
          });
        };

        element.addEventListener('mouseenter', handleMouseEnter);
        element.addEventListener('mouseleave', handleMouseLeave);

        // Clean up event listeners
        return () => {
          element.removeEventListener('mouseenter', handleMouseEnter);
          element.removeEventListener('mouseleave', handleMouseLeave);
        };
      }, 500); // Delay animation start

      // Initial fade-in animation (subtle)
      gsap.fromTo(element,
        {
          y: 20,
          opacity: 0
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: "power2.out",
          delay: delay
        }
      );

      return () => {
        // Clean up animation and timeout
        clearTimeout(startAnimationTimeout);
        if (timelineRef.current) {
          timelineRef.current.kill();
        }
        setIsAnimating(false);
      };
    }
  }, [delay, duration, distance, rotation, scale]);

  return (
    <div
      ref={elementRef}
      className="inline-block transform-gpu"
      style={{
        willChange: 'transform',
        transformStyle: 'preserve-3d',
        opacity: 1, // Ensure content is visible by default
        display: 'block', // Ensure element is displayed
        width: '100%' // Ensure element takes full width
      }}
    >
      {children}
    </div>
  );
};

export default FloatingElement;
