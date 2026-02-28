# FUTURE.md — Globe Project

Ideas that wait their turn. Not a graveyard — a queue.

## Gate: Before adding anything here to active development, at least 3 phases from the architecture plan must be deployed and tested.

### Rendering / Performance
- WebGPU compute shader population heatmap (requires density grid data + shader pipeline)
- 3D population bar extrusions (CesiumJS wall entities, performance-intensive)
- Population density raster overlay (NASA SEDAC GeoTIFF processing pipeline)
- WorldPop 100m resolution drill-down (per-country download, heavy processing)
- LOD (Level of Detail) system for high entity count layers

### Data / Feeds
- OpenSky real-time flight tracker (high entity count, needs LOD system first)
- Historical population timeline animation (requires time-series data architecture)
- World Bank time-series GDP/HDI (multi-year indicator charts per country)
- Climate data overlay (temperature anomalies, precipitation)
- COVID-19 historical data layer (Johns Hopkins CSSE archive)

### UI / Visualization
- Multi-indicator dashboard mode (side-by-side GDP vs HDI comparison)
- Split-screen comparison (two globes, different indicators)
- Export to image/PDF (screenshot of current globe state)
- Mobile touch gestures (pinch zoom, swipe rotation)
- Dark/light theme toggle for sidebar

### Architecture
- Service worker for offline caching of TopoJSON files
- IndexedDB storage for downloaded Census data
- Web worker for TopoJSON decoding (off main thread)
- Shared state via Zustand store (replace prop drilling)
