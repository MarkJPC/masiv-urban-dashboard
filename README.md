# Calgary 3D City Dashboard

*MASIV Software Engineering Internship Assessment - Mark Cena*

## 🚀 Live Demo
**Frontend**: https://masiv-urban-dashboard.vercel.app  
**Backend API**: https://masiv-urban-dashboard.onrender.com  
**GitHub**: https://github.com/MARKJPC/masiv-urban-dashboard

## 📋 Project Overview

A full-stack 3D web application that visualizes Calgary city buildings with interactive querying capabilities. Built as a technical assessment demonstrating modern web development practices, 3D visualization, AI integration, and cloud deployment.

## ✨ Features Implemented

### Core Requirements ✅
- **3D Building Visualization**: Interactive Three.js scene with 20+ Calgary buildings
- **Building Interaction**: Click buildings to view detailed information (address, height, value, zoning)
- **Natural Language Queries**: LLM-powered building filtering ("buildings over 100 feet", "commercial buildings")
- **Project Persistence**: Save and load filtered views with user identification
- **Full Deployment**: Production-ready hosting on Vercel + Render

### Technical Highlights
- **Frontend**: React 18 + Vanilla Three.js for optimal performance
- **Backend**: Flask REST API with CORS configuration
- **AI Integration**: Hugging Face Inference API for natural language processing
- **Storage**: localStorage for rapid prototyping (production-ready database schema designed)
- **Deployment**: Automated CI/CD with environment variable management

## 🏗️ Architecture

```
Frontend (React + Three.js)          Backend (Flask)           External APIs
├── CityMap Component               ├── /api/buildings         ├── Hugging Face
├── QueryPanel Component           ├── /api/query             │   Inference API
├── BuildingPopup Component        ├── /api/health            └── (Future: Calgary
└── SaveLoad Functionality         └── CORS Configuration          Open Data)
```

## 🛠️ Technology Stack

**Frontend**
- React 18 with functional components and hooks
- Three.js for 3D rendering and raycasting
- Axios for HTTP client
- CSS-in-JS for responsive styling

**Backend**
- Flask 2.3 with RESTful API design
- Flask-CORS for cross-origin resource sharing
- Python-dotenv for environment management
- Requests library for external API integration

**Deployment & DevOps**
- Vercel for frontend hosting
- Render for backend hosting
- Git version control with GitHub
- Environment variable management

**AI & Data Processing**
- Hugging Face Transformers API
- Natural language query parsing
- Fallback keyword filtering system

## 📁 Project Structure

```
masiv-urban-dashboard/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CityMap.js         # Three.js 3D visualization
│   │   │   ├── BuildingPopup.js   # Building detail overlay
│   │   │   └── QueryPanel.js      # LLM query interface
│   │   ├── App.jsx                # Main application logic
│   │   └── index.js               # React entry point
│   ├── package.json               # Frontend dependencies
│   └── .env                       # Environment variables
├── backend/
│   ├── app.py                     # Flask application
│   ├── requirements.txt           # Python dependencies
│   ├── sample_data.py             # Mock Calgary building data
│   └── .env                       # API keys and configuration
├── docs/
│   └── UML_diagrams/              # System architecture diagrams
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- Python 3.8+
- Hugging Face API key (free tier)

### Local Development

1. **Clone Repository**
```bash
git clone https://github.com/MARKJPC/masiv-urban-dashboard
cd masiv-urban-dashboard
```

2. **Backend Setup**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file
echo "HUGGINGFACE_API_KEY=your_key_here" > .env

# Start backend
python app.py
# Backend runs on http://localhost:5000
```

3. **Frontend Setup**
```bash
cd ../frontend
npm install

# Create .env file
echo "REACT_APP_API_URL=http://localhost:5000" > .env

# Start frontend
npm start
# Frontend runs on http://localhost:3000
```

### Production Deployment

**Backend (Render)**
1. Connect GitHub repository
2. Set root directory: `backend`
3. Build command: `pip install -r requirements.txt`
4. Start command: `gunicorn app:app`
5. Add environment variable: `HUGGINGFACE_API_KEY`

**Frontend (Vercel)**
1. Import from GitHub
2. Set root directory: `frontend`
3. Add environment variable: `REACT_APP_API_URL=https://your-backend.onrender.com`

## 🎮 Usage Guide

### Basic Navigation
1. **Explore the 3D Scene**: Drag to orbit, scroll to zoom
2. **Select Buildings**: Click any building to view details
3. **Query Buildings**: Enter natural language queries like:
   - "buildings over 200 feet"
   - "commercial buildings"
   - "buildings worth less than $500,000"
