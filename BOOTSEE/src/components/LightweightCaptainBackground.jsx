import { useEffect, useRef } from 'react';

const LightweightCaptainBackground = () => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let time = 0;
    
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
      time += 0.01;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, 'hsl(240, 70%, 10%)');
      gradient.addColorStop(1, 'hsl(280, 70%, 5%)');
      
      // Fill background
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw road-like pattern at the bottom
      ctx.fillStyle = 'rgba(40, 40, 40, 0.5)';
      ctx.fillRect(0, canvas.height * 0.7, canvas.width, canvas.height * 0.3);
      
      // Draw road lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 5;
      ctx.setLineDash([40, 30]);
      ctx.lineDashOffset = -time * 100; // Animate the dash
      
      ctx.beginPath();
      ctx.moveTo(0, canvas.height * 0.8);
      ctx.lineTo(canvas.width, canvas.height * 0.8);
      ctx.stroke();
      
      // Draw stars/particles
      const particleCount = 100;
      for (let i = 0; i < particleCount; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height * 0.7; // Only in the sky part
        const radius = Math.random() * 1.5;
        const opacity = Math.random() * 0.5 + 0.2;
        
        // Create a pink/purple color
        const hue = 280 + Math.random() * 60; // 280-340 range (purple to pink)
        
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue}, 80%, 70%, ${opacity})`;
        ctx.fill();
      }
      
      // Draw a simple bike silhouette
      const bikeX = canvas.width / 2 + Math.sin(time) * 20;
      const bikeY = canvas.height * 0.7 - 50;
      
      ctx.save();
      ctx.translate(bikeX, bikeY);
      
      // Bike frame
      ctx.strokeStyle = '#ff1493';
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      
      // Draw wheels
      ctx.beginPath();
      ctx.arc(-20, 0, 20, 0, Math.PI * 2);
      ctx.strokeStyle = '#ff1493';
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(20, 0, 20, 0, Math.PI * 2);
      ctx.stroke();
      
      // Draw frame
      ctx.beginPath();
      ctx.moveTo(-20, 0);
      ctx.lineTo(0, -20);
      ctx.lineTo(20, 0);
      ctx.lineTo(-20, 0);
      ctx.stroke();
      
      // Draw handlebars
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(0, -30);
      ctx.stroke();
      
      // Draw seat
      ctx.beginPath();
      ctx.moveTo(-20, 0);
      ctx.lineTo(-20, -15);
      ctx.stroke();
      
      ctx.restore();
      
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

export default LightweightCaptainBackground;
