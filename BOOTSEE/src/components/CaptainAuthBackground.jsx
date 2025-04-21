import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';

const CaptainAuthBackground = () => {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const bikeModelRef = useRef(null);
  const particlesRef = useRef(null);
  const mouseX = useRef(0);
  const mouseY = useRef(0);
  
  useEffect(() => {
    // Initialize Three.js scene
    const container = containerRef.current;
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Create scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 30;
    cameraRef.current = camera;
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Create road-like particles
    const roadGeometry = new THREE.BufferGeometry();
    const roadParticlesCount = 500;
    const roadPosArray = new Float32Array(roadParticlesCount * 3);
    
    for (let i = 0; i < roadParticlesCount; i++) {
      // Create a road-like pattern
      const i3 = i * 3;
      roadPosArray[i3] = (Math.random() - 0.5) * 50; // x
      roadPosArray[i3 + 1] = (Math.random() - 0.5) * 5 - 10; // y (mostly at the bottom)
      roadPosArray[i3 + 2] = (Math.random() - 0.5) * 50; // z
    }
    
    roadGeometry.setAttribute('position', new THREE.BufferAttribute(roadPosArray, 3));
    
    const roadMaterial = new THREE.PointsMaterial({
      size: 0.2,
      color: 0xffffff,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
    });
    
    const roadParticles = new THREE.Points(roadGeometry, roadMaterial);
    scene.add(roadParticles);
    
    // Create particles for the "sky"
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 800;
    const posArray = new Float32Array(particlesCount * 3);
    const colorsArray = new Float32Array(particlesCount * 3);
    
    for (let i = 0; i < particlesCount; i++) {
      const i3 = i * 3;
      // Position
      posArray[i3] = (Math.random() - 0.5) * 100; // x
      posArray[i3 + 1] = Math.random() * 50; // y (mostly at the top)
      posArray[i3 + 2] = (Math.random() - 0.5) * 100; // z
      
      // Colors - pink to purple gradient
      colorsArray[i3] = Math.random() * 0.3 + 0.7; // R: 0.7-1.0 (high red for pink)
      colorsArray[i3 + 1] = Math.random() * 0.2; // G: 0.0-0.2 (low green)
      colorsArray[i3 + 2] = Math.random() * 0.5 + 0.5; // B: 0.5-1.0 (high blue for purple tint)
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorsArray, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.3,
      transparent: true,
      opacity: 0.8,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);
    particlesRef.current = particles;
    
    // Create a simple bike representation using shapes
    const bikeGroup = new THREE.Group();
    
    // Bike body (frame)
    const frameGeometry = new THREE.BoxGeometry(3, 0.3, 1);
    const frameMaterial = new THREE.MeshPhongMaterial({ color: 0xff1493 });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    bikeGroup.add(frame);
    
    // Wheels
    const wheelGeometry = new THREE.TorusGeometry(0.8, 0.2, 16, 32);
    const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    
    const frontWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    frontWheel.position.set(1.5, -0.8, 0);
    frontWheel.rotation.x = Math.PI / 2;
    bikeGroup.add(frontWheel);
    
    const backWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    backWheel.position.set(-1.5, -0.8, 0);
    backWheel.rotation.x = Math.PI / 2;
    bikeGroup.add(backWheel);
    
    // Handlebars
    const handlebarGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.2, 16);
    const handlebarMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc });
    const handlebar = new THREE.Mesh(handlebarGeometry, handlebarMaterial);
    handlebar.position.set(1.5, 0.5, 0);
    handlebar.rotation.z = Math.PI / 2;
    bikeGroup.add(handlebar);
    
    // Seat
    const seatGeometry = new THREE.BoxGeometry(0.8, 0.2, 0.6);
    const seatMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
    const seat = new THREE.Mesh(seatGeometry, seatMaterial);
    seat.position.set(-0.8, 0.3, 0);
    bikeGroup.add(seat);
    
    // Position the bike
    bikeGroup.position.set(0, 0, 10);
    bikeGroup.rotation.y = Math.PI / 4;
    scene.add(bikeGroup);
    bikeModelRef.current = bikeGroup;
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // Add point light
    const pointLight = new THREE.PointLight(0xff1493, 1);
    pointLight.position.set(0, 5, 20);
    scene.add(pointLight);
    
    // Mouse move event
    const handleMouseMove = (event) => {
      mouseX.current = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY.current = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    // Animation
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Rotate particles
      particles.rotation.x += 0.0003;
      particles.rotation.y += 0.0003;
      
      // Move particles based on mouse position
      particles.rotation.x += mouseY.current * 0.0003;
      particles.rotation.y += mouseX.current * 0.0003;
      
      // Animate bike
      if (bikeModelRef.current) {
        bikeModelRef.current.rotation.y += 0.005;
        bikeModelRef.current.position.y = Math.sin(Date.now() * 0.001) * 0.3;
      }
      
      // Animate road particles
      roadParticles.rotation.x += 0.001;
      roadParticles.rotation.y += 0.001;
      
      // Render
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Resize handler
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Update camera
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      
      // Update renderer
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    
    window.addEventListener('resize', handleResize);
    
    // Initial animation
    gsap.fromTo(
      bikeGroup.position,
      { x: -20 },
      { x: 0, duration: 2, ease: 'power3.out' }
    );
    
    gsap.fromTo(
      bikeGroup.rotation,
      { y: 0 },
      { y: Math.PI / 4, duration: 2, ease: 'power3.out' }
    );
    
    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      
      // Dispose resources
      if (particlesRef.current) {
        particlesRef.current.geometry.dispose();
        particlesRef.current.material.dispose();
      }
      
      if (bikeModelRef.current) {
        bikeModelRef.current.traverse((child) => {
          if (child.isMesh) {
            child.geometry.dispose();
            child.material.dispose();
          }
        });
      }
    };
  }, []);
  
  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 z-0"
      style={{ pointerEvents: 'none' }}
    />
  );
};

export default CaptainAuthBackground;
