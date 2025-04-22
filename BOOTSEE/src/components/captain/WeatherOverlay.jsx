import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { gsap } from 'gsap';
import './WeatherOverlay.css';

// Weather overlay component for CaptainMap
const WeatherOverlay = ({ 
  position, 
  enabled = true,
  apiKey = 'YOUR_OPENWEATHERMAP_API_KEY' // Replace with your actual API key
}) => {
  const map = useMap();
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [weatherLayer, setWeatherLayer] = useState(null);

  // Fetch weather data
  useEffect(() => {
    if (!enabled || !position) return;

    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(null);

        // For demo purposes, we'll use a mock response
        // In production, uncomment the fetch call below
        
        /*
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${position[0]}&lon=${position[1]}&units=metric&appid=${apiKey}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch weather data');
        }
        
        const data = await response.json();
        */
        
        // Mock weather data for demo
        const mockWeather = {
          main: {
            temp: 28,
            feels_like: 30,
            humidity: 65,
            pressure: 1012
          },
          weather: [
            {
              id: 800,
              main: 'Clear',
              description: 'clear sky',
              icon: '01d'
            }
          ],
          wind: {
            speed: 3.5,
            deg: 120
          },
          visibility: 10000,
          name: 'Current Location'
        };
        
        // Simulate network delay
        setTimeout(() => {
          setWeather(mockWeather);
          setLoading(false);
        }, 500);
        
      } catch (err) {
        console.error('Error fetching weather:', err);
        setError('Failed to load weather data');
        setLoading(false);
      }
    };

    fetchWeather();
  }, [position, enabled, apiKey]);

  // Add weather overlay to map
  useEffect(() => {
    if (!map || !weather || !enabled) return;

    // Remove existing weather layer
    if (weatherLayer) {
      map.removeLayer(weatherLayer);
    }

    // Create weather overlay container
    const weatherContainer = L.DomUtil.create('div', 'weather-overlay');
    
    // Prevent clicks on the weather overlay from propagating to the map
    L.DomEvent.disableClickPropagation(weatherContainer);
    
    // Weather icon URL
    const iconUrl = `https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`;
    
    // Set HTML content
    weatherContainer.innerHTML = `
      <div class="weather-content">
        <div class="weather-header">
          <img src="${iconUrl}" alt="${weather.weather[0].description}" class="weather-icon" />
          <div class="weather-temp">${Math.round(weather.main.temp)}°C</div>
        </div>
        <div class="weather-details">
          <div class="weather-description">${weather.weather[0].description}</div>
          <div class="weather-info">
            <span>Feels like: ${Math.round(weather.main.feels_like)}°C</span>
            <span>Humidity: ${weather.main.humidity}%</span>
            <span>Wind: ${weather.wind.speed} m/s</span>
          </div>
        </div>
      </div>
    `;
    
    // Create custom control
    const WeatherControl = L.Control.extend({
      options: {
        position: 'topright'
      },
      onAdd: function() {
        return weatherContainer;
      }
    });
    
    // Add control to map
    const weatherControl = new WeatherControl();
    map.addControl(weatherControl);
    
    // Store layer reference for cleanup
    setWeatherLayer(weatherControl);
    
    // Animate in
    gsap.fromTo(
      weatherContainer,
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
    );
    
    // Cleanup
    return () => {
      if (weatherLayer) {
        map.removeControl(weatherLayer);
      }
    };
  }, [map, weather, enabled, weatherLayer]);

  // Loading and error states don't need to render anything
  // The weather overlay will be added directly to the map
  return null;
};

export default WeatherOverlay;
