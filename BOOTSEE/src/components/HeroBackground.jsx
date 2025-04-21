import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial } from '@react-three/drei';
import { gsap } from 'gsap';

const AnimatedSphere = ({ position, color, speed, distort }) => {
  const sphereRef = useRef();
  
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed;
    sphereRef.current.position.y = Math.sin(t) * 0.2;
    sphereRef.current.rotation.x = t * 0.1;
    sphereRef.current.rotation.z = t * 0.1;
  });

  useEffect(() => {
    gsap.from(sphereRef.current.scale, {
      x: 0,
      y: 0,
      z: 0,
      duration: 1.5,
      ease: "elastic.out(1, 0.3)",
      delay: Math.random()
    });
  }, []);

  return (
    <Sphere ref={sphereRef} args={[1, 32, 32]} position={position}>
      <MeshDistortMaterial 
        color={color} 
        attach="material" 
        distort={distort} 
        speed={0.5} 
        roughness={0.2}
        metalness={0.8}
      />
    </Sphere>
  );
};

const HeroBackground = () => {
  return (
    <div className="absolute inset-0 z-0 opacity-70">
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#ff69b4" />
        <AnimatedSphere position={[-3, 0, 0]} color="#ff1493" speed={0.5} distort={0.4} />
        <AnimatedSphere position={[3, 0, 0]} color="#ff69b4" speed={0.7} distort={0.6} />
        <AnimatedSphere position={[0, 2, -2]} color="#ff69b4" speed={0.3} distort={0.3} />
        <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
      </Canvas>
    </div>
  );
};

export default HeroBackground;
