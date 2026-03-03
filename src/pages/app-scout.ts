import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import QRCode from 'qrcode';

import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/tab-group/tab-group.js';
import '@shoelace-style/shoelace/dist/components/tab/tab.js';
import '@shoelace-style/shoelace/dist/components/tab-panel/tab-panel.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/switch/switch.js';
import '@shoelace-style/shoelace/dist/components/textarea/textarea.js';
import '@shoelace-style/shoelace/dist/components/select/select.js';
import '@shoelace-style/shoelace/dist/components/option/option.js';

import { styles } from '../styles/shared-styles';
import { appState } from '../services/app-state';
// Type definitions for match data structure
type AutoArr = [number[], number, 0 | 1, 0 | 1, 0 | 1];
type TeleopArr = [number, number, 0 | 1, 0 | 1, number];
type EndgameArr = [string, 0 | 1, number, number, number];
type TeamInfoArr = [number, 'red' | 'blue', number];
type MatchPayload = [AutoArr, TeleopArr, EndgameArr, TeamInfoArr];

@customElement('app-scout')
export class AppScout extends LitElement {
  @state() matchId: string = '';
  @state() selectedMatch: any = null;
  @state() teamNumber: number = 0;
  @state() alliance: 'red' | 'blue' = 'red';
  @state() matchNumber: number = 0;

  // Auto tab data
  @state() autoPaths: number[] = [];
  @state() autoScore: number = 0;
  @state() autoPreloaded: 0 | 1 = 0;
  @state() autoClimbAttempted: 0 | 1 = 0;
  @state() autoClimbSuccessful: 0 | 1 = 0;

  // Teleop tab data
  @state() teleopBallsMade: number = 0;
  @state() teleopBallsTransferred: number = 0;
  @state() teleopBricked: 0 | 1 = 0;
  @state() teleopPlayedDefense: 0 | 1 = 0;
  @state() teleopScore: number = 0;

  // Endgame tab data
  @state() endgameNotes: string = '';
  @state() endgameAttempted: 0 | 1 = 0;
  @state() endgameLevel: number = 0;
  @state() endgameRating: number = 5;
  @state() endgameFouls: number = 0;

  // QR code data URL
  @state() qrCodeDataUrl: string = '';

  static styles = [
    styles,
    css`
      main {
        padding-bottom: 140px;
      }

      h1 {
        margin-top: 16px;
        margin-bottom: 8px;
      }

      .match-header {
        background-color: var(--sl-color-neutral-100);
        padding: 16px;
        border-radius: var(--sl-border-radius-medium);
        margin-bottom: 24px;
      }

      sl-tab-group {
        --indicator-color: var(--sl-color-primary-600);
        --border-radius: 0;
      }

      sl-tab-group::part(tabs) {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: white;
        border-top: 1px solid var(--sl-color-neutral-200);
        display: flex;
        z-index: 100;
      }

      sl-tab-panel {
        padding: 16px;
      }

      .tab-content {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .form-group label {
        font-weight: 600;
        font-size: 14px;
        color: var(--sl-color-neutral-800);
      }

      sl-input,
      sl-textarea,
      sl-select {
        width: 100%;
      }

      .number-controls {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      .number-controls sl-button {
        flex: 0;
      }

      .number-display {
        font-size: 18px;
        font-weight: 600;
        padding: 8px 16px;
        background-color: var(--sl-color-neutral-100);
        border-radius: var(--sl-border-radius-small);
        min-width: 60px;
        text-align: center;
      }

      .button-group {
        display: flex;
        gap: 8px;
        margin-top: 24px;
      }

      sl-button {
        flex: 1;
      }

      .data-display {
        background-color: var(--sl-color-neutral-50);
        border: 1px solid var(--sl-color-neutral-200);
        border-radius: var(--sl-border-radius-medium);
        padding: 16px;
        font-family: monospace;
        font-size: 12px;
        overflow-x: auto;
        white-space: pre-wrap;
        word-break: break-all;
      }

      .path-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        padding: 8px;
        background-color: var(--sl-color-neutral-100);
        border-radius: var(--sl-border-radius-small);
      }

      .path-badge {
        background-color: var(--sl-color-primary-600);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .path-badge sl-button {
        flex: 0;
        padding: 0;
        font-size: 10px;
      }
    `
  ];

