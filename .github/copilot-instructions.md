# VideoAnalysis - Copilot Instructions

## Project Overview
VideoAnalysis is a rugby video analysis platform that processes match data exported from tools like LongoMatch, Sportscode, or Nacsport. The system connects statistical events with video playback for tactical analysis.

**Architecture**: React TypeScript frontend + Flask Python backend + PostgreSQL database

## Key Components & Data Flow

### Data Import Pipeline
1. **Excel/JSON Import** → `backend/normalizer.py` → Standardized JSON
2. **Preview & Filter** → `frontend/src/pages/PreviewImport.tsx` → Category selection
3. **Database Storage** → `backend/importer.py` → Relational models

### Core Models (backend/models.py)
- `Club` → `Team` → `Match` → `Event` (hierarchical relationship)
- `Player` → `TeamPlayer` (many-to-many with jersey numbers)
- `ImportProfile` for custom Excel column mapping

### API Architecture
- Routes organized in `backend/routes/` with blueprints
- Standard pattern: `db = SessionLocal()` → query → `db.close()`
- Frontend calls: `http://localhost:5001/api/{endpoint}`

## Development Patterns

### Frontend (React + TypeScript)
- **UI Library**: Radix UI + Tailwind CSS (shadcn/ui components)
- **Routing**: React Router with state passing via `useLocation()`
- **State Management**: React hooks, no global state library
- **API Calls**: Native fetch with error handling patterns

### Component Structure
```tsx
// Standard page component pattern
const PageName = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [localState, setLocalState] = useState();
  
  // API calls with try/catch
  // JSX with Tailwind classes
};
```

### Backend (Flask + SQLAlchemy)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **File Structure**: Modular routes, separate models, utilities
- **Session Management**: Manual session lifecycle with try/finally
- **CORS**: Enabled for all origins (development setup)

## Critical Workflows

### Local Development
```bash
# Frontend (Vite dev server)
cd frontend && npm run dev  # Port 3000

# Backend (Flask development)
cd backend && python app.py  # Port 5001

# Database (Docker)
docker-compose up db  # PostgreSQL on 5432
```

### Data Import Process
1. Upload Excel/JSON → `POST /api/upload`
2. Preview data → Frontend shows events by category
3. User filters categories → Frontend state management
4. Confirm import → `POST /api/save_match` → Database storage

### Video Integration
- Videos stored in `frontend/public/` or `backend/uploads/`
- React YouTube component for video playback
- Event timestamps link to video positions

## Project-Specific Conventions

### Database Sessions
```python
# Always use this pattern
db = SessionLocal()
try:
    # Database operations
    result = db.query(Model).filter(...).all()
    return jsonify(result)
finally:
    db.close()
```

### Import Profiles
- Configurable column mappings for different data sources
- Stored as JSON in database or passed as parameters
- Key fields: event_type, player, time, coordinates

### Event Filtering
- Frontend allows category selection/deselection
- Common exclusions: WARMUP, HALFTIME, END, TIMEOUT
- Filter applied before database save, not at query time

## Integration Points

### Frontend ↔ Backend
- No authentication (development setup)
- JSON APIs with manual error handling
- File uploads via FormData

### Database Schema
- Foreign key relationships with proper joins
- JSON columns for flexible event metadata
- Date/time handling with proper timezone conversion

### Docker Setup
- Backend + Database in docker-compose
- Frontend runs separately (Vite dev server)
- Shared uploads volume for file handling

## Common Tasks

### Adding New Event Types
1. Update normalization logic in `backend/normalizer.py`
2. Add database migration if needed
3. Update frontend filtering in `PreviewImport.tsx`

### New API Endpoints
1. Create route in `backend/routes/`
2. Register blueprint in `register_routes.py`
3. Add corresponding frontend service

### UI Components
- Use existing shadcn/ui components from `components/ui/`
- Follow Tailwind spacing/color patterns
- React Router for navigation with state passing

This codebase prioritizes rapid development and data visualization over enterprise patterns. Focus on maintaining the established data flow and component patterns when making changes.
