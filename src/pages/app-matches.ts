import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { resolveRouterPath } from '../router';

import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/select/select.js';
import '@shoelace-style/shoelace/dist/components/option/option.js';

import { styles } from '../styles/shared-styles';
import { appState } from '../services/app-state';

interface Match {
  id: string;           // match_key, e.g. "2024casd_qm1"
  name: string;         // human-readable label, e.g. "Qualification 1"
  matchNumber: number;
  scheduledTime: string;
  redTeams: string[];   // 3 team numbers
  blueTeams: string[];  // 3 team numbers
}

@customElement('app-matches')
export class AppMatches extends LitElement {
  @state() eventCode: string = '';
  @state() matchList: Match[] = [];
  @state() loading: boolean = true;
  @state() error: string = '';

  // Custom match form
  @state() customTeamNumber: string = '';
  @state() customMatchNumber: string = '';
  @state() customAlliance: 'red' | 'blue' = 'red';
  @state() customError: string = '';

  static styles = [
    styles,
    css`
      main {
        padding: 16px;
        padding-bottom: 32px;
      }

      h1 {
        margin-top: 8px;
        margin-bottom: 4px;
      }

      .subtitle {
        color: var(--sl-color-neutral-600);
        margin-bottom: 20px;
      }

      .matches-container {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .match-card {
        border: 1px solid var(--sl-color-neutral-200);
        border-radius: var(--sl-border-radius-medium);
        overflow: hidden;
      }

      .match-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 14px;
        background-color: var(--sl-color-neutral-100);
        border-bottom: 1px solid var(--sl-color-neutral-200);
        font-weight: 600;
        font-size: 14px;
      }

      .match-time {
        font-weight: 400;
        font-size: 12px;
        color: var(--sl-color-neutral-500);
      }

      .alliances {
        display: grid;
        grid-template-columns: 1fr 1fr;
      }

      .alliance-col {
        padding: 10px 14px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .alliance-col.red {
        border-right: 1px solid var(--sl-color-neutral-200);
      }

      .alliance-label {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 2px;
      }

      .alliance-label.red  { color: var(--sl-color-danger-600); }
      .alliance-label.blue { color: var(--sl-color-primary-600); }

      .team-btn {
        display: block;
        width: 100%;
        text-align: left;
        padding: 6px 10px;
        border-radius: var(--sl-border-radius-small);
        border: 1px solid transparent;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        background: transparent;
        transition: background 0.15s, border-color 0.15s;
      }

      .team-btn.red:hover  {
        background-color: var(--sl-color-danger-100);
        border-color: var(--sl-color-danger-300);
      }

      .team-btn.blue:hover {
        background-color: var(--sl-color-primary-100);
        border-color: var(--sl-color-primary-300);
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

      .custom-match-card {
        border: 1px solid var(--sl-color-neutral-300);
        border-radius: var(--sl-border-radius-medium);
        overflow: hidden;
        margin-bottom: 20px;
      }

      .custom-match-header {
        padding: 10px 14px;
        background-color: var(--sl-color-neutral-100);
        border-bottom: 1px solid var(--sl-color-neutral-200);
        font-weight: 600;
        font-size: 14px;
      }

      .custom-match-body {
        padding: 14px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .custom-match-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .custom-match-error {
        font-size: 12px;
        color: var(--sl-color-danger-700);
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

      const response = await fetch('/data/matches.csv');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to load matches`);
      }

      const csv = await response.text();
      this.matchList = this.parseCSV(csv, this.eventCode);

      if (this.matchList.length === 0) {
        this.error = `No matches found for event code: ${this.eventCode}`;
      }
    } catch (err) {
      console.error('Error loading matches:', err);
      this.error = err instanceof Error ? err.message : 'Failed to load matches';
    } finally {
      this.loading = false;
    }
  }

  private parseCSV(csv: string, eventCode: string): Match[] {
    const lines = csv.trim().split('\n');
    // Skip header row
    const rows = lines.slice(1).map(line => line.trim().split(','));

    // Group rows by match_key
    const matchMap = new Map<string, typeof rows>();
    for (const row of rows) {
      const [matchKey] = row;
      // match_key format: "2024casd_qm1" — event code is everything before the underscore + suffix
      // Compare case-insensitively, stripping the suffix
      const keyEventCode = matchKey.split('_')[0];
      if (keyEventCode.toLowerCase() !== eventCode.toLowerCase()) continue;

      if (!matchMap.has(matchKey)) matchMap.set(matchKey, []);
      matchMap.get(matchKey)!.push(row);
    }

    // Build Match objects, sorted by match number
    const matchList: Match[] = [];
    for (const [matchKey, rows] of matchMap.entries()) {
      const first = rows[0];
      const compLevel: string = first[3];
      const matchNumber = parseInt(first[4], 10);
      const scheduledTime: string = first[2];

      const redTeams = rows.filter(r => r[6] === 'red').map(r => r[7]);
      const blueTeams = rows.filter(r => r[6] === 'blue').map(r => r[7]);

      const levelLabel = compLevel === 'qm' ? 'Qualification'
        : compLevel === 'sf' ? 'Semifinal'
        : compLevel === 'f'  ? 'Final'
        : compLevel.toUpperCase();

      matchList.push({
        id: matchKey,
        name: `${levelLabel} ${matchNumber}`,
        matchNumber,
        scheduledTime,
        redTeams,
        blueTeams,
      });
    }

    matchList.sort((a, b) => a.matchNumber - b.matchNumber);
    return matchList;
  }

  private selectTeam(match: Match, teamNumber: string, alliance: 'red' | 'blue') {
    const matchData = { ...match, team1: teamNumber, team1Name: teamNumber, alliance };
    appState.setState({ selectedMatchId: match.id, selectedMatch: matchData });
    window.location.href = resolveRouterPath(`scout/${match.matchNumber}`);
  }

  private scoutCustomMatch() {
    this.customError = '';

    const teamNum = parseInt(this.customTeamNumber, 10);
    const matchNum = parseInt(this.customMatchNumber, 10);

    if (!this.customTeamNumber || isNaN(teamNum) || teamNum <= 0) {
      this.customError = 'Please enter a valid team number.';
      return;
    }
    if (!this.customMatchNumber || isNaN(matchNum) || matchNum >= 0) {
      this.customError = 'Match number must be a negative integer.';
      return;
    }

    const customMatch: Match = {
      id: `custom_${matchNum}`,
      name: `Custom ${matchNum}`,
      matchNumber: matchNum,
      scheduledTime: '',
      redTeams: [],
      blueTeams: [],
    };

    const matchData = {
      ...customMatch,
      team1: String(teamNum),
      team1Name: String(teamNum),
      alliance: this.customAlliance,
    };
    appState.setState({ selectedMatchId: customMatch.id, selectedMatch: matchData });
    window.location.href = resolveRouterPath(`scout/${matchNum}`);
  }

  render() {
    if (this.loading) {
      return html`
        <main>
          <div class="loading"><p>Loading matches...</p></div>
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
        <p class="subtitle">Select a team to scout:</p>

        <div class="matches-container">
          <div class="custom-match-card">
            <div class="custom-match-header">Scout a Custom Match</div>
            <div class="custom-match-body">
              <div class="custom-match-row">
                <sl-input
                  label="Team Number"
                  type="number"
                  placeholder="e.g. 1234"
                  value="${this.customTeamNumber}"
                  @sl-input="${(e: any) => (this.customTeamNumber = e.target.value)}"
                ></sl-input>
                <sl-input
                  label="Match Number (negative)"
                  type="number"
                  placeholder="e.g. -1"
                  value="${this.customMatchNumber}"
                  @sl-input="${(e: any) => (this.customMatchNumber = e.target.value)}"
                ></sl-input>
              </div>
              <sl-select
                label="Alliance"
                value="${this.customAlliance}"
                @sl-change="${(e: any) => (this.customAlliance = e.target.value as 'red' | 'blue')}"
              >
                <sl-option value="red">Red</sl-option>
                <sl-option value="blue">Blue</sl-option>
              </sl-select>
              ${this.customError
                ? html`<p class="custom-match-error">${this.customError}</p>`
                : ''}
              <sl-button variant="primary" @click="${() => this.scoutCustomMatch()}">
                Scout Custom Match
              </sl-button>
            </div>
          </div>

          ${this.matchList.map(match => html`
            <div class="match-card">
              <div class="match-header">
                <span>${match.name}</span>
                <span class="match-time">${match.scheduledTime}</span>
              </div>
              <div class="alliances">
                <div class="alliance-col red">
                  <div class="alliance-label red">Red Alliance</div>
                  ${match.redTeams.map(team => html`
                    <button class="team-btn red" @click="${() => this.selectTeam(match, team, 'red')}">
                      Team ${team}
                    </button>
                  `)}
                </div>
                <div class="alliance-col blue">
                  <div class="alliance-label blue">Blue Alliance</div>
                  ${match.blueTeams.map(team => html`
                    <button class="team-btn blue" @click="${() => this.selectTeam(match, team, 'blue')}">
                      Team ${team}
                    </button>
                  `)}
                </div>
              </div>
            </div>
          `)}
        </div>
      </main>
    `;
  }
}
