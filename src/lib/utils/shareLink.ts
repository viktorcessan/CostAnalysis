import type { CalculatorModel } from '$lib/types/calculator';

export interface TargetPlanningParams {
  // Model type
  model: CalculatorModel;
  
  // Team Model Parameters
  teamSize?: number;
  hourlyRate?: number;
  serviceEfficiency?: number;
  operationalOverhead?: number;
  
  // Ticket Model Parameters
  monthlyTickets?: number;
  hoursPerTicket?: number;
  peoplePerTicket?: number;
  slaCompliance?: number;
  
  // Target Parameters
  breakEvenTarget: number;
  reductionTarget: number;
  efficiencyTarget: number;
  implementationTarget: number;
}

export function generateShareLink(params: TargetPlanningParams): string {
  const searchParams = new URLSearchParams();
  
  // Add model type
  searchParams.set('model', params.model);
  
  // Add model-specific parameters
  if (params.model === 'team') {
    searchParams.set('teamSize', params.teamSize?.toString() || '');
    searchParams.set('hourlyRate', params.hourlyRate?.toString() || '');
    searchParams.set('serviceEfficiency', params.serviceEfficiency?.toString() || '');
    searchParams.set('operationalOverhead', params.operationalOverhead?.toString() || '');
  } else {
    searchParams.set('monthlyTickets', params.monthlyTickets?.toString() || '');
    searchParams.set('hoursPerTicket', params.hoursPerTicket?.toString() || '');
    searchParams.set('peoplePerTicket', params.peoplePerTicket?.toString() || '');
    searchParams.set('slaCompliance', params.slaCompliance?.toString() || '');
  }
  
  // Add target parameters
  searchParams.set('breakEvenTarget', params.breakEvenTarget.toString());
  searchParams.set('reductionTarget', params.reductionTarget.toString());
  searchParams.set('efficiencyTarget', params.efficiencyTarget.toString());
  searchParams.set('implementationTarget', params.implementationTarget.toString());
  
  return searchParams.toString();
}

export function parseShareLink(searchParams: URLSearchParams): TargetPlanningParams | null {
  const model = searchParams.get('model') as CalculatorModel;
  if (!model) return null;
  
  const params: TargetPlanningParams = {
    model,
    breakEvenTarget: Number(searchParams.get('breakEvenTarget')),
    reductionTarget: Number(searchParams.get('reductionTarget')),
    efficiencyTarget: Number(searchParams.get('efficiencyTarget')),
    implementationTarget: Number(searchParams.get('implementationTarget'))
  };
  
  // Parse model-specific parameters
  if (model === 'team') {
    params.teamSize = Number(searchParams.get('teamSize'));
    params.hourlyRate = Number(searchParams.get('hourlyRate'));
    params.serviceEfficiency = Number(searchParams.get('serviceEfficiency'));
    params.operationalOverhead = Number(searchParams.get('operationalOverhead'));
  } else {
    params.monthlyTickets = Number(searchParams.get('monthlyTickets'));
    params.hoursPerTicket = Number(searchParams.get('hoursPerTicket'));
    params.peoplePerTicket = Number(searchParams.get('peoplePerTicket'));
    params.slaCompliance = Number(searchParams.get('slaCompliance'));
  }
  
  return params;
}

export function validateShareParams(params: TargetPlanningParams): boolean {
  if (!params.model) return false;
  
  // Validate target parameters
  if (
    isNaN(params.breakEvenTarget) ||
    isNaN(params.reductionTarget) ||
    isNaN(params.efficiencyTarget) ||
    isNaN(params.implementationTarget)
  ) {
    return false;
  }
  
  // Validate model-specific parameters
  if (params.model === 'team') {
    return !(
      isNaN(params.teamSize!) ||
      isNaN(params.hourlyRate!) ||
      isNaN(params.serviceEfficiency!) ||
      isNaN(params.operationalOverhead!)
    );
  } else {
    return !(
      isNaN(params.monthlyTickets!) ||
      isNaN(params.hoursPerTicket!) ||
      isNaN(params.peoplePerTicket!) ||
      isNaN(params.slaCompliance!)
    );
  }
}

export function formatShareParams(params: TargetPlanningParams): string[] {
  const formatted: string[] = [];
  
  // Format model-specific parameters
  if (params.model === 'team') {
    formatted.push(`Team Size: ${params.teamSize}`);
    formatted.push(`Hourly Rate: $${params.hourlyRate}`);
    formatted.push(`Service Efficiency: ${params.serviceEfficiency! * 100}%`);
    formatted.push(`Operational Overhead: ${params.operationalOverhead! * 100}%`);
  } else {
    formatted.push(`Monthly Tickets: ${params.monthlyTickets}`);
    formatted.push(`Hours per Ticket: ${params.hoursPerTicket}`);
    formatted.push(`People per Ticket: ${params.peoplePerTicket}`);
    formatted.push(`SLA Compliance: ${params.slaCompliance}%`);
  }
  
  // Format target parameters
  formatted.push(`Break Even Target: ${params.breakEvenTarget} months`);
  formatted.push(`${params.model === 'team' ? 'Team Reduction' : 'Automation'} Target: ${params.reductionTarget}%`);
  formatted.push(`${params.model === 'team' ? 'Process Efficiency' : 'SLA Improvement'} Target: ${params.efficiencyTarget}%`);
  formatted.push(`Implementation Target: ${params.implementationTarget} months`);
  
  return formatted;
} 