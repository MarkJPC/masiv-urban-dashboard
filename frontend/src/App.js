import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import axios from 'axios';
import CityMap from './components/CityMap';

function App() {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const buildingMeshesRef = useRef([]);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [highlightedBuildings, setHighlightedBuildings] = useState([]);

  // State management
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [activeFilters, setActiveFilters] = useState({});
  const [savedProjects, setSavedProjects] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x34495e);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75, 
      mountRef.current.clientWidth / mountRef.current.clientHeight, 
      0.1, 
      1000
    );
    camera.position.set(100, 100, 100);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 100, 50);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -10;
    ground.receiveShadow = true;
    scene.add(ground);

    // Controls (basic orbit controls)
    let isMouseDown = false;
    let mouseDownPosition = { x: 0, y: 0 };
    let cameraRotation = { x: 0, y: 0 };

    const handleMouseDown = (event) => {
      isMouseDown = true;
      mouseDownPosition.x = event.clientX;
      mouseDownPosition.y = event.clientY;
    };

    const handleMouseMove = (event) => {
      if (!isMouseDown) return;
      
      const deltaX = event.clientX - mouseDownPosition.x;
      const deltaY = event.clientY - mouseDownPosition.y;
      
      cameraRotation.y += deltaX * 0.01;
      cameraRotation.x += deltaY * 0.01;
      
      const radius = 200;
      camera.position.x = Math.sin(cameraRotation.y) * Math.cos(cameraRotation.x) * radius;
      camera.position.y = Math.sin(cameraRotation.x) * radius;
      camera.position.z = Math.cos(cameraRotation.y) * Math.cos(cameraRotation.x) * radius;
      camera.lookAt(0, 0, 0);
      
      mouseDownPosition.x = event.clientX;
      mouseDownPosition.y = event.clientY;
    };

    const handleMouseUp = () => {
      isMouseDown = false;
    };

    const handleWheel = (event) => {
      const scale = event.deltaY > 0 ? 1.1 : 0.9;
      camera.position.multiplyScalar(scale);
      camera.lookAt(0, 0, 0);
    };

    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('wheel', handleWheel);

    // Mouse click detection
    const handleClick = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(buildingMeshesRef.current);

      if (intersects.length > 0) {
        const clickedMesh = intersects[0].object;
        const buildingData = clickedMesh.userData;
        setSelectedBuilding(buildingData);
      }
    };

    renderer.domElement.addEventListener('click', handleClick);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      renderer.domElement.removeEventListener('click', handleClick);
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Fetch buildings data
  useEffect(() => {
    fetchBuildings();
  }, []);

  const handleBuildingClick = (building, screenPos) => {
    setSelectedBuilding(building);
    setPopupPosition(screenPos);
  };

  const fetchBuildings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/buildings');
      setBuildings(response.data.buildings);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch buildings:', err);
      setError('Failed to load building data');
    } finally {
      setLoading(false);
    }
  };

  // Update buildings in 3D scene
  useEffect(() => {
    if (!sceneRef.current || buildings.length === 0) return;

    // Clear existing building meshes
    buildingMeshesRef.current.forEach(mesh => {
      sceneRef.current.remove(mesh);
    });
    buildingMeshesRef.current = [];

    // Add new building meshes
    buildings.forEach(building => {
      // Convert lat/lng to 3D coordinates
      const x = (building.lng + 114.0719) * 1000;
      const z = (building.lat - 51.0447) * 1000;
      const height = building.height / 2;

      const geometry = new THREE.BoxGeometry(20, height, 20);
      const material = new THREE.MeshLambertMaterial({ 
        color: selectedBuilding?.id === building.id ? 0xffff00 : building.color,
        transparent: true,
        opacity: 0.8
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, height / 2, z);
      mesh.castShadow = true;
      mesh.userData = building;
      
      sceneRef.current.add(mesh);
      buildingMeshesRef.current.push(mesh);
    });
  }, [buildings, selectedBuilding]);

  // Handle query submission
  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      setLoading(true);
      const response = await axios.post('/api/query', { query });
      setActiveFilters(response.data.filter_criteria);
      setError(null);
    } catch (err) {
      console.error('Query failed:', err);
      setError('Failed to process query');
    } finally {
      setLoading(false);
    }
  };

  // Save/Load project functions
  const saveProject = () => {
    const project = {
      id: Date.now(),
      name: `Project ${savedProjects.length + 1}`,
      timestamp: new Date().toISOString(),
      buildings: buildings,
      filters: activeFilters,
      selectedBuilding: selectedBuilding
    };
    setSavedProjects([...savedProjects, project]);
  };

  const loadProject = (project) => {
    setBuildings(project.buildings);
    setActiveFilters(project.filters);
    setSelectedBuilding(project.selectedBuilding);
  };

  // Filter buildings
  const filteredBuildings = buildings.filter(building => {
    if (activeFilters.height_min && building.height < activeFilters.height_min) return false;
    if (activeFilters.height_max && building.height > activeFilters.height_max) return false;
    if (activeFilters.value_min && building.value < activeFilters.value_min) return false;
    if (activeFilters.value_max && building.value > activeFilters.value_max) return false;
    if (activeFilters.zoning && building.zoning !== activeFilters.zoning) return false;
    return true;
  });

  // Styles
  const styles = {
    app: {
      fontFamily: 'Arial, sans-serif',
      height: '100vh',
      backgroundColor: '#1a1a1a',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column'
    },
    header: {
      backgroundColor: '#2c3e50',
      padding: '15px 20px',
      borderBottom: '2px solid #34495e',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    title: {
      margin: 0,
      fontSize: '24px',
      fontWeight: 'bold'
    },
    status: {
      fontSize: '14px',
      color: '#bdc3c7'
    },
    mainContent: {
      display: 'flex',
      flex: 1,
      height: 'calc(100vh - 80px)'
    },
    canvasContainer: {
      flex: 2,
      backgroundColor: '#34495e',
      position: 'relative'
    },
    sidebar: {
      width: '350px',
      backgroundColor: '#2c3e50',
      borderLeft: '2px solid #34495e',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto'
    },
    panel: {
      padding: '20px',
      borderBottom: '1px solid #34495e'
    },
    panelTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '15px',
      color: '#ecf0f1'
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    },
    input: {
      padding: '10px',
      borderRadius: '4px',
      border: '1px solid #7f8c8d',
      backgroundColor: '#34495e',
      color: '#ffffff',
      fontSize: '14px'
    },
    button: {
      padding: '10px 15px',
      backgroundColor: '#3498db',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 'bold'
    },
    buildingInfo: {
      backgroundColor: '#34495e',
      padding: '15px',
      borderRadius: '4px',
      margin: '10px 0'
    },
    infoItem: {
      display: 'flex',
      justifyContent: 'space-between',
      margin: '5px 0',
      fontSize: '14px'
    },
    filterChip: {
      display: 'inline-block',
      backgroundColor: '#e74c3c',
      color: 'white',
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      margin: '2px'
    },
    error: {
      color: '#e74c3c',
      fontSize: '14px',
      marginTop: '10px'
    },
    projectItem: {
      backgroundColor: '#34495e',
      padding: '10px',
      borderRadius: '4px',
      margin: '5px 0',
      cursor: 'pointer'
    }
  };

  return (
    <div style={styles.app}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.title}>Calgary 3D City Dashboard</h1>
        <div style={styles.status}>
          {loading ? 'Loading...' : `${filteredBuildings.length} buildings displayed`}
        </div>
      </header>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* 3D Canvas Container */}
        <CityMap 
          buildings={buildings}
          selectedBuilding={selectedBuilding}
          highlightedBuildings={highlightedBuildings}
          onBuildingClick={handleBuildingClick}
          style={styles.canvasContainer}
        />

        {/* Sidebar */}
        <div style={styles.sidebar}>
          {/* Query Panel */}
          <div style={styles.panel}>
            <h3 style={styles.panelTitle}>LLM Query</h3>
            <form style={styles.form} onSubmit={handleQuerySubmit}>
              <input
                style={styles.input}
                type="text"
                placeholder="Enter query (e.g., 'buildings over 100 feet')"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button style={styles.button} type="submit" disabled={loading}>
                Process Query
              </button>
            </form>
            
            {/* Active Filters */}
            {Object.keys(activeFilters).length > 0 && (
              <div style={{ marginTop: '15px' }}>
                <strong>Active Filters:</strong>
                <div style={{ marginTop: '5px' }}>
                  {Object.entries(activeFilters).map(([key, value]) => (
                    <span key={key} style={styles.filterChip}>
                      {key}: {value}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {error && <div style={styles.error}>{error}</div>}
          </div>

          {/* Selected Building Info */}
          {selectedBuilding && (
            <div style={styles.panel}>
              <h3 style={styles.panelTitle}>Building Details</h3>
              <div style={styles.buildingInfo}>
                <div style={styles.infoItem}>
                  <span>Name:</span>
                  <span>{selectedBuilding.name}</span>
                </div>
                <div style={styles.infoItem}>
                  <span>Address:</span>
                  <span>{selectedBuilding.address}</span>
                </div>
                <div style={styles.infoItem}>
                  <span>Height:</span>
                  <span>{selectedBuilding.height} ft</span>
                </div>
                <div style={styles.infoItem}>
                  <span>Value:</span>
                  <span>${selectedBuilding.value.toLocaleString()}</span>
                </div>
                <div style={styles.infoItem}>
                  <span>Zoning:</span>
                  <span>{selectedBuilding.zoning}</span>
                </div>
              </div>
            </div>
          )}

          {/* Save/Load Panel */}
          <div style={styles.panel}>
            <h3 style={styles.panelTitle}>Projects</h3>
            <button style={styles.button} onClick={saveProject}>
              Save Current View
            </button>
            
            {savedProjects.length > 0 && (
              <div style={{ marginTop: '15px' }}>
                <strong>Saved Projects:</strong>
                {savedProjects.map((project) => (
                  <div
                    key={project.id}
                    style={styles.projectItem}
                    onClick={() => loadProject(project)}
                  >
                    <div>{project.name}</div>
                    <div style={{ fontSize: '12px', color: '#bdc3c7' }}>
                      {new Date(project.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;