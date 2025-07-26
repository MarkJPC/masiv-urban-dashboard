import React, { useRef, useEffect, useCallback } from 'react';
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
  const buildingMapRef = useRef(new Map());
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const animationFrameRef = useRef(null);

  // Calgary downtown center coordinates
  const CALGARY_CENTER = {
    lat: 51.0447,
    lng: -114.0719
  };
  
  // Scale factor for coordinate conversion
  const COORD_SCALE = 10000;

  // Memoized click handler to prevent re-renders
  const handleBuildingClick = useCallback((event) => {
    if (!onBuildingClick || !rendererRef.current || !cameraRef.current) return;

    const rect = rendererRef.current.domElement.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObjects(buildingMeshesRef.current);

    // Use mouse event coordinates directly
    const screenPos = {
      x: event.clientX,
      y: event.clientY
    };

    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object;
      const buildingData = clickedMesh.userData;
      onBuildingClick(buildingData, screenPos);
    }
  }, [onBuildingClick]);

  // Initialize Three.js scene ONCE on mount
  useEffect(() => {
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

    // Add click event listener
    renderer.domElement.addEventListener('click', handleBuildingClick);

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
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
      renderer.domElement.removeEventListener('click', handleBuildingClick);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      controls.dispose();
      renderer.dispose();
      
      // Clean up geometries and materials
      buildingMeshesRef.current.forEach(mesh => {
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) mesh.material.dispose();
      });
      buildingMeshesRef.current = [];
      buildingMapRef.current.clear();
    };
  }, []); // Empty dependency array - scene setup only runs once

  // Function to get building color based on zoning
  const getBuildingColor = useCallback((zoning) => {
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
  }, []);

  // Function to convert lat/lng to 3D coordinates
  const latLngTo3D = useCallback((lat, lng) => {
    const x = (lng - CALGARY_CENTER.lng) * COORD_SCALE;
    const z = (lat - CALGARY_CENTER.lat) * COORD_SCALE;
    return { x, z };
  }, [COORD_SCALE, CALGARY_CENTER.lng, CALGARY_CENTER.lat]);

  // Create buildings ONCE when buildings data changes
  useEffect(() => {
    if (!sceneRef.current || !buildings.length) return;

    // Clear existing building meshes
    buildingMeshesRef.current.forEach(mesh => {
      sceneRef.current.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) mesh.material.dispose();
    });
    buildingMeshesRef.current = [];
    buildingMapRef.current.clear();
    
    // Create new building meshes
    buildings.forEach((building, index) => {
      const coords = latLngTo3D(building.lat, building.lng);
      const height = Math.max(building.height * 0.3, 10);

      // Create geometry
      const geometry = new THREE.BoxGeometry(8, height, 8);
      
      // Base color from zoning
      const baseColor = getBuildingColor(building.zoning);
      
      // Create material
      const material = new THREE.MeshLambertMaterial({
        color: baseColor,
        emissive: 0x000000,
        transparent: true,
        opacity: 0.9
      });

      // Create mesh
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(coords.x, height / 2, coords.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = building;

      // Store original material properties
      mesh.userData.originalColor = baseColor;
      mesh.userData.originalEmissive = 0x000000;

      // Add to scene and tracking
      sceneRef.current.add(mesh);
      buildingMeshesRef.current.push(mesh);
      buildingMapRef.current.set(building.id, mesh);
    });
  }, [buildings, getBuildingColor, latLngTo3D]);

  // Update building highlights ONLY when selection changes
  useEffect(() => {
    if (!buildingMapRef.current.size) return;

    // Reset all buildings to original state
    buildingMeshesRef.current.forEach(mesh => {
      if (mesh.material && mesh.userData) {
        mesh.material.color.setHex(mesh.userData.originalColor);
        mesh.material.emissive.setHex(mesh.userData.originalEmissive);
        mesh.material.needsUpdate = true;
      }
    });

    // Apply highlights
    highlightedBuildings.forEach(building => {
      const mesh = buildingMapRef.current.get(building.id);
      if (mesh && mesh.material) {
        mesh.material.emissive.setHex(0x333333);
        mesh.material.needsUpdate = true;
      }
    });

    // Apply selection
    if (selectedBuilding) {
      const mesh = buildingMapRef.current.get(selectedBuilding.id);
      if (mesh && mesh.material) {
        mesh.material.emissive.setHex(0x666666);
        mesh.material.needsUpdate = true;
      }
    }
  }, [selectedBuilding, highlightedBuildings]);

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

// Memoize component to prevent unnecessary re-renders and fix hot reload issues
export default React.memo(CityMap, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.buildings === nextProps.buildings &&
    prevProps.selectedBuilding?.id === nextProps.selectedBuilding?.id &&
    prevProps.highlightedBuildings.length === nextProps.highlightedBuildings.length &&
    prevProps.highlightedBuildings.every((hb, index) => 
      hb.id === nextProps.highlightedBuildings[index]?.id
    ) &&
    prevProps.onBuildingClick === nextProps.onBuildingClick
  );
});