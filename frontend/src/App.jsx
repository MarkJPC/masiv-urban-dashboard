import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CityMap from './components/CityMap';
import BuildingPopup from './components/BuildingPopup';

function App() {
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [showPopup, setShowPopup] = useState(false);
  const [highlightedBuildings, setHighlightedBuildings] = useState([]);

  // State management
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [activeFilters, setActiveFilters] = useState({});
  const [savedProjects, setSavedProjects] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [username, setUsername] = useState('');


  // Initialize from localStorage and fetch buildings data
  useEffect(() => {
    initializeFromLocalStorage();
    fetchBuildings();
  }, []);

  // Add keyboard shortcut for saving projects
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        saveProject();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [savedProjects, buildings, activeFilters, highlightedBuildings, selectedBuilding, query, username]);

  // LocalStorage utilities with error handling
  const getFromLocalStorage = (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      return defaultValue;
    }
  };

  const setToLocalStorage = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to localStorage (${key}):`, error);
      setError('Failed to save data. Storage might be full.');
      return false;
    }
  };

  // Initialize data from localStorage
  const initializeFromLocalStorage = () => {
    const savedUsername = getFromLocalStorage('masiv-dashboard-username', '');
    const savedProjectsList = getFromLocalStorage('masiv-dashboard-projects', []);
    
    setUsername(savedUsername);
    setSavedProjects(savedProjectsList);
  };

  const handleBuildingClick = (building, screenPos) => {
    setSelectedBuilding(building);
    setPopupPosition(screenPos || { x: 0, y: 0 });
    setShowPopup(true);
    console.log('popup position:', screenPos);
    console.log('Building clicked:', building);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setSelectedBuilding(null);
    setHighlightedBuildings([]);
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


  // Handle query submission
  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      setLoading(true);
      setError(null);
      console.log('Processing query:', query);
      
      const response = await axios.post('/api/query', { query });
      
      if (response.data.parsed_successfully) {
        const filterCriteria = response.data.filter_criteria;
        setActiveFilters(filterCriteria);
        
        // Apply filters to buildings and set highlighted buildings
        const filtered = applyFilters(buildings, filterCriteria);
        setHighlightedBuildings(filtered);
        
        console.log('Query processed successfully:', {
          query: response.data.query,
          criteria: filterCriteria,
          totalBuildings: buildings.length,
          matchedBuildings: filtered.length,
          filteredBuildings: filtered.map(b => ({ id: b.id, name: b.name, height: b.height }))
        });
      } else {
        setError('Could not parse query. Please try a different format.');
      }
    } catch (err) {
      console.error('Query failed:', err);
      if (err.response?.data?.message) {
        setError(`Query error: ${err.response.data.message}`);
      } else if (err.code === 'ECONNREFUSED') {
        setError('Backend server not available. Please start the server.');
      } else {
        setError('Failed to process query. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Save username to localStorage
  const saveUsername = (newUsername) => {
    setUsername(newUsername);
    setToLocalStorage('masiv-dashboard-username', newUsername);
  };

  // Enhanced save project function
  const saveProject = () => {
    // Prompt user for project name
    const projectName = prompt('Enter a name for this project:', `Project ${savedProjects.length + 1}`);
    if (!projectName) return; // User cancelled

    const project = {
      id: Date.now(),
      name: projectName.trim(),
      timestamp: new Date().toISOString(),
      username: username || 'Anonymous',
      buildings: buildings,
      activeFilters: activeFilters,
      highlightedBuildings: highlightedBuildings,
      selectedBuilding: selectedBuilding,
      query: query
    };

    const updatedProjects = [...savedProjects, project];
    setSavedProjects(updatedProjects);
    
    if (setToLocalStorage('masiv-dashboard-projects', updatedProjects)) {
      setError(null);
      console.log('Project saved successfully:', project.name);
    }
  };

  // Enhanced load project function
  const loadProject = (project) => {
    try {
      // Restore all project state
      setBuildings(project.buildings || []);
      setActiveFilters(project.activeFilters || {});
      setHighlightedBuildings(project.highlightedBuildings || []);
      setSelectedBuilding(project.selectedBuilding || null);
      setQuery(project.query || '');
      
      // Clear any existing errors and popup
      setError(null);
      setShowPopup(false);
      
      console.log('Project loaded successfully:', project.name);
    } catch (error) {
      console.error('Error loading project:', error);
      setError('Failed to load project. Data might be corrupted.');
    }
  };

  // Delete project function
  const deleteProject = (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    
    const updatedProjects = savedProjects.filter(p => p.id !== projectId);
    setSavedProjects(updatedProjects);
    
    if (setToLocalStorage('masiv-dashboard-projects', updatedProjects)) {
      console.log('Project deleted successfully');
    }
  };

  // Clear all projects function
  const clearAllProjects = () => {
    if (!window.confirm('Are you sure you want to delete ALL saved projects? This cannot be undone.')) return;
    
    setSavedProjects([]);
    if (setToLocalStorage('masiv-dashboard-projects', [])) {
      console.log('All projects cleared');
    }
  };

  // Get localStorage usage info
  const getStorageInfo = () => {
    try {
      const projectsData = JSON.stringify(savedProjects);
      const usedBytes = new Blob([projectsData]).size;
      return { usedBytes, usedKB: Math.round(usedBytes / 1024 * 100) / 100 };
    } catch {
      return { usedBytes: 0, usedKB: 0 };
    }
  };

  // Function to apply filters to buildings
  const applyFilters = (buildingList, filters) => {
    return buildingList.filter(building => {
      // Height filters (already in meters from backend)
      if (filters.height_min && building.height < filters.height_min) return false;
      if (filters.height_max && building.height > filters.height_max) return false;
      
      // Value filters
      if (filters.value_min && building.value < filters.value_min) return false;
      if (filters.value_max && building.value > filters.value_max) return false;
      
      // Zoning filters
      if (filters.zoning && building.zoning !== filters.zoning) return false;
      
      // Sorting and limiting (if specified)
      return true;
    }).sort((a, b) => {
      if (filters.sort_by) {
        const field = filters.sort_by;
        const order = filters.sort_order === 'desc' ? -1 : 1;
        return (a[field] - b[field]) * order;
      }
      return 0;
    }).slice(0, filters.limit || buildingList.length);
  };

  // Filter buildings for display
  const filteredBuildings = applyFilters(buildings, activeFilters);

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
          {loading ? 'Loading...' : 
           `${buildings.length} total buildings | ${highlightedBuildings.length} highlighted | ${filteredBuildings.length} filtered`}
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
              
              <div style={{ fontSize: '12px', color: '#bdc3c7', marginTop: '5px' }}>
                <strong>Try asking:</strong><br />
                • "buildings over 100 feet"<br />
                • "tallest buildings"<br />
                • "commercial buildings"<br />
                • "buildings worth over 2 million"<br />
                • "residential buildings under 80 feet"
              </div>
              <button style={styles.button} type="submit" disabled={loading}>
                {loading ? 'Processing...' : 'Process Query'}
              </button>
              {(Object.keys(activeFilters).length > 0 || highlightedBuildings.length > 0) && (
                <button 
                  style={{...styles.button, backgroundColor: '#e74c3c', marginTop: '10px'}} 
                  type="button"
                  onClick={() => {
                    setActiveFilters({});
                    setHighlightedBuildings([]);
                    setQuery('');
                  }}
                >
                  Clear Filters
                </button>
              )}
            </form>
            
            {/* Active Filters */}
            {Object.keys(activeFilters).length > 0 && (
              <div style={{ marginTop: '15px' }}>
                <strong>Active Filters:</strong>
                <div style={{ marginTop: '5px' }}>
                  {Object.entries(activeFilters).map(([key, value]) => {
                    let displayText = `${key}: ${value}`;
                    
                    // Format filter display text
                    if (key === 'height_min') displayText = `Min Height: ${value}ft`;
                    else if (key === 'height_max') displayText = `Max Height: ${value}ft`;
                    else if (key === 'value_min') displayText = `Min Value: $${value.toLocaleString()}`;
                    else if (key === 'value_max') displayText = `Max Value: $${value.toLocaleString()}`;
                    else if (key === 'zoning') displayText = `Zoning: ${value}`;
                    else if (key === 'sort_by') displayText = `Sort: ${value} (${activeFilters.sort_order || 'asc'})`;
                    else if (key === 'limit') displayText = `Limit: ${value} buildings`;
                    else if (key === 'sort_order') return null; // Don't show separately
                    
                    return (
                      <span key={key} style={styles.filterChip}>
                        {displayText}
                      </span>
                    );
                  })}
                </div>
                <div style={{ marginTop: '10px', fontSize: '12px', color: '#bdc3c7' }}>
                  {highlightedBuildings.length} buildings match these filters
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
            
            {/* Username input */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '14px', color: '#bdc3c7', display: 'block', marginBottom: '5px' }}>
                Username:
              </label>
              <input
                style={styles.input}
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => saveUsername(e.target.value)}
              />
            </div>
            
            <button style={styles.button} onClick={saveProject}>
              Save Current View
            </button>
            <div style={{ fontSize: '11px', color: '#95a5a6', marginTop: '5px' }}>
              Tip: Use Ctrl+S to quick save
            </div>
            
            {savedProjects.length > 0 && (
              <div style={{ marginTop: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <strong>Saved Projects ({savedProjects.length}):</strong>
                  <button
                    style={{
                      ...styles.button,
                      backgroundColor: '#e74c3c',
                      padding: '4px 8px',
                      fontSize: '11px'
                    }}
                    onClick={clearAllProjects}
                  >
                    Clear All
                  </button>
                </div>
                <div style={{ fontSize: '11px', color: '#95a5a6', marginBottom: '10px' }}>
                  Storage used: {getStorageInfo().usedKB} KB
                </div>
                {savedProjects.map((project) => (
                  <div key={project.id} style={styles.projectItem}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => loadProject(project)}>
                        <div style={{ fontWeight: 'bold' }}>{project.name}</div>
                        <div style={{ fontSize: '12px', color: '#bdc3c7' }}>
                          by {project.username || 'Anonymous'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#bdc3c7' }}>
                          {new Date(project.timestamp).toLocaleDateString()} {new Date(project.timestamp).toLocaleTimeString()}
                        </div>
                        {project.highlightedBuildings?.length > 0 && (
                          <div style={{ fontSize: '11px', color: '#e74c3c', marginTop: '2px' }}>
                            {project.highlightedBuildings.length} buildings highlighted
                          </div>
                        )}
                        {Object.keys(project.activeFilters || {}).length > 0 && (
                          <div style={{ fontSize: '11px', color: '#3498db', marginTop: '2px' }}>
                            {Object.keys(project.activeFilters).length} active filters
                          </div>
                        )}
                      </div>
                      <button
                        style={{
                          ...styles.button,
                          backgroundColor: '#e74c3c',
                          padding: '4px 8px',
                          fontSize: '12px',
                          marginLeft: '8px'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteProject(project.id);
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Building Popup */}
      {showPopup && selectedBuilding && (
        <BuildingPopup
          building={selectedBuilding}
          isVisible={showPopup}
          onClose={handleClosePopup}
          position={popupPosition}
        />
      )}
    </div>
  );
}

export default App;