import type { CalculatorModel, TeamInputs, TicketInputs, SolutionInputs } from '$lib/types/calculator';
import { base } from '$app/paths';

interface BaseAnalysisParams {
  model: CalculatorModel;
  baseInputs: TeamInputs | TicketInputs;
  solutionInputs?: SolutionInputs;
}

export function generateShareLink(params: BaseAnalysisParams): string {
  const searchParams = new URLSearchParams();
  
  // Add model type
  searchParams.set('model', params.model);
  
  // Add base model parameters
  if (params.model === 'team') {
    const teamInputs = params.baseInputs as TeamInputs;
    searchParams.set('teamSize', teamInputs.teamSize.toString());
    searchParams.set('hourlyRate', teamInputs.hourlyRate.toString());
    searchParams.set('serviceEfficiency', teamInputs.serviceEfficiency.toString());
    searchParams.set('operationalOverhead', teamInputs.operationalOverhead.toString());
  } else {
    const ticketInputs = params.baseInputs as TicketInputs;
    searchParams.set('monthlyTickets', ticketInputs.monthlyTickets.toString());
    searchParams.set('hoursPerTicket', ticketInputs.hoursPerTicket.toString());
    searchParams.set('peoplePerTicket', ticketInputs.peoplePerTicket.toString());
    searchParams.set('slaCompliance', ticketInputs.slaCompliance.toString());
  }
  
  // Add solution parameters if present
  if (params.solutionInputs) {
    searchParams.set('solution', params.solutionInputs.type);
    
    switch (params.solutionInputs.type) {
      case 'platform':
        if (params.solutionInputs.platform) {
          const platform = params.solutionInputs.platform;
          searchParams.set('platformCost', platform.platformCost.toString());
          searchParams.set('platformMaintenance', platform.platformMaintenance.toString());
          searchParams.set('timeToBuild', platform.timeToBuild.toString());
          searchParams.set('teamReduction', platform.teamReduction.toString());
          searchParams.set('processEfficiency', platform.processEfficiency.toString());
        }
        break;
        
      case 'outsource':
        if (params.solutionInputs.outsource) {
          const outsource = params.solutionInputs.outsource;
          searchParams.set('vendorRate', outsource.vendorRate.toString());
          searchParams.set('managementOverhead', outsource.managementOverhead.toString());
          searchParams.set('qualityImpact', outsource.qualityImpact.toString());
          searchParams.set('knowledgeLoss', outsource.knowledgeLoss.toString());
          searchParams.set('transitionTime', outsource.transitionTime.toString());
          searchParams.set('transitionCost', outsource.transitionCost.toString());
        }
        break;
        
      case 'hybrid':
        if (params.solutionInputs.hybrid) {
          const hybrid = params.solutionInputs.hybrid;
          searchParams.set('platformPortion', hybrid.platformPortion.toString());
          searchParams.set('vendorPortion', hybrid.vendorPortion.toString());
          searchParams.set('platformCost', hybrid.platformCost.toString());
          searchParams.set('platformMaintenance', hybrid.platformMaintenance.toString());
          searchParams.set('timeToBuild', hybrid.timeToBuild.toString());
          searchParams.set('teamReduction', hybrid.teamReduction.toString());
          searchParams.set('processEfficiency', hybrid.processEfficiency.toString());
          searchParams.set('vendorRate', hybrid.vendorRate.toString());
          searchParams.set('managementOverhead', hybrid.managementOverhead.toString());
          searchParams.set('qualityImpact', hybrid.qualityImpact.toString());
          searchParams.set('knowledgeLoss', hybrid.knowledgeLoss.toString());
          searchParams.set('transitionTime', hybrid.transitionTime.toString());
          searchParams.set('transitionCost', hybrid.transitionCost.toString());
        }
        break;
    }
  }
  
  // Just return the query parameters - let the component handle the full URL construction
  return searchParams.toString();
}

