import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const Interactive3DCard = ({ 
  children, 
  className = "", 
  depth = 30, 
  sensitivity = 20,
  glareOpacity = 0.2,
  perspective = 1000,
  borderRadius = "1rem",
  backgroundColor = "rgba(0, 0, 0, 0.5)",
  borderColor = "#ff1493",
  glareColor = "rgba(255, 255, 255, 0.5)",
  shadowColor = "rgba(255, 20, 147, 0.3)",
  onClick
}) => {
  const cardRef = useRef(null);
  const glareRef = useRef(null);
  const contentRef = useRef(null);
  
  useEffect(() => {
    const card = cardRef.current;
    const glare = glareRef.current;
    const content = contentRef.current;
    
    if (!card || !glare || !content) return;
    
    let bounds;
    let mouseX = 0;
    let mouseY = 0;
    
    const handleMouseMove = (e) => {
      if (!bounds) bounds = card.getBoundingClientRect();
      
      // Calculate mouse position relative to card center
      mouseX = (e.clientX - bounds.left - bounds.width / 2) / (bounds.width / 2);
      mouseY = (e.clientY - bounds.top - bounds.height / 2) / (bounds.height / 2);
      
      // Apply rotation
      gsap.to(card, {
        rotationY: mouseX * sensitivity,
        rotationX: -mouseY * sensitivity,
        duration: 0.5,
        ease: "power2.out",
        transformPerspective: perspective,
        transformStyle: "preserve-3d"
      });
      
      // Move content slightly for depth effect
      gsap.to(content, {
        x: mouseX * depth / 2,
        y: mouseY * depth / 2,
        duration: 0.5,
        ease: "power2.out"
      });
      
      // Move glare effect
      gsap.to(glare, {
        opacity: glareOpacity,
        x: `${mouseX * 100}%`,
        y: `${mouseY * 100}%`,
        duration: 0.5,
        ease: "power2.out"
      });
    };
    
    const handleMouseEnter = () => {
      // Reset bounds on mouse enter
      bounds = card.getBoundingClientRect();
      
      // Add shadow and scale up
      gsap.to(card, {
        scale: 1.03,
        boxShadow: `0 30px 50px -15px ${shadowColor}`,
        duration: 0.4,
        ease: "power2.out"
      });
      
      // Show glare
      gsap.to(glare, {
        opacity: glareOpacity,
        duration: 0.4
      });
    };
    
    const handleMouseLeave = () => {
      // Reset card position
      gsap.to(card, {
        rotationY: 0,
        rotationX: 0,
        scale: 1,
        boxShadow: `0 15px 35px -10px ${shadowColor}`,
        duration: 0.7,
        ease: "power3.out"
      });
      
      // Reset content position
      gsap.to(content, {
        x: 0,
        y: 0,
        duration: 0.7,
        ease: "power3.out"
      });
      
      // Hide glare
      gsap.to(glare, {
        opacity: 0,
        duration: 0.7
      });
    };
    
    // Add event listeners
    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mouseleave', handleMouseLeave);
    
    // Initial animation
    gsap.from(card, {
      y: 50,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out"
    });
    
    // Cleanup
    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseenter', handleMouseEnter);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [depth, sensitivity, glareOpacity, perspective, shadowColor]);
  
  return (
    <div 
      ref={cardRef}
      className={`relative overflow-hidden transform-gpu ${className}`}
      style={{ 
        borderRadius,
        backgroundColor,
        border: `1px solid ${borderColor}`,
        boxShadow: `0 15px 35px -10px ${shadowColor}`,
        willChange: 'transform',
        transformStyle: 'preserve-3d',
        cursor: onClick ? 'pointer' : 'default'
      }}
      onClick={onClick}
    >
      {/* Glare effect */}
      <div 
        ref={glareRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${glareColor} 0%, transparent 50%)`,
          opacity: 0,
          transform: 'translate(-50%, -50%)',
          width: '200%',
          height: '200%',
          top: '50%',
          left: '50%'
        }}
      />
      
      {/* Content container */}
      <div 
        ref={contentRef} 
        className="relative z-10"
      >
        {children}
      </div>
    </div>
  );
};

export default Interactive3DCard;
