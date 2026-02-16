"""Sample data generation for PipeFlow"""
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random


def generate_census_data(n_records: int = 500) -> pd.DataFrame:
    """Generate synthetic Indian census data"""
    np.random.seed(42)
    random.seed(42)
    
    states = [
        "Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "West Bengal",
        "Gujarat", "Rajasthan", "Uttar Pradesh", "Madhya Pradesh", "Kerala",
        "Punjab", "Haryana", "Bihar", "Odisha", "Telangana"
    ]
    
    districts_per_state = {
        "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Solapur"],
        "Delhi": ["New Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi"],
        "Karnataka": ["Bangalore", "Mysore", "Mangalore", "Hubli", "Belgaum"],
        "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
        "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri"],
        "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar"],
        "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner"],
        "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Agra", "Allahabad"],
        "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain"],
        "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam"],
        "Punjab": ["Chandigarh", "Ludhiana", "Amritsar", "Jalandhar", "Patiala"],
        "Haryana": ["Gurgaon", "Faridabad", "Panipat", "Karnal", "Rohtak"],
        "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga"],
        "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur"],
        "Telangana": ["Hyderabad", "Warangal", "Karimnagar", "Nizamabad", "Khammam"]
    }
    
    data = []
    for _ in range(n_records):
        state = random.choice(states)
        district = random.choice(districts_per_state[state])
        
        population = int(np.random.lognormal(12, 1.5))
        population = max(10000, min(population, 5000000))
        
        area = population / random.uniform(50, 5000)
        
        age = int(np.random.triangular(0, 35, 80))
        
        literacy_rate = min(99, max(40, np.random.normal(75, 12)))
        
        male_pop = int(population * random.uniform(0.48, 0.52))
        female_pop = population - male_pop
        
        urban = random.random() < 0.4
        urban_pop = int(population * random.uniform(0.3, 0.9)) if urban else int(population * random.uniform(0.05, 0.25))
        rural_pop = population - urban_pop
        
        data.append({
            "state": state,
            "district": district,
            "population": population,
            "area_km2": round(area, 2),
            "age": age,
            "literacy_rate": round(literacy_rate, 2),
            "male_population": male_pop,
            "female_population": female_pop,
            "urban_population": urban_pop,
            "rural_population": rural_pop,
            "population_density": round(population / area, 2)
        })
    
    df = pd.DataFrame(data)
    return df


def generate_weather_data(n_records: int = 1000) -> pd.DataFrame:
    """Generate synthetic weather data for Indian cities"""
    np.random.seed(43)
    random.seed(43)
    
    cities = [
        ("Delhi", 28.6139, 77.2090),
        ("Mumbai", 19.0760, 72.8777),
        ("Bangalore", 12.9716, 77.5946),
        ("Chennai", 13.0827, 80.2707),
        ("Kolkata", 22.5726, 88.3639),
        ("Hyderabad", 17.3850, 78.4867),
        ("Pune", 18.5204, 73.8567),
        ("Ahmedabad", 23.0225, 72.5714),
        ("Jaipur", 26.9124, 75.7873),
        ("Lucknow", 26.8467, 80.9462),
        ("Chandigarh", 30.7333, 76.7794),
        ("Kochi", 9.9312, 76.2673),
        ("Guwahati", 26.1445, 91.7362),
        ("Shimla", 31.1048, 77.1734),
        ("Srinagar", 34.0837, 74.7973)
    ]
    
    seasons = {
        "Winter": (1, 2, 12),
        "Spring": (3, 4, 5),
        "Monsoon": (6, 7, 8, 9),
        "Autumn": (10, 11)
    }
    
    base_temps = {
        "Delhi": (15, 35, 45),      # min, max, avg
        "Mumbai": (20, 35, 32),
        "Bangalore": (15, 32, 25),
        "Chennai": (20, 40, 30),
        "Kolkata": (15, 38, 30),
        "Hyderabad": (18, 38, 28),
        "Pune": (15, 35, 28),
        "Ahmedabad": (18, 42, 32),
        "Jaipur": (10, 38, 28),
        "Lucknow": (12, 38, 28),
        "Chandigarh": (8, 35, 25),
        "Kochi": (22, 35, 30),
        "Guwahati": (15, 35, 28),
        "Shimla": (2, 25, 15),
        "Srinagar": (-2, 30, 15)
    }
    
    data = []
    start_date = datetime.now() - timedelta(days=365)
    
    for _ in range(n_records):
        city, lat, lon = random.choice(cities)
        
        # Random date within past year
        days_offset = random.randint(0, 365)
        date = start_date + timedelta(days=days_offset)
        month = date.month
        
        # Determine season
        season = "Summer"
        for s, months in seasons.items():
            if month in months:
                season = s
                break
        
        # Temperature based on season and city
        base_min, base_max, _ = base_temps[city]
        
        if season == "Winter":
            temp = np.random.normal(base_min + 5, 3)
            humidity = np.random.normal(70, 10)
            rainfall = np.random.exponential(2)
        elif season == "Monsoon":
            temp = np.random.normal((base_min + base_max) / 2, 3)
            humidity = np.random.normal(85, 8)
            rainfall = np.random.exponential(20)
        elif season == "Spring":
            temp = np.random.normal(base_max - 10, 3)
            humidity = np.random.normal(60, 12)
            rainfall = np.random.exponential(5)
        else:  # Autumn
            temp = np.random.normal(base_max - 5, 3)
            humidity = np.random.normal(65, 10)
            rainfall = np.random.exponential(3)
        
        wind_speed = np.random.exponential(10)
        
        # Weather condition
        if humidity > 80 or rainfall > 15:
            condition = random.choice(["Rainy", "Cloudy", "Overcast"])
        elif temp > 35:
            condition = random.choice(["Clear", "Hot", "Sunny"])
        else:
            condition = random.choice(["Clear", "Cloudy", "Sunny", "Partly Cloudy"])
        
        # Air quality (higher in metro cities)
        aqi = int(np.random.lognormal(4 if city in ["Delhi", "Mumbai", "Kolkata"] else 3, 0.5))
        aqi = min(500, max(20, aqi))
        
        data.append({
            "city": city,
            "latitude": lat,
            "longitude": lon,
            "date": date.strftime("%Y-%m-%d"),
            "season": season,
            "temperature": round(temp, 1),
            "humidity": round(max(0, min(100, humidity)), 1),
            "wind_speed_kmh": round(wind_speed, 1),
            "rainfall_mm": round(rainfall, 1),
            "condition": condition,
            "air_quality_index": aqi,
            "pressure_hpa": round(np.random.normal(1013, 10), 1),
            "visibility_km": round(max(0.5, 15 - rainfall / 2 + np.random.normal(0, 2)), 1)
        })
    
    df = pd.DataFrame(data)
    return df


if __name__ == "__main__":
    # Generate and save sample data
    census_df = generate_census_data()
    census_df.to_csv("data/census_data.csv", index=False)
    print(f"Generated {len(census_df)} census records")
    
    weather_df = generate_weather_data()
    weather_df.to_csv("data/weather_data.csv", index=False)
    print(f"Generated {len(weather_df)} weather records")
