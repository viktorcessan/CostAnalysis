import type { CostParams, DependencyMatrix } from '$lib/stores/teamDependencyTemplateStore';
import type { Team } from '$lib/types/team';

export interface TeamDependencyParams {
  distributionMode: 'even' | 'hub-spoke' | 'sequential' | 'mesh' | 'hierarchical' | 'clustered';
  teamCount: number;
  companyDependencyLevel: number;
  teams: Team[];
  dependencyMatrix: DependencyMatrix;
  costParams: CostParams;
}

export interface Team {
  name: string;
  size: number;
  efficiency: number;
  baseCapacity?: number;  // Make it optional since it's calculated
}

export function generateShareLink(params: TeamDependencyParams): string {
  const searchParams = new URLSearchParams();
  
  // Add basic parameters
  searchParams.set('distributionMode', params.distributionMode);
  searchParams.set('teamCount', params.teamCount.toString());
  searchParams.set('companyDependencyLevel', params.companyDependencyLevel.toString());
  
  // Add teams data
  searchParams.set('teams', JSON.stringify(params.teams.map(team => ({
    name: team.name,
    size: team.size,
    baseCapacity: team.baseCapacity,
    efficiency: team.efficiency
  }))));
  
  // Add dependency matrix
  searchParams.set('dependencyMatrix', JSON.stringify({
    teams: params.dependencyMatrix.teams,
    dependencies: params.dependencyMatrix.dependencies
  }));
  
  // Add cost parameters
  const costParams = {
    hourlyRate: {
      developer: params.costParams.hourlyRate.developer,
      manager: params.costParams.hourlyRate.manager,
      teamLead: params.costParams.hourlyRate.teamLead
    },
    meetings: {
      duration: params.costParams.meetings.duration,
      recurrence: params.costParams.meetings.recurrence,
      attendeesPerTeam: params.costParams.meetings.attendeesPerTeam,
      communicationOverhead: params.costParams.meetings.communicationOverhead,
      additionalHours: params.costParams.meetings.additionalHours
    },
    overhead: {
      communicationOverhead: params.costParams.overhead.communicationOverhead,
      waitTimeMultiplier: params.costParams.overhead.waitTimeMultiplier,
      baselineCommunicationHours: params.costParams.overhead.baselineCommunicationHours,
      dependencyHoursRate: params.costParams.overhead.dependencyHoursRate
    }
  };
  searchParams.set('costParams', JSON.stringify(costParams));
  
  return searchParams.toString();
}

export function parseShareLink(searchParams: URLSearchParams): TeamDependencyParams | null {
  try {
    // Parse basic parameters
    const distributionMode = searchParams.get('distributionMode') as 'even' | 'hub-spoke' | 'sequential' | 'mesh' | 'hierarchical' | 'clustered';
    const teamCount = parseInt(searchParams.get('teamCount') || '');
    const companyDependencyLevel = parseInt(searchParams.get('companyDependencyLevel') || '');
    
    if (!distributionMode || isNaN(teamCount) || isNaN(companyDependencyLevel)) {
      console.log('Invalid basic parameters:', { distributionMode, teamCount, companyDependencyLevel });
      return null;
    }
    
    // Parse teams data
    const teams = JSON.parse(searchParams.get('teams') || '[]') as Team[];
    
    // Parse dependency matrix
    const dependencyMatrix = JSON.parse(searchParams.get('dependencyMatrix') || '{}') as DependencyMatrix;
    
    // Parse cost parameters with defaults
    const rawCostParams = JSON.parse(searchParams.get('costParams') || '{}');
    const costParams = {
      hourlyRate: {
        developer: Number(rawCostParams?.hourlyRate?.developer) || 75,
        manager: Number(rawCostParams?.hourlyRate?.manager) || 100,
        teamLead: Number(rawCostParams?.hourlyRate?.teamLead) || 125
      },
      meetings: {
        duration: Number(rawCostParams?.meetings?.duration) || 1,
        recurrence: rawCostParams?.meetings?.recurrence || 'weekly',
        attendeesPerTeam: Number(rawCostParams?.meetings?.attendeesPerTeam) || 5,
        communicationOverhead: Number(rawCostParams?.meetings?.communicationOverhead) || 1.2,
        additionalHours: Number(rawCostParams?.meetings?.additionalHours) || 0
      },
      overhead: {
        communicationOverhead: Number(rawCostParams?.overhead?.communicationOverhead) || 1.2,
        waitTimeMultiplier: Number(rawCostParams?.overhead?.waitTimeMultiplier) || 0.5,
        baselineCommunicationHours: Number(rawCostParams?.overhead?.baselineCommunicationHours) || 10,
        dependencyHoursRate: Number(rawCostParams?.overhead?.dependencyHoursRate) || 4
      }
    };
    
    const params = {
      distributionMode,
      teamCount,
      companyDependencyLevel,
      teams,
      dependencyMatrix,
      costParams
    };
    
    // Validate the complete params object
    if (!validateShareParams(params)) {
      console.error('Invalid params after parsing:', params);
      return null;
    }
    
    return params;
  } catch (error) {
    console.error('Error parsing share link:', error);
    return null;
  }
}

export function validateShareParams(params: TeamDependencyParams): boolean {
  try {
    return !!(
      params.distributionMode &&
      params.teamCount &&
      params.companyDependencyLevel &&
      params.teams?.length > 0 &&
      params.dependencyMatrix?.teams?.length > 0 &&
      // Validate hourly rates
      params.costParams?.hourlyRate?.developer &&
      params.costParams?.hourlyRate?.manager &&
      params.costParams?.hourlyRate?.teamLead &&
      // Validate meeting parameters
      params.costParams?.meetings?.duration &&
      params.costParams?.meetings?.recurrence &&
      params.costParams?.meetings?.attendeesPerTeam &&
      params.costParams?.meetings?.communicationOverhead &&
      typeof params.costParams?.meetings?.additionalHours === 'number' &&
      // Validate overhead parameters
      params.costParams?.overhead?.communicationOverhead &&
      params.costParams?.overhead?.waitTimeMultiplier &&
      params.costParams?.overhead?.baselineCommunicationHours &&
      params.costParams?.overhead?.dependencyHoursRate
    );
  } catch (error) {
    console.error('Error validating share params:', error);
    return false;
  }
} 