  connectedCallback() {
    super.connectedCallback();
    // Extract match ID from URL if present
    const path = window.location.pathname;
    const match = path.match(/scout\/([^/]+)/);
    if (match) {
      this.matchId = match[1];
      this.matchNumber = parseInt(match[1], 10) || 0;
    }

    // Load match data from appState
    const state = appState.getState();
    if (state.selectedMatch) {
      this.selectedMatch = state.selectedMatch;
      // Extract team number from the match - assume we're scouting team1
      this.teamNumber = parseInt(state.selectedMatch.team1, 10) || 0;
    }
  }

  private addPath(pathNum: number) {
    this.autoPaths = [...this.autoPaths, pathNum];
  }

  private removePath(index: number) {
    this.autoPaths = this.autoPaths.filter((_, i) => i !== index);
  }

  private incrementCounter(state: keyof this, amount: number = 10) {
    const current = this[state] as number;
    this[state] = Math.max(0, current + amount) as any;
  }

  private toggleSwitch(state: keyof this) {
    const current = this[state] as 0 | 1;
    this[state] = (current === 0 ? 1 : 0) as any;
  }

  private compilePayload(): MatchPayload {
    const autoArr: AutoArr = [
      this.autoPaths,
      this.autoScore,
      this.autoPreloaded,
      this.autoClimbAttempted,
      this.autoClimbSuccessful,
    ];

    const teleopArr: TeleopArr = [
      this.teleopBallsMade,
      this.teleopBallsTransferred,
      this.teleopBricked,
      this.teleopPlayedDefense,
      this.teleopScore,
    ];

    const endgameArr: EndgameArr = [
      this.endgameNotes,
      this.endgameAttempted,
      this.endgameLevel,
      this.endgameRating,
      this.endgameFouls,
    ];

    const teamInfoArr: TeamInfoArr = [
      this.teamNumber,
      this.alliance,
      this.matchNumber,
    ];

    return [autoArr, teleopArr, endgameArr, teamInfoArr];
  }

  private convertPayloadToBoolean(payload: MatchPayload): any {
    const [autoArr, teleopArr, endgameArr, teamInfoArr] = payload;

    return [
      [
        autoArr[0],                           // paths (array, unchanged)
        autoArr[1],                           // score (number, unchanged)
        autoArr[2] === 1,                     // preloaded (0|1 -> boolean)
        autoArr[3] === 1,                     // climbAttempted (0|1 -> boolean)
        autoArr[4] === 1,                     // climbSuccessful (0|1 -> boolean)
      ],
      [
        teleopArr[0],                         // ballsMade (number, unchanged)
        teleopArr[1],                         // ballsTransferred (number, unchanged)
        teleopArr[2] === 1,                   // bricked (0|1 -> boolean)
        teleopArr[3] === 1,                   // playedDefense (0|1 -> boolean)
        teleopArr[4],                         // score (number, unchanged)
      ],
      [
        endgameArr[0],                        // notes (string, unchanged)
        endgameArr[1] === 1,                  // attempted (0|1 -> boolean)
        endgameArr[2],                        // level (number, unchanged)
        endgameArr[3],                        // rating (number, unchanged)
        endgameArr[4],                        // fouls (number, unchanged)
      ],
      teamInfoArr,                            // teamInfoArr (unchanged)
    ];
  }

  private async generateQRCode() {
    try {
      const payload = this.compilePayload();
      const booleanPayload = this.convertPayloadToBoolean(payload);
      const qrData = JSON.stringify(booleanPayload);
      const dataUrl = await QRCode.toDataURL(qrData, { width: 300 });
      this.qrCodeDataUrl = dataUrl;
    } catch (err) {
      console.error('Error generating QR code:', err);
    }
  }

  private saveData() {
    const payload = this.compilePayload();
    const scoutData = {
      matchId: this.matchId,
      payload: payload,
      timestamp: new Date().toISOString(),
    };

    // TODO: Save to local storage or backend
    console.log('Scout data compiled:', scoutData);
    alert('Scout data saved!');
  }

