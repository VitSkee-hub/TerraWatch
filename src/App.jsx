import React, { useState, useEffect, useRef } from "react";
import {
  Activity,
  ArrowDown,
  ArrowUpRight,
  CloudSun,
  Compass,
  Droplets,
  ExternalLink,
  LocateFixed,
  MapPin,
  Search,
  ShieldAlert,
  Thermometer,
  Wind,
  Zap,
} from "lucide-react";
import { findCities, fetchWeather, fetchEarthquakes } from "./api";

const DEFAULT_CITY = {
  name: "San Diego",
  admin1: "California",
  country: "United States",
  latitude: 32.7157,
  longitude: -117.1611,
  timezone: "America/Los_Angeles",
};
const condition = (code) => {
  if (code === 0) return "Clear sky";
  if ([1, 2, 3].includes(code)) return "Partly cloudy";
  if ([45, 48].includes(code)) return "Foggy";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
  if ([95, 96, 99].includes(code)) return "Thunderstorms";
  return "Variable conditions";
};
const day = (date) =>
  new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
  });
const number = (value, precision = 0) =>
  typeof value === "number" ? value.toFixed(precision) : "—";
const quakeLevel = (mag) => (mag >= 5 ? "high" : mag >= 3 ? "medium" : "low");

function SearchPanel({ onSelect, loading }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState("");
  const [searching, setSearching] = useState(false);
  const controller = useRef(null);
  const search = async (event) => {
    event.preventDefault();
    if (query.trim().length < 2)
      return setError("Enter at least two characters.");
    controller.current?.abort();
    controller.current = new AbortController();
    setSearching(true);
    setError("");
    setSuggestions([]);
    try {
      const matches = await findCities(query, controller.current.signal);
      if (!matches.length)
        setError("No matching cities. Try another location.");
      setSuggestions(matches);
    } catch (err) {
      if (err.name !== "AbortError") setError("City lookup failed. Try again.");
    } finally {
      setSearching(false);
    }
  };
  return (
    <div className="search-zone">
      <form onSubmit={search} className="search-form">
        <Search size={19} aria-hidden="true" />
        <input
          aria-label="Search city"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search any city worldwide..."
        />
        <button
          className="search-button"
          type="submit"
          disabled={searching || loading}
        >
          {searching ? "Searching…" : "Explore"} <ArrowUpRight size={15} />
        </button>
      </form>
      {error && (
        <p className="search-error" role="alert">
          {error}
        </p>
      )}
      {suggestions.length > 0 && (
        <div
          className="search-results"
          role="listbox"
          aria-label="Matching locations"
        >
          {suggestions.map((city) => (
            <button
              type="button"
              role="option"
              aria-selected="false"
              key={city.id}
              onClick={() => {
                onSelect(city);
                setSuggestions([]);
                setQuery("");
              }}
            >
              <MapPin size={16} />
              <span>
                {city.name}
                <small>
                  {[city.admin1, city.country].filter(Boolean).join(", ")}
                </small>
              </span>
              <ArrowUpRight size={14} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
function Metric({ icon: Icon, label, value, suffix }) {
  return (
    <div className="metric">
      <span className="metric-icon">
        <Icon size={17} />
      </span>
      <span>
        <small>{label}</small>
        <strong>
          {value}
          <em>{suffix}</em>
        </strong>
      </span>
    </div>
  );
}
function WeatherPanel({ data, loading, error }) {
  if (loading)
    return (
      <section className="panel weather-panel">
        <div className="skeleton-title skeleton" />
        <div className="skeleton-card skeleton" />
      </section>
    );
  if (error)
    return (
      <section className="panel">
        <h2>Weather forecast</h2>
        <p className="empty error">{error}</p>
      </section>
    );
  if (!data) return null;
  const { current, daily } = data;
  return (
    <section className="panel weather-panel" aria-label="Weather forecast">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">ATMOSPHERIC CONDITIONS</span>
          <h2>Weather forecast</h2>
        </div>
        <span className="data-tag">
          <span className="live-dot" /> LIVE DATA
        </span>
      </div>
      <div className="current-weather">
        <div className="temperature">
          <CloudSun size={33} strokeWidth={1.3} />
          <div>
            <strong>{number(current.temperature_2m)}°</strong>
            <span>{condition(current.weather_code)}</span>
          </div>
        </div>
        <div className="current-aside">
          <small>FEELS LIKE</small>
          <strong>{number(current.apparent_temperature)}°C</strong>
        </div>
      </div>
      <div className="metrics">
        <Metric
          icon={Droplets}
          label="Humidity"
          value={number(current.relative_humidity_2m)}
          suffix="%"
        />
        <Metric
          icon={Wind}
          label="Wind speed"
          value={number(current.wind_speed_10m)}
          suffix="km/h"
        />
        <Metric
          icon={CloudSun}
          label="Precipitation"
          value={number(current.precipitation, 1)}
          suffix="mm"
        />
      </div>
      <div className="subheading">
        <span>5-DAY OUTLOOK</span>
        <span>HIGH / LOW</span>
      </div>
      <div className="forecast-grid">
        {daily.time.map((date, i) => (
          <div key={date} className="forecast-day">
            <span>{day(date)}</span>
            <CloudSun size={23} strokeWidth={1.5} />
            <strong>{number(daily.temperature_2m_max[i])}°</strong>
            <small>{number(daily.temperature_2m_min[i])}°</small>
            <span className="rain-chance">
              <Droplets size={12} />
              {daily.precipitation_probability_max?.[i] ?? "—"}%
            </span>
          </div>
        ))}
      </div>
      <div className="source">
        Source:{" "}
        <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
          Open-Meteo
        </a>
      </div>
    </section>
  );
}
function EarthquakePanel({
  data,
  loading,
  error,
  radius,
  days,
  onRadius,
  onDays,
}) {
  const earthquakes = data?.features || [];
  return (
    <section className="panel earthquake-panel" aria-label="Nearby earthquakes">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">SEISMIC ACTIVITY</span>
          <h2>Nearby earthquakes</h2>
        </div>
        <Activity size={22} className="muted-icon" />
      </div>
      <div className="filters">
        <label>
          Radius
          <select
            value={radius}
            onChange={(e) => onRadius(Number(e.target.value))}
          >
            <option value={100}>100 km</option>
            <option value={300}>300 km</option>
            <option value={500}>500 km</option>
            <option value={1000}>1,000 km</option>
          </select>
        </label>
        <label>
          Timeframe
          <select value={days} onChange={(e) => onDays(Number(e.target.value))}>
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
          </select>
        </label>
      </div>
      {loading ? (
        <p className="empty">Loading earthquake observations…</p>
      ) : error ? (
        <p className="empty error">{error}</p>
      ) : (
        <>
          <div className="quake-summary">
            <div>
              <strong>{earthquakes.length}</strong>
              <span>RECENT EVENTS</span>
            </div>
            <div>
              <strong>
                {earthquakes.length
                  ? number(
                      Math.max(
                        ...earthquakes.map((e) => e.properties.mag ?? 0),
                      ),
                      1,
                    )
                  : "—"}
              </strong>
              <span>MAX MAGNITUDE</span>
            </div>
            <div>
              <strong>{radius}</strong>
              <span>SEARCH RADIUS (KM)</span>
            </div>
          </div>
          <div className="quake-list">
            {earthquakes.length ? (
              earthquakes.slice(0, 12).map((q) => (
                <a
                  className="quake-row"
                  href={
                    q.properties.url ||
                    "https://earthquake.usgs.gov/earthquakes/map/"
                  }
                  key={q.id}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span
                    className={`magnitude ${quakeLevel(q.properties.mag || 0)}`}
                  >
                    M {number(q.properties.mag, 1)}
                  </span>
                  <span className="quake-description">
                    <strong>{q.properties.place || "Unknown location"}</strong>
                    <small>
                      {new Date(q.properties.time).toLocaleDateString()} · Depth{" "}
                      {number(q.geometry.coordinates[2], 1)} km
                    </small>
                  </span>
                  <ExternalLink size={14} />
                </a>
              ))
            ) : (
              <p className="empty">
                No events reported within this radius and timeframe. Try a
                larger radius or longer window.
              </p>
            )}
          </div>
          {earthquakes.length > 12 && (
            <p className="more-events">
              Showing 12 of {earthquakes.length} recent events.
            </p>
          )}
        </>
      )}
      <div className="source">
        Source:{" "}
        <a href="https://earthquake.usgs.gov/" target="_blank" rel="noreferrer">
          U.S. Geological Survey
        </a>
      </div>
    </section>
  );
}
export default function App() {
  const [location, setLocation] = useState(DEFAULT_CITY);
  const [weather, setWeather] = useState(null);
  const [quakeData, setQuakeData] = useState(null);
  const [weatherError, setWeatherError] = useState("");
  const [quakeError, setQuakeError] = useState("");
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [quakeLoading, setQuakeLoading] = useState(true);
  const [radius, setRadius] = useState(500);
  const [days, setDays] = useState(30);
  useEffect(() => {
    const controller = new AbortController();
    setWeatherLoading(true);
    setWeatherError("");
    setWeather(null);
    fetchWeather(location, controller.signal)
      .then(setWeather)
      .catch((e) => {
        if (e.name !== "AbortError")
          setWeatherError("Forecast unavailable. Please try again later.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setWeatherLoading(false);
      });
    return () => controller.abort();
  }, [location]);
  useEffect(() => {
    const controller = new AbortController();
    setQuakeLoading(true);
    setQuakeError("");
    setQuakeData(null);
    fetchEarthquakes(location, radius, days, controller.signal)
      .then(setQuakeData)
      .catch((e) => {
        if (e.name !== "AbortError")
          setQuakeError("USGS observations unavailable. Try again later.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setQuakeLoading(false);
      });
    return () => controller.abort();
  }, [location, radius, days]);
  const locationLabel = [location.name, location.admin1, location.country]
    .filter(Boolean)
    .join(", ");
  return (
    <div className="page">
      <header className="topbar">
        <a className="brand" href="/" aria-label="TerraWatch home">
          <span className="brand-mark">
            <Activity size={23} strokeWidth={2.5} />
          </span>
          <span>
            TERRA<span>WATCH</span>
          </span>
        </a>
        <div className="topbar-right">
          <span className="topbar-label">
            <span className="live-dot" /> ENVIRONMENTAL INTELLIGENCE
          </span>
          <a
            href="https://github.com/new"
            target="_blank"
            rel="noreferrer"
            className="github-link"
          >
            YOUR PROJECT <ArrowUpRight size={15} />
          </a>
        </div>
      </header>
      <div className="hero">
        <div className="hero-glow" />
        <div className="hero-body">
          <div className="hero-kicker">
            <span className="kicker-line" /> YOUR WORLD, IN DATA
          </div>
          <h1>
            Know what's happening
            <br />
            <em>around you.</em>
          </h1>
          <p>
            Live weather forecasts and seismic activity, together in one place.
            Explore environmental conditions anywhere on Earth.
          </p>
          <SearchPanel onSelect={setLocation} loading={false} />
        </div>
        <div className="hero-decor" aria-hidden="true">
          <span className="orb orb-one" />
          <span className="orb orb-two" />
          <span className="orb orb-three" />
          <span className="grid-overlay" />
        </div>
      </div>
      <main className="main-content">
        <div className="location-heading">
          <div className="location-title">
            <span className="pin">
              <MapPin size={20} />
            </span>
            <div>
              <span className="eyebrow">CURRENT LOCATION</span>
              <h2>{locationLabel}</h2>
            </div>
          </div>
          <div className="coords">
            <Compass size={15} />
            {location.latitude.toFixed(3)}°, {location.longitude.toFixed(3)}°
          </div>
        </div>
        <div className="dashboard">
          <WeatherPanel
            data={weather}
            loading={weatherLoading}
            error={weatherError}
          />
          <EarthquakePanel
            data={quakeData}
            loading={quakeLoading}
            error={quakeError}
            radius={radius}
            days={days}
            onRadius={setRadius}
            onDays={setDays}
          />
        </div>
        <aside className="disclaimer">
          <ShieldAlert size={18} />
          <span>
            <strong>Informational use only.</strong> This dashboard displays
            weather forecasts and recorded earthquakes, not earthquake
            predictions or official emergency alerts. For safety decisions,
            consult your local emergency authorities.
          </span>
        </aside>
      </main>
      <footer>
        <span>
          © {new Date().getFullYear()} TerraWatch · Built with React + 3 public
          API endpoints
        </span>
        <span>DATA FOR CURIOSITY. NOT FOR EMERGENCY RESPONSE.</span>
      </footer>
    </div>
  );
}
