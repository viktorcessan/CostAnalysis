import type { BuildBuyResults } from '$lib/types/calculator';

interface ShareableFormState {
  // Section 1: Define your Need
  solutionType: string;
  
  // Section 2: Business Impact & Timeline
  businessRole: string;
  timelineNeeded: string;
  usageDuration: string;
  
  // Section 3: Market Maturity
  alternativeSolutions: string;
  marketEvolution: string;
  marketStandardization: string;
  alternativeTypes: string[];
  
  // Section 4: Build Capability
  controlNeeded: string;
  inHouseCompetency: string;
  
  // Section 5: Costs Analysis
  buildFTEs: number;
  buildHourlyRate: number;
  buildCost: number;
  buyCost: number;
  userCount: number;
  costPerUser: number;
  buyCustomizationCost: number;
  buyMaintenanceCost: number;
  implementationTime: string;
  
  // Section 6: Strategic Assessment
  strategicAlignment: string;
  buildRisks: string[];
  buyRisks: string[];
}

export function generateShareLink(results: BuildBuyResults): string {
  const searchParams = new URLSearchParams();
  
  // Only include the essential form state fields
  const shareableState: ShareableFormState = {
    solutionType: results.formState.solutionType,
    businessRole: results.formState.businessRole,
    timelineNeeded: results.formState.timelineNeeded,
    usageDuration: results.formState.usageDuration,
    alternativeSolutions: results.formState.alternativeSolutions,
    marketEvolution: results.formState.marketEvolution,
    marketStandardization: results.formState.marketStandardization,
    alternativeTypes: results.formState.alternativeTypes,
    controlNeeded: results.formState.controlNeeded,
    inHouseCompetency: results.formState.inHouseCompetency,
    buildFTEs: results.formState.buildFTEs,
    buildHourlyRate: results.formState.buildHourlyRate,
    buildCost: results.formState.buildCost,
    buyCost: results.formState.buyCost,
    userCount: results.formState.userCount,
    costPerUser: results.formState.costPerUser,
    buyCustomizationCost: results.formState.buyCustomizationCost,
    buyMaintenanceCost: results.formState.buyMaintenanceCost,
    implementationTime: results.formState.implementationTime,
    strategicAlignment: results.formState.strategicAlignment,
    buildRisks: results.formState.buildRisks,
    buyRisks: results.formState.buyRisks
  };
  
  // Compress and encode the state
  const compressedState = btoa(JSON.stringify(shareableState));
  searchParams.set('state', compressedState);
  
  return searchParams.toString();
}

export function parseShareLink(searchParams: URLSearchParams): BuildBuyResults | null {
  try {
    // Get and decode the compressed state
    const compressedState = searchParams.get('state');
    if (!compressedState) return null;
    
    const shareableState = JSON.parse(atob(compressedState)) as ShareableFormState;
    
    // Create a complete form state with the shared data
    const formState = {
      ...shareableState,
      // Add any missing fields with default values
      timelineIndex: 0,
      usageDurationIndex: 0,
      solutionsCount: 4,
      landscapeEvolution: '',
      teamCapability: '',
      capabilityBuildMonths: 0,
      competencyAcquisitionTime: '',
      strategicValue: '',
      alternativeFitness: '',
      hasMaintenanceTeam: false,
      maintenanceTeamSize: 0
    };
    
    // Return a minimal BuildBuyResults object that will be used to populate the form
    return {
      formState,
      scores: {
        build: {
          businessCriticality: 0,
          timeToImplement: 0,
          cost: 0,
          control: 0,
          competency: 0,
          marketFit: 0
        },
        buy: {
          businessCriticality: 0,
          timeToImplement: 0,
          cost: 0,
          control: 0,
          competency: 0,
          marketFit: 0
        }
      },
      riskMatrix: {
        buildRisks: [],
        buyRisks: []
      },
      recommendation: '',
      confidence: 0
    };
  } catch (error) {
    console.error('Error parsing share link:', error);
    return null;
  }
}

export function validateShareParams(results: BuildBuyResults): boolean {
  if (!results.formState) return false;
  
  // Validate essential form fields
  const requiredFields = [
    'solutionType',
    'businessRole',
    'timelineNeeded',
    'usageDuration',
    'alternativeSolutions',
    'marketEvolution',
    'marketStandardization',
    'controlNeeded',
    'inHouseCompetency',
    'buildFTEs',
    'buildHourlyRate',
    'buildCost',
    'buyCost'
  ] as const;
  
  for (const field of requiredFields) {
    if (!results.formState[field]) return false;
  }
  
  // Validate numeric fields
  const numericFields = [
    'buildFTEs',
    'buildHourlyRate',
    'buildCost',
    'buyCost',
    'userCount',
    'costPerUser',
    'buyCustomizationCost',
    'buyMaintenanceCost'
  ] as const;
  
  for (const field of numericFields) {
    if (typeof results.formState[field] !== 'number') return false;
  }
  
  // Validate arrays
  if (!Array.isArray(results.formState.alternativeTypes) ||
      !Array.isArray(results.formState.buildRisks) ||
      !Array.isArray(results.formState.buyRisks)) {
    return false;
  }
  
  return true;
} 