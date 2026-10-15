const json = async (url, signal) => {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`API request failed (${response.status})`);
  return response.json();
};

export async function findCities(name, signal) {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', name.trim());
  url.searchParams.set('count', '5');
  url.searchParams.set('language', 'en');
  const result = await json(url, signal);
  return result.results || [];
}

export function fetchWeather(location, signal) {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', location.latitude);
  url.searchParams.set('longitude', location.longitude);
  url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,weather_code');
  url.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max');
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('forecast_days', '5');
  return json(url, signal);
}

export function fetchEarthquakes(location, radiusKm, days, signal) {
  const url = new URL('https://earthquake.usgs.gov/fdsnws/event/1/query');
  const start = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  url.searchParams.set('format', 'geojson');
  url.searchParams.set('latitude', location.latitude);
  url.searchParams.set('longitude', location.longitude);
  url.searchParams.set('maxradiuskm', radiusKm);
  url.searchParams.set('starttime', start);
  url.searchParams.set('orderby', 'time');
  url.searchParams.set('limit', '100');
  return json(url, signal);
}