  private goBack() {
    window.history.back();
  }

  render() {
    const payload = this.compilePayload();

    return html`
      <main>
        <div class="match-header">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h1>Match ${this.matchId} - Team ${this.teamNumber}</h1>
              <p>Scout Team Data</p>
            </div>
            <sl-button variant="text" size="large" @click="${() => this.goBack()}">
              ← Back
            </sl-button>
          </div>
        </div>

        <sl-tab-group placement="bottom">
          <sl-tab slot="nav" panel="auto">Auto</sl-tab>
          <sl-tab slot="nav" panel="tele">Tele</sl-tab>
          <sl-tab slot="nav" panel="endgame">Endgame</sl-tab>
          <sl-tab slot="nav" panel="summary">Summary</sl-tab>

          <!-- AUTO TAB -->
          <sl-tab-panel name="auto">
            <div class="tab-content">
              <div class="form-group">
                <label>Field Map</label>
                <img
                  src="/assets/field-map.png"
                  alt="Field path map"
                  style="width: 100%; border-radius: var(--sl-border-radius-medium); border: 1px solid var(--sl-color-neutral-200);"
                />
              </div>

              <div class="form-group">
                <label>Paths Visited (in order)</label>
                <div class="path-list">
                  ${this.autoPaths.length === 0
                    ? html`<p style="color: var(--sl-color-neutral-600);">No paths added</p>`
                    : this.autoPaths.map(
                        (path, index) => html`
                          <div class="path-badge">
                            #${path}
                            <sl-button
                              size="small"
                              @click="${() => this.removePath(index)}"
                            >
                              ×
                            </sl-button>
                          </div>
                        `
                      )}
                </div>
              </div>

              <div class="form-group">
                <label>Add Path</label>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                  ${[1, 2, 3, 4, 5, 6, 7].map(
                    pathNum => html`
                      <sl-button
                        variant="${this.autoPaths.includes(pathNum) ? 'primary' : 'default'}"
                        @click="${() => this.addPath(pathNum)}"
                      >
                        ${pathNum}
                      </sl-button>
                    `
                  )}
                </div>
              </div>

              <div class="form-group">
                <label for="auto-score">Auto Score</label>
                <sl-input
                  id="auto-score"
                  type="number"
                  value="${this.autoScore}"
                  @sl-input="${(e: any) => (this.autoScore = parseInt(e.target.value, 10) || 0)}"
                ></sl-input>
              </div>

              <div class="form-group">
                <sl-switch
                  ?checked="${this.autoPreloaded === 1}"
                  @sl-change="${() => this.toggleSwitch('autoPreloaded')}"
                >
                  Started with Preloaded Piece
                </sl-switch>
              </div>

              <div class="form-group">
                <sl-switch
                  ?checked="${this.autoClimbAttempted === 1}"
                  @sl-change="${() => this.toggleSwitch('autoClimbAttempted')}"
                >
                  Climb Attempted in Auto
                </sl-switch>
              </div>

              <div class="form-group">
                <sl-switch
                  ?checked="${this.autoClimbSuccessful === 1}"
                  @sl-change="${() => this.toggleSwitch('autoClimbSuccessful')}"
                >
                  Climb Successful in Auto
                </sl-switch>
              </div>
            </div>
          </sl-tab-panel>

          <!-- TELEOP TAB -->
          <sl-tab-panel name="tele">
            <div class="tab-content">
              <div class="form-group">
                <label for="balls-made">Balls Made</label>
                <sl-input
                  id="balls-made"
                  type="number"
                  value="${this.teleopBallsMade}"
                  @sl-input="${(e: any) => (this.teleopBallsMade = parseInt(e.target.value, 10) || 0)}"
                ></sl-input>
              </div>

              <div class="form-group">
                <label for="balls-transferred">Balls Transferred</label>
                <sl-input
                  id="balls-transferred"
                  type="number"
                  value="${this.teleopBallsTransferred}"
                  @sl-input="${(e: any) => (this.teleopBallsTransferred = parseInt(e.target.value, 10) || 0)}"
                ></sl-input>
              </div>

              <div class="form-group">
                <sl-switch
                  ?checked="${this.teleopBricked === 1}"
                  @sl-change="${() => this.toggleSwitch('teleopBricked')}"
                >
                  Bricked
                </sl-switch>
              </div>

              <div class="form-group">
                <sl-switch
                  ?checked="${this.teleopPlayedDefense === 1}"
                  @sl-change="${() => this.toggleSwitch('teleopPlayedDefense')}"
                >
                  Played Defense
                </sl-switch>
              </div>

              <div class="form-group">
                <label for="teleop-score">Teleop Score</label>
                <sl-input
                  id="teleop-score"
                  type="number"
                  value="${this.teleopScore}"
                  @sl-input="${(e: any) => (this.teleopScore = parseInt(e.target.value, 10) || 0)}"
                ></sl-input>
              </div>
            </div>
          </sl-tab-panel>

          <!-- ENDGAME TAB -->
          <sl-tab-panel name="endgame">
            <div class="tab-content">
              <div class="form-group">
                <label for="endgame-notes">Endgame Notes</label>
                <sl-textarea
                  id="endgame-notes"
                  placeholder="Enter endgame observations..."
                  value="${this.endgameNotes}"
                  @sl-input="${(e: any) => (this.endgameNotes = e.target.value)}"
                ></sl-textarea>
              </div>

              <div class="form-group">
                <sl-switch
                  ?checked="${this.endgameAttempted === 1}"
                  @sl-change="${() => this.toggleSwitch('endgameAttempted')}"
                >
                  Endgame Climb Attempted
                </sl-switch>
              </div>

              <div class="form-group">
                <label for="endgame-level">Climb Level</label>
                <sl-select
                  id="endgame-level"
                  value="${this.endgameLevel}"
                  @sl-change="${(e: any) => (this.endgameLevel = parseInt(e.target.value, 10))}"
                >
                  <sl-option value="0">None</sl-option>
                  <sl-option value="1">L1</sl-option>
                  <sl-option value="2">L2</sl-option>
                  <sl-option value="3">L3</sl-option>
                </sl-select>
              </div>

              <div class="form-group">
                <label for="endgame-rating">Driver Rating (1-10)</label>
                <sl-select
                  id="endgame-rating"
                  value="${this.endgameRating}"
                  @sl-change="${(e: any) => (this.endgameRating = parseInt(e.target.value, 10))}"
                >
                  ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(
                    n => html`<sl-option value="${n}">${n}</sl-option>`
                  )}
                </sl-select>
              </div>

              <div class="form-group">
                <label>Fouls</label>
                <div class="number-controls">
                  <sl-button @click="${() => this.incrementCounter('endgameFouls', -1)}">−</sl-button>
                  <div class="number-display">${this.endgameFouls}</div>
                  <sl-button @click="${() => this.incrementCounter('endgameFouls', 1)}">+</sl-button>
                </div>
              </div>
            </div>
          </sl-tab-panel>

          <!-- SUMMARY TAB -->
          <sl-tab-panel name="summary">
            <div class="tab-content">
              <div class="form-group">
                <label>Match Payload (JSON)</label>
                <div class="data-display">${JSON.stringify(payload, null, 2)}</div>
              </div>

              <div class="form-group">
                <label>QR Code</label>
                <div style="display: flex; flex-direction: column; align-items: center; gap: 16px;">
                  ${this.qrCodeDataUrl
                    ? html`<img src="${this.qrCodeDataUrl}" alt="Match Data QR Code" style="border: 2px solid var(--sl-color-neutral-200); border-radius: var(--sl-border-radius-medium);" />`
                    : html`<sl-button variant="primary" @click="${async () => { await this.generateQRCode(); }}"
                        >Generate QR Code</sl-button
                      >`}
                </div>
              </div>

              <div class="button-group">
                <sl-button variant="default" @click="${() => this.goBack()}">
                  Back
                </sl-button>
                <sl-button variant="primary" @click="${() => this.saveData()}">
                  Save
                </sl-button>
              </div>
            </div>
          </sl-tab-panel>
        </sl-tab-group>
      </main>
    `;
  }
}
