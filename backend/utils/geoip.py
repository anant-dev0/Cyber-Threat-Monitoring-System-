import random

class GeoIP:
    def __init__(self):
        # Mock country list with lat/long centers
        self.countries = {
            'US': {'name': 'United States', 'lat': 37.0902, 'lon': -95.7129},
            'CN': {'name': 'China', 'lat': 35.8617, 'lon': 104.1954},
            'RU': {'name': 'Russia', 'lat': 61.5240, 'lon': 105.3188},
            'DE': {'name': 'Germany', 'lat': 51.1657, 'lon': 10.4515},
            'BR': {'name': 'Brazil', 'lat': -14.2350, 'lon': -51.9253},
            'IN': {'name': 'India', 'lat': 20.5937, 'lon': 78.9629},
            'FR': {'name': 'France', 'lat': 46.2276, 'lon': 2.2137},
            'JP': {'name': 'Japan', 'lat': 36.2048, 'lon': 138.2529},
            'GB': {'name': 'United Kingdom', 'lat': 55.3781, 'lon': -3.4360},
            'AU': {'name': 'Australia', 'lat': -25.2744, 'lon': 133.7751},
            'CA': {'name': 'Canada', 'lat': 56.1304, 'lon': -106.3468},
            'MX': {'name': 'Mexico', 'lat': 23.6345, 'lon': -102.5528},
            'IT': {'name': 'Italy', 'lat': 41.8719, 'lon': 12.5674},
            'ES': {'name': 'Spain', 'lat': 40.4637, 'lon': -3.7492},
            'NL': {'name': 'Netherlands', 'lat': 52.1326, 'lon': 5.2913},
            'SE': {'name': 'Sweden', 'lat': 60.1282, 'lon': 18.6435},
            'NO': {'name': 'Norway', 'lat': 60.4720, 'lon': 8.4689},
            'PL': {'name': 'Poland', 'lat': 51.9194, 'lon': 19.1451},
            'UA': {'name': 'Ukraine', 'lat': 48.3794, 'lon': 31.1656},
            'TR': {'name': 'Turkey', 'lat': 38.9637, 'lon': 35.2433},
            'SA': {'name': 'Saudi Arabia', 'lat': 23.8859, 'lon': 45.0792},
            'IR': {'name': 'Iran', 'lat': 32.4279, 'lon': 53.6880},
            'ZA': {'name': 'South Africa', 'lat': -30.5595, 'lon': 22.9375},
            'EG': {'name': 'Egypt', 'lat': 26.8206, 'lon': 30.8025},
            'NG': {'name': 'Nigeria', 'lat': 9.0820, 'lon': 8.6753},
            'KE': {'name': 'Kenya', 'lat': -0.0236, 'lon': 37.9062},
            'KR': {'name': 'South Korea', 'lat': 35.9078, 'lon': 127.7669},
            'ID': {'name': 'Indonesia', 'lat': -0.7893, 'lon': 113.9213},
            'VN': {'name': 'Vietnam', 'lat': 14.0583, 'lon': 108.2772},
            'TH': {'name': 'Thailand', 'lat': 15.8700, 'lon': 100.9925},
            'PK': {'name': 'Pakistan', 'lat': 30.3753, 'lon': 69.3451},
            'AR': {'name': 'Argentina', 'lat': -38.4161, 'lon': -63.6167},
            'CO': {'name': 'Colombia', 'lat': 4.5709, 'lon': -74.2973},
            'PE': {'name': 'Peru', 'lat': -9.1900, 'lon': -75.0152},
            'CL': {'name': 'Chile', 'lat': -35.6751, 'lon': -71.5430},
            'NZ': {'name': 'New Zealand', 'lat': -40.9006, 'lon': 174.8860},
            'SG': {'name': 'Singapore', 'lat': 1.3521, 'lon': 103.8198},
            'MY': {'name': 'Malaysia', 'lat': 4.2105, 'lon': 101.9758},
            'PH': {'name': 'Philippines', 'lat': 12.8797, 'lon': 121.7740},
            'BD': {'name': 'Bangladesh', 'lat': 23.6850, 'lon': 90.3563},
            'GR': {'name': 'Greece', 'lat': 39.0742, 'lon': 21.8243},
            'PT': {'name': 'Portugal', 'lat': 39.3999, 'lon': -8.2245},
            'RO': {'name': 'Romania', 'lat': 45.9432, 'lon': 24.9668},
            'CZ': {'name': 'Czech Republic', 'lat': 49.8175, 'lon': 15.4730},
            'HU': {'name': 'Hungary', 'lat': 47.1625, 'lon': 19.5033},
            'AT': {'name': 'Austria', 'lat': 47.5162, 'lon': 14.5501},
            'CH': {'name': 'Switzerland', 'lat': 46.8182, 'lon': 8.2275},
            'BE': {'name': 'Belgium', 'lat': 50.5039, 'lon': 4.4699}
        }
        self.country_codes = list(self.countries.keys())

    def get_country(self, ip):
        """Mock function to return a random country for an IP."""
        # For a real app, use geoip2.database.Reader('GeoLite2-City.mmdb')
        # Here we just pick random for simulation viz
        code = random.choice(self.country_codes)
        base = self.countries[code]
        
        # Add random jitter to simulate different cities/locations within the country
        # +/- 1.5 degrees is roughly +/- 150km, creating a nice spread
        lat_jitter = random.uniform(-1.5, 1.5)
        lon_jitter = random.uniform(-1.5, 1.5)

        return {
            'country_code': code,
            'country_name': base['name'],
            'location': {
                'lat': base['lat'] + lat_jitter, 
                'lon': base['lon'] + lon_jitter
            }
        }
