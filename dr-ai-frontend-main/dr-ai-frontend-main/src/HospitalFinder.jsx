import React, { useState, useEffect, useRef } from "react";
import "./HospitalFinder.css";

const FILTERS = [
  { key: "hospital",  label: "Hospitals",   icon: "🏥", color: "#ef4444" },
  { key: "pharmacy",  label: "Pharmacies",  icon: "💊", color: "#22c55e" },
  { key: "clinic",    label: "Clinics",     icon: "🩺", color: "#667eea" },
  { key: "emergency", label: "Emergency",   icon: "🚨", color: "#f97316" },
];

function buildQuery(lat, lon, radius, type) {
  const tag = type === "emergency"
    ? `["emergency"="yes"]`
    : type === "clinic"
      ? `["amenity"="clinic"]`
      : `["amenity"="${type}"]`;
  return `[out:json][timeout:25];(node${tag}(around:${radius},${lat},${lon});way${tag}(around:${radius},${lat},${lon}););out body center;`;
}

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export default function HospitalFinder({ onClose }) {
  const [location, setLocation]       = useState(null);
  const [places, setPlaces]           = useState([]);
  const [loading, setLoading]         = useState(false);
  const [locError, setLocError]       = useState("");
  const [activeFilter, setFilter]     = useState("hospital");
  const [radius, setRadius]           = useState(3000);
  const [selected, setSelected]       = useState(null);
  const [city, setCity]               = useState("");
  const [cityLoading, setCityLoading] = useState(false);
  const mapRef      = useRef(null);
  const mapInstance = useRef(null);
  const markers     = useRef([]);

  // ── Cleanup map on unmount ────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // ── Update markers when places change ────────────────────────────────────
  useEffect(() => {
    if (!mapInstance.current || !window.L) return;
    markers.current.forEach(m => m.remove());
    markers.current = [];
    const filter = FILTERS.find(f => f.key === activeFilter);
    places.forEach(p => {
      const icon = window.L.divIcon({
        html: `<div class="map-pin" style="background:${filter.color}">${filter.icon}</div>`,
        className: "", iconSize: [36, 36], iconAnchor: [18, 36]
      });
      const marker = window.L.marker([p.lat, p.lon], { icon })
        .addTo(mapInstance.current)
        .bindPopup(`<b>${p.name}</b><br>${p.dist} km away`);
      marker.on("click", () => setSelected(p));
      markers.current.push(marker);
    });
  }, [places, activeFilter]);

  // ── Init map ──────────────────────────────────────────────────────────────
  const initMap = (loc) => {
    if (!mapRef.current || !window.L) return;
    if (mapInstance.current) {
      mapInstance.current.setView([loc.lat, loc.lon], 14);
      return;
    }
    const map = window.L.map(mapRef.current, { zoomControl: true }).setView([loc.lat, loc.lon], 14);
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap"
    }).addTo(map);
    window.L.circleMarker([loc.lat, loc.lon], {
      radius: 10, fillColor: "#667eea", color: "#fff", weight: 3, fillOpacity: 1
    }).addTo(map).bindPopup("📍 You are here");
    mapInstance.current = map;
  };

  // ── GPS location ──────────────────────────────────────────────────────────
  const getLocation = () => {
    setLocError("");
    if (!navigator.geolocation) { setLocError("Geolocation not supported."); return; }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setLocation(loc);
        setTimeout(() => { initMap(loc); fetchPlaces(loc, activeFilter, radius); }, 100);
      },
      () => {
        setLoading(false);
        setLocError("GPS access denied. Try searching by city name below.");
      },
      { timeout: 10000 }
    );
  };

  // ── City name search via Nominatim ────────────────────────────────────────
  const searchByCity = async () => {
    if (!city.trim()) return;
    setCityLoading(true); setLocError("");
    try {
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`
      );
      const data = await res.json();
      if (!data.length) { setLocError("City not found. Try a different name."); return; }
      const loc = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
      setLocation(loc);
      setTimeout(() => { initMap(loc); fetchPlaces(loc, activeFilter, radius); }, 100);
    } catch(e) {
      setLocError("Failed to find city. Check your internet.");
    } finally {
      setCityLoading(false);
    }
  };

  // ── Fetch from Overpass ───────────────────────────────────────────────────
  const fetchPlaces = async (loc, type, rad) => {
    setLoading(true); setPlaces([]); setSelected(null);
    try {
      const res  = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST", body: buildQuery(loc.lat, loc.lon, rad, type)
      });
      const data = await res.json();
      const results = data.elements
        .map(el => {
          const lat = el.center?.lat ?? el.lat;
          const lon = el.center?.lon ?? el.lon;
          if (!lat || !lon) return null;
          return {
            id:      el.id,
            name:    el.tags?.name || "Unnamed",
            address: [el.tags?.["addr:street"], el.tags?.["addr:city"]].filter(Boolean).join(", "),
            phone:   el.tags?.phone || el.tags?.["contact:phone"] || "",
            website: el.tags?.website || "",
            opening: el.tags?.opening_hours || "",
            lat, lon,
            dist: parseFloat(getDistance(loc.lat, loc.lon, lat, lon).toFixed(1)),
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 20);
      setPlaces(results);
    } catch(e) {
      setLocError("Failed to fetch places. Check your internet and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key) => { setFilter(key); if (location) fetchPlaces(location, key, radius); };
  const handleRadiusChange = (r)   => { setRadius(r);   if (location) fetchPlaces(location, activeFilter, r); };
  const openDirections = (p) => window.open(`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}`, "_blank");
  const activeFilterObj = FILTERS.find(f => f.key === activeFilter);

  return (
    <div className="hf-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="hf-modal">

        {/* Header */}
        <div className="hf-header">
          <div className="hf-header-left">
            <div className="hf-icon">🏥</div>
            <div><h2>Nearby Healthcare</h2><p>Find hospitals, pharmacies & clinics near you</p></div>
          </div>
          <button className="hf-close" onClick={onClose}>✕</button>
        </div>

        {/* Filters */}
        <div className="hf-filters">
          {FILTERS.map(f => (
            <button key={f.key} className={`hf-filter ${activeFilter === f.key ? "active" : ""}`}
              style={{ "--fc": f.color }} onClick={() => handleFilterChange(f.key)}>
              {f.icon} {f.label}
            </button>
          ))}
          <select className="hf-radius" value={radius} onChange={e => handleRadiusChange(Number(e.target.value))}>
            <option value={1000}>1 km</option>
            <option value={3000}>3 km</option>
            <option value={5000}>5 km</option>
            <option value={10000}>10 km</option>
          </select>
        </div>

        <div className="hf-body">

          {/* List column */}
          <div className="hf-list-col">

            {/* Location prompt */}
            {!location && !loading && (
              <div className="hf-loc-prompt">
                <div className="hf-loc-icon">📍</div>
                <h3>Find Healthcare Near You</h3>

                <button className="hf-loc-btn" onClick={getLocation}>
                  📍 Use My GPS Location
                </button>

                <div className="hf-loc-divider"><span>or search by city</span></div>

                <div className="hf-city-search">
                  <input
                    type="text"
                    className="hf-city-input"
                    placeholder="e.g. Pune, Mumbai, Delhi..."
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && searchByCity()}
                  />
                  <button className="hf-city-btn" onClick={searchByCity} disabled={cityLoading}>
                    {cityLoading ? "..." : "Search"}
                  </button>
                </div>

                {locError && <div className="hf-error">{locError}</div>}
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="hf-loading">
                <div className="hf-spinner" />
                <p>Finding {activeFilterObj.label}...</p>
              </div>
            )}

            {/* Results */}
            {!loading && location && (
              <>
                <div className="hf-results-header">
                  <span>{places.length} {activeFilterObj.label} found</span>
                  <button className="hf-refresh" onClick={() => fetchPlaces(location, activeFilter, radius)}>↻ Refresh</button>
                </div>
                {places.length === 0 && (
                  <div className="hf-empty">
                    <span>{activeFilterObj.icon}</span>
                    <p>No {activeFilterObj.label.toLowerCase()} found within {radius/1000} km</p>
                    <button className="hf-loc-btn" onClick={() => handleRadiusChange(radius * 2)}>Expand search area</button>
                  </div>
                )}
                <div className="hf-list">
                  {places.map(p => (
                    <div key={p.id} className={`hf-card ${selected?.id === p.id ? "selected" : ""}`}
                      onClick={() => { setSelected(p); mapInstance.current?.setView([p.lat, p.lon], 16); }}>
                      <div className="hf-card-icon" style={{ background: activeFilterObj.color }}>{activeFilterObj.icon}</div>
                      <div className="hf-card-info">
                        <div className="hf-card-name">{p.name}</div>
                        {p.address && <div className="hf-card-addr">📍 {p.address}</div>}
                        {p.phone   && <div className="hf-card-phone">📞 {p.phone}</div>}
                        {p.opening && <div className="hf-card-hours">🕐 {p.opening}</div>}
                      </div>
                      <div className="hf-card-right">
                        <div className="hf-dist">{p.dist} km</div>
                        <button className="hf-dir-btn" onClick={e => { e.stopPropagation(); openDirections(p); }}>🗺️</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Map column */}
          <div className="hf-map-col">
            {!location && !loading && (
              <div className="hf-map-placeholder">
                <div className="hf-map-placeholder-icon">🗺️</div>
                <p>Map will appear after location access</p>
              </div>
            )}
            <div ref={mapRef} className="hf-map"
              style={{ opacity: location ? 1 : 0, pointerEvents: location ? "auto" : "none" }} />
            {selected && (
              <div className="hf-selected-card">
                <div className="hf-selected-name">{selected.name}</div>
                {selected.address && <div className="hf-selected-info">📍 {selected.address}</div>}
                {selected.phone   && <div className="hf-selected-info">📞 {selected.phone}</div>}
                {selected.opening && <div className="hf-selected-info">🕐 {selected.opening}</div>}
                <div className="hf-selected-actions">
                  <button onClick={() => openDirections(selected)}>🗺️ Get Directions</button>
                  {selected.phone && <button onClick={() => window.location.href = `tel:${selected.phone}`}>📞 Call</button>}
                  {selected.website && <button onClick={() => window.open(selected.website, "_blank")}>🌐 Website</button>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
