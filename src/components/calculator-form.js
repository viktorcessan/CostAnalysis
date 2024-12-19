import { LitElement, html } from 'lit';

const BASE_FIELDS = {
  team: [
    { name: 'teamSize', label: 'Team Size (FTEs)', type: 'number', min: 1, max: 100, step: 1 },
    { name: 'hourlyRate', label: 'Hourly Rate ($)', type: 'number', min: 1, max: 500, step: 1 },
    { name: 'serviceEfficiency', label: 'Service Efficiency', type: 'number', min: 0, max: 1, step: 0.01 },
    { name: 'operationalOverhead', label: 'Operational Overhead', type: 'number', min: 0, max: 1, step: 0.01 }
  ],
  ticket: [
    { name: 'monthlyTickets', label: 'Monthly Tickets', type: 'number', min: 1, max: 10000, step: 1 },
    { name: 'hoursPerTicket', label: 'Hours per Ticket', type: 'number', min: 0.1, max: 100, step: 0.1 },
    { name: 'peoplePerTicket', label: 'People per Ticket', type: 'number', min: 1, max: 10, step: 1 },
    { name: 'hourlyRate', label: 'Hourly Rate ($)', type: 'number', min: 1, max: 500, step: 1 }
  ]
};

const SOLUTION_FIELDS = {
  platform: [
    { name: 'platformCost', label: 'Platform Investment ($)', type: 'number', min: 0, max: 1000000, step: 1000 },
    { name: 'platformMaintenance', label: 'Monthly Maintenance ($)', type: 'number', min: 0, max: 100000, step: 100 },
    { name: 'teamReduction', label: 'Team Reduction Factor', type: 'number', min: 0, max: 1, step: 0.01 },
    { name: 'processEfficiency', label: 'Process Efficiency Gain', type: 'number', min: 0, max: 1, step: 0.01 }
  ],
  outsource: [
    { name: 'vendorRate', label: 'Vendor Hourly Rate ($)', type: 'number', min: 1, max: 500, step: 1 },
    { name: 'managementOverhead', label: 'Management Overhead', type: 'number', min: 0, max: 1, step: 0.01 },
    { name: 'qualityImpact', label: 'Quality Impact Factor', type: 'number', min: -0.5, max: 0.5, step: 0.01 },
    { name: 'knowledgeLoss', label: 'Knowledge Loss Factor', type: 'number', min: 0, max: 1, step: 0.01 },
    { name: 'transitionTime', label: 'Transition Time (months)', type: 'number', min: 1, max: 24, step: 1 },
    { name: 'transitionCost', label: 'Transition Cost ($)', type: 'number', min: 0, max: 1000000, step: 1000 }
  ],
  hybrid: [
    { name: 'platformCost', label: 'Platform Investment ($)', type: 'number', min: 0, max: 1000000, step: 1000 },
    { name: 'platformMaintenance', label: 'Monthly Maintenance ($)', type: 'number', min: 0, max: 100000, step: 100 },
    { name: 'processEfficiency', label: 'Process Efficiency Gain', type: 'number', min: 0, max: 1, step: 0.01 },
    { name: 'vendorRate', label: 'Vendor Hourly Rate ($)', type: 'number', min: 1, max: 500, step: 1 },
    { name: 'managementOverhead', label: 'Management Overhead', type: 'number', min: 0, max: 1, step: 0.01 },
    { name: 'qualityImpact', label: 'Quality Impact Factor', type: 'number', min: -0.5, max: 0.5, step: 0.01 },
    { name: 'workSplit', label: 'Platform/Vendor Split', type: 'number', min: 0, max: 1, step: 0.1 }
  ]
};

const MODEL_DESCRIPTIONS = {
  team: {
    title: 'Team-Based Model',
    description: 'Calculate costs based on team size and efficiency metrics.',
    tooltips: {
      teamSize: 'Number of full-time employees (n)',
      hourlyRate: 'Average hourly cost per team member (h)',
      serviceEfficiency: 'Service delivery efficiency factor (η_s)',
      operationalOverhead: 'Operational overhead factor (η_o)'
    }
  },
  ticket: {
    title: 'Ticket-Based Model',
    description: 'Calculate costs based on ticket volume and handling metrics.',
    tooltips: {
      monthlyTickets: 'Average number of monthly tickets (m)',
      hoursPerTicket: 'Average hours per ticket (t_h)',
      peoplePerTicket: 'Average people needed per ticket (p)',
      hourlyRate: 'Average hourly cost per person (h)'
    }
  }
};

const SOLUTION_DESCRIPTIONS = {
  platform: {
    title: 'Platform Solution',
    description: 'Automate service delivery through a platform investment.',
    tooltips: {
      platformCost: 'Initial platform investment (P_i)',
      platformMaintenance: 'Monthly platform maintenance cost (P_m)',
      teamReduction: 'Team size reduction through automation (α_t)',
      processEfficiency: 'Process efficiency improvement factor (α_p)'
    }
  },
  outsource: {
    title: 'Outsourcing Solution',
    description: 'Transfer service delivery to external providers.',
    tooltips: {
      vendorRate: 'Vendor hourly rate (v)',
      managementOverhead: 'Management overhead factor (β_m)',
      qualityImpact: 'Quality impact factor (β_q)',
      knowledgeLoss: 'Knowledge loss factor (β_k)',
      transitionTime: 'Transition period in months (T_t)',
      transitionCost: 'One-time transition cost (O_t)'
    }
  },
  hybrid: {
    title: 'Hybrid Solution',
    description: 'Combine platform automation with outsourcing.',
    tooltips: {
      platformCost: 'Initial platform investment (P_i)',
      platformMaintenance: 'Monthly platform maintenance cost (P_m)',
      processEfficiency: 'Process efficiency improvement factor (α_p)',
      vendorRate: 'Vendor hourly rate (v)',
      managementOverhead: 'Management overhead factor (β_m)',
      workSplit: 'Ratio of work handled by platform vs vendor (γ)'
    }
  }
};

export class CalculatorForm extends LitElement {
  static properties = {
    model: { type: String },
    solution: { type: String },
    values: { type: Object }
  };

  constructor() {
    super();
    this.model = 'team';
    this.solution = 'platform';
    this.values = this.getDefaultValues();
  }

  firstUpdated() {
    // Initialize tooltips
    tippy('[data-tippy-content]', {
      placement: 'right',
      arrow: true,
      theme: 'light'
    });

    // Trigger initial calculation
    this.dispatchCalculation();
  }

  getDefaultValues() {
    const baseDefaults = {
      team: {
        teamSize: 5,
        hourlyRate: 75,
        serviceEfficiency: 0.6,
        operationalOverhead: 0.2
      },
      ticket: {
        monthlyTickets: 50,
        hoursPerTicket: 4,
        peoplePerTicket: 2,
        hourlyRate: 75
      }
    };

    const solutionDefaults = {
      platform: {
        platformCost: 100000,
        platformMaintenance: 5000,
        teamReduction: 0.3,
        processEfficiency: 0.2
      },
      outsource: {
        vendorRate: 50,
        managementOverhead: 0.15,
        qualityImpact: -0.15,
        knowledgeLoss: 0.2,
        transitionTime: 3,
        transitionCost: 50000
      },
      hybrid: {
        platformCost: 60000,
        platformMaintenance: 3000,
        processEfficiency: 0.15,
        vendorRate: 55,
        managementOverhead: 0.1,
        qualityImpact: -0.1,
        workSplit: 0.5
      }
    };

    return {
      ...baseDefaults[this.model],
      ...solutionDefaults[this.solution]
    };
  }

  createRenderRoot() {
    return this;
  }

