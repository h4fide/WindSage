from flask import Flask, render_template, jsonify
import requests
from datetime import datetime, timedelta
import logging

app = Flask(__name__)
logging.basicConfig(level=logging.DEBUG)

def get_wind_data(latitude, longitude):
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": "wind_speed_10m,wind_direction_10m",
        "forecast_days": 1
    }
    response = requests.get(url, params=params)
    app.logger.debug(f"API Response: {response.status_code}")
    app.logger.debug(f"API Response content: {response.text}")
    return response.json() if response.status_code == 200 else None

def get_cardinal_direction(degrees):
    directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
    index = round(degrees / 45) % 8
    return directions[index]

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/wind-data')
def wind_data():
    app.logger.debug("Received request for wind data")
    latitude = 34.23075126666799
    longitude = -3.9822058161358935
    data = get_wind_data(latitude, longitude)
    
    if not data:
        app.logger.error("Failed to fetch wind data")
        return jsonify({"error": "Failed to fetch wind data"}), 500

    hourly_data = data.get("hourly", {})
    timestamps = hourly_data.get("time", [])
    wind_speeds = hourly_data.get("wind_speed_10m", [])
    wind_directions = hourly_data.get("wind_direction_10m", [])

    forecast_data = []
    for i in range(len(timestamps)):
        forecast_data.append({
            "time": timestamps[i],
            "wind_speed": wind_speeds[i],
            "wind_direction": wind_directions[i],
            "cardinal_direction": get_cardinal_direction(wind_directions[i])
        })

    app.logger.debug(f"Sending response: {forecast_data}")
    return jsonify(forecast_data)

if __name__ == '__main__':
    app.run(debug=True)
