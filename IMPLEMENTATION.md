# Scouting PWA - Implementation Summary

## Architecture Overview

The robotics scouting PWA has been built using:
- **Framework**: Lit (Web Components)
- **Router**: App Tools Router
- **UI Library**: Shoelace
- **Build Tool**: Vite
- **State Management**: Custom StateManager with localStorage persistence

## Features Implemented

### 1. Event Code Input Screen (`app-event-input.ts`)
- User enters an event code (e.g., "MICMP", "ONCMP")
- Event code is stored in localStorage via `appState`
- Navigation to matches list on submit

**Route**: `/` (root)

### 2. Matches List Screen (`app-matches.ts`)
- Displays all matches for the selected event code
- Loads match data from `/data/matches.json`
- Shows match number and participating teams
- Clicking a match navigates to the scout detail page

**Route**: `/matches`

**Data Structure**: Matches are stored by event code in JSON:
```json
{
  "MICMP": [
    { "id": "1", "name": "Qualification 1", "matchNumber": 1, "team1": "3476", "team1Name": "Enderbots", "team2": "2056", "team2Name": "KnightKrawler" },
    ...
  ]
}
```

### 3. Scout Detail Screen (`app-scout.ts`)
Four tabs for comprehensive match scouting:

#### Auto Tab
- **Paths Visited**: Numbered buttons (1-5) to add paths in order
  - Displays visited paths with remove buttons
- **Auto Score**: Increment/decrement by 10
- **Preloaded Piece**: Toggle switch
- **Climb Attempted**: Toggle switch
- **Climb Successful**: Toggle switch

#### Tele Tab
- **Balls Made**: Increment/decrement by 10
- **Balls Transferred**: Increment/decrement by 10
- **Bricked**: Toggle switch
- **Played Defense**: Toggle switch
- **Teleop Score**: Increment/decrement by 10

#### Endgame Tab
- **Endgame Notes**: Text area for free-form notes
- **Climb Attempted**: Toggle switch
- **Climb Level**: Dropdown (None, L1, L2, L3)
- **Driver Rating**: Dropdown (1-10)
- **Fouls**: Increment/decrement by 1

#### Summary Tab
- Displays the compiled JSON payload in the proper format
- Save and Back buttons

**Route**: `/scout/:matchId`

### 4. Data Payload Structure

The match data is compiled into the following format:

```typescript
type MatchPayload = [
  AutoArr,    // [paths, score, preloaded, climbAttempted, climbSuccessful]
  TeleopArr,  // [ballsMade, ballsTransferred, bricked, playedDefense, score]
  EndgameArr, // [notes, attempted, level, rating, fouls]
  TeamInfoArr // [teamNumber, alliance, matchNumber]
]
```

**Example**:
```json
[
  [[1, 2, 3], 12, 1, 1, 0],
  [20, 10, 0, 1, 30],
  ["climbed successfully", 1, 2, 8, 0],
  [1234, "red", 7]
]
```

## State Management

The `appState` service maintains:
- `eventCode`: The selected event code (persists across page reloads)
- `selectedMatchId`: The currently selected match

State is automatically persisted to localStorage, allowing the app to work offline.

## File Structure

```
src/
├── app-index.ts                 # Main app component
├── router.ts                    # Route configuration
├── services/
│   └── app-state.ts            # State management
├── pages/
│   ├── app-home.ts             # (Original home - optional)
│   ├── app-event-input.ts      # Event code input screen
│   ├── app-matches.ts          # Matches list screen
│   ├── app-scout.ts            # Scout detail screen
│   └── app-about/              # (Original about page)
├── components/
│   └── header.ts               # (Original header)
└── styles/
    ├── global.css              # (Original global styles)
    └── shared-styles.ts        # (Original shared styles)

public/
└── data/
    └── matches.json            # Match data by event code
```

## Running the App

```bash
# Development
npm run dev

# Build
npm run build
```

The app will be available at `http://localhost:5173/`

## Next Steps / TODO

1. **Backend Integration**: Replace `/data/matches.json` with API calls
2. **Data Persistence**: Implement saving scout data to backend or local database
3. **Team Input**: Add fields to input team number and alliance color
4. **Data Export**: Export collected data in CSV or JSON format
5. **Validation**: Add validation for match data before saving
6. **Offline Support**: Enhance service worker to cache match data
7. **UI Polish**: Add loading states, error handling, confirmation dialogs
8. **Real-time Sync**: Sync data across multiple devices for a scouting team
