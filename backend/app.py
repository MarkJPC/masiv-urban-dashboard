from flask import Flask, jsonify, request
from flask_cors import CORS
import logging
import requests
import json
import os
import re
from typing import Dict, List, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins=['http://localhost:3000'])

# Calgary building data in a 4-block grid (Centre St to 2nd St SW, 6th Ave to 9th Ave SW)
# Grid arranged for visible pattern: 5x4 layout
MOCK_BUILDINGS = [
    # Row 1: 9th Avenue (North)
    {
        "id": 1,
        "name": "Heritage Plaza",
        "address": "100 Centre St SW",
        "lat": 51.0440,
        "lng": -114.0600,
        "height": 120,
        "value": 2800000,
        "zoning": "CB-D",
        "color": "#FF6B6B"
    },
    {
        "id": 2,
        "name": "Central Court",
        "address": "200 Centre St SW",
        "lat": 51.0440,
        "lng": -114.0650,
        "height": 95,
        "value": 1900000,
        "zoning": "RC-G",
        "color": "#4ECDC4"
    },
    {
        "id": 3,
        "name": "Metro Building",
        "address": "300 1st St SW",
        "lat": 51.0440,
        "lng": -114.0700,
        "height": 210,
        "value": 4200000,
        "zoning": "CB-D",
        "color": "#45B7D1"
    },
    {
        "id": 4,
        "name": "Sunrise Tower",
        "address": "400 2nd St SW",
        "lat": 51.0440,
        "lng": -114.0750,
        "height": 85,
        "value": 1500000,
        "zoning": "RC-G",
        "color": "#96CEB4"
    },
    # Row 2: 8th Avenue
    {
        "id": 5,
        "name": "Commerce Centre",
        "address": "101 Centre St SW",
        "lat": 51.0455,
        "lng": -114.0600,
        "height": 180,
        "value": 3600000,
        "zoning": "CB-D",
        "color": "#FFEAA7"
    },
    {
        "id": 6,
        "name": "Executive Plaza",
        "address": "201 Centre St SW",
        "lat": 51.0455,
        "lng": -114.0650,
        "height": 165,
        "value": 3200000,
        "zoning": "CB-D",
        "color": "#DDA0DD"
    },
    {
        "id": 7,
        "name": "City Centre West",
        "address": "301 1st St SW",
        "lat": 51.0455,
        "lng": -114.0700,
        "height": 240,
        "value": 4800000,
        "zoning": "CB-D",
        "color": "#F39C12"
    },
    {
        "id": 8,
        "name": "Maple Leaf Building",
        "address": "401 2nd St SW",
        "lat": 51.0455,
        "lng": -114.0750,
        "height": 75,
        "value": 1200000,
        "zoning": "RC-G",
        "color": "#E74C3C"
    },
    # Row 3: 7th Avenue (Transit Mall)
    {
        "id": 9,
        "name": "Transit Plaza",
        "address": "102 Centre St SW",
        "lat": 51.0470,
        "lng": -114.0600,
        "height": 145,
        "value": 2900000,
        "zoning": "CC-MH",
        "color": "#9B59B6"
    },
    {
        "id": 10,
        "name": "Stephen Avenue Place",
        "address": "202 Centre St SW",
        "lat": 51.0470,
        "lng": -114.0650,
        "height": 320,
        "value": 5000000,
        "zoning": "CB-D",
        "color": "#1ABC9C"
    },
    {
        "id": 11,
        "name": "Financial District Tower",
        "address": "302 1st St SW",
        "lat": 51.0470,
        "lng": -114.0700,
        "height": 285,
        "value": 4700000,
        "zoning": "CB-D",
        "color": "#34495E"
    },
    {
        "id": 12,
        "name": "Olympic Plaza View",
        "address": "402 2nd St SW",
        "lat": 51.0470,
        "lng": -114.0750,
        "height": 55,
        "value": 850000,
        "zoning": "RC-G",
        "color": "#E67E22"
    },
    # Row 4: 6th Avenue (South)
    {
        "id": 13,
        "name": "Eau Claire Gateway",
        "address": "103 Centre St SW",
        "lat": 51.0485,
        "lng": -114.0600,
        "height": 65,
        "value": 980000,
        "zoning": "CC-MH",
        "color": "#27AE60"
    },
    {
        "id": 14,
        "name": "Bow River Plaza",
        "address": "203 Centre St SW",
        "lat": 51.0485,
        "lng": -114.0650,
        "height": 105,
        "value": 2100000,
        "zoning": "CC-MH",
        "color": "#3498DB"
    },
    {
        "id": 15,
        "name": "Prince's Island Tower",
        "address": "303 1st St SW",
        "lat": 51.0485,
        "lng": -114.0700,
        "height": 125,
        "value": 2500000,
        "zoning": "CC-MH",
        "color": "#F1C40F"
    },
    {
        "id": 16,
        "name": "Riverside Court",
        "address": "403 2nd St SW",
        "lat": 51.0485,
        "lng": -114.0750,
        "height": 42,
        "value": 620000,
        "zoning": "RC-G",
        "color": "#FF6B9D"
    },
    # Additional buildings for 20 total
    {
        "id": 17,
        "name": "Heritage Court",
        "address": "150 Centre St SW",
        "lat": 51.0447,
        "lng": -114.0625,
        "height": 88,
        "value": 1600000,
        "zoning": "RC-G",
        "color": "#C44569"
    },
    {
        "id": 18,
        "name": "Downtown Lofts",
        "address": "250 Centre St SW",
        "lat": 51.0462,
        "lng": -114.0625,
        "height": 72,
        "value": 1350000,
        "zoning": "RC-G",
        "color": "#40407A"
    },
    {
        "id": 19,
        "name": "Urban Living Complex",
        "address": "350 1st St SW",
        "lat": 51.0477,
        "lng": -114.0675,
        "height": 98,
        "value": 1850000,
        "zoning": "CC-MH",
        "color": "#706FD3"
    },
    {
        "id": 20,
        "name": "Parkside Residences",
        "address": "450 2nd St SW",
        "lat": 51.0492,
        "lng": -114.0725,
        "height": 35,
        "value": 450000,
        "zoning": "RC-G",
        "color": "#FF5252"
    }
]

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        logger.info("Health check requested")
        return jsonify({
            "status": "healthy",
            "message": "Calgary 3D City Dashboard API is running"
        }), 200
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Health check failed"
        }), 500

