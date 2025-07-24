import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const CityMap = ({ 
  buildings = [], 
  selectedBuilding = null, 
  highlightedBuildings = [], 
  onBuildingClick 
}) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const buildingMeshesRef = useRef([]);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  // Calgary downtown center coordinates
  const CALGARY_CENTER = {
    lat: 51.0447,
    lng: -114.0719
  };
  
  // Scale factor for coordinate conversion
  const COORD_SCALE = 10000;

  // Initialize Three.js scene
  useEffect(() => {
    console.log('=== DEBUGGING BUILDINGS DATA ===');
    console.log('Total buildings:', buildings.length);
    console.log('Buildings data:', buildings);
    if (buildings.length > 0) {
      console.log('First building coords:', buildings[0]?.lat, buildings[0]?.lng);
      console.log('Calgary center:', CALGARY_CENTER);
    }

    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      10000
    );
    camera.position.set(100, 100, 100);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.gammaOutput = true;
    renderer.gammaFactor = 2.2;
    
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 200, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 1000;
    directionalLight.shadow.camera.left = -200;
    directionalLight.shadow.camera.right = 200;
    directionalLight.shadow.camera.top = 200;
    directionalLight.shadow.camera.bottom = -200;
    scene.add(directionalLight);

    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(2000, 2000);
    const groundMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x2c3e50,
      transparent: true,
      opacity: 0.8
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -5;
    ground.receiveShadow = true;
    scene.add(ground);

    // Add visual debugging helpers
    const gridHelper = new THREE.GridHelper(500, 50, 0x888888, 0x444444);
    gridHelper.position.y = -4;
    scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(100);
    axesHelper.position.y = 0;
    scene.add(axesHelper);

    console.log('Added grid and axes helpers');

    // OrbitControls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 50;
    controls.maxDistance = 1000;
    controls.maxPolarAngle = Math.PI / 2;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Mouse click detection
    const handleClick = (event) => {
      if (!onBuildingClick) return;

      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(buildingMeshesRef.current);

      if (intersects.length > 0) {
        const clickedMesh = intersects[0].object;
        const buildingData = clickedMesh.userData;
        onBuildingClick(buildingData);
      }
    };

    renderer.domElement.addEventListener('click', handleClick);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!mountRef.current || !camera || !renderer) return;
      
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', handleClick);
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      controls.dispose();
      renderer.dispose();
    };
  }, [onBuildingClick]);

  // Function to get building color based on zoning
  const getBuildingColor = (zoning) => {
    switch (zoning?.toLowerCase()) {
      case 'rc-g': // Residential
      case 'residential':
        return 0x3498db; // Blue
      case 'cb-d': // Commercial
      case 'commercial':
        return 0x27ae60; // Green
      case 'cc-mh': // Mixed-use
      case 'mixed-use':
      case 'mixed':
        return 0x9b59b6; // Purple
      default:
        return 0x95a5a6; // Gray
    }
  };

  // Function to convert lat/lng to 3D coordinates
  const latLngTo3D = (lat, lng) => {
    // Subtract center coordinates first, then scale
    const x = (lng - CALGARY_CENTER.lng) * COORD_SCALE;
    const z = (lat - CALGARY_CENTER.lat) * COORD_SCALE;
    
    console.log(`Building at lat:${lat}, lng:${lng} -> 3D coords: x:${x.toFixed(2)}, z:${z.toFixed(2)}`);
    
    return { x, z };
  };

  // Update buildings in scene
  useEffect(() => {
    if (!sceneRef.current || !buildings.length) return;

    // Clear existing building meshes
    buildingMeshesRef.current.forEach(mesh => {
      sceneRef.current.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
    buildingMeshesRef.current = [];

    console.log('=== CREATING BUILDING MESHES ===');
    
    // Create new building meshes
    buildings.forEach((building, index) => {
      // Convert lat/lng to 3D coordinates
      const coords = latLngTo3D(building.lat, building.lng);
      const height = Math.max(building.height * 0.3, 10); // Scale height and minimum of 10

      console.log(`Building ${index + 1} (${building.name}):`);
      console.log(`  - Original coords: lat:${building.lat}, lng:${building.lng}`);
      console.log(`  - 3D position: x:${coords.x.toFixed(2)}, y:${(height/2).toFixed(2)}, z:${coords.z.toFixed(2)}`);
      console.log(`  - Height: ${height.toFixed(2)} (from ${building.height})`);
      console.log(`  - Zoning: ${building.zoning}`);

      // Create geometry
      const geometry = new THREE.BoxGeometry(8, height, 8); // Smaller buildings
      
      // Determine building color and effects
      const baseColor = getBuildingColor(building.zoning);
      let emissive = 0x000000;
      
      // Check if building is highlighted
      const isHighlighted = highlightedBuildings.some(hb => hb.id === building.id);
      const isSelected = selectedBuilding?.id === building.id;
      
      if (isSelected) {
        emissive = 0x444444; // Selected glow
      } else if (isHighlighted) {
        emissive = 0x888888; // Highlighted glow
      }

      // Add unique color variation for visual distinction
      const hue = (index * 137.508) % 360; // Golden angle for good distribution
      const uniqueColor = new THREE.Color().setHSL(hue / 360, 0.7, 0.5);
      
      // Create material with unique colors for debugging
      const material = new THREE.MeshLambertMaterial({
        color: uniqueColor.getHex(), // Use unique color for now
        emissive: emissive,
        transparent: true,
        opacity: 0.9
      });

      // Create mesh
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(coords.x, height / 2, coords.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = building;

      console.log(`  - Final mesh position: (${mesh.position.x.toFixed(2)}, ${mesh.position.y.toFixed(2)}, ${mesh.position.z.toFixed(2)})`);

      // Add to scene and track
      sceneRef.current.add(mesh);
      buildingMeshesRef.current.push(mesh);
    });
    
    console.log(`Total meshes created: ${buildingMeshesRef.current.length}`);
    console.log('=== END BUILDING CREATION ===');
  }, [buildings, selectedBuilding, highlightedBuildings]);

  return (
    <div 
      ref={mountRef} 
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative',
        overflow: 'hidden'
      }}
    />
  );
};

export default CityMap;