import { LitElement, html } from 'lit';
import './calculator-form.js';
import './calculation-results.js';
import { CalculatorService } from '../services/calculator.js';

export class CalculatorApp extends LitElement {
  static properties = {
    activeTab: { type: String },
    activeModel: { type: String },
    activeChart: { type: String },
    calculations: { type: Object }
  };

  constructor() {
    super();
    this.activeTab = 'landing';
    this.activeModel = 'team';
    this.activeChart = 'cumulative';
    this.calculations = null;
  }

  createRenderRoot() {
    return this;
  }

  firstUpdated() {
    // Get default values from calculator form
    const form = this.querySelector('calculator-form');
    if (form) {
      const defaultValues = form.getDefaultValues();
      this.calculations = CalculatorService.calculate(
        this.activeModel,
        'platform', // Default solution
        defaultValues
      );
    }
  }

  updated(changedProperties) {
    if (changedProperties.has('activeTab') && this.activeTab === 'calculator' && !this.calculations) {
      // When switching to calculator tab for the first time
      const form = this.querySelector('calculator-form');
      if (form) {
        const defaultValues = form.getDefaultValues();
        this.calculations = CalculatorService.calculate(
          this.activeModel,
          'platform', // Default solution
          defaultValues
        );
      }
    }
  }

  render() {
    return html`
      <div class="max-w-7xl mx-auto px-4 py-8">
        <!-- Navigation -->
        <nav class="flex justify-center mb-12">
          <div class="flex gap-4">
            ${this.renderNavButton('landing', 'Overview')}
            ${this.renderNavButton('calculator', 'Calculator')}
          </div>
        </nav>

        ${this.activeTab === 'landing' ? 
          this.renderLanding() : 
          this.renderCalculator()}
      </div>
    `;
  }

  renderNavButton(tab, label) {
    return html`
      <button
        @click=${() => this.activeTab = tab}
        class=${`px-6 py-2 rounded-lg font-medium transition-all duration-200
          ${this.activeTab === tab 
            ? 'bg-indigo-600 text-white shadow-lg' 
            : 'bg-white text-gray-700 hover:bg-gray-50'}`}
      >
        ${label}
      </button>
    `;
  }

  renderLanding() {
    return html`
      <div class="space-y-16">
        <!-- Hero Section -->
        <div class="text-center space-y-6">
          <h1 class="text-5xl font-bold text-gray-900 mb-6">
            Service Delivery Cost Analysis
          </h1>
          <p class="text-xl text-gray-600 max-w-3xl mx-auto">
            Make data-driven decisions about your service delivery strategy. Compare costs and benefits 
            between different delivery models and solutions.
          </p>
          <div class="flex justify-center gap-4 pt-4">
            <button 
              @click=${() => this.activeTab = 'calculator'}
              class="px-8 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 
                     transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              Start Analysis
            </button>
          </div>
        </div>

        <!-- Key Benefits -->
        <div class="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-8 md:p-12">
          <h2 class="text-2xl font-bold text-gray-900 mb-8">Why Use This Calculator?</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            ${this.renderBenefitCard(
              'Data-Driven Decisions',
              'Make informed decisions based on comprehensive cost analysis and ROI projections.',
              'M9 7h6m0 0v6m0-6L9 13m-3 8h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
            )}
            ${this.renderBenefitCard(
              'Cost Comparison',
              'Compare different service delivery models and solutions side by side.',
              'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
            )}
            ${this.renderBenefitCard(
              'Long-term Impact',
              'Understand the long-term implications of different service delivery models.',
              'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
            )}
          </div>
        </div>

        <!-- Models -->
        <div class="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <h2 class="text-2xl font-bold text-gray-900 mb-8">Available Models</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Team-Based Model -->
            <div class="space-y-6">
              <div class="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                ${this.getModelIcon('team')}
              </div>
              <div>
                <h3 class="text-xl font-semibold text-gray-900 mb-4">Team-Based Model</h3>
                <div class="space-y-4 text-gray-600">
                  <p>Perfect for organizations with dedicated service teams handling consistent workloads.</p>
                  <h4 class="font-medium text-gray-900">Key Metrics:</h4>
                  <ul class="list-disc pl-5 space-y-2">
                    <li>Team size and utilization</li>
                    <li>Service delivery efficiency</li>
                    <li>Operational overhead</li>
                    <li>Cost per team member</li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Ticket-Based Model -->
            <div class="space-y-6">
              <div class="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                ${this.getModelIcon('ticket')}
              </div>
              <div>
                <h3 class="text-xl font-semibold text-gray-900 mb-4">Ticket-Based Model</h3>
                <div class="space-y-4 text-gray-600">
                  <p>Ideal for service desk operations and request-driven workflows.</p>
                  <h4 class="font-medium text-gray-900">Key Metrics:</h4>
                  <ul class="list-disc pl-5 space-y-2">
                    <li>Monthly ticket volume</li>
                    <li>Hours per ticket</li>
                    <li>People per ticket</li>
                    <li>Cost per ticket</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Solutions -->
        <div class="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-8 md:p-12">
          <h2 class="text-2xl font-bold text-gray-900 mb-8">Available Solutions</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            ${this.renderSolutionCard(
              'Platform Solution',
              'Automate service delivery through platform investment.',
              ['Initial platform cost', 'Monthly maintenance', 'Team reduction', 'Process efficiency'],
              'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z'
            )}
            ${this.renderSolutionCard(
              'Outsourcing Solution',
              'Transfer service delivery to external providers.',
              ['Vendor rates', 'Management overhead', 'Quality impact', 'Knowledge retention'],
              'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
            )}
            ${this.renderSolutionCard(
              'Hybrid Solution',
              'Combine platform automation with outsourcing.',
              ['Platform/vendor split', 'Combined benefits', 'Balanced approach', 'Flexible scaling'],
              'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
            )}
          </div>
        </div>

        <!-- CTA Section -->
        <div class="text-center py-12">
          <h2 class="text-3xl font-bold text-gray-900 mb-6">
            Ready to Analyze Your Service Delivery Strategy?
          </h2>
          <p class="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Get started with our comprehensive calculator to make data-driven decisions 
            about your service delivery transformation.
          </p>
          <button 
            @click=${() => this.activeTab = 'calculator'}
            class="px-8 py-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 
                   transition-colors duration-200 shadow-lg hover:shadow-xl text-lg"
          >
            Start Your Analysis
          </button>
        </div>
      </div>
    `;
  }