@app.route('/api/buildings', methods=['GET'])
def get_buildings():
    """Get all Calgary building data"""
    try:
        logger.info("Buildings data requested")
        return jsonify({
            "buildings": MOCK_BUILDINGS,
            "count": len(MOCK_BUILDINGS)
        }), 200
    except Exception as e:
        logger.error(f"Failed to fetch buildings: {str(e)}")
        return jsonify({
            "error": "Failed to fetch building data",
            "message": str(e)
        }), 500

@app.route('/api/query', methods=['POST'])
def process_llm_query():
    """Process LLM queries and return filter criteria"""
    try:
        data = request.get_json()
        if not data or 'query' not in data:
            return jsonify({
                "error": "Missing query parameter"
            }), 400

        query = data['query'].lower().strip()
        logger.info(f"Processing query: {query}")

        # Parse query and generate filter criteria
        filter_criteria = parse_query_to_filters(query)
        
        # Optional: Use Hugging Face API for more sophisticated processing
        if os.getenv('HUGGINGFACE_API_KEY'):
            enhanced_criteria = enhance_with_llm(query, filter_criteria)
            if enhanced_criteria:
                filter_criteria = enhanced_criteria

        return jsonify({
            "query": data['query'],
            "filter_criteria": filter_criteria,
            "parsed_successfully": True
        }), 200

    except Exception as e:
        logger.error(f"Failed to process query: {str(e)}")
        return jsonify({
            "error": "Failed to process query",
            "message": str(e),
            "parsed_successfully": False
        }), 500

