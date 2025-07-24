import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Box } from '@react-three/drei';
import axios from 'axios';

// Building component for 3D visualization
function Building({ building, isSelected, onClick }) {
  const meshRef = useRef();
  
  const handleClick = (event) => {
    event.stopPropagation();
    onClick(building);
  };

  return (
    <group
      position={[
        (building.lng + 114.0719) * 1000, // Convert to 3D coordinates
        building.height / 4,
        (building.lat - 51.0447) * 1000
      ]}
      onClick={handleClick}
    >
      <Box
        ref={meshRef}
        args={[20, building.height / 2, 20]}
        position={[0, 0, 0]}
      >
        <meshStandardMaterial
          color={isSelected ? '#ffff00' : building.color}
          transparent
          opacity={0.8}
        />
      </Box>
      <Text
        position={[0, building.height / 4 + 10, 0]}
        fontSize={8}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {building.name}
      </Text>
    </group>
  );
}

// 3D Scene component
function Scene({ buildings, selectedBuilding, onBuildingClick }) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[100, 100, 100]} intensity={1} />
      <pointLight position={[-100, 100, -100]} intensity={0.5} />
      
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -10, 0]}>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial color="#2c3e50" />
      </mesh>

      {/* Buildings */}
      {buildings.map((building) => (
        <Building
          key={building.id}
          building={building}
          isSelected={selectedBuilding?.id === building.id}
          onClick={onBuildingClick}
        />
      ))}

      <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
    </>
  );
}

// Main App component
function App() {
  // State management
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [activeFilters, setActiveFilters] = useState({});
  const [savedProjects, setSavedProjects] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch buildings data from backend
  useEffect(() => {
    fetchBuildings();
  }, []);

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

  // Handle building selection
  const handleBuildingClick = (building) => {
    setSelectedBuilding(building);
  };

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

  // Save current project
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

  // Load project
  const loadProject = (project) => {
    setBuildings(project.buildings);
    setActiveFilters(project.filters);
    setSelectedBuilding(project.selectedBuilding);
  };

  // Filter buildings based on active filters
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
      flexDirection: 'column'
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
    buttonSecondary: {
      padding: '8px 12px',
      backgroundColor: '#95a5a6',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '12px',
      margin: '2px'
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
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
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
        {/* 3D Canvas */}
        <div style={styles.canvasContainer}>
          <Canvas camera={{ position: [100, 100, 100], fov: 60 }}>
            <Scene
              buildings={filteredBuildings}
              selectedBuilding={selectedBuilding}
              onBuildingClick={handleBuildingClick}
            />
          </Canvas>
        </div>

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
                    <div>
                      <div>{project.name}</div>
                      <div style={{ fontSize: '12px', color: '#bdc3c7' }}>
                        {new Date(project.timestamp).toLocaleDateString()}
                      </div>
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