import { LitElement, html } from 'lit';
import Chart from 'chart.js/auto';
import annotationPlugin from 'chartjs-plugin-annotation';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import katex from 'katex';

Chart.register(annotationPlugin);

export class CalculationResults extends LitElement {
  static properties = {
    results: { type: Object },
    activeChart: { type: String },
    showFormulas: { type: Boolean }
  };

  constructor() {
    super();
    this.activeChart = 'cumulative';
    this.chartInstance = null;
    this.showFormulas = false;
  }

  createRenderRoot() {
    return this;
  }

  render() {
    if (!this.results) return null;

    return html`
      <div class="mt-12 space-y-8">
        <!-- Main Results Box -->
        <div class="bg-white rounded-xl shadow-lg p-6">
          <!-- Summary Cards -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            ${this.renderSummaryCard(
              'Monthly Savings',
              this.results.monthly,
              this.results.monthly >= 0 ? 'text-green-600' : 'text-red-600',
              'currency'
            )}
            ${this.renderSummaryCard(
              'Break-even Period',
              this.results.breakeven,
              'text-indigo-600',
              'months'
            )}
            ${this.renderSummaryCard(
              'Initial Investment',
              this.results.solution.initial,
              'text-gray-600',
              'currency'
            )}
          </div>

          <!-- Cost Comparison -->
          ${this.renderComparisonTable()}

          <!-- Chart Controls -->
          <div class="flex justify-center gap-4 mb-6">
            ${['cumulative', 'monthly', 'savings'].map(chart => html`
              <button
                @click=${() => this.handleChartChange(chart)}
                class=${`px-4 py-2 rounded-lg transition-all ${
                  this.activeChart === chart
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ${this.getChartTitle(chart)}
              </button>
            `)}
          </div>

          <!-- Chart -->
          <div class="h-80 mb-8">
            <canvas id="analysisChart"></canvas>
          </div>

          <!-- Export Buttons -->
          <div class="flex justify-end gap-4 pt-4 border-t border-gray-200">
            <button
              @click=${this.exportExcel}
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Excel
            </button>
            <button
              @click=${this.exportPDF}
              class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export PDF
            </button>
          </div>
        </div>

        <!-- Sensitivity Analysis Box -->
        <div class="bg-white rounded-xl shadow-lg p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-semibold text-gray-900">Sensitivity Analysis</h3>
            <div class="text-sm text-gray-600">
              Analysis based on ±20% variation in cost savings
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            ${this.renderSensitivityCard(
              'Pessimistic',
              this.calculateSensitivity().pessimistic,
              'red',
              'Assumes 20% lower cost savings than base case, representing potential risks and challenges.'
            )}
            ${this.renderSensitivityCard(
              'Base Case',
              this.calculateSensitivity().base,
              'indigo',
              'Current projected savings based on provided inputs and standard assumptions.'
            )}
            ${this.renderSensitivityCard(
              'Optimistic',
              this.calculateSensitivity().optimistic,
              'green',
              'Assumes 20% higher cost savings than base case, representing potential upside opportunities.'
            )}
          </div>
        </div>

