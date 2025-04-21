import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';

const LandingPageBackground = () => {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
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
    
    // Create a grid of cubes
    const cubeSize = 0.5;
    const gap = 2;
    const gridSize = 15;
    const halfGrid = gridSize / 2;
    
    const cubes = [];
    const cubeGroup = new THREE.Group();
    
    for (let x = -halfGrid; x < halfGrid; x++) {
      for (let y = -halfGrid; y < halfGrid; y++) {
        // Skip some cubes randomly for a more interesting pattern
        if (Math.random() > 0.7) continue;
        
        const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
        
        // Determine color based on position
        const distanceFromCenter = Math.sqrt(x * x + y * y);
        const normalizedDistance = Math.min(distanceFromCenter / halfGrid, 1);
        
        // Create a gradient from pink to purple
        const color = new THREE.Color();
        color.setHSL(0.9 - normalizedDistance * 0.1, 0.8, 0.5); // Pink to purple hue range
        
        const material = new THREE.MeshPhongMaterial({
          color: color,
          shininess: 100,
          emissive: color.clone().multiplyScalar(0.2),
          transparent: true,
          opacity: 0.9,
        });
        
        const cube = new THREE.Mesh(geometry, material);
        
        // Position cubes in a grid
        cube.position.x = x * gap;
        cube.position.y = y * gap;
        
        // Add some randomness to z position
        cube.position.z = Math.random() * 5 - 2.5;
        
        // Store initial position for animation
        cube.userData.initialPosition = {
          x: cube.position.x,
          y: cube.position.y,
          z: cube.position.z
        };
        
        // Add to group
        cubeGroup.add(cube);
        cubes.push(cube);
      }
    }
    
    // Add cube group to scene
    scene.add(cubeGroup);
    
    // Rotate the entire group for a better initial view
    cubeGroup.rotation.x = Math.PI / 6;
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // Add point lights for more dramatic lighting
    const pointLight1 = new THREE.PointLight(0xff1493, 1, 50); // Pink light
    pointLight1.position.set(10, 10, 10);
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0x9400d3, 1, 50); // Purple light
    pointLight2.position.set(-10, -10, 10);
    scene.add(pointLight2);
    
    // Mouse move event
    const handleMouseMove = (event) => {
      mouseX.current = (event.clientX / width) * 2 - 1;
      mouseY.current = -(event.clientY / height) * 2 + 1;
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    // Animation
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Rotate the entire cube group based on mouse position
      if (cubeGroup) {
        cubeGroup.rotation.x += (mouseY.current * 0.01 - cubeGroup.rotation.x) * 0.05;
        cubeGroup.rotation.y += (mouseX.current * 0.01 - cubeGroup.rotation.y) * 0.05;
      }
      
      // Animate individual cubes
      const time = Date.now() * 0.001;
      
      cubes.forEach((cube, i) => {
        const initialPos = cube.userData.initialPosition;
        
        // Create a wave effect
        const waveX = Math.sin(time + i * 0.1) * 0.2;
        const waveY = Math.cos(time + i * 0.1) * 0.2;
        
        cube.position.x = initialPos.x + waveX;
        cube.position.y = initialPos.y + waveY;
        
        // Subtle rotation
        cube.rotation.x = time * 0.2 + i * 0.01;
        cube.rotation.y = time * 0.1 + i * 0.01;
      });
      
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
    gsap.from(camera.position, {
      z: 50,
      duration: 2,
      ease: 'power2.out'
    });
    
    gsap.from(cubeGroup.rotation, {
      x: Math.PI,
      y: Math.PI,
      duration: 2,
      ease: 'power2.out'
    });
    
    // Animate cubes appearing
    cubes.forEach((cube, i) => {
      gsap.from(cube.scale, {
        x: 0,
        y: 0,
        z: 0,
        duration: 1,
        delay: 0.5 + i * 0.005,
        ease: 'back.out(1.7)'
      });
    });
    
    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      
      // Dispose resources
      cubes.forEach(cube => {
        cube.geometry.dispose();
        cube.material.dispose();
      });
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

export default LandingPageBackground;