def parse_query_to_filters(query: str) -> Dict[str, Any]:
    """Parse natural language query into filter criteria"""
    filters = {}
    
    # Height filters
    height_patterns = [
        (r'buildings?\s+over\s+(\d+)\s*(?:feet|ft|meters?|m)', 'height_min'),
        (r'buildings?\s+above\s+(\d+)\s*(?:feet|ft|meters?|m)', 'height_min'),
        (r'buildings?\s+taller\s+than\s+(\d+)\s*(?:feet|ft|meters?|m)', 'height_min'),
        (r'buildings?\s+under\s+(\d+)\s*(?:feet|ft|meters?|m)', 'height_max'),
        (r'buildings?\s+below\s+(\d+)\s*(?:feet|ft|meters?|m)', 'height_max'),
        (r'buildings?\s+shorter\s+than\s+(\d+)\s*(?:feet|ft|meters?|m)', 'height_max'),
    ]
    
    for pattern, filter_type in height_patterns:
        match = re.search(pattern, query)
        if match:
            height = int(match.group(1))
            # Convert feet to meters if needed
            if 'feet' in match.group(0) or 'ft' in match.group(0):
                height = int(height * 0.3048)
            filters[filter_type] = height

    # Value filters
    value_patterns = [
        (r'buildings?\s+worth\s+over\s+\$?(\d+)(?:\s*million)?', 'value_min'),
        (r'buildings?\s+valued\s+above\s+\$?(\d+)(?:\s*million)?', 'value_min'),
        (r'expensive\s+buildings?', 'value_min_preset'),
        (r'cheap\s+buildings?', 'value_max_preset'),
    ]
    
    for pattern, filter_type in value_patterns:
        match = re.search(pattern, query)
        if match:
            if 'preset' in filter_type:
                if 'min' in filter_type:
                    filters['value_min'] = 3000000  # 3M+
                else:
                    filters['value_max'] = 1000000   # Under 1M
            else:
                value = int(match.group(1))
                if 'million' in match.group(0):
                    value *= 1000000
                filters['value_min' if 'min' in filter_type else 'value_max'] = value

    # Zoning filters (Calgary specific)
    zoning_patterns = [
        (r'commercial\s+buildings?', 'CB-D'),
        (r'residential\s+buildings?', 'RC-G'),
        (r'mixed.use\s+buildings?', 'CC-MH'),
        (r'cb-d\s+buildings?', 'CB-D'),
        (r'rc-g\s+buildings?', 'RC-G'),
        (r'cc-mh\s+buildings?', 'CC-MH'),
    ]
    
    for pattern, zone_type in zoning_patterns:
        if re.search(pattern, query):
            filters['zoning'] = zone_type

    # Special queries
    if re.search(r'tallest\s+buildings?', query):
        filters['sort_by'] = 'height'
        filters['sort_order'] = 'desc'
        filters['limit'] = 5
    elif re.search(r'shortest\s+buildings?', query):
        filters['sort_by'] = 'height'
        filters['sort_order'] = 'asc'
        filters['limit'] = 5
    elif re.search(r'most\s+expensive\s+buildings?', query):
        filters['sort_by'] = 'value'
        filters['sort_order'] = 'desc'
        filters['limit'] = 5

    return filters

def enhance_with_llm(query: str, base_filters: Dict[str, Any]) -> Dict[str, Any]:
    """Enhance filter criteria using Hugging Face API"""
    try:
        api_key = os.getenv('HUGGINGFACE_API_KEY')
        if not api_key:
            return None

        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }

        prompt = f"""
        Extract filter criteria from this query: "{query}"
        
        Return JSON with this exact format:
        {{
            "attribute": "height|value|zoning",
            "operator": ">", "<", "=",
            "value": number_or_string
        }}
        
        Examples:
        - "buildings over 100 feet" -> {{"attribute": "height", "operator": ">", "value": 100}}
        - "RC-G zoned buildings" -> {{"attribute": "zoning", "operator": "=", "value": "RC-G"}}
        - "buildings under $2M" -> {{"attribute": "value", "operator": "<", "value": 2000000}}
        """

        payload = {
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": 200,
                "temperature": 0.1
            }
        }

        response = requests.post(
            "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium",
            headers=headers,
            json=payload,
            timeout=10
        )

        if response.status_code == 200:
            result = response.json()
            # Process and merge with base filters
            logger.info("Enhanced filters with LLM")
            return base_filters
        else:
            logger.warning(f"LLM API failed: {response.status_code}")
            return base_filters

    except Exception as e:
        logger.error(f"LLM enhancement failed: {str(e)}")
        return base_filters

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "error": "Endpoint not found",
        "message": "The requested API endpoint does not exist"
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        "error": "Internal server error",
        "message": "An unexpected error occurred"
    }), 500

if __name__ == '__main__':
    logger.info("Starting Calgary 3D City Dashboard API")
    app.run(debug=True, host='0.0.0.0', port=5000)