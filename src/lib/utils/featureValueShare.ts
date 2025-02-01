import type { FeatureValueResults } from '$lib/stores/featureValueTemplateStore';

export function generateShareLink(results: FeatureValueResults): string {
  const searchParams = new URLSearchParams();
  
  // Add project name
  searchParams.set('projectName', results.projectName);
  
  // Add selected impacts
  searchParams.set('impacts', JSON.stringify(results.selectedImpacts.map(impact => ({
    id: impact.id,
    impact: {
      name: impact.impact.name,
      description: impact.impact.description,
      category: impact.impact.category,
      formula: impact.impact.formula,
      formulaDescription: impact.impact.formulaDescription
    },
    inputValues: impact.inputValues,
    calculatedValue: impact.calculatedValue
  }))));
  
  // Add development costs
  searchParams.set('developmentCost', JSON.stringify(results.developmentCost));
  
  // Add maintenance costs
  searchParams.set('maintenanceCost', JSON.stringify(results.maintenanceCost));
  
  // Add calculated values
  searchParams.set('totalValue', results.totalValue.toString());
  searchParams.set('totalCost', results.totalCost.toString());
  searchParams.set('roi', results.roi.toString());
  searchParams.set('breakEvenMonths', results.breakEvenMonths.toString());
  searchParams.set('confidenceScore', results.confidenceScore.toString());
  
  return searchParams.toString();
}

export function parseShareLink(searchParams: URLSearchParams): FeatureValueResults | null {
  try {
    // Parse project name
    const projectName = searchParams.get('projectName');
    if (!projectName) return null;
    
    // Parse impacts
    const impactsStr = searchParams.get('impacts');
    if (!impactsStr) return null;
    const selectedImpacts = JSON.parse(impactsStr);
    
    // Parse costs
    const developmentCostStr = searchParams.get('developmentCost');
    const maintenanceCostStr = searchParams.get('maintenanceCost');
    if (!developmentCostStr || !maintenanceCostStr) return null;
    
    const developmentCost = JSON.parse(developmentCostStr);
    const maintenanceCost = JSON.parse(maintenanceCostStr);
    
    // Parse calculated values
    const totalValue = Number(searchParams.get('totalValue'));
    const totalCost = Number(searchParams.get('totalCost'));
    const roi = Number(searchParams.get('roi'));
    const breakEvenMonths = Number(searchParams.get('breakEvenMonths'));
    const confidenceScore = Number(searchParams.get('confidenceScore'));
    
    if (
      isNaN(totalValue) ||
      isNaN(totalCost) ||
      isNaN(roi) ||
      isNaN(breakEvenMonths) ||
      isNaN(confidenceScore)
    ) {
      return null;
    }
    
    return {
      projectName,
      selectedImpacts,
      developmentCost,
      maintenanceCost,
      totalValue,
      totalCost,
      roi,
      breakEvenMonths,
      confidenceScore
    };
  } catch (error) {
    console.error('Error parsing share link:', error);
    return null;
  }
}

export function validateShareParams(results: FeatureValueResults): boolean {
  if (!results.projectName) return false;
  
  // Validate impacts
  if (!Array.isArray(results.selectedImpacts) || results.selectedImpacts.length === 0) return false;
  
  // Validate development costs
  if (
    !results.developmentCost ||
    typeof results.developmentCost.hourlyRate !== 'number' ||
    typeof results.developmentCost.hours !== 'number'
  ) {
    return false;
  }
  
  // Validate maintenance costs
  if (!results.maintenanceCost || typeof results.maintenanceCost.monthly !== 'number') {
    return false;
  }
  
  // Validate calculated values
  if (
    typeof results.totalValue !== 'number' ||
    typeof results.totalCost !== 'number' ||
    typeof results.roi !== 'number' ||
    typeof results.breakEvenMonths !== 'number' ||
    typeof results.confidenceScore !== 'number'
  ) {
    return false;
  }
  
  return true;
} 