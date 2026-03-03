/**
 * Simple state management service for the scouting app
 * Uses localStorage to persist state across page reloads
 */

interface AppState {
  eventCode: string | null;
  selectedMatchId: string | null;
  selectedMatch: any | null;
}

const STORAGE_KEY = 'scouting-app-state';

class StateManager {
  private state: AppState;
  private listeners: Array<(state: AppState) => void> = [];

  constructor() {
    // Load initial state from localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    this.state = stored
      ? JSON.parse(stored)
      : {
          eventCode: null,
          selectedMatchId: null,
          selectedMatch: null,
        };
  }

  setState(partial: Partial<AppState>) {
    this.state = { ...this.state, ...partial };
    // Persist to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    this.notifyListeners();
  }

  getState(): AppState {
    return { ...this.state };
  }

  subscribe(listener: (state: AppState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.getState()));
  }
}

export const appState = new StateManager();