        <!-- Formula Accordion -->
        <div class="bg-white rounded-xl shadow-lg p-6">
          <button
            @click=${() => this.toggleFormulas()}
            class="w-full flex items-center justify-between px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <span class="font-medium text-gray-700">View Mathematical Models</span>
            <svg
              class="w-5 h-5 text-gray-500 transform transition-transform duration-200 ${this.showFormulas ? 'rotate-180' : ''}"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          ${this.showFormulas ? this.renderModelFormulas() : ''}
        </div>
      </div>
    `;
  }

  renderSummaryCard(title, value, colorClass, type) {
    let displayValue = '';
    
    if (type === 'currency') {
      displayValue = value ? value.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
      }) : '$0';
    } else if (type === 'months') {
      if (value === null || value === undefined) {
        displayValue = 'Never';
      } else {
        const buildTime = this.results.solution.timeToBuild;
        if (buildTime && this.results.solution.type === 'platform') {
          displayValue = `${value} months (includes ${buildTime} months build time)`;
        } else {
          displayValue = `${value} months`;
        }
      }
    }

    return html`
      <div class="bg-gray-50 rounded-xl p-6">
        <h3 class="text-gray-600 text-sm font-medium mb-2">${title}</h3>
        <p class=${`text-2xl font-bold ${colorClass}`}>${displayValue}</p>
      </div>
    `;
  }

  renderComparisonTable() {
    const { baseline, solution, data } = this.results;
    
    // For platform solutions, we need to account for build time
    let solutionMonthly = solution.monthly;
    let solutionTotal;
    
    if (solution.type === 'platform') {
      const buildTime = solution.timeToBuild || 3;
      // During build time: full baseline costs
      const buildPeriodCost = baseline.monthly * buildTime;
      // After build time: reduced costs for remaining months
      const remainingMonths = 24 - buildTime;
      solutionTotal = solution.initial + buildPeriodCost + (solution.monthly * remainingMonths);
    } else {
      solutionTotal = (solution.monthly * 24) + solution.initial;
    }
    
    const baselineTotal = baseline.monthly * 24;
    
    return html`
      <div class="overflow-x-auto mb-8">
        <table class="min-w-full">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="text-left py-3 px-4 text-gray-600">Cost Category</th>
              <th class="text-right py-3 px-4 text-gray-600">Baseline</th>
              <th class="text-right py-3 px-4 text-gray-600">Solution</th>
              <th class="text-right py-3 px-4 text-gray-600">Difference</th>
            </tr>
          </thead>
          <tbody>
            ${this.renderComparisonRow('Monthly Total', baseline.monthly, solutionMonthly)}
            ${this.renderComparisonRow('Initial Cost', baseline.initial, solution.initial)}
            ${this.renderComparisonRow('2-Year Total', baselineTotal, solutionTotal)}
          </tbody>
        </table>
      </div>
    `;
  }

  renderComparisonRow(label, baselineValue, solutionValue) {
    const difference = baselineValue - solutionValue;
    const formatValue = (value) => value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    });

    return html`
      <tr class="border-b border-gray-100">
        <td class="py-3 px-4 text-gray-700">${label}</td>
        <td class="text-right py-3 px-4 text-gray-700">${formatValue(baselineValue)}</td>
        <td class="text-right py-3 px-4 text-gray-700">${formatValue(solutionValue)}</td>
        <td class="text-right py-3 px-4 ${difference >= 0 ? 'text-green-600' : 'text-red-600'}">
          ${formatValue(Math.abs(difference))}
          ${difference >= 0 ? 'saved' : 'extra'}
        </td>
      </tr>
    `;
  }

  renderSensitivityCard(scenario, results, color, explanation) {
    const formatValue = (value) => value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    });

    return html`
      <div class="bg-${color}-50 rounded-xl p-6 border border-${color}-100">
        <h4 class="text-${color}-800 font-semibold mb-2">${scenario} Case</h4>
        <p class="text-sm text-${color}-600 mb-4">${explanation}</p>
        <div class="space-y-3">
          <div>
            <div class="text-sm text-${color}-600">Monthly Savings</div>
            <div class="text-lg font-semibold text-${color}-700">${formatValue(results.monthly)}</div>
          </div>
          <div>
            <div class="text-sm text-${color}-600">2-Year Total Savings</div>
            <div class="text-lg font-semibold text-${color}-700">${formatValue(results.total)}</div>
          </div>
          <div>
            <div class="text-sm text-${color}-600">Break-even Period</div>
            <div class="text-lg font-semibold text-${color}-700">
              ${results.breakeven ? `${results.breakeven} months` : 'Never'}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  calculateSensitivity() {
    const { baseline, solution } = this.results;
    
    // Base case
    const baseMonthly = baseline.monthly - solution.monthly;
    const baseTotal = (baseline.monthly * 24) - ((solution.monthly * 24) + solution.initial);
    
    // Helper function to calculate break-even
    const calculateBreakeven = (monthlySavings) => {
      if (monthlySavings <= 0) return null;
      return Math.ceil(solution.initial / monthlySavings);
    };
    
    // For negative savings, we want to show less negative numbers for optimistic case
    const variationFactor = baseMonthly >= 0 ? 0.2 : -0.2;
    
    // Pessimistic case: 20% worse
    const pessimisticMonthly = baseMonthly * (1 - variationFactor);
    const pessimisticTotal = baseTotal * (1 - variationFactor);
    
    // Optimistic case: 20% better
    const optimisticMonthly = baseMonthly * (1 + variationFactor);
    const optimisticTotal = baseTotal * (1 + variationFactor);

    return {
      base: {
        monthly: baseMonthly,
        total: baseTotal,
        breakeven: calculateBreakeven(baseMonthly)
      },
      pessimistic: {
        monthly: pessimisticMonthly,
        total: pessimisticTotal,
        breakeven: calculateBreakeven(pessimisticMonthly)
      },
      optimistic: {
        monthly: optimisticMonthly,
        total: optimisticTotal,
        breakeven: calculateBreakeven(optimisticMonthly)
      }
    };
  }

  getChartTitle(chart) {
    switch (chart) {
      case 'cumulative':
        return 'Cumulative Costs';
      case 'monthly':
        return 'Monthly Costs';
      case 'savings':
        return 'Monthly Savings';
      default:
        return '';
    }
  }

  handleChartChange(chart) {
    this.activeChart = chart;
    this.updateChart();
  }

  updated(changedProperties) {
    if (changedProperties.has('results') || changedProperties.has('activeChart')) {
      this.updateChart();
    }
    if (this.showFormulas) {
      // Clear all existing formula containers first
      this.querySelectorAll('.formula-container').forEach(container => {
        container.innerHTML = '';
        container.removeAttribute('data-rendered');
      });
      
      // Then render them again
      setTimeout(() => {
        this.querySelectorAll('.formula-container').forEach(container => {
          if (!container.hasAttribute('data-rendered')) {
            this.renderLatex({ target: container });
          }
        });
      }, 0);
    }
  }

  updateChart() {
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    const ctx = this.renderRoot.querySelector('#analysisChart');
    if (!ctx) return;

    const { baseline, solution, data, breakeven } = this.results;
    let chartConfig;

    switch (this.activeChart) {
      case 'monthly':
        chartConfig = {
          type: 'bar',
          data: {
            labels: data.map(d => `Month ${d.month}`),
            datasets: [
              {
                label: 'Baseline Cost',
                data: data.map(d => baseline.monthly),
                backgroundColor: 'rgba(79, 70, 229, 0.8)',
                borderRadius: 4
              },
              {
                label: 'Solution Cost',
                data: data.map(d => solution.monthly),
                backgroundColor: 'rgba(16, 185, 129, 0.8)',
                borderRadius: 4
              }
            ]
          },
          options: this.getChartOptions()
        };
        break;

      case 'savings':
        chartConfig = {
          type: 'line',
          data: {
            labels: data.map(d => `Month ${d.month}`),
            datasets: [
              {
                label: 'Monthly Savings',
                data: data.map(d => d.savings),
                borderColor: d => d.savings >= 0 ? 'rgba(16, 185, 129, 1)' : 'rgba(239, 68, 68, 1)',
                backgroundColor: d => d.savings >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                fill: true,
                tension: 0.4
              }
            ]
          },
          options: this.getChartOptions()
        };
        break;

      default: // cumulative
        const annotations = {};
        
        // Only add break-even annotation if it exists
        if (breakeven !== null && breakeven !== undefined) {
          annotations.breakeven = {
            type: 'line',
            xMin: breakeven,
            xMax: breakeven,
            borderColor: 'rgba(245, 158, 11, 0.5)',
            borderWidth: 2,
            borderDash: [6, 6],
            label: {
              content: 'Break-even Point',
              enabled: true,
              position: 'top'
            }
          };
        }

        chartConfig = {
          type: 'line',
          data: {
            labels: data.map(d => `Month ${d.month}`),
            datasets: [
              {
                label: 'Baseline Cumulative',
                data: data.map(d => d.baseline),
                borderColor: 'rgba(79, 70, 229, 1)',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                fill: true,
                tension: 0.4
              },
              {
                label: 'Solution Cumulative',
                data: data.map(d => d.solution),
                borderColor: 'rgba(16, 185, 129, 1)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4
              }
            ]
          },
          options: {
            ...this.getChartOptions(),
            plugins: {
              ...this.getChartOptions().plugins,
              annotation: {
                annotations
              }
            }
          }
        };
    }

    this.chartInstance = new Chart(ctx, chartConfig);
  }

  getChartOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 20
          }
        },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          titleColor: '#1F2937',
          bodyColor: '#1F2937',
          borderColor: '#E5E7EB',
          borderWidth: 1,
          padding: 12,
          boxPadding: 6,
          usePointStyle: true,
          callbacks: {
            label: (context) => {
              const value = context.raw;
              return value.toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0
              });
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            callback: (value) => {
              return value.toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0
              });
            }
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    };
  }

  async exportPDF() {
    try {
      // Get both calculator form and results content
      const calculatorForm = document.querySelector('calculator-form');
      const resultsContent = this.querySelector('.bg-white.rounded-xl.shadow-lg');
      if (!calculatorForm || !resultsContent) {
        throw new Error('Could not find content to export');
      }

      // Create PDF with A4 dimensions
      const pdf = new jsPDF('p', 'pt', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 40;
      let yOffset = margin;

      // Add title
      pdf.setFontSize(16);
      pdf.setTextColor(0);
      const title = 'Service Delivery Cost Analysis Report';
      const titleWidth = pdf.getStringUnitWidth(title) * 16 / pdf.internal.scaleFactor;
      const titleX = (pageWidth - titleWidth) / 2;
      pdf.text(title, titleX, yOffset);

      // Add timestamp
      yOffset += 25;
      pdf.setFontSize(10);
      pdf.setTextColor(100);
      const date = new Date().toLocaleString();
      const dateWidth = pdf.getStringUnitWidth(date) * 10 / pdf.internal.scaleFactor;
      const dateX = (pageWidth - dateWidth) / 2;
      pdf.text(date, dateX, yOffset);
      yOffset += 40;

      // Convert calculator form to canvas
      const formCanvas = await html2canvas(calculatorForm, {
        scale: 2,
        logging: false,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true
      });

      // Calculate dimensions for form
      const formWidth = pageWidth - (margin * 2);
      const formHeight = (formCanvas.height * formWidth) / formCanvas.width;

      // Add form image
      pdf.addImage(
        formCanvas.toDataURL('image/png'),
        'PNG',
        margin,
        yOffset,
        formWidth,
        formHeight
      );

      // Update yOffset and check if we need a new page
      yOffset += formHeight + 40;
      if (yOffset + 100 > pageHeight) {
        pdf.addPage();
        yOffset = margin;
      }

      // Convert results content to canvas
      const resultsCanvas = await html2canvas(resultsContent, {
        scale: 2,
        logging: false,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true
      });

      // Calculate dimensions for results
      const resultsWidth = pageWidth - (margin * 2);
      const resultsHeight = (resultsCanvas.height * resultsWidth) / resultsCanvas.width;

      // Add results image
      pdf.addImage(
        resultsCanvas.toDataURL('image/png'),
        'PNG',
        margin,
        yOffset,
        resultsWidth,
        resultsHeight
      );

      // Save the PDF
      pdf.save('cost-analysis-report.pdf');
    } catch (error) {
      console.error('PDF Export Error:', error);
      alert('There was an error generating the PDF. Please try again.');
    }
  }

  getSolutionName(solution) {
    switch (solution) {
      case 'platform':
        return 'Platform Automation';
      case 'outsource':
        return 'Outsourcing';
      case 'hybrid':
        return 'Hybrid Solution';
      default:
        return solution;
    }
  }

  renderInputValues(model, values) {
    if (model === 'team') {
      return `
        <div class="space-y-2">
          <div><span class="font-medium">Team Size:</span> ${values.teamSize} FTEs</div>
          <div><span class="font-medium">Hourly Rate:</span> $${values.hourlyRate}</div>
          <div><span class="font-medium">Service Efficiency:</span> ${(values.serviceEfficiency * 100).toFixed(0)}%</div>
          <div><span class="font-medium">Operational Overhead:</span> ${(values.operationalOverhead * 100).toFixed(0)}%</div>
        </div>
      `;
    } else {
      return `
        <div class="space-y-2">
          <div><span class="font-medium">Monthly Tickets:</span> ${values.monthlyTickets}</div>
          <div><span class="font-medium">Hours per Ticket:</span> ${values.hoursPerTicket}</div>
          <div><span class="font-medium">People per Ticket:</span> ${values.peoplePerTicket}</div>
          <div><span class="font-medium">Hourly Rate:</span> $${values.hourlyRate}</div>
        </div>
      `;
    }
  }

  renderSolutionValues(solution, values) {
    switch (solution) {
      case 'platform':
        return `
          <div class="space-y-2">
            <div><span class="font-medium">Platform Investment:</span> ${this.formatCurrency(values.platformCost)}</div>
            <div><span class="font-medium">Monthly Maintenance:</span> ${this.formatCurrency(values.platformMaintenance)}</div>
            <div><span class="font-medium">Team Reduction:</span> ${(values.teamReduction * 100).toFixed(0)}%</div>
            <div><span class="font-medium">Process Efficiency:</span> ${(values.processEfficiency * 100).toFixed(0)}%</div>
          </div>
        `;
      case 'outsource':
        return `
          <div class="space-y-2">
            <div><span class="font-medium">Vendor Rate:</span> $${values.vendorRate}/hour</div>
            <div><span class="font-medium">Management Overhead:</span> ${(values.managementOverhead * 100).toFixed(0)}%</div>
            <div><span class="font-medium">Quality Impact:</span> ${(values.qualityImpact * 100).toFixed(0)}%</div>
            <div><span class="font-medium">Knowledge Loss:</span> ${(values.knowledgeLoss * 100).toFixed(0)}%</div>
            <div><span class="font-medium">Transition Time:</span> ${values.transitionTime} months</div>
            <div><span class="font-medium">Transition Cost:</span> ${this.formatCurrency(values.transitionCost)}</div>
          </div>
        `;
      case 'hybrid':
        return `
          <div class="space-y-2">
            <div><span class="font-medium">Platform Investment:</span> ${this.formatCurrency(values.platformCost)}</div>
            <div><span class="font-medium">Monthly Maintenance:</span> ${this.formatCurrency(values.platformMaintenance)}</div>
            <div><span class="font-medium">Process Efficiency:</span> ${(values.processEfficiency * 100).toFixed(0)}%</div>
            <div><span class="font-medium">Vendor Rate:</span> $${values.vendorRate}/hour</div>
            <div><span class="font-medium">Management Overhead:</span> ${(values.managementOverhead * 100).toFixed(0)}%</div>
            <div><span class="font-medium">Platform/Vendor Split:</span> ${(values.workSplit * 100).toFixed(0)}%/${(100 - values.workSplit * 100).toFixed(0)}%</div>
          </div>
        `;
      default:
        return '';
    }
  }

  formatCurrency(value) {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    });
  }

  exportExcel() {
    const { baseline, solution, data } = this.results;
    const sensitivityResults = this.calculateSensitivity();
    
    // Prepare the workbook with multiple sheets
    const wb = XLSX.utils.book_new();
    
    // Summary sheet
    const summaryData = [
      ['Summary', ''],
      ['Monthly Savings', baseline.monthly - solution.monthly],
      ['Break-even Period', this.results.breakeven || 'Never'],
      ['Initial Investment', solution.initial],
      ['', ''],
      ['Cost Comparison', ''],
      ['Category', 'Baseline', 'Solution', 'Difference'],
      ['Monthly Total', baseline.monthly, solution.monthly, baseline.monthly - solution.monthly],
      ['Initial Cost', baseline.initial, solution.initial, baseline.initial - solution.initial],
      ['2-Year Total', baseline.monthly * 24, (solution.monthly * 24) + solution.initial, 
        (baseline.monthly * 24) - ((solution.monthly * 24) + solution.initial)],
    ];
    
    // Monthly data sheet
    const monthlyData = data.map(d => ([
      d.month,
      d.baseline,
      d.solution,
      d.savings
    ]));
    monthlyData.unshift(['Month', 'Baseline Cumulative', 'Solution Cumulative', 'Savings']);
    
    // Sensitivity analysis sheet
    const sensitivityData = [
      ['Scenario', 'Monthly Savings', '2-Year Total Savings', 'Break-even (months)'],
      ['Pessimistic', sensitivityResults.pessimistic.monthly, sensitivityResults.pessimistic.total, 
        sensitivityResults.pessimistic.breakeven || 'Never'],
      ['Base Case', sensitivityResults.base.monthly, sensitivityResults.base.total, 
        sensitivityResults.base.breakeven || 'Never'],
      ['Optimistic', sensitivityResults.optimistic.monthly, sensitivityResults.optimistic.total, 
        sensitivityResults.optimistic.breakeven || 'Never'],
    ];
    
    // Add sheets to workbook
    wb.SheetNames.push('Summary');
    wb.Sheets['Summary'] = XLSX.utils.aoa_to_sheet(summaryData);
    
    wb.SheetNames.push('Monthly Data');
    wb.Sheets['Monthly Data'] = XLSX.utils.aoa_to_sheet(monthlyData);
    
    wb.SheetNames.push('Sensitivity Analysis');
    wb.Sheets['Sensitivity Analysis'] = XLSX.utils.aoa_to_sheet(sensitivityData);
    
    // Save the file
    XLSX.writeFile(wb, 'cost-analysis-data.xlsx');
  }

  toggleFormulas() {
    this.showFormulas = !this.showFormulas;
    if (this.showFormulas) {
      // Clear all existing formula containers first
      this.querySelectorAll('.formula-container').forEach(container => {
        container.innerHTML = '';
        container.removeAttribute('data-rendered');
      });
      
      setTimeout(() => {
        this.querySelectorAll('.formula-container').forEach(container => {
          if (!container.hasAttribute('data-rendered')) {
            this.renderLatex({ target: container });
          }
        });
      }, 0);
    }
  }

  renderLatex(e) {
    const container = e.target;
    if (!container.formula || container.hasAttribute('data-rendered')) return;
    
    try {
      // Clear any existing content first
      container.innerHTML = '';
      // Remove any existing katex-rendered spans
      const existingKatex = container.querySelectorAll('.katex, .katex-html');
      existingKatex.forEach(el => el.remove());
      
      katex.render(container.formula, container, {
        throwOnError: false,
        displayMode: container.classList.contains('display-mode'),
        output: 'html' // Force HTML output to prevent showing unrendered formula
      });
      container.setAttribute('data-rendered', 'true');
    } catch (error) {
      console.error('LaTeX rendering error:', error);
      container.textContent = container.formula;
    }
  }

  renderModelFormulas() {
    // Get current model and solution from the form
    const form = document.querySelector('calculator-form');
    const currentModel = form ? form.model : 'team';
    const currentSolution = form ? form.solution : 'platform';

    return html`
      <div class="mt-4 space-y-4">
        <!-- Current Model -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <h4 class="text-lg font-semibold text-gray-900 mb-3">
            ${currentModel === 'team' ? 'Team-Based Model' : 'Ticket-Based Model'} with 
            ${currentSolution.charAt(0).toUpperCase() + currentSolution.slice(1)} Solution
          </h4>
          
          <!-- Base Cost -->
          <div class="mb-4">
            <div class="formula-container display-mode" .formula=${currentModel === 'team' ? 
              "C_b = n \\cdot h \\cdot w \\cdot \\eta_s \\cdot (1 + \\eta_o)" :
              "C_t = m \\cdot t_h \\cdot p \\cdot h"
            }></div>
            <p class="text-sm text-gray-600 mt-2">
              <span class="font-medium">Variables:</span> ${currentModel === 'team' ? 
                'n = team size, h = hourly rate, w = working hours, η_s = service efficiency, η_o = overhead' :
                'm = monthly tickets, t_h = hours per ticket, p = people per ticket, h = hourly rate'
              }
            </p>
          </div>

          <!-- Solution Cost -->
          <div class="mb-4">
            <div class="formula-container display-mode" .formula=${
              currentSolution === 'platform' ? 
                "C_p = " + (currentModel === 'team' ? "C_b" : "C_t") + " \\cdot (1 - \\alpha_t) \\cdot (1 - \\alpha_p) + P_m" :
              currentSolution === 'outsource' ? 
                "C_o = v \\cdot w \\cdot " + (currentModel === 'team' ? "n" : "m \\cdot t_h \\cdot p") + " \\cdot (1 + \\beta_m) \\cdot (1 \\pm \\beta_q) \\cdot (1 + \\beta_k)" :
                "C_h = \\gamma_p \\cdot C_p + (1-\\gamma_p) \\cdot C_o"
            }></div>
            <p class="text-sm text-gray-600 mt-2">
              <span class="font-medium">Variables:</span> ${
              currentSolution === 'platform' ? 
                'α_t = team reduction, α_p = process efficiency, P_m = monthly maintenance' :
              currentSolution === 'outsource' ? 
                'v = vendor rate, β_m = management overhead, β_q = quality impact, β_k = knowledge loss' :
                'γ_p = platform portion, C_p = platform cost, C_o = outsource cost'
            }</p>
          </div>

          <!-- Cost Structure -->
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h5 class="font-medium text-gray-700 mb-1">Cost Components:</h5>
              <ul class="list-disc pl-4 text-gray-600 space-y-1">
                ${this.renderCostComponents(currentModel, currentSolution)}
              </ul>
            </div>
            <div>
              <h5 class="font-medium text-gray-700 mb-1">Key Metrics:</h5>
              <ul class="list-disc pl-4 text-gray-600 space-y-1">
                ${this.renderKeyMetrics(currentModel, currentSolution)}
              </ul>
            </div>
          </div>
        </div>

        <!-- Break-even Analysis -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <h4 class="text-lg font-semibold text-gray-900 mb-2">Financial Analysis</h4>
          <div class="formula-container display-mode" .formula="NPV = -I_0 + \\sum_{t=1}^{\\Delta t} \\frac{(C_b - C_s)_t}{(1 + r)^t}"></div>
          <div class="text-sm text-gray-600 space-y-2 mt-2">
            <p><span class="font-medium">Variables:</span> I₀ = initial investment, C_b = baseline cost, C_s = solution cost, r = discount rate, Δt = analysis period</p>
            <p><span class="font-medium">Break-even point:</span> Time when NPV = 0</p>
          </div>
        </div>
      </div>
    `;
  }

  renderCostComponents(model, solution) {
    const baseComponents = model === 'team' ? [
      'Direct labor costs',
      'Service efficiency impact',
      'Operational overhead'
    ] : [
      'Ticket volume costs',
      'Resource allocation',
      'Handling time impact'
    ];

    const solutionComponents = {
      platform: [
        'Platform investment',
        'Maintenance costs',
        'Reduced team costs'
      ],
      outsource: [
        'Vendor rates',
        'Management overhead',
        'Quality adjustments',
        'Knowledge impact'
      ],
      hybrid: [
        'Platform portion',
        'Vendor portion',
        'Combined overhead'
      ]
    };

    return html`
      ${baseComponents.map(comp => html`<li>${comp}</li>`)}
      ${solutionComponents[solution].map(comp => html`<li>${comp}</li>`)}
    `;
  }

  renderKeyMetrics(model, solution) {
    const baseMetrics = model === 'team' ? [
      'Team utilization',
      'Service efficiency',
      'Cost per FTE'
    ] : [
      'Ticket resolution rate',
      'Average handling time',
      'Cost per ticket'
    ];

    const solutionMetrics = {
      platform: [
        'Automation rate',
        'Process efficiency',
        'Platform ROI'
      ],
      outsource: [
        'Vendor performance',
        'Quality metrics',
        'Knowledge retention'
      ],
      hybrid: [
        'Work distribution',
        'Combined efficiency',
        'Blended costs'
      ]
    };

    return html`
      ${baseMetrics.map(metric => html`<li>${metric}</li>`)}
      ${solutionMetrics[solution].map(metric => html`<li>${metric}</li>`)}
    `;
  }
}

customElements.define('calculation-results', CalculationResults); 