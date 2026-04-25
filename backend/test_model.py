import requests

r = requests.post(
    'http://localhost:5000/api/predict-crop',
    json={
        'temperature': 25.0,
        'moisture': 0.6,
        'rainfall': 150.0,
        'ph': 6.5,
        'nitrogen': 40.0,
        'phosphorus': 60.0,
        'potassium': 40.0,
        'carbon': 1.2,
        'soil': 'Loamy Soil'
    }
)

print(r.json())