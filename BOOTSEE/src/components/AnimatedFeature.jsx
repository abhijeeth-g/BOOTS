import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

const AnimatedFeature = ({ icon, title, description, index }) => {
  const featureRef = useRef(null);
  const iconRef = useRef(null);
  
  useEffect(() => {
    // Create animation for the feature card
    gsap.fromTo(
      featureRef.current,
      { 
        y: 100, 
        opacity: 0,
        scale: 0.8,
        rotationY: 15
      },
      { 
        y: 0, 
        opacity: 1,
        scale: 1,
        rotationY: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: featureRef.current,
          start: "top 80%",
          end: "top 50%",
          toggleActions: "play none none reverse"
        },
        delay: index * 0.2
      }
    );
    
    // Create animation for the icon
    gsap.fromTo(
      iconRef.current,
      { 
        scale: 0,
        rotation: -45
      },
      { 
        scale: 1,
        rotation: 0,
        duration: 1.2,
        ease: "elastic.out(1, 0.3)",
        scrollTrigger: {
          trigger: featureRef.current,
          start: "top 80%",
          end: "top 50%",
          toggleActions: "play none none reverse"
        },
        delay: 0.3 + index * 0.2
      }
    );
    
    // Hover animation
    featureRef.current.addEventListener('mouseenter', () => {
      gsap.to(featureRef.current, { 
        y: -10, 
        scale: 1.03,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
        borderColor: "#ff1493",
        duration: 0.3,
        ease: "power2.out"
      });
      
      gsap.to(iconRef.current, { 
        rotation: 10,
        scale: 1.1,
        duration: 0.5,
        ease: "elastic.out(1, 0.3)"
      });
    });
    
    featureRef.current.addEventListener('mouseleave', () => {
      gsap.to(featureRef.current, { 
        y: 0, 
        scale: 1,
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        borderColor: "#374151",
        duration: 0.3,
        ease: "power2.out"
      });
      
      gsap.to(iconRef.current, { 
        rotation: 0,
        scale: 1,
        duration: 0.5,
        ease: "elastic.out(1, 0.3)"
      });
    });
    
    return () => {
      // Clean up event listeners
      if (featureRef.current) {
        featureRef.current.removeEventListener('mouseenter', () => {});
        featureRef.current.removeEventListener('mouseleave', () => {});
      }
    };
  }, [index]);
  
  return (
    <div 
      ref={featureRef}
      className="feature-item bg-black bg-opacity-70 p-8 rounded-xl text-center border border-gray-700 transition-all duration-300 shadow-lg"
      style={{ 
        backdropFilter: 'blur(10px)',
        perspective: '1000px',
        transformStyle: 'preserve-3d'
      }}
    >
      <div 
        ref={iconRef}
        className="w-20 h-20 bg-gradient-to-br from-secondary to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
      >
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
      <p className="text-gray-300">{description}</p>
    </div>
  );
};

export default AnimatedFeature;