export function parseShareLink(searchParams: URLSearchParams): BaseAnalysisParams | null {
  try {
    // Get and validate model type
    const model = searchParams.get('model') as CalculatorModel;
    if (!model || !['team', 'ticket'].includes(model)) return null;
    
    let baseInputs: TeamInputs | TicketInputs;
    
    // Parse base model parameters
    if (model === 'team') {
      const teamSize = parseInt(searchParams.get('teamSize') || '');
      const hourlyRate = parseFloat(searchParams.get('hourlyRate') || '');
      const serviceEfficiency = parseFloat(searchParams.get('serviceEfficiency') || '');
      const operationalOverhead = parseFloat(searchParams.get('operationalOverhead') || '');
      
      if (isNaN(teamSize) || isNaN(hourlyRate) || isNaN(serviceEfficiency) || isNaN(operationalOverhead)) {
        console.log('Invalid team parameters:', { teamSize, hourlyRate, serviceEfficiency, operationalOverhead });
        return null;
      }
      
      baseInputs = {
        teamSize,
        hourlyRate,
        serviceEfficiency,
        operationalOverhead
      };
    } else {
      const monthlyTickets = parseInt(searchParams.get('monthlyTickets') || '');
      const hoursPerTicket = parseFloat(searchParams.get('hoursPerTicket') || '');
      const peoplePerTicket = parseInt(searchParams.get('peoplePerTicket') || '');
      const slaCompliance = parseFloat(searchParams.get('slaCompliance') || '');
      
      if (isNaN(monthlyTickets) || isNaN(hoursPerTicket) || isNaN(peoplePerTicket) || isNaN(slaCompliance)) {
        console.log('Invalid ticket parameters:', { monthlyTickets, hoursPerTicket, peoplePerTicket, slaCompliance });
        return null;
      }
      
      baseInputs = {
        monthlyTickets,
        hoursPerTicket,
        peoplePerTicket,
        slaCompliance
      };
    }
    
    // Parse solution parameters if present
    const solutionType = searchParams.get('solution') as 'platform' | 'outsource' | 'hybrid' | null;
    let solutionInputs: SolutionInputs | undefined;
    
    if (solutionType) {
      switch (solutionType) {
        case 'platform':
          const platformCost = parseFloat(searchParams.get('platformCost') || '');
          const platformMaintenance = parseFloat(searchParams.get('platformMaintenance') || '');
          const timeToBuild = parseInt(searchParams.get('timeToBuild') || '');
          const teamReduction = parseFloat(searchParams.get('teamReduction') || '');
          const processEfficiency = parseFloat(searchParams.get('processEfficiency') || '');
          
          if (!isNaN(platformCost) && !isNaN(platformMaintenance) && !isNaN(timeToBuild) && !isNaN(teamReduction) && !isNaN(processEfficiency)) {
            solutionInputs = {
              type: 'platform',
              platform: {
                platformCost,
                platformMaintenance,
                timeToBuild,
                teamReduction,
                processEfficiency,
                baselineCost: 0 // Will be calculated by the store
              }
            };
          }
          break;
          
        case 'outsource':
          const vendorRate = parseFloat(searchParams.get('vendorRate') || '');
          const managementOverhead = parseFloat(searchParams.get('managementOverhead') || '');
          const qualityImpact = parseFloat(searchParams.get('qualityImpact') || '');
          const knowledgeLoss = parseFloat(searchParams.get('knowledgeLoss') || '');
          const transitionTime = parseInt(searchParams.get('transitionTime') || '');
          const transitionCost = parseFloat(searchParams.get('transitionCost') || '');
          
          if (!isNaN(vendorRate) && !isNaN(managementOverhead) && !isNaN(qualityImpact) && !isNaN(knowledgeLoss) && !isNaN(transitionTime) && !isNaN(transitionCost)) {
            solutionInputs = {
              type: 'outsource',
              outsource: {
                vendorRate,
                managementOverhead,
                qualityImpact,
                knowledgeLoss,
                transitionTime,
                transitionCost,
                baselineCost: 0 // Will be calculated by the store
              }
            };
          }
          break;
          
        case 'hybrid':
          const hybrid = {
            platformPortion: parseFloat(searchParams.get('platformPortion') || ''),
            vendorPortion: parseFloat(searchParams.get('vendorPortion') || ''),
            platformCost: parseFloat(searchParams.get('platformCost') || ''),
            platformMaintenance: parseFloat(searchParams.get('platformMaintenance') || ''),
            timeToBuild: parseInt(searchParams.get('timeToBuild') || ''),
            teamReduction: parseFloat(searchParams.get('teamReduction') || ''),
            processEfficiency: parseFloat(searchParams.get('processEfficiency') || ''),
            vendorRate: parseFloat(searchParams.get('vendorRate') || ''),
            managementOverhead: parseFloat(searchParams.get('managementOverhead') || ''),
            qualityImpact: parseFloat(searchParams.get('qualityImpact') || ''),
            knowledgeLoss: parseFloat(searchParams.get('knowledgeLoss') || ''),
            transitionTime: parseInt(searchParams.get('transitionTime') || ''),
            transitionCost: parseFloat(searchParams.get('transitionCost') || '')
          };
          
          if (!Object.values(hybrid).some(isNaN)) {
            solutionInputs = {
              type: 'hybrid',
              hybrid: {
                ...hybrid,
                baselineCost: 0 // Will be calculated by the store
              }
            };
          }
          break;
      }
    }
    
    console.log('Parsed share link:', { model, baseInputs, solutionInputs }); // Debug log
    return {
      model,
      baseInputs,
      solutionInputs
    };
  } catch (error) {
    console.error('Error parsing share link:', error);
    return null;
  }
}

export function validateShareParams(params: BaseAnalysisParams): boolean {
  if (!params.model || !params.baseInputs) return false;
  
  if (params.model === 'team') {
    const teamInputs = params.baseInputs as TeamInputs;
    return !!(
      teamInputs.teamSize &&
      teamInputs.hourlyRate &&
      teamInputs.serviceEfficiency &&
      teamInputs.operationalOverhead
    );
  } else {
    const ticketInputs = params.baseInputs as TicketInputs;
    return !!(
      ticketInputs.monthlyTickets &&
      ticketInputs.hoursPerTicket &&
      ticketInputs.peoplePerTicket &&
      ticketInputs.slaCompliance
    );
  }
} 