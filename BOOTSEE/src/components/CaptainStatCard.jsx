import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const CaptainStatCard = ({ 
  title, 
  value, 
  icon, 
  color = 'secondary',
  trend = null, // 'up', 'down', or null
  trendValue = null,
  delay = 0,
  className = ""
}) => {
  const cardRef = useRef(null);
  const valueRef = useRef(null);
  const iconRef = useRef(null);
  const trendRef = useRef(null);
  
  // Define color classes
  const colorClasses = {
    secondary: 'text-secondary',
    green: 'text-green-500',
    blue: 'text-blue-500',
    yellow: 'text-yellow-500',
    red: 'text-red-500',
    purple: 'text-purple-500'
  };
  
  const bgColorClasses = {
    secondary: 'bg-secondary bg-opacity-10',
    green: 'bg-green-500 bg-opacity-10',
    blue: 'bg-blue-500 bg-opacity-10',
    yellow: 'bg-yellow-500 bg-opacity-10',
    red: 'bg-red-500 bg-opacity-10',
    purple: 'bg-purple-500 bg-opacity-10'
  };
  
  const borderColorClasses = {
    secondary: 'border-secondary',
    green: 'border-green-500',
    blue: 'border-blue-500',
    yellow: 'border-yellow-500',
    red: 'border-red-500',
    purple: 'border-purple-500'
  };
  
  useEffect(() => {
    const card = cardRef.current;
    const valueElement = valueRef.current;
    const iconElement = iconRef.current;
    const trendElement = trendRef.current;
    
    if (!card || !valueElement) return;
    
    // Create a timeline for the animations
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: card,
        start: "top 80%",
        toggleActions: "play none none none"
      }
    });
    
    // Card animation
    tl.from(card, {
      y: 30,
      opacity: 0,
      duration: 0.6,
      delay: delay,
      ease: "power3.out"
    });
    
    // Value animation - count up effect
    const startValue = 0;
    const endValue = parseFloat(value) || 0;
    
    tl.from(valueElement, {
      textContent: startValue,
      duration: 1.5,
      ease: "power2.out",
      snap: { textContent: 1 },
      onUpdate: function() {
        if (typeof endValue === 'number') {
          valueElement.textContent = Math.round(this.targets()[0].textContent);
        }
      }
    }, "-=0.3");
    
    // Icon animation
    if (iconElement) {
      tl.from(iconElement, {
        scale: 0,
        rotation: 180,
        opacity: 0,
        duration: 0.8,
        ease: "elastic.out(1, 0.3)"
      }, "-=1.2");
    }
    
    // Trend animation
    if (trendElement) {
      tl.from(trendElement, {
        y: trend === 'up' ? 20 : -20,
        opacity: 0,
        duration: 0.6,
        ease: "back.out(1.7)"
      }, "-=0.8");
    }
    
    // Hover animation
    card.addEventListener('mouseenter', () => {
      gsap.to(card, {
        y: -5,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
        duration: 0.3,
        ease: "power2.out"
      });
      
      if (iconElement) {
        gsap.to(iconElement, {
          rotation: '+=30',
          scale: 1.1,
          duration: 0.4,
          ease: "power2.out"
        });
      }
    });
    
    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        y: 0,
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        duration: 0.3,
        ease: "power2.out"
      });
      
      if (iconElement) {
        gsap.to(iconElement, {
          rotation: '-=30',
          scale: 1,
          duration: 0.4,
          ease: "power2.out"
        });
      }
    });
    
    // Cleanup
    return () => {
      card.removeEventListener('mouseenter', () => {});
      card.removeEventListener('mouseleave', () => {});
      
      if (card.scrollTrigger) {
        card.scrollTrigger.kill();
      }
    };
  }, [delay, value, trend]);
  
  return (
    <div 
      ref={cardRef}
      className={`bg-black bg-opacity-50 backdrop-blur-sm rounded-xl p-5 border border-gray-700 hover:${borderColorClasses[color]} transition-all duration-300 ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-400">{title}</h3>
        {icon && (
          <div ref={iconRef} className={`w-10 h-10 ${bgColorClasses[color]} rounded-full flex items-center justify-center ${colorClasses[color]}`}>
            {icon}
          </div>
        )}
      </div>
      
      <div className="flex items-end">
        <div ref={valueRef} className={`text-3xl font-bold ${colorClasses[color]}`}>
          {value}
        </div>
        
        {trend && (
          <div 
            ref={trendRef}
            className={`ml-2 mb-1 flex items-center ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}
          >
            {trend === 'up' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
              </svg>
            )}
            <span className="text-xs ml-1">{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaptainStatCard;
