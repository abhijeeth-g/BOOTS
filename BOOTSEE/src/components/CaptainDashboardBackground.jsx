import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';

const CaptainDashboardBackground = () => {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const roadRef = useRef(null);
  const vehiclesRef = useRef([]);
  const mouseX = useRef(0);
  const mouseY = useRef(0);
  
  useEffect(() => {
    // Initialize Three.js scene
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Create scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 10, 50);
    sceneRef.current = scene;
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 3, 10);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Create road
    const roadGroup = new THREE.Group();
    
    // Road surface
    const roadGeometry = new THREE.PlaneGeometry(100, 10);
    const roadMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x333333,
      shininess: 10,
      emissive: 0x111111,
    });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.y = -0.5;
    roadGroup.add(road);
    
    // Road markings
    const createRoadMarkings = () => {
      // Center line
      const centerLineGeometry = new THREE.PlaneGeometry(100, 0.2);
      const centerLineMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffff00,
        side: THREE.DoubleSide
      });
      const centerLine = new THREE.Mesh(centerLineGeometry, centerLineMaterial);
      centerLine.rotation.x = -Math.PI / 2;
      centerLine.position.y = -0.49;
      roadGroup.add(centerLine);
      
      // Side lines
      const leftLineGeometry = new THREE.PlaneGeometry(100, 0.1);
      const leftLineMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff,
        side: THREE.DoubleSide
      });
      const leftLine = new THREE.Mesh(leftLineGeometry, leftLineMaterial);
      leftLine.rotation.x = -Math.PI / 2;
      leftLine.position.set(0, -0.49, -4.5);
      roadGroup.add(leftLine);
      
      const rightLine = leftLine.clone();
      rightLine.position.set(0, -0.49, 4.5);
      roadGroup.add(rightLine);
      
      // Dashed lines
      for (let i = -50; i < 50; i += 3) {
        const dashGeometry = new THREE.PlaneGeometry(1, 0.1);
        const dashMaterial = new THREE.MeshBasicMaterial({ 
          color: 0xffffff,
          side: THREE.DoubleSide
        });
        const dash = new THREE.Mesh(dashGeometry, dashMaterial);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(i, -0.49, 2.25);
        roadGroup.add(dash);
        
        const dash2 = dash.clone();
        dash2.position.set(i, -0.49, -2.25);
        roadGroup.add(dash2);
      }
    };
    
    createRoadMarkings();
    scene.add(roadGroup);
    roadRef.current = roadGroup;
    
    // Create buildings
    const createBuildings = () => {
      const buildingGroup = new THREE.Group();
      
      // Create buildings on both sides of the road
      for (let side = -1; side <= 1; side += 2) {
        for (let i = -50; i < 50; i += 5) {
          const height = Math.random() * 5 + 3;
          const width = Math.random() * 3 + 2;
          const depth = Math.random() * 3 + 2;
          
          const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
          const buildingMaterial = new THREE.MeshPhongMaterial({
            color: new THREE.Color().setHSL(Math.random() * 0.1 + 0.05, 0.5, Math.random() * 0.25 + 0.25),
            shininess: 30
          });
          
          const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
          building.position.set(
            i + Math.random() * 2 - 1,
            height / 2 - 0.5,
            (side * 7) + Math.random() * 2 - 1
          );
          
          // Add windows
          const addWindows = (building) => {
            const windowGeometry = new THREE.PlaneGeometry(0.3, 0.3);
            const windowMaterial = new THREE.MeshBasicMaterial({
              color: 0xffff99,
              opacity: Math.random() > 0.3 ? 0.8 : 0,
              transparent: true
            });
            
            const rows = Math.floor(height / 1);
            const cols = Math.floor(width / 0.8);
            
            for (let row = 0; row < rows; row++) {
              for (let col = 0; col < cols; col++) {
                if (Math.random() > 0.3) {
                  const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial.clone());
                  windowMesh.position.set(
                    -width / 2 + 0.4 + col * 0.8,
                    -height / 2 + 0.5 + row * 1,
                    depth / 2 + 0.01
                  );
                  building.add(windowMesh);
                  
                  if (side === -1) {
                    const backWindowMesh = windowMesh.clone();
                    backWindowMesh.rotation.y = Math.PI;
                    backWindowMesh.position.z = -depth / 2 - 0.01;
                    building.add(backWindowMesh);
                  }
                }
              }
            }
          };
          
          addWindows(building);
          buildingGroup.add(building);
        }
      }
      
      scene.add(buildingGroup);
    };
    
    createBuildings();
    
    // Create vehicles
    const createVehicle = (type, position) => {
      const vehicleGroup = new THREE.Group();
      
      if (type === 'bike') {
        // Bike body
        const bodyGeometry = new THREE.BoxGeometry(0.8, 0.4, 1.5);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0xff1493 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.4;
        vehicleGroup.add(body);
        
        // Wheels
        const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16);
        const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
        
        const frontWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        frontWheel.rotation.z = Math.PI / 2;
        frontWheel.position.set(0, 0.3, 0.5);
        vehicleGroup.add(frontWheel);
        
        const backWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        backWheel.rotation.z = Math.PI / 2;
        backWheel.position.set(0, 0.3, -0.5);
        vehicleGroup.add(backWheel);
        
        // Rider
        const riderGeometry = new THREE.CapsuleGeometry(0.2, 0.5, 4, 8);
        const riderMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
        const rider = new THREE.Mesh(riderGeometry, riderMaterial);
        rider.position.set(0, 0.9, 0);
        rider.rotation.x = Math.PI / 4;
        vehicleGroup.add(rider);
        
        // Headlight
        const headlightGeometry = new THREE.SphereGeometry(0.1, 16, 16);
        const headlightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const headlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        headlight.position.set(0, 0.4, 0.8);
        vehicleGroup.add(headlight);
        
        // Add headlight glow
        const headlightLight = new THREE.PointLight(0xffffff, 1, 5);
        headlightLight.position.set(0, 0.4, 0.9);
        vehicleGroup.add(headlightLight);
      } else if (type === 'car') {
        // Car body
        const bodyGeometry = new THREE.BoxGeometry(1.2, 0.8, 2.5);
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
          color: Math.random() > 0.5 ? 0x3366ff : 0x66cc66,
          shininess: 50,
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.5;
        vehicleGroup.add(body);
        
        // Car top
        const topGeometry = new THREE.BoxGeometry(1, 0.5, 1.5);
        const topMaterial = new THREE.MeshPhongMaterial({ 
          color: bodyMaterial.color,
          shininess: 50,
        });
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.set(0, 1.15, -0.2);
        vehicleGroup.add(top);
        
        // Wheels
        const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
        const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x111111 });
        
        const frontLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        frontLeftWheel.rotation.z = Math.PI / 2;
        frontLeftWheel.position.set(-0.7, 0.3, 0.7);
        vehicleGroup.add(frontLeftWheel);
        
        const frontRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        frontRightWheel.rotation.z = Math.PI / 2;
        frontRightWheel.position.set(0.7, 0.3, 0.7);
        vehicleGroup.add(frontRightWheel);
        
        const backLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        backLeftWheel.rotation.z = Math.PI / 2;
        backLeftWheel.position.set(-0.7, 0.3, -0.7);
        vehicleGroup.add(backLeftWheel);
        
        const backRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        backRightWheel.rotation.z = Math.PI / 2;
        backRightWheel.position.set(0.7, 0.3, -0.7);
        vehicleGroup.add(backRightWheel);
        
        // Headlights
        const headlightGeometry = new THREE.SphereGeometry(0.1, 16, 16);
        const headlightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        
        const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        leftHeadlight.position.set(-0.4, 0.5, 1.3);
        vehicleGroup.add(leftHeadlight);
        
        const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        rightHeadlight.position.set(0.4, 0.5, 1.3);
        vehicleGroup.add(rightHeadlight);
        
        // Add headlight glow
        const leftLight = new THREE.PointLight(0xffffff, 1, 5);
        leftLight.position.set(-0.4, 0.5, 1.4);
        vehicleGroup.add(leftLight);
        
        const rightLight = new THREE.PointLight(0xffffff, 1, 5);
        rightLight.position.set(0.4, 0.5, 1.4);
        vehicleGroup.add(rightLight);
        
        // Taillights
        const taillightGeometry = new THREE.SphereGeometry(0.1, 16, 16);
        const taillightMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        
        const leftTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
        leftTaillight.position.set(-0.4, 0.5, -1.3);
        vehicleGroup.add(leftTaillight);
        
        const rightTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
        rightTaillight.position.set(0.4, 0.5, -1.3);
        vehicleGroup.add(rightTaillight);
      }
      
      vehicleGroup.position.copy(position);
      vehicleGroup.userData = {
        speed: Math.random() * 0.1 + 0.05,
        type: type,
        lane: Math.floor(Math.random() * 4) - 1.5,
      };
      
      scene.add(vehicleGroup);
      vehiclesRef.current.push(vehicleGroup);
      
      return vehicleGroup;
    };
    
    // Create some vehicles
    for (let i = 0; i < 10; i++) {
      const type = Math.random() > 0.5 ? 'bike' : 'car';
      const position = new THREE.Vector3(
        Math.random() * 80 - 40,
        0,
        (Math.floor(Math.random() * 4) - 1.5) * 1.5
      );
      createVehicle(type, position);
    }
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    scene.add(ambientLight);
    
    // Add directional light (moonlight)
    const moonLight = new THREE.DirectionalLight(0x6666ff, 0.5);
    moonLight.position.set(0, 10, 5);
    scene.add(moonLight);
    
    // Add point lights for street lamps
    for (let i = -40; i <= 40; i += 10) {
      const streetLight = new THREE.PointLight(0xffaa00, 0.5, 10);
      streetLight.position.set(i, 3, -6);
      scene.add(streetLight);
      
      const streetLight2 = new THREE.PointLight(0xffaa00, 0.5, 10);
      streetLight2.position.set(i, 3, 6);
      scene.add(streetLight2);
    }
    
    // Mouse move event
    const handleMouseMove = (event) => {
      // Calculate mouse position in normalized device coordinates
      // (-1 to +1) for both components
      const rect = container.getBoundingClientRect();
      mouseX.current = ((event.clientX - rect.left) / width) * 2 - 1;
      mouseY.current = -((event.clientY - rect.top) / height) * 2 + 1;
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    // Animation
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Move vehicles
      vehiclesRef.current.forEach(vehicle => {
        vehicle.position.x -= vehicle.userData.speed;
        
        // Reset position when vehicle goes off screen
        if (vehicle.position.x < -50) {
          vehicle.position.x = 50;
          vehicle.position.z = (Math.floor(Math.random() * 4) - 1.5) * 1.5;
        }
        
        // Add slight up and down movement
        vehicle.position.y = Math.sin(Date.now() * 0.001 + vehicle.position.x * 0.1) * 0.05;
      });
      
      // Subtle camera movement based on mouse position
      if (cameraRef.current) {
        cameraRef.current.position.x += (mouseX.current * 2 - cameraRef.current.position.x) * 0.01;
        cameraRef.current.position.y += (mouseY.current + 3 - cameraRef.current.position.y) * 0.01;
        cameraRef.current.lookAt(0, 0, 0);
      }
      
      // Render
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Resize handler
    const handleResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      
      // Update camera
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      
      // Update renderer
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    
    window.addEventListener('resize', handleResize);
    
    // Initial animations
    gsap.from(camera.position, {
      z: 20,
      y: 10,
      duration: 3,
      ease: 'power2.out'
    });
    
    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      
      // Dispose resources
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object.geometry) {
            object.geometry.dispose();
          }
          
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material.dispose();
            }
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

export default CaptainDashboardBackground;