  renderBenefitCard(title, description, icon) {
    return html`
      <div class="flex items-start gap-4">
        <div class="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${icon}" />
          </svg>
        </div>
        <div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">${title}</h3>
          <p class="text-gray-600">${description}</p>
        </div>
      </div>
    `;
  }

  renderSolutionCard(title, description, features, icon) {
    return html`
      <div class="bg-white rounded-xl p-6 shadow-md">
        <div class="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
          <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${icon}" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">${title}</h3>
        <p class="text-gray-600 mb-4">${description}</p>
        <ul class="space-y-2">
          ${features.map(feature => html`
            <li class="flex items-center gap-2 text-gray-600">
              <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              ${feature}
            </li>
          `)}
        </ul>
      </div>
    `;
  }

  renderCalculator() {
    return html`
      <div class="space-y-8">
        <!-- Model Selection -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          ${['team', 'ticket'].map(model => this.renderModelSelector(model))}
        </div>

        <!-- Calculator Form -->
        <calculator-form
          .model=${this.activeModel}
          @calculate=${this.handleCalculate}
          @solution-change=${(e) => {
            const form = this.querySelector('calculator-form');
            if (form) {
              const defaultValues = form.getDefaultValues();
              this.calculations = CalculatorService.calculate(
                this.activeModel,
                e.detail,
                defaultValues
              );
            }
          }}
        ></calculator-form>

        <!-- Results -->
        ${this.calculations ? html`
          <calculation-results
            .results=${this.calculations}
            .activeChart=${this.activeChart}
            @chart-change=${(e) => this.activeChart = e.detail}
          ></calculation-results>
        ` : ''}
      </div>
    `;
  }

  renderModelSelector(model) {
    const isActive = this.activeModel === model;
    return html`
      <button
        @click=${() => this.selectModel(model)}
        class=${`relative overflow-hidden transition-all duration-300 transform ${
          isActive ? 'scale-105' : 'hover:scale-102'
        }`}
      >
        <div class=${`w-full h-full text-left transition-all duration-300 ${
          isActive 
          ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-xl' 
          : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 hover:border-indigo-200'
        } rounded-2xl p-8`}>
          <div class="relative z-10">
            <!-- Header -->
            <div class="flex items-center gap-4 mb-6">
              <div class=${`p-3 rounded-xl ${
                isActive 
                ? 'bg-indigo-500/30' 
                : 'bg-indigo-50'
              }`}>
                ${this.getModelIcon(model)}
              </div>
              <h3 class="text-2xl font-bold">
                ${model === 'team' ? 'Team Based' : 'Ticket Based'}
              </h3>
            </div>

            <!-- Description -->
            <p class=${`text-base ${
              isActive 
              ? 'text-indigo-100' 
              : 'text-gray-600'
            }`}>
              ${this.getModelDescription(model)}
            </p>
          </div>

          ${isActive ? html`
            <div class="absolute top-4 right-4">
              <div class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          ` : ''}
        </div>
      </button>
    `;
  }

  getModelIcon(model) {
    switch (model) {
      case 'team':
        return html`
          <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        `;
      case 'ticket':
        return html`
          <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        `;
    }
  }

  getModelDescription(model) {
    switch (model) {
      case 'team':
        return 'Calculate costs based on team size and efficiency metrics.';
      case 'ticket':
        return 'Calculate costs based on ticket volume and handling metrics.';
    }
  }

  selectModel(model) {
    this.activeModel = model;
    // Get new default values for the selected model
    const form = this.querySelector('calculator-form');
    if (form) {
      form.model = model;
      const defaultValues = form.getDefaultValues();
      this.calculations = CalculatorService.calculate(
        model,
        form.solution, // Keep current solution
        defaultValues
      );
    }
    this.requestUpdate();
  }

  handleCalculate(e) {
    const { model, solution, values } = e.detail;
    this.calculations = CalculatorService.calculate(model, solution, values);
    this.requestUpdate();
  }
}

customElements.define('calculator-app', CalculatorApp); 