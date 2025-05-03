import { useEffect, useRef } from 'react';

const LightweightBackground = () => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let hue = 0;
    
    // Set canvas dimensions
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    // Initial resize
    resizeCanvas();
    
    // Listen for window resize
    window.addEventListener('resize', resizeCanvas);
    
    // Animation function
    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Create gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      
      // Use a slow-changing hue for the primary color (pink/purple range)
      hue = (hue + 0.1) % 360;
      const primaryHue = (hue % 60) + 300; // Keep in pink/purple range (300-360)
      
      gradient.addColorStop(0, `hsl(${primaryHue}, 70%, 15%)`);
      gradient.addColorStop(1, 'hsl(240, 70%, 5%)');
      
      // Fill background
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add subtle particles
      const particleCount = 20;
      for (let i = 0; i < particleCount; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 2;
        const opacity = Math.random() * 0.2;
        
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fill();
      }
      
      // Continue animation
      animationFrameId = requestAnimationFrame(animate);
    };
    
    // Start animation
    animate();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);
  
  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full -z-10"
      style={{ pointerEvents: 'none' }}
    />
  );
};

export default LightweightBackground;
