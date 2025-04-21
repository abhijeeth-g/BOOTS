import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const AnimatedCounter = ({ 
  end, 
  duration = 2.5, 
  delay = 0.2, 
  prefix = '', 
  suffix = '', 
  decimals = 0,
  className = '',
  triggerElement = null,
  startOnScroll = true,
  onComplete = null
}) => {
  const counterRef = useRef(null);
  const valueRef = useRef(0);
  const [value, setValue] = useState(0);
  const hasAnimated = useRef(false);
  
  useEffect(() => {
    const counter = counterRef.current;
    
    if (!counter) return;
    
    const animateCounter = () => {
      if (hasAnimated.current) return;
      
      hasAnimated.current = true;
      
      gsap.to(valueRef, {
        current: end,
        duration: duration,
        delay: delay,
        ease: "power2.out",
        onUpdate: () => {
          const value = valueRef.current;
          setValue(Number(value.toFixed(decimals)));
        },
        onComplete: () => {
          if (onComplete) onComplete();
        }
      });
      
      // Add number jumping animation
      gsap.fromTo(counter, 
        { 
          y: 0 
        }, 
        {
          y: -10,
          duration: 0.1,
          ease: "power1.inOut",
          yoyo: true,
          repeat: 5,
          delay: delay
        }
      );
    };
    
    if (startOnScroll && triggerElement) {
      // Create scroll trigger
      ScrollTrigger.create({
        trigger: triggerElement,
        start: "top 80%",
        onEnter: animateCounter,
        once: true
      });
    } else {
      // Animate immediately
      animateCounter();
    }
    
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [end, duration, delay, decimals, triggerElement, startOnScroll, onComplete]);
  
  return (
    <span ref={counterRef} className={className}>
      {prefix}{value.toLocaleString()}{suffix}
    </span>
  );
};

export default AnimatedCounter;
