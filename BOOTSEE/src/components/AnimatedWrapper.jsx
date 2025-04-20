import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const AnimatedWrapper = ({ children, delay = 0, duration = 0.5, y = 20, className = '' }) => {
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    
    gsap.fromTo(
      element,
      { 
        y: y, 
        opacity: 0 
      },
      { 
        y: 0, 
        opacity: 1, 
        duration: duration, 
        delay: delay,
        ease: "power3.out"
      }
    );

    return () => {
      // Cleanup animation if component unmounts during animation
      gsap.killTweensOf(element);
    };
  }, [delay, duration, y]);

  return (
    <div ref={elementRef} className={className}>
      {children}
    </div>
  );
};

export default AnimatedWrapper;
