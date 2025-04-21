import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const AnimatedText = ({
  children,
  className = "",
  type = "words", // words, lines
  stagger = 0.03,
  duration = 0.8,
  delay = 0,
  from = { y: 50, opacity: 0 },
  ease = "power3.out",
  as = "div"
}) => {
  const textRef = useRef(null);

  useEffect(() => {
    if (!textRef.current) return;

    // Manual text splitting approach
    const text = textRef.current;
    const originalHTML = text.innerHTML;
    let newHTML = '';

    if (type === 'words') {
      // Split by words
      newHTML = originalHTML
        .split(/\s+/)
        .map(word => `<span class="animated-word">${word}</span>`)
        .join(' ');
    } else if (type === 'lines') {
      // For lines, we'll wrap each line in a span
      // This is a simplified approach - in production you might want to use
      // a more sophisticated method to detect actual visual lines
      newHTML = originalHTML
        .split('\n')
        .map(line => `<span class="animated-line">${line}</span>`)
        .join('<br>');
    } else {
      // Default to the original content
      newHTML = originalHTML;
    }

    // Set the new HTML
    text.innerHTML = newHTML;

    // Get the elements to animate
    const elements = type === 'words'
      ? text.querySelectorAll('.animated-word')
      : text.querySelectorAll('.animated-line');

    // Set initial state
    gsap.set(elements, {
      opacity: 0,
      y: from.y,
      x: from.x || 0,
      rotationX: from.rotationX || 0,
      rotationY: from.rotationY || 0,
      scale: from.scale || 1
    });

    // Animate in
    gsap.to(elements, {
      opacity: 1,
      y: 0,
      x: 0,
      rotationX: 0,
      rotationY: 0,
      scale: 1,
      duration: duration,
      stagger: stagger,
      delay: delay,
      ease: ease
    });

    // Cleanup - not needed since we're not using SplitText
    return () => {};
  }, [children, type, stagger, duration, delay, from, ease]);

  // Dynamically create the element based on the 'as' prop
  const Component = as;

  return (
    <Component ref={textRef} className={className}>
      {children}
    </Component>
  );
};

export default AnimatedText;
