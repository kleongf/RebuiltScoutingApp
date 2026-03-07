import { LitElement, css, html } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { resolveRouterPath } from '../router';

import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';

import { styles } from '../styles/shared-styles';
import { appState } from '../services/app-state';

@customElement('app-event-input')
export class AppEventInput extends LitElement {
  @property() eventCode: string = '';

  static styles = [
    styles,
    css`
      #container {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        min-height: 100vh;
        padding: 16px;
      }

      sl-card {
        width: 100%;
        max-width: 400px;
      }

      sl-input {
        margin-bottom: 16px;
      }

      sl-card::part(footer) {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }

      h1 {
        text-align: center;
        margin-bottom: 24px;
      }
    `
  ];

  private handleEventCodeChange(e: any) {
    this.eventCode = e.target.value;
  }

  private handleSubmit() {
    if (!this.eventCode.trim()) {
      alert('Please enter an event code');
      return;
    }

    // Store the event code in app state
    appState.setState({ eventCode: this.eventCode });

    // Navigate to matches page using href
    window.location.href = resolveRouterPath('matches');
  }

  render() {
    return html`
      <div id="container">
        <sl-card>
          <h1>Match Scouting</h1>
          <p>Enter the event code to get started:</p>

          <sl-input
            label="Event Code"
            placeholder="e.g., 2024casd"
            @input="${this.handleEventCodeChange}"
            value="${this.eventCode}"
          ></sl-input>

          <sl-button slot="footer" variant="primary" @click="${this.handleSubmit}">
            Continue
          </sl-button>
        </sl-card>
      </div>
    `;
  }
}

