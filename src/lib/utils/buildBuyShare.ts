import type { BuildBuyResults } from '$lib/types/calculator';

interface ShareableFormState {
  // Section 1: Define your Need
  solutionType: string;
  
  // Section 2: Business Impact & Timeline
  businessRole: string;
  timelineIndex: number;
  timelineNeeded: string;
  usageDurationIndex: number;
  usageDuration: string;
  
  // Section 3: Market Maturity
  solutionsCount: number;
  alternativeSolutions: string;
  marketEvolution: string;
  landscapeEvolution: string;
  marketStandardization: string;
  alternativeTypes: string[];
  
  // Section 4: Build Capability
  teamCapability: string;
  controlNeeded: string;
  inHouseCompetency: string;
  capabilityBuildMonths: number;
  competencyAcquisitionTime: string;
  
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
  strategicValue: string;
  strategicAlignment: string;
  alternativeFitness: string;
  changeDifficulty: string;
  buildRisks: string[];
  buyRisks: string[];
  hasMaintenanceTeam: boolean;
  maintenanceTeamSize: number;

  // Section 7: Category Weights
  categoryWeights: {
    businessCriticality: number;
    timeToImplement: number;
    cost: number;
    control: number;
    competency: number;
    marketFit: number;
  };
}

export function generateShareLink(results: BuildBuyResults): string {
  const searchParams = new URLSearchParams();
  
  // Only include the essential form state fields
  const shareableState: ShareableFormState = {
    // Section 1: Define your Need
    solutionType: results.formState.solutionType,
    
    // Section 2: Business Impact & Timeline
    businessRole: results.formState.businessRole,
    timelineIndex: results.formState.timelineIndex,
    timelineNeeded: results.formState.timelineNeeded,
    usageDurationIndex: results.formState.usageDurationIndex,
    usageDuration: results.formState.usageDuration,
    
    // Section 3: Market Maturity
    solutionsCount: results.formState.solutionsCount,
    alternativeSolutions: results.formState.alternativeSolutions,
    marketEvolution: results.formState.marketEvolution,
    landscapeEvolution: results.formState.landscapeEvolution,
    marketStandardization: results.formState.marketStandardization,
    alternativeTypes: results.formState.alternativeTypes,
    
    // Section 4: Build Capability
    teamCapability: results.formState.teamCapability,
    controlNeeded: results.formState.controlNeeded,
    inHouseCompetency: results.formState.inHouseCompetency,
    capabilityBuildMonths: results.formState.capabilityBuildMonths,
    competencyAcquisitionTime: results.formState.competencyAcquisitionTime,
    
    // Section 5: Costs Analysis
    buildFTEs: results.formState.buildFTEs,
    buildHourlyRate: results.formState.buildHourlyRate,
    buildCost: results.formState.buildCost,
    buyCost: results.formState.buyCost,
    userCount: results.formState.userCount,
    costPerUser: results.formState.costPerUser,
    buyCustomizationCost: results.formState.buyCustomizationCost,
    buyMaintenanceCost: results.formState.buyMaintenanceCost,
    implementationTime: results.formState.implementationTime,
    
    // Section 6: Strategic Assessment
    strategicValue: results.formState.strategicValue,
    strategicAlignment: results.formState.strategicAlignment,
    alternativeFitness: results.formState.alternativeFitness,
    changeDifficulty: results.formState.changeDifficulty,
    buildRisks: results.formState.buildRisks,
    buyRisks: results.formState.buyRisks,
    hasMaintenanceTeam: results.formState.hasMaintenanceTeam,
    maintenanceTeamSize: results.formState.maintenanceTeamSize,

    // Section 7: Category Weights
    categoryWeights: results.formState.categoryWeights
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
      landscapeEvolution: shareableState.landscapeEvolution || '',
      teamCapability: shareableState.teamCapability || '',
      strategicValue: shareableState.strategicValue || '',
      categoryWeights: shareableState.categoryWeights || {
        businessCriticality: 3,
        timeToImplement: 3,
        cost: 3,
        control: 3,
        competency: 3,
        marketFit: 3
      }
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
    'buyCost',
    'categoryWeights'
  ] as const;
  
  for (const field of requiredFields) {
    if (!results.formState[field]) return false;
  }
  
  // Validate numeric fields
  const numericFields = [
    'timelineIndex',
    'usageDurationIndex',
    'solutionsCount',
    'capabilityBuildMonths',
    'buildFTEs',
    'buildHourlyRate',
    'buildCost',
    'buyCost',
    'userCount',
    'costPerUser',
    'buyCustomizationCost',
    'buyMaintenanceCost',
    'maintenanceTeamSize'
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
  
  // Validate category weights
  const requiredWeights = [
    'businessCriticality',
    'timeToImplement',
    'cost',
    'control',
    'competency',
    'marketFit'
  ] as const;
  
  for (const weight of requiredWeights) {
    if (typeof results.formState.categoryWeights[weight] !== 'number') return false;
  }
  
  return true;
} 