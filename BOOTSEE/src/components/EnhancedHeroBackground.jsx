import React from 'react';

// Simplified background component that doesn't use WebGL
const EnhancedHeroBackground = () => {
  return (
    <div className="absolute inset-0 z-0 bg-gradient-to-b from-gray-900 to-black">
      <div className="absolute inset-0 opacity-20">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500"></div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-20 left-1/4 w-32 h-32 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20"></div>
      <div className="absolute top-40 right-1/3 w-32 h-32 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20"></div>
      <div className="absolute bottom-40 left-1/3 w-32 h-32 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20"></div>
    </div>
  );
};

export default EnhancedHeroBackground;
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
      };

      cityGroup.add(vehicleGroup);
      vehiclesRef.current.push(vehicleGroup);

      return vehicleGroup;
    };

    // Create some vehicles
    for (let i = 0; i < 5; i++) {
      const type = Math.random() > 0.5 ? 'bike' : 'car';
      const position = new THREE.Vector3(
        Math.random() * 40 - 20,
        0,
        Math.random() * 2 - 1
      );
      createVehicle(type, position);
    }

    scene.add(cityGroup);
    cityRef.current = cityGroup;

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    scene.add(ambientLight);

    // Add directional light (moonlight)
    const moonLight = new THREE.DirectionalLight(0x6666ff, 0.5);
    moonLight.position.set(0, 10, 5);
    scene.add(moonLight);

    // Add point lights for street lamps
    for (let i = -20; i <= 20; i += 5) {
      const streetLight = new THREE.PointLight(0xffaa00, 0.5, 10);
      streetLight.position.set(i, 3, -3);
      scene.add(streetLight);

      const streetLight2 = new THREE.PointLight(0xffaa00, 0.5, 10);
      streetLight2.position.set(i, 3, 3);
      scene.add(streetLight2);
    }

    // Add stars
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 500;
    const starsPositions = new Float32Array(starsCount * 3);

    for (let i = 0; i < starsCount * 3; i += 3) {
      starsPositions[i] = (Math.random() - 0.5) * 100;
      starsPositions[i + 1] = Math.random() * 50 + 10;
      starsPositions[i + 2] = (Math.random() - 0.5) * 100;
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3));

    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.1,
    });

    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

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
        vehicle.position.x += vehicle.userData.speed;

        // Reset position when vehicle goes off screen
        if (vehicle.position.x > 30) {
          vehicle.position.x = -30;
        }
      });

      // Subtle camera movement based on mouse position
      if (cameraRef.current) {
        cameraRef.current.position.x += (mouseX.current * 2 - cameraRef.current.position.x) * 0.01;
        cameraRef.current.position.y += (mouseY.current * 2 + 5 - cameraRef.current.position.y) * 0.01;
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
      z: 30,
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

export default EnhancedHeroBackground;
