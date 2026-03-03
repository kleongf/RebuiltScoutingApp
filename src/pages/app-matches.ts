import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { resolveRouterPath } from '../router';

import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';

import { styles } from '../styles/shared-styles';
import { appState } from '../services/app-state';

interface Match {
  id: string;
  name: string;
  matchNumber: number;
  team1: string;
  team1Name: string;
  team2: string;
  team2Name: string;
}

@customElement('app-matches')
export class AppMatches extends LitElement {
  @state() eventCode: string = '';
  @state() matchList: Match[] = [];
  @state() loading: boolean = true;
  @state() error: string = '';

  static styles = [
    styles,
    css`
      main {
        padding-bottom: 16px;
      }

      h1 {
        margin-top: 24px;
        margin-bottom: 16px;
      }

      .matches-container {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .match-card {
        border: 1px solid var(--sl-color-neutral-200);
        border-radius: var(--sl-border-radius-medium);
        padding: 16px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .match-card:hover {
        background-color: var(--sl-color-neutral-100);
        box-shadow: var(--sl-shadow-small);
      }

      .match-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
        flex: 1;
      }

      .match-name {
        font-weight: 600;
        font-size: 16px;
      }

      .teams {
        color: var(--sl-color-neutral-600);
        font-size: 14px;
      }

      .loading {
        text-align: center;
        padding: 40px 16px;
      }

      .error {
        background-color: var(--sl-color-danger-100);
        color: var(--sl-color-danger-800);
        padding: 16px;
        border-radius: var(--sl-border-radius-medium);
        border: 1px solid var(--sl-color-danger-300);
      }
    `
  ];

  async firstUpdated() {
    const state = appState.getState();
    this.eventCode = state.eventCode || '';
    
    if (this.eventCode) {
      await this.loadMatches();
    } else {
      this.error = 'No event code provided';
      this.loading = false;
    }
  }

  private async loadMatches() {
    try {
      this.loading = true;
      this.error = '';
      
      const response = await fetch('/data/matches.json');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to load matches`);
      }
      
      const data: { [key: string]: Match[] } = await response.json();
      const matches = data[this.eventCode];
      
      if (!matches) {
        this.error = `No matches found for event code: ${this.eventCode}`;
        this.matchList = [];
      } else {
        this.matchList = matches;
      }
    } catch (err) {
      console.error('Error loading matches:', err);
      this.error = err instanceof Error ? err.message : 'Failed to load matches';
      this.matchList = [];
    } finally {
      this.loading = false;
      this.requestUpdate();
    }
  }

  private selectMatch(match: Match) {
    appState.setState({ selectedMatchId: match.id, selectedMatch: match });
    window.location.href = resolveRouterPath(`scout/${match.id}`);
  }

  render() {
    if (this.loading) {
      return html`
        <main>
          <div class="loading">
            <p>Loading matches...</p>
          </div>
        </main>
      `;
    }

    if (this.error) {
      return html`
        <main>
          <h1>Event: ${this.eventCode}</h1>
          <div class="error">${this.error}</div>
        </main>
      `;
    }

    return html`
      <main>
        <h1>Event: ${this.eventCode}</h1>
        <p>Select a match to scout:</p>

        <div class="matches-container">
          ${this.matchList.map(match => html`
            <div class="match-card" @click="${() => this.selectMatch(match)}">
              <div class="match-info">
                <div class="match-name">${match.name}</div>
                <div class="teams">${match.team1} (${match.team1Name}) vs ${match.team2} (${match.team2Name})</div>
              </div>
              <sl-icon name="chevron-right"></sl-icon>
            </div>
          `)}
        </div>
      </main>
    `;
  }
}
