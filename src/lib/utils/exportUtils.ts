import type { CalculationResults, TeamInputs, TicketInputs, SolutionInputs } from '$lib/types/calculator';
import pkg from 'file-saver';
const { saveAs } = pkg;
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface ExportData {
  results: CalculationResults;
  baseInputs: TeamInputs | TicketInputs;
  solutionInputs: SolutionInputs;
}

export async function exportToExcel(data: ExportData) {
  const { results, baseInputs, solutionInputs } = data;

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summaryData = [
    ['Service Delivery Cost Analysis'],
    [''],
    ['Summary'],
    ['Model Type', results.model === 'team' ? 'Team-based' : 'Ticket-based'],
    ['Solution Type', capitalize(results.solution)],
    [''],
    ['Key Metrics'],
    ['Current Monthly Cost', formatCurrency(results.totalCost)],
    ['Cost per Ticket', formatCurrency(results.costPerTicket)],
    ['Annual Cost', formatCurrency(results.annualCost)],
    ['Monthly Savings', formatCurrency(results.monthlySavings)],
    ['Break-even Months', results.breakEvenMonths || 'N/A'],
    ['Efficiency', `${results.efficiency}%`],
    ['Recommended Team Size', results.recommendedTeamSize],
    ['Solution Viability', results.isViable ? 'Viable' : 'Not Viable']
  ];

  // Base inputs sheet data
  const baseInputsData = [
    ['Base Inputs'],
    [''],
    ...Object.entries(baseInputs).map(([key, value]) => [
      formatKey(key),
      typeof value === 'number' && key.toLowerCase().includes('cost') ? 
        formatCurrency(value) : 
        typeof value === 'number' && key.toLowerCase().includes('percent') ?
          `${value}%` :
          value
    ])
  ];

  // Solution inputs sheet data
  const solutionInputsData = [
    ['Solution Inputs'],
    [''],
    ['Solution Type', capitalize(solutionInputs.type)],
    [''],
    ...getSolutionInputsRows(solutionInputs)
  ];

  // Monthly data sheet
  const monthlyData = [
    ['Monthly Analysis'],
    [''],
    ['Month', 'Baseline Cost', 'Solution Cost', 'Monthly Savings', 'Cumulative Savings'],
    ...results.monthlyData.map(row => [
      row.month,
      formatCurrency(row.baseline),
      formatCurrency(row.solution),
      formatCurrency(row.savings),
      formatCurrency((row as any).cumulative_savings)
    ])
  ];

  // Add sheets to workbook
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), 'Summary');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(baseInputsData), 'Base Inputs');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(solutionInputsData), 'Solution Inputs');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(monthlyData), 'Monthly Analysis');

  // Generate Excel file
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, 'service-delivery-analysis.xlsx');
}

export async function exportToPDF(data: ExportData) {
  const { results, baseInputs, solutionInputs } = data;
  const doc = new jsPDF();

  // Title
  doc.setFontSize(20);
  doc.text('Service Delivery Cost Analysis', 20, 20);

  // Summary section
  doc.setFontSize(16);
  doc.text('Summary', 20, 40);
  doc.setFontSize(12);

  const summaryData = [
    ['Model Type', results.model === 'team' ? 'Team-based' : 'Ticket-based'],
    ['Solution Type', capitalize(results.solution)],
    ['Current Monthly Cost', formatCurrency(results.totalCost)],
    ['Cost per Ticket', formatCurrency(results.costPerTicket)],
    ['Annual Cost', formatCurrency(results.annualCost)],
    ['Monthly Savings', formatCurrency(results.monthlySavings)],
    ['Break-even Months', results.breakEvenMonths?.toString() || 'N/A'],
    ['Efficiency', `${results.efficiency}%`],
    ['Recommended Team Size', results.recommendedTeamSize.toString()],
    ['Solution Viability', results.isViable ? 'Viable' : 'Not Viable']
  ];

  (doc as any).autoTable({
    startY: 45,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'striped',
    headStyles: { fillColor: [63, 131, 248] }
  });

  // Base Inputs section
  doc.addPage();
  doc.setFontSize(16);
  doc.text('Base Inputs', 20, 20);
  doc.setFontSize(12);

  const baseInputsRows = Object.entries(baseInputs).map(([key, value]) => [
    formatKey(key),
    typeof value === 'number' && key.toLowerCase().includes('cost') ? 
      formatCurrency(value) : 
      typeof value === 'number' && key.toLowerCase().includes('percent') ?
        `${value}%` :
        value.toString()
  ]);

  (doc as any).autoTable({
    startY: 25,
    head: [['Parameter', 'Value']],
    body: baseInputsRows,
    theme: 'striped',
    headStyles: { fillColor: [63, 131, 248] }
  });

  // Solution Inputs section
  doc.addPage();
  doc.setFontSize(16);
  doc.text('Solution Inputs', 20, 20);
  doc.setFontSize(12);

  const solutionInputsRows = getSolutionInputsRows(solutionInputs);

  (doc as any).autoTable({
    startY: 25,
    head: [['Parameter', 'Value']],
    body: solutionInputsRows,
    theme: 'striped',
    headStyles: { fillColor: [63, 131, 248] }
  });

  // Monthly Analysis section
  doc.addPage();
  doc.setFontSize(16);
  doc.text('Monthly Analysis', 20, 20);
  doc.setFontSize(12);

  const monthlyRows = results.monthlyData.map(row => [
    row.month.toString(),
    formatCurrency(row.baseline),
    formatCurrency(row.solution),
    formatCurrency(row.savings),
    formatCurrency((row as any).cumulative_savings)
  ]);

  (doc as any).autoTable({
    startY: 25,
    head: [['Month', 'Baseline Cost', 'Solution Cost', 'Monthly Savings', 'Cumulative Savings']],
    body: monthlyRows,
    theme: 'striped',
    headStyles: { fillColor: [63, 131, 248] }
  });

  // Save the PDF
  doc.save('service-delivery-analysis.pdf');
}

// Helper functions
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatKey(key: string): string {
  return key
    .split(/(?=[A-Z])/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getSolutionInputsRows(solutionInputs: SolutionInputs): [string, string][] {
  const rows: [string, string][] = [];
  
  switch (solutionInputs.type) {
    case 'platform':
      if (solutionInputs.platform) {
        Object.entries(solutionInputs.platform).forEach(([key, value]) => {
          rows.push([
            formatKey(key),
            typeof value === 'number' && key.toLowerCase().includes('cost') ? 
              formatCurrency(value) : 
              typeof value === 'number' && (
                key.toLowerCase().includes('percent') ||
                key.toLowerCase().includes('efficiency') ||
                key.toLowerCase().includes('reduction')
              ) ?
                `${value}%` :
                value.toString()
          ]);
        });
      }
      break;
    case 'outsource':
      if (solutionInputs.outsource) {
        Object.entries(solutionInputs.outsource).forEach(([key, value]) => {
          rows.push([
            formatKey(key),
            typeof value === 'number' && key.toLowerCase().includes('cost') ? 
              formatCurrency(value) : 
              typeof value === 'number' && (
                key.toLowerCase().includes('percent') ||
                key.toLowerCase().includes('overhead') ||
                key.toLowerCase().includes('impact') ||
                key.toLowerCase().includes('loss')
              ) ?
                `${value}%` :
                value.toString()
          ]);
        });
      }
      break;
    case 'hybrid':
      if (solutionInputs.hybrid) {
        rows.push(['Distribution', '']);
        rows.push(['Platform Portion', `${solutionInputs.hybrid.platformPortion}%`]);
        rows.push(['Vendor Portion', `${solutionInputs.hybrid.vendorPortion}%`]);
        rows.push(['Internal Portion', `${100 - solutionInputs.hybrid.platformPortion - solutionInputs.hybrid.vendorPortion}%`]);
        rows.push(['', '']);
        rows.push(['Platform Parameters', '']);
        Object.entries({
          platformCost: solutionInputs.hybrid.platformCost,
          platformMaintenance: solutionInputs.hybrid.platformMaintenance,
          timeToBuild: solutionInputs.hybrid.timeToBuild,
          teamReduction: solutionInputs.hybrid.teamReduction,
          processEfficiency: solutionInputs.hybrid.processEfficiency
        }).forEach(([key, value]) => {
          rows.push([
            formatKey(key),
            typeof value === 'number' && key.toLowerCase().includes('cost') ? 
              formatCurrency(value) : 
              typeof value === 'number' && (
                key.toLowerCase().includes('percent') ||
                key.toLowerCase().includes('efficiency') ||
                key.toLowerCase().includes('reduction')
              ) ?
                `${value}%` :
                value.toString()
          ]);
        });
        rows.push(['', '']);
        rows.push(['Outsourcing Parameters', '']);
        Object.entries({
          vendorRate: solutionInputs.hybrid.vendorRate,
          managementOverhead: solutionInputs.hybrid.managementOverhead,
          qualityImpact: solutionInputs.hybrid.qualityImpact,
          knowledgeLoss: solutionInputs.hybrid.knowledgeLoss,
          transitionTime: solutionInputs.hybrid.transitionTime,
          transitionCost: solutionInputs.hybrid.transitionCost
        }).forEach(([key, value]) => {
          rows.push([
            formatKey(key),
            typeof value === 'number' && key.toLowerCase().includes('cost') ? 
              formatCurrency(value) : 
              typeof value === 'number' && (
                key.toLowerCase().includes('percent') ||
                key.toLowerCase().includes('overhead') ||
                key.toLowerCase().includes('impact') ||
                key.toLowerCase().includes('loss')
              ) ?
                `${value}%` :
                value.toString()
          ]);
        });
      }
      break;
  }

  return rows;
} 