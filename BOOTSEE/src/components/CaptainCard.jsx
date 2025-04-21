import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const CaptainCard = ({ 
  children, 
  className = "", 
  title,
  icon,
  delay = 0,
  maxHeight = null,
  scrollable = false,
  onClick
}) => {
  const cardRef = useRef(null);
  const titleRef = useRef(null);
  const contentRef = useRef(null);
  const iconRef = useRef(null);
  
  useEffect(() => {
    const card = cardRef.current;
    const titleElement = titleRef.current;
    const content = contentRef.current;
    const iconElement = iconRef.current;
    
    if (!card || !titleElement || !content) return;
    
    // Initial animation
    gsap.from(card, {
      y: 50,
      opacity: 0,
      duration: 0.8,
      delay: delay,
      ease: "power3.out"
    });
    
    // Title animation
    gsap.from(titleElement, {
      x: -20,
      opacity: 0,
      duration: 0.6,
      delay: delay + 0.2,
      ease: "back.out(1.7)"
    });
    
    // Icon animation
    if (iconElement) {
      gsap.from(iconElement, {
        scale: 0,
        rotation: 180,
        opacity: 0,
        duration: 0.8,
        delay: delay + 0.1,
        ease: "elastic.out(1, 0.3)"
      });
    }
    
    // Content animation
    gsap.from(content.children, {
      y: 20,
      opacity: 0,
      stagger: 0.1,
      duration: 0.6,
      delay: delay + 0.3,
      ease: "power3.out"
    });
    
    // Hover animation
    card.addEventListener('mouseenter', () => {
      gsap.to(card, {
        y: -5,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
        borderColor: '#ff1493',
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
        borderColor: 'rgba(75, 85, 99, 0.5)',
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
    };
  }, [delay]);
  
  return (
    <div 
      ref={cardRef}
      className={`bg-gradient-to-br from-gray-900 to-black rounded-xl shadow-lg border border-gray-700 overflow-hidden transition-all duration-300 ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <h2 ref={titleRef} className="text-xl font-bold text-white flex items-center">
          {icon && (
            <span ref={iconRef} className="inline-block mr-2 text-secondary">
              {icon}
            </span>
          )}
          {title}
        </h2>
      </div>
      <div 
        ref={contentRef} 
        className={`p-4 ${scrollable ? 'overflow-y-auto' : ''}`}
        style={maxHeight ? { maxHeight } : {}}
      >
        {children}
      </div>
    </div>
  );
};

export default CaptainCard;
