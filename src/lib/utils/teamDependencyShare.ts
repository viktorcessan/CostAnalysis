import type { Team, DependencyMatrix } from '$lib/types/teamDependency';

export interface TeamDependencyParams {
  distributionMode: 'even' | 'hub-spoke';
  teamCount: number;
  companyDependencyLevel: number;
  teams: Team[];
  dependencyMatrix: DependencyMatrix;
  costParams: {
    hourlyRate: {
      developer: number;
    };
    meetings: {
      weeklyDuration: number;
      attendeesPerTeam: number;
    };
    overhead: {
      communicationOverhead: number;
    };
  };
}

export function generateShareLink(params: TeamDependencyParams): string {
  const searchParams = new URLSearchParams();
  
  // Add basic parameters
  searchParams.set('distributionMode', params.distributionMode);
  searchParams.set('teamCount', params.teamCount.toString());
  searchParams.set('companyDependencyLevel', params.companyDependencyLevel.toString());
  
  // Add teams data
  searchParams.set('teams', JSON.stringify(params.teams));
  
  // Add dependency matrix
  searchParams.set('dependencyMatrix', JSON.stringify(params.dependencyMatrix));
  
  // Add cost parameters
  searchParams.set('costParams', JSON.stringify(params.costParams));
  
  return searchParams.toString();
}

export function parseShareLink(searchParams: URLSearchParams): TeamDependencyParams | null {
  try {
    // Parse basic parameters
    const distributionMode = searchParams.get('distributionMode') as 'even' | 'hub-spoke';
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
    
    // Parse cost parameters
    const costParams = JSON.parse(searchParams.get('costParams') || '{}');
    
    return {
      distributionMode,
      teamCount,
      companyDependencyLevel,
      teams,
      dependencyMatrix,
      costParams
    };
  } catch (error) {
    console.error('Error parsing share link:', error);
    return null;
  }
}

export function validateShareParams(params: TeamDependencyParams): boolean {
  return !!(
    params.distributionMode &&
    params.teamCount &&
    params.companyDependencyLevel &&
    params.teams?.length > 0 &&
    params.dependencyMatrix?.teams?.length > 0 &&
    params.costParams?.hourlyRate?.developer &&
    params.costParams?.meetings?.weeklyDuration &&
    params.costParams?.meetings?.attendeesPerTeam &&
    params.costParams?.overhead?.communicationOverhead
  );
} 