  render() {
    const modelInfo = MODEL_DESCRIPTIONS[this.model];
    const solutionInfo = SOLUTION_DESCRIPTIONS[this.solution];
    const baseFields = BASE_FIELDS[this.model];
    const solutionFields = SOLUTION_FIELDS[this.solution];

    return html`
      <div class="bg-white rounded-xl shadow-lg p-4">
        <!-- Model Description -->
        <div class="bg-gradient-to-r from-indigo-50 to-blue-50 p-2 rounded-lg border border-indigo-100 mb-3">
          <p class="text-indigo-700 text-xs leading-relaxed">${modelInfo.description}</p>
        </div>

        <!-- Solution Selection -->
        <div class="flex gap-2 mb-3">
          ${['platform', 'outsource', 'hybrid'].map(sol => html`
            <button
              @click=${() => this.selectSolution(sol)}
              class=${`flex-1 p-2 rounded-lg border transition-all text-sm ${
                this.solution === sol
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 hover:border-indigo-200'
              }`}
            >
              <h4 class="font-medium text-sm">${SOLUTION_DESCRIPTIONS[sol].title}</h4>
              <p class="text-xs text-gray-600 mt-0.5">${SOLUTION_DESCRIPTIONS[sol].description}</p>
            </button>
          `)}
        </div>

        <!-- Base Configuration -->
        <div class="mb-3">
          <h3 class="text-sm font-semibold text-gray-900 mb-2">Base Configuration</h3>
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-2">
            ${baseFields.map(field => this.renderField(field))}
          </div>
        </div>

        <!-- Solution Configuration -->
        <div>
          <h3 class="text-sm font-semibold text-gray-900 mb-2">${solutionInfo.title} Configuration</h3>
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-2">
            ${solutionFields.map(field => this.renderField(field))}
          </div>
        </div>
      </div>
    `;
  }

  renderField(field) {
    const tooltip = (this.solution === 'platform' || this.solution === 'outsource' || this.solution === 'hybrid')
      ? SOLUTION_DESCRIPTIONS[this.solution].tooltips[field.name] || MODEL_DESCRIPTIONS[this.model].tooltips[field.name]
      : MODEL_DESCRIPTIONS[this.model].tooltips[field.name];
    
    const value = this.values[field.name] || field.min;
    
    return html`
      <div class="bg-white p-2 rounded-lg border border-gray-100 hover:border-indigo-200 transition-colors duration-200">
        <div class="flex justify-between items-center mb-1">
          <label class="text-xs font-medium text-gray-700 flex items-center gap-1">
            ${field.label}
            <span class="tooltip" data-tippy-content="${tooltip}">
              <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </label>
          <div class="relative">
            <input
              type="number"
              name=${field.name}
              .value=${value}
              @input=${this.handleInput}
              min=${field.min}
              max=${field.max}
              step=${field.step}
              class="w-20 px-1 py-0.5 text-right text-gray-700 bg-gray-50 border border-gray-200 
                     rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent
                     transition-all duration-200 text-xs"
            />
            ${field.name.toLowerCase().includes('cost') ? html`
              <span class="absolute left-1 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">$</span>
            ` : ''}
          </div>
        </div>
        
        <input
          type="range"
          name=${field.name}
          min=${field.min}
          max=${field.max}
          step=${field.step}
          .value=${value}
          @input=${this.handleInput}
          class="w-full h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer
                 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:ring-offset-1"
        />
      </div>
    `;
  }

  selectSolution(solution) {
    this.solution = solution;
    this.values = this.getDefaultValues();
    this.requestUpdate();
    
    // Dispatch solution change event
    const event = new CustomEvent('solution-change', {
      detail: solution,
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  updated(changedProperties) {
    if (changedProperties.has('model')) {
      // When model changes, update values with new defaults
      this.values = this.getDefaultValues();
      this.requestUpdate();
      this.dispatchCalculation();
    }

    // Initialize tooltips after update
    tippy('[data-tippy-content]', {
      placement: 'right',
      arrow: true,
      theme: 'light'
    });
  }

  handleInput(e) {
    const { name, value } = e.target;
    const numValue = Number(value) || 0;
    this.values = {
      ...this.values,
      [name]: numValue
    };

    // Update the corresponding range/number input in the same field container
    const container = e.target.closest('.bg-white');
    if (container) {
      const inputs = container.querySelectorAll(`input[name="${name}"]`);
      inputs.forEach(input => {
        if (input !== e.target) {
          input.value = numValue;
        }
      });
    }

    this.dispatchCalculation();
  }

  dispatchCalculation() {
    const event = new CustomEvent('calculate', {
      detail: {
        model: this.model,
        solution: this.solution,
        values: this.values
      },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }
}

customElements.define('calculator-form', CalculatorForm); 