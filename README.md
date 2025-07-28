# masiv-urban-dashboard
# Calgary 3D City Dashboard

Live Demo: https://masiv-urban-dashboard.vercel.app/

## Features
- 3D visualization of Calgary buildings
- Click buildings for details
- Natural language queries ("buildings over 100 feet")
- Save/load project views
- Real-time filtering and highlighting

## Local Setup
1. Backend: `cd backend && pip install -r requirements.txt && python app.py`
2. Frontend: `cd frontend && npm install && npm start`
3. Set HUGGINGFACE_API_KEY in backend/.env
