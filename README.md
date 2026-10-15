# TerraWatch — Weather & Earthquake Explorer

A React/Vite hackathon project joining three public API endpoints: Open-Meteo Geocoding, Open-Meteo Forecast, and USGS Earthquake Catalog.

## Run locally

```bash
npm install
npm run dev
npm run build
```

Open the local URL shown by Vite. No API keys required for personal/noncommercial evaluation; obey source terms and rate limits.

## Features
- City lookup with ambiguity handling (choose a matching city)
- Current weather and 5-day forecast
- Recorded earthquakes within a configurable radius and time window
- Magnitude indicators, links to official event details, responsive layout
- Independent request errors and loading states

## Component wireframe
See `docs/wireframe.png` or `docs/wireframe.svg`. `App` owns selected `location`, weather data, earthquake data, date/radius filters and request status. `SearchPanel` manages the search string and matches locally and raises a chosen city with `onSelect`. `WeatherPanel` receives weather props; `EarthquakePanel` receives earthquake props and raises radius/day filter changes. `Metric` is a reusable presentational component. API calls live in `src/api.js`.

```text
App [location, weather, earthquakes, radius, days]
├── Header
├── Hero
│   └── SearchPanel [query, results] --onSelect--> App
├── LocationHeading
├── WeatherPanel [weather, loading, error]
│   ├── CurrentWeather
│   ├── Metric × 3
│   └── ForecastDay × 5
├── EarthquakePanel [events, loading, error, radius, days]
│   ├── Filters --onRadius/onDays--> App
│   ├── EventSummary
│   └── EventRow × N
└── SafetyDisclaimer / Footer
```

## APIs
1. `https://geocoding-api.open-meteo.com/v1/search` — city to coordinates
2. `https://api.open-meteo.com/v1/forecast` — current/daily weather
3. `https://earthquake.usgs.gov/fdsnws/event/1/query` — recent events by coordinates/radius

The first two are independent Open-Meteo **endpoints**, not independent providers. This project integrates **three endpoints from two organizations**.

## Important limitations
- Quake events are observed historical reports and **not earthquake predictions**.
- The USGS endpoint may return delayed or incomplete observations and caps display at 12 events, with a query limit of 100.
- This dashboard is **not** an emergency response service.
- Weather use is subject to Open-Meteo license and usage terms; check before commercial use.

## Deployment
1. Commit/push this folder to your own GitHub repo.
2. Import repo into Vercel (`Framework: Vite`, `Build: npm run build`, `Output: dist`).
3. Verify city search and both data panels from the live URL.