4. **Save Projects**: Enter username, save current filtered view
5. **Load Projects**: Select from saved projects to restore filters

### Sample Queries
- `"tall buildings"` → Filters by height
- `"expensive properties"` → Filters by value
- `"commercial zoning"` → Filters by zoning type
- `"show all buildings"` → Clears all filters

## 🔬 Technical Implementation Details

### 3D Visualization Engine
- **Coordinate System**: Calgary lat/lng converted to Three.js world space
- **Building Representation**: BoxGeometry with height-based extrusion
- **Interaction**: Raycasting for mouse-click detection
- **Performance**: Optimized rendering with efficient state management

### LLM Integration Workflow
1. User enters natural language query
2. Frontend sends query to `/api/query` endpoint
3. Backend processes with Hugging Face API
4. Parsed filter criteria returned to frontend
5. Buildings filtered and highlighted in 3D scene
6. Fallback keyword parsing ensures reliability

### Data Management
- **Mock Data**: 20 realistic Calgary buildings with coordinates, heights, values
- **State Management**: React hooks with optimized re-rendering
- **Persistence**: localStorage with user-scoped project management
- **Error Handling**: Comprehensive error boundaries and fallback systems

## 🚧 Future Development Roadmap

### Phase 1: Enhanced Data Integration
- **Real Calgary Open Data**: Replace mock data with City of Calgary APIs
- **Building Footprints**: Accurate geometric representations
- **Historical Data**: Property value trends and development timeline
- **Real-time Updates**: Live building permit and development data

### Phase 2: Database & Authentication
- **PostgreSQL Migration**: Replace localStorage with proper database
- **User Authentication**: Secure login with project sharing capabilities
- **Advanced Queries**: Complex multi-criteria filtering with query history
- **Data Caching**: Optimized performance for large datasets

### Phase 3: Advanced Visualization
- **Detailed Building Models**: 3D meshes with architectural details
- **Neighborhood Overlays**: Zoning maps, demographic data visualization
- **Temporal Visualization**: Time-slider for historical city development
- **AR/VR Integration**: Mobile AR viewing and VR exploration modes

### Phase 4: AI & Analytics
- **Predictive Analytics**: Property value forecasting with ML models
- **Urban Planning Tools**: Development impact simulation
- **Natural Language Reporting**: AI-generated insights and summaries
- **Advanced Query Engine**: Complex spatial and temporal queries

### Phase 5: Production Features
- **Multi-City Support**: Expandable to other Canadian cities
- **API Rate Limiting**: Proper production API management
- **Performance Monitoring**: Real-time metrics and error tracking
- **Mobile App**: React Native companion application

## 🎯 Assessment Reflection

### Challenges Overcome
- **Three.js Learning Curve**: Mastered 3D visualization concepts quickly
- **Dependency Management**: Resolved complex package conflicts
- **Deployment Configuration**: Successful CORS and environment setup
- **LLM Integration**: Implemented robust fallback systems

### Design Decisions
- **Vanilla Three.js over React-Three-Fiber**: Better performance and control
- **localStorage over Database**: Rapid prototyping for time constraints
- **Mock Data Strategy**: Realistic Calgary building information
- **Modular Architecture**: Separation of concerns for maintainability

### Performance Optimizations
- **Efficient Re-rendering**: Prevented unnecessary Three.js scene rebuilds
- **Query Fallback System**: Keyword parsing when LLM unavailable
- **Responsive Design**: Mobile-friendly interface considerations
- **Error Boundaries**: Graceful degradation strategies

## 📊 Project Metrics

- **Components**: 4 React components, 3 API endpoints
- **Dependencies**: 15 npm packages, 6 Python packages
- **Deployment**: 2 cloud services, automated CI/CD

## 🤝 Acknowledgments

Built as a technical assessment for MASIV (Mercedes and Singh Innovative Ventures) Software Engineering Internship position. Special thanks for the flexibility and understanding regarding timeline adjustments.

## 📞 Contact

**Mark Cena**  
📧 markjpcena@gmail.com  
📱 587-577-0296  
🔗 [LinkedIn](https://www.linkedin.com/in/mark-cena-bb8658267/)  
🐙 [GitHub](https://github.com/MARKJPC)

---

*This project demonstrates full-stack development capabilities, 3D visualization expertise, AI integration skills, and production deployment experience suitable for modern AEC technology development.*
