import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

const AnimatedFeature = ({ icon, title, description, index }) => {
  const featureRef = useRef(null);
  const iconRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Set initial state to ensure content is visible
    if (featureRef.current) {
      gsap.set(featureRef.current, {
        opacity: 1,
        y: 0,
        scale: 1,
        rotationY: 0
      });
    }

    if (iconRef.current) {
      gsap.set(iconRef.current, {
        opacity: 1,
        scale: 1,
        rotation: 0
      });
    }

    // Ensure content is visible immediately
    setIsVisible(true);

    // Create a more subtle animation for the feature card
    const featureAnimation = gsap.fromTo(
      featureRef.current,
      {
        y: 30,
        opacity: 0.5,
        scale: 0.95
      },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: featureRef.current,
          start: "top 90%",
          toggleActions: "play none none none"
        },
        delay: index * 0.15
      }
    );

    // Create a more subtle animation for the icon
    const iconAnimation = gsap.fromTo(
      iconRef.current,
      {
        scale: 0.8,
        opacity: 0.8
      },
      {
        scale: 1,
        opacity: 1,
        duration: 0.8,
        ease: "back.out(1.5)",
        scrollTrigger: {
          trigger: featureRef.current,
          start: "top 90%",
          toggleActions: "play none none none"
        },
        delay: 0.2 + index * 0.15
      }
    );

    // Hover animation with proper event handlers
    const handleMouseEnter = () => {
      gsap.to(featureRef.current, {
        y: -5,
        scale: 1.02,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
        borderColor: "#ff1493",
        duration: 0.3,
        ease: "power2.out"
      });

      gsap.to(iconRef.current, {
        rotation: 5,
        scale: 1.05,
        duration: 0.3,
        ease: "power2.out"
      });
    };

    const handleMouseLeave = () => {
      gsap.to(featureRef.current, {
        y: 0,
        scale: 1,
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        borderColor: "rgba(75, 85, 99, 0.5)",
        duration: 0.3,
        ease: "power2.out"
      });

      gsap.to(iconRef.current, {
        rotation: 0,
        scale: 1,
        duration: 0.3,
        ease: "power2.out"
      });
    };

    const element = featureRef.current;
    if (element) {
      element.addEventListener('mouseenter', handleMouseEnter);
      element.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      // Kill animations to prevent memory leaks
      if (featureAnimation) featureAnimation.kill();
      if (iconAnimation) iconAnimation.kill();

      // Clean up event listeners properly
      if (element) {
        element.removeEventListener('mouseenter', handleMouseEnter);
        element.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [index]);

  return (
    <div
      ref={featureRef}
      className="feature-item bg-black bg-opacity-70 p-8 rounded-xl text-center border border-gray-800 transition-all duration-300 shadow-lg"
      style={{
        backdropFilter: 'blur(10px)',
        opacity: isVisible ? 1 : 0, // Ensure content is visible by default
        display: 'block', // Ensure element is displayed
        width: '100%' // Ensure element takes full width
      }}
    >
      <div
        ref={iconRef}
        className="w-20 h-20 bg-gradient-to-br from-secondary to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
      >
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
      <p className="text-white">{description}</p>
    </div>
  );
};

export default AnimatedFeature;
