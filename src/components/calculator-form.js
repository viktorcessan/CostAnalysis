import { LitElement, html } from 'lit';

const BASE_FIELDS = {
  team: [
    { name: 'teamSize', label: 'Team Size (FTEs)', type: 'number', min: 1, max: 15, step: 1 },
    { name: 'hourlyRate', label: 'Hourly Rate ($)', type: 'number', min: 10, max: 150, step: 1 },
    { name: 'serviceEfficiency', label: 'Service Efficiency', type: 'number', min: 0, max: 1, step: 0.01 },
    { name: 'operationalOverhead', label: 'Operational Overhead', type: 'number', min: 0, max: 1, step: 0.01 }
  ],
  ticket: [
    { name: 'monthlyTickets', label: 'Monthly Tickets', type: 'number', min: 1, max: 250, step: 1 },
    { name: 'hoursPerTicket', label: 'Hours per Ticket', type: 'number', min: 0.1, max: 100, step: 0.1 },
    { name: 'peoplePerTicket', label: 'People per Ticket', type: 'number', min: 1, max: 10, step: 1 },
    { name: 'hourlyRate', label: 'Hourly Rate ($)', type: 'number', min: 10, max: 150, step: 1 }
  ]
};

const SOLUTION_FIELDS = {
  platform: [
    { name: 'platformCost', label: 'Platform Investment ($)', type: 'number', min: 50000, max: 500000, step: 1000 },
    { name: 'platformMaintenance', label: 'Monthly Maintenance ($)', type: 'number', min: 1000, max: 10000, step: 100 },
    { name: 'timeToBuild', label: 'Time to Build (months)', type: 'number', min: 1, max: 12, step: 1 },
    { name: 'teamReduction', label: 'Team Reduction Factor', type: 'number', min: 0, max: 1, step: 0.01 },
    { name: 'processEfficiency', label: 'Process Efficiency Gain', type: 'number', min: 0, max: 1, step: 0.01 }
  ],
  outsource: [
    { name: 'vendorRate', label: 'Vendor Hourly Rate ($)', type: 'number', min: 10, max: 150, step: 1 },
    { name: 'managementOverhead', label: 'Management Overhead', type: 'number', min: 0, max: 1, step: 0.01 },
    { name: 'qualityImpact', label: 'Quality Impact Factor', type: 'number', min: -0.5, max: 0.5, step: 0.01 },
    { name: 'knowledgeLoss', label: 'Knowledge Loss Factor', type: 'number', min: 0, max: 1, step: 0.01 },
    { name: 'transitionTime', label: 'Transition Time (months)', type: 'number', min: 1, max: 12, step: 1 },
    { name: 'transitionCost', label: 'Transition Cost ($)', type: 'number', min: 0, max: 100000, step: 1000 }
  ],
  hybrid: [
    { name: 'platformCost', label: 'Platform Investment ($)', type: 'number', min: 50000, max: 500000, step: 1000 },
    { name: 'platformMaintenance', label: 'Monthly Maintenance ($)', type: 'number', min: 1000, max: 10000, step: 100 },
    { name: 'processEfficiency', label: 'Process Efficiency Gain', type: 'number', min: 0, max: 1, step: 0.01 },
    { name: 'vendorRate', label: 'Vendor Hourly Rate ($)', type: 'number', min: 10, max: 150, step: 1 },
    { name: 'managementOverhead', label: 'Management Overhead', type: 'number', min: 0, max: 1, step: 0.01 },
    { name: 'qualityImpact', label: 'Quality Impact Factor', type: 'number', min: -0.5, max: 0.5, step: 0.01 },
    { name: 'knowledgeLoss', label: 'Knowledge Loss Factor', type: 'number', min: 0, max: 1, step: 0.01 },
    { name: 'transitionTime', label: 'Transition Time (months)', type: 'number', min: 1, max: 12, step: 1 },
    { name: 'transitionCost', label: 'Transition Cost ($)', type: 'number', min: 0, max: 100000, step: 1000 },
    { name: 'platformPortion', label: 'Platform Portion (%)', type: 'number', min: 0, max: 100, step: 5 },
    { name: 'vendorPortion', label: 'Vendor Portion (%)', type: 'number', min: 0, max: 100, step: 5 }
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
      timeToBuild: 'Time required to build the platform (T_b)',
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
    // Initialize tooltips with mobile-friendly configuration
    tippy('[data-tippy-content]', {
      placement: 'auto',
      arrow: true,
      theme: 'light-border',
      delay: [100, 200],
      touch: 'hold',
      maxWidth: 300,
      hideOnClick: false,
      trigger: 'mouseenter focus click',
      interactive: true
    });

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
        timeToBuild: 3,
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
        knowledgeLoss: 0.2,
        transitionTime: 3,
        transitionCost: 30000,
        platformPortion: 40,
        vendorPortion: 30
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
        ${this.solution === 'hybrid' ? html`
          <!-- Hybrid Solution Configuration -->
          <div class="space-y-4">
            <!-- Platform Configuration -->
            <div>
              <h3 class="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                <svg class="w-4 h-4 mr-1 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Platform Configuration
              </h3>
              <div class="grid grid-cols-2 lg:grid-cols-4 gap-2">
                ${solutionFields.filter(f => ['platformCost', 'platformMaintenance', 'processEfficiency'].includes(f.name))
                  .map(field => this.renderField(field))}
              </div>
            </div>

            <!-- Outsourcing Configuration -->
            <div>
              <h3 class="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                <svg class="w-4 h-4 mr-1 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Outsourcing Configuration
              </h3>
              <div class="grid grid-cols-2 lg:grid-cols-4 gap-2">
                ${solutionFields.filter(f => ['vendorRate', 'managementOverhead', 'qualityImpact', 'knowledgeLoss', 'transitionTime', 'transitionCost'].includes(f.name))
                  .map(field => this.renderField(field))}
              </div>
            </div>

            <!-- Work Distribution -->
            <div>
              <h3 class="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                <svg class="w-4 h-4 mr-1 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
                Work Distribution
              </h3>
              <div class="grid grid-cols-2 gap-2">
                ${solutionFields.filter(f => ['platformPortion', 'vendorPortion'].includes(f.name))
                  .map(field => this.renderField(field))}
              </div>
            </div>
          </div>
        ` : html`
          <div>
            <h3 class="text-sm font-semibold text-gray-900 mb-2">${solutionInfo.title} Configuration</h3>
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-2">
              ${solutionFields.map(field => this.renderField(field))}
            </div>
          </div>
        `}
      </div>
    `;
  }

  renderField(field) {
    const tooltip = (this.solution === 'platform' || this.solution === 'outsource' || this.solution === 'hybrid')
      ? SOLUTION_DESCRIPTIONS[this.solution].tooltips[field.name] || MODEL_DESCRIPTIONS[this.model].tooltips[field.name]
      : MODEL_DESCRIPTIONS[this.model].tooltips[field.name];
    
    const value = this.values[field.name] || field.min;
    
    // Determine input width based on field type
    const inputWidthClass = field.name.toLowerCase().includes('cost') || field.max > 1000 
      ? 'w-24 min-w-[6rem]' 
      : 'w-16 min-w-[4rem]';
    
    return html`
      <div class="bg-white p-2 rounded-lg border border-gray-100 hover:border-indigo-200 transition-colors duration-200 overflow-hidden">
        <div class="flex justify-between items-center mb-1 gap-2">
          <label class="text-xs font-medium text-gray-700 flex items-center gap-1 min-w-0 flex-1">
            <span class="truncate">${field.label}</span>
            <button class="tooltip flex-none" data-tippy-content="${tooltip}">
              <svg class="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </label>
          <div class="relative flex-none">
            <input
              type="number"
              name=${field.name}
              .value=${value}
              @input=${this.handleInput}
              min=${field.min}
              max=${field.max}
              step=${field.step}
              class="${inputWidthClass} px-1 py-0.5 text-right text-gray-700 bg-gray-50 border border-gray-200 
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

    // Initialize tooltips with mobile-friendly configuration
    tippy('[data-tippy-content]', {
      placement: 'auto',
      arrow: true,
      theme: 'light-border',
      delay: [100, 200],
      touch: ['hold', 500],
      maxWidth: 300,
      interactive: true,
      appendTo: () => document.body
    });
  }

  handleInput(e) {
    const { name, value } = e.target;
    const numValue = Number(value) || 0;

    // Special handling for platform/vendor portions to ensure they sum to 100%
    if (name === 'platformPortion' || name === 'vendorPortion') {
      const newValue = Math.min(100, Math.max(0, numValue));
      if (name === 'platformPortion') {
        this.values = {
          ...this.values,
          platformPortion: newValue,
          vendorPortion: 100 - newValue
        };
      } else {
        this.values = {
          ...this.values,
          vendorPortion: newValue,
          platformPortion: 100 - newValue
        };
      }
    } else {
      this.values = {
        ...this.values,
        [name]: numValue
      };
    }

    // Update the corresponding range/number input in the same field container
    const container = e.target.closest('.bg-white');
    if (container) {
      const inputs = container.querySelectorAll(`input[name="${name}"]`);
      inputs.forEach(input => {
        if (input !== e.target) {
          input.value = this.values[name];
        }
      });

      // Update the linked field if it's platform/vendor portion
      if (name === 'platformPortion' || name === 'vendorPortion') {
        const linkedName = name === 'platformPortion' ? 'vendorPortion' : 'platformPortion';
        const linkedInputs = document.querySelectorAll(`input[name="${linkedName}"]`);
        linkedInputs.forEach(input => {
          input.value = this.values[linkedName];
        });
      }
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