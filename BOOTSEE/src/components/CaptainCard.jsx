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

    // Store animations for cleanup
    const animations = [];

    // CRITICAL: Make sure all elements are visible by default
    // This ensures elements don't disappear if animations fail
    gsap.set(card, { opacity: 1, y: 0 });
    gsap.set(titleElement, { opacity: 1, x: 0 });
    if (iconElement) gsap.set(iconElement, { opacity: 1, scale: 1, rotation: 0 });
    gsap.set(content.children, { opacity: 1, y: 0 });

    // Use very subtle animations that won't break the layout

    // Card fade in - subtle slide up
    const cardAnim = gsap.fromTo(card,
      { y: 15, opacity: 0.9 },
      {
        y: 0,
        opacity: 1,
        duration: 0.5,
        delay: delay,
        ease: "power2.out"
      }
    );
    animations.push(cardAnim);

    // Title animation - subtle fade in
    const titleAnim = gsap.fromTo(titleElement,
      { x: -5, opacity: 0.9 },
      {
        x: 0,
        opacity: 1,
        duration: 0.4,
        delay: delay + 0.1,
        ease: "power2.out"
      }
    );
    animations.push(titleAnim);

    // Icon animation - subtle fade in, no rotation
    if (iconElement) {
      const iconAnim = gsap.fromTo(iconElement,
        { scale: 0.9, opacity: 0.9 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.4,
          delay: delay + 0.1,
          ease: "power2.out"
        }
      );
      animations.push(iconAnim);
    }

    // Content animation - subtle fade in
    if (content.children.length > 0) {
      const contentAnim = gsap.fromTo(content.children,
        { y: 5, opacity: 0.9 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.05,
          duration: 0.4,
          delay: delay + 0.2,
          ease: "power2.out"
        }
      );
      animations.push(contentAnim);
    }

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
      // Remove event listeners
      card.removeEventListener('mouseenter', () => {});
      card.removeEventListener('mouseleave', () => {});

      // Kill all animations
      animations.forEach(anim => {
        if (anim && anim.kill) anim.kill();
      });
    };
  }, [delay]);

  return (
    <div
      ref={cardRef}
      className={`bg-gradient-to-br from-gray-900 to-black rounded-xl shadow-lg border border-gray-800 overflow-hidden transition-all duration-300 ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-black bg-opacity-50">
        <h2 ref={titleRef} className="text-xl font-bold text-secondary flex items-center">
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
