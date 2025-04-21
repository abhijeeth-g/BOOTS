import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const AnimatedAuthForm = ({ children, title }) => {
  const formRef = useRef(null);
  const titleRef = useRef(null);
  const formElementsRef = useRef(null);
  
  useEffect(() => {
    if (formRef.current && titleRef.current && formElementsRef.current) {
      // Create a timeline
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      
      // Animate the form container
      tl.fromTo(
        formRef.current,
        { 
          y: 50, 
          opacity: 0,
          scale: 0.9,
          boxShadow: '0 0 0 rgba(0, 0, 0, 0)'
        },
        { 
          y: 0, 
          opacity: 1,
          scale: 1,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          duration: 0.8
        }
      );
      
      // Animate the title
      tl.fromTo(
        titleRef.current,
        { 
          y: -20, 
          opacity: 0,
          clipPath: 'polygon(0 0, 100% 0, 100% 0, 0 0)'
        },
        { 
          y: 0, 
          opacity: 1,
          clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
          duration: 0.6
        },
        '-=0.4'
      );
      
      // Animate form elements
      const formElements = formElementsRef.current.children;
      tl.fromTo(
        formElements,
        { 
          y: 30, 
          opacity: 0
        },
        { 
          y: 0, 
          opacity: 1,
          stagger: 0.1,
          duration: 0.5
        },
        '-=0.3'
      );
      
      // Add hover effect to the form
      formRef.current.addEventListener('mouseenter', () => {
        gsap.to(formRef.current, {
          boxShadow: '0 25px 60px -12px rgba(255, 20, 147, 0.3)',
          borderColor: '#ff1493',
          duration: 0.3
        });
      });
      
      formRef.current.addEventListener('mouseleave', () => {
        gsap.to(formRef.current, {
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          borderColor: '#ff1493',
          duration: 0.3
        });
      });
      
      // Cleanup
      return () => {
        if (formRef.current) {
          formRef.current.removeEventListener('mouseenter', () => {});
          formRef.current.removeEventListener('mouseleave', () => {});
        }
      };
    }
  }, []);
  
  return (
    <div 
      ref={formRef}
      className="w-full max-w-md bg-gradient-to-br from-gray-900 to-black shadow-2xl rounded-2xl p-8 border border-secondary relative overflow-hidden"
      style={{ backdropFilter: 'blur(10px)' }}
    >
      {/* Animated background gradient */}
      <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg blur opacity-20 animate-pulse"></div>
      
      {/* Content */}
      <div className="relative z-10">
        <h2 ref={titleRef} className="text-3xl font-bold text-center text-white mb-8">
          <span className="text-secondary">{title.split(' ')[0]}</span> {title.split(' ').slice(1).join(' ')}
        </h2>
        
        <div ref={formElementsRef}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AnimatedAuthForm;
