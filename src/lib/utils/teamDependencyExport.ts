import type { Team, DependencyMatrix } from '$lib/types/teamDependency';
import { exportToExcel } from './exportUtils';
import { toPng } from 'html-to-image/es';
import { Chart } from 'chart.js/auto';

interface TeamDependencyExportData {
  teams: Team[];
  dependencyMatrix: DependencyMatrix;
  metrics: {
    flowEfficiency: number;
    utilizationRate: number;
    serviceEfficiency: number;
  };
  costs: {
    weeklyMeetingCost: number;
    communicationCost: number;
    processOverhead: number;
    totalCost: number;
  };
}

export async function exportTeamDependencyToExcel(data: TeamDependencyExportData) {
  const exportData = {
    results: {
      model: 'team' as const,
      solution: 'platform' as const,
      totalCost: data.costs.totalCost * 4,
      annualCost: data.costs.totalCost * 52,
      monthlySavings: 0,
      breakEvenMonths: 0,
      monthlyData: [{
        month: 1,
        baseline: data.costs.totalCost * 4,
        solution: data.costs.totalCost * 4,
        savings: 0
      }],
      costPerTicket: 0,
      efficiency: data.metrics.flowEfficiency,
      recommendedTeamSize: data.teams.length,
      isViable: true,
      teams: data.teams,
      dependencies: data.dependencyMatrix,
      metrics: {
        weeklyMeetingCost: data.costs.weeklyMeetingCost,
        communicationCost: data.costs.communicationCost,
        processOverhead: data.costs.processOverhead,
        totalWeeklyCost: data.costs.totalCost,
        flowEfficiency: data.metrics.flowEfficiency,
        utilizationRate: data.metrics.utilizationRate,
        serviceEfficiency: data.metrics.serviceEfficiency
      }
    },
    baseInputs: {
      teamSize: data.teams.length,
      hourlyRate: 75,
      serviceEfficiency: data.metrics.serviceEfficiency,
      operationalOverhead: 1.2
    },
    solutionInputs: {
      type: 'platform' as const,
      platform: {
        platformCost: 0,
        platformMaintenance: 0,
        timeToBuild: 0,
        teamReduction: 0,
        processEfficiency: data.metrics.flowEfficiency,
        baselineCost: data.costs.totalCost * 4
      }
    }
  };
  
  await exportToExcel(exportData);
}

export async function exportTeamDependencyToPNG() {
  try {
    const element = document.querySelector('#team-dependencies-container');
    if (!element || !(element instanceof HTMLElement)) {
      throw new Error('Could not find main content container');
    }

    // Create a temporary container for the snapshot
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.style.background = '#ffffff';
    document.body.appendChild(tempContainer);

    // Clone the element
    const clone = element.cloneNode(true) as HTMLElement;
    tempContainer.appendChild(clone);

    // Remove unwanted sections
    const sectionsToRemove = [
      '.bg-white.rounded-xl.p-6.border.border-gray-200', // Export section
      '.bg-gradient-to-br', // Expert guidance section
    ];
    sectionsToRemove.forEach(selector => {
      const section = clone.querySelector(selector);
      if (section) {
        section.remove();
      }
    });

    // Find the cost analysis section
    const costAnalysisSection = clone.querySelector('.cost-analysis-section');
    if (costAnalysisSection) {
      // Find the original canvas
      const originalCanvas = document.querySelector('.cost-analysis-section canvas');
      if (originalCanvas instanceof HTMLCanvasElement) {
        // Find the canvas in the clone
        const clonedChartContainer = costAnalysisSection.querySelector('canvas')?.parentElement?.parentElement;
        if (clonedChartContainer instanceof HTMLElement) {
          // Adjust container spacing
          clonedChartContainer.style.marginRight = '1rem';
          clonedChartContainer.style.marginLeft = '0';
          clonedChartContainer.style.width = '90%';
          
          // Create a new canvas with the same dimensions
          const newCanvas = document.createElement('canvas');
          newCanvas.width = originalCanvas.width;
          newCanvas.height = originalCanvas.height;
          newCanvas.style.marginLeft = '-4rem'; // Increased negative margin to move further left
          
          // Copy the content from the original canvas
          const ctx = newCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(originalCanvas, 0, 0);
          }
          
          // Replace the old canvas and ensure it's left-aligned
          const canvasContainer = clonedChartContainer.querySelector('canvas')?.parentElement;
          if (canvasContainer instanceof HTMLElement) {
            canvasContainer.innerHTML = '';
            canvasContainer.style.display = 'flex';
            canvasContainer.style.justifyContent = 'flex-start';
            canvasContainer.appendChild(newCanvas);
          }
        }
      }
    }

    // Set explicit dimensions
    clone.style.width = '1000px';
    clone.style.height = 'auto';
    clone.style.position = 'relative';
    clone.style.transform = 'none';
    clone.style.background = '#ffffff';
    clone.style.margin = '0';
    clone.style.padding = '24px';
    clone.style.maxWidth = 'none';

    // Create canvas with optimal settings
    const canvas = await toPng(clone, {
      quality: 1.0,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      width: 1000,
      height: clone.scrollHeight,
      style: {
        transform: 'none'
      },
      filter: (node: HTMLElement) => {
        // Filter out unwanted elements
        const exclusionClasses = ['scrollbar', 'scroll', 'modal'];
        return !exclusionClasses.some(className => 
          node.classList?.contains(className)
        );
      }
    });

    // Clean up
    document.body.removeChild(tempContainer);

    // Download the image
    const link = document.createElement('a');
    link.download = `team-dependencies-analysis-${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas;
    link.click();
  } catch (error) {
    console.error('PNG Export Error:', error);
    alert('There was an error generating the PNG. Please try again.');
  }
} 