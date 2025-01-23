import { writable } from 'svelte/store';
import type { Team } from '$lib/types/team';

export interface Node {
  id: string;
  data: {
    label: string;
    size: number;
    efficiency: number;
    throughput: number;
    leadTime: number;
    dependencyFactor: number;
    isHub: boolean;
  };
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  data: {
    strength: number;
    type: string;
  };
}

export interface DependencyMatrix {
  teams: string[];
  dependencies: number[][];
}

export interface CostAnalysis {
  directMeetingCost: number;
  communicationOverhead: number;
  opportunityCost: number;
  flowEfficiencyCost: number;
  totalCost: number;
}

export interface Metrics {
  avgThroughput: number;
  avgLeadTime: number;
  dependencyComplexity: number;
  flowEfficiency: number;
  dependencyImpactScore: number;
  utilizationRate: number;
  serviceEfficiency: number;
  costPerFTE: number;
  overheadRatio: number;
  // Cost metrics
  directMeetingCost: number;
  communicationOverhead: number;
  opportunityCost: number;
  flowEfficiencyCost: number;
  totalCost: number;
}

export interface CostParams {
  hourlyRate: {
    developer: number;
    manager: number;
    teamLead: number;
  };
  meetings: {
    duration: number;
    recurrence: string;
    attendeesPerTeam: number;
    communicationOverhead: number;
    additionalHours: number;
  };
  overhead: {
    communicationOverhead: number;
    waitTimeMultiplier: number;
    baselineCommunicationHours: number;
    dependencyHoursRate: number;
    opportunityCostMultiplier: number;
  };
}

interface TeamCommunicationMetrics {
  meetingHours: number;
  overheadHours: number;
  additionalHours: number;
  totalHours: number;
}

function formatCurrency(value: number): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function getMonthlyMeetingMultiplier(recurrence: string): number {
  switch (recurrence) {
    case 'twice-weekly': return 8;
    case 'weekly': return 4;
    case 'biweekly': return 2;
    case 'monthly': return 1;
    default: return 4;
  }
}

function generateTemplate(
  distributionMode: string,
  teamCount: number,
  companyDependencyLevel: number,
  teams: Team[],
  nodes: Node[],
  edges: Edge[],
  dependencyMatrix: DependencyMatrix,
  metrics: Metrics,
  costParams: CostParams,
  teamCommunicationMetrics: TeamCommunicationMetrics[]
): string {
  // Ensure we have valid arrays to work with
  const safeTeams = teams || [];
  const safeNodes = nodes || [];
  const safeEdges = edges || [];
  const safeDependencyMatrix = {
    teams: dependencyMatrix?.teams || [],
    dependencies: dependencyMatrix?.dependencies || []
  };
  const safeTeamCommunicationMetrics = teamCommunicationMetrics || [];

  // Calculate total monthly cost and cost per team member
  const totalCost = metrics.totalCost || 0;
  const totalTeamMembers = safeTeams.slice(0, teamCount).reduce((sum, team) => sum + team.size, 0);
  const costPerTeamMember = totalTeamMembers > 0 ? totalCost / totalTeamMembers : 0;

  const template = `# Team Dependency Analysis Report

## Organization Overview

### Structure
- Distribution Pattern: ${distributionMode?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Not Specified'}
- Number of Teams: ${teamCount || 0}
- Overall Dependency Level: ${companyDependencyLevel || 0}/5

### Cost Parameters
- Average Employee Cost: ${formatCurrency(costParams?.hourlyRate?.developer || 0)}/hour
- Meeting Duration: ${costParams?.meetings?.duration || 0} hours
- Meeting Frequency: ${costParams?.meetings?.recurrence || 'Not Specified'}
- Average Attendees per Team: ${costParams?.meetings?.attendeesPerTeam || 0}
- Meeting Overhead Multiplier: ${costParams?.meetings?.communicationOverhead || 1}x
- Opportunity Cost Multiplier: ${costParams.overhead.opportunityCostMultiplier}x (efficiency of time spent in meetings)

## Team Analysis

### Team Composition & Dependencies
${safeTeams.slice(0, teamCount).map((team, i) => {
  const node = safeNodes.find(n => n.data.label === team.name);
  const commMetrics = safeTeamCommunicationMetrics[i] || {
    meetingHours: 0,
    overheadHours: 0,
    additionalHours: 0,
    totalHours: 0
  };
  const incomingDeps = safeDependencyMatrix.dependencies
    .map(row => row[i])
    .filter(v => v > 0)
    .length;
  const outgoingDeps = (safeDependencyMatrix.dependencies[i] || [])
    .filter(v => v > 0)
    .length;
  
  return `
${team.name}
- Team Size: ${team.size} members
- Efficiency Rating: ${formatPercent(team.efficiency * 100)}
- Dependencies:
  * Incoming: ${incomingDeps}
  * Outgoing: ${outgoingDeps}
- Communication Hours (Monthly):
  * Direct Meeting Hours: ${commMetrics.meetingHours}
  * Overhead Hours: ${commMetrics.overheadHours}
  * Additional Hours: ${commMetrics.additionalHours}
  * Total Hours: ${commMetrics.totalHours}
${node ? `- Performance Metrics:
  * Throughput: ${node.data.throughput.toFixed(1)} items/day
  * Lead Time: ${node.data.leadTime.toFixed(1)} days
  * Dependency Factor: ${formatPercent(node.data.dependencyFactor * 100)}` : ''}`;
}).join('\n')}

### Dependency Matrix
\`\`\`
${['To → | ' + safeDependencyMatrix.teams.join(' | ')].concat(
  safeDependencyMatrix.teams.map((team, i) => 
    team + ' | ' + (safeDependencyMatrix.dependencies[i] || []).map(v => 
      (v || 0).toString().padStart(team.length)
    ).join(' | ')
  )
).join('\n')}
\`\`\`

## Cost Analysis

### Direct Costs
1. Direct Meeting Costs
   - Based on manually specified meeting hours
   - Calculated as: Meeting Hours × Hourly Rate
   - Monthly Cost: ${formatCurrency(metrics.directMeetingCost || 0)}

2. Indirect Meeting Costs (Communication Overhead)
   - Includes preparation, follow-up, and coordination time
   - Calculated as: Meeting Hours × Overhead Multiplier × Hourly Rate
   - Additional coordination hours from dependency strength
   - Monthly Cost: ${formatCurrency(metrics.communicationOverhead || 0)}

3. Opportunity Cost
   - Cost of value-adding work not done due to dependencies
   - Calculated as: (Direct Meeting Cost + Communication Overhead) × Opportunity Cost Multiplier
   - Opportunity Cost Multiplier: ${costParams.overhead.opportunityCostMultiplier}x
     * Represents efficiency of time spent in meetings (0 = no loss, 1 = equal loss, 2 = double loss)
   - Monthly Cost: ${formatCurrency(metrics.opportunityCost || 0)}

4. Flow Efficiency Impact
   - Cost of reduced productivity from dependencies
   - Monthly Cost: ${formatCurrency(metrics.flowEfficiencyCost || 0)}

Total Monthly Cost: ${formatCurrency(totalCost)}
Cost per Team Member: ${formatCurrency(costPerTeamMember)}

### Efficiency Impact
1. Flow Efficiency: ${formatPercent(metrics?.flowEfficiency || 0)}
   - Ratio of value-adding time to total time
   - Impacted by dependencies and coordination overhead
   - Target Range: 15-40%

2. Service Efficiency: ${formatPercent(metrics?.serviceEfficiency || 0)}
   - Measures effective use of team capacity
   - Accounts for coordination and wait times
   - Target: >80%

3. Utilization Rate: ${formatPercent(metrics?.utilizationRate || 0)}
   - Actual work + coordination overhead vs. total capacity
   - Target Range: 70-85%

## Key Metrics

1. Dependency Complexity: ${(metrics?.dependencyComplexity || 0).toFixed(2)}
   - Average strength of dependencies
   - Scale: 0 (none) to 5 (very high)

2. Dependency Impact Score: ${formatPercent(metrics?.dependencyImpactScore || 0)}
   - Percentage of maximum possible dependencies
   - Higher scores indicate more complex coordination needs

3. Average Lead Time: ${(metrics?.avgLeadTime || 0).toFixed(1)} days
   - Includes both processing and wait time
   - Impacted by dependency patterns

4. Average Throughput: ${(metrics?.avgThroughput || 0).toFixed(1)} items/day
   - Adjusted for team size and dependency impact
   - Baseline capacity modified by efficiency factors

## Recommendations

### Structure Optimization
1. ${distributionMode === 'mesh' ? 
     'Consider reducing non-essential dependencies to decrease coordination overhead' :
     distributionMode === 'hub-spoke' ? 
     'Monitor hub team capacity and consider distributing responsibilities' :
     'Evaluate if current pattern supports desired team autonomy'}

2. Focus Areas:
   - Teams with highest dependency factors
   - High-overhead communication patterns
   - Bottleneck dependencies

### Cost Reduction Opportunities
1. Meeting Efficiency
   - Review meeting frequency and duration
   - Optimize attendee participation
   - Consider asynchronous alternatives

2. Dependency Management
   - Identify and reduce non-essential dependencies
   - Streamline coordination processes
   - Implement clear communication protocols

### Performance Improvement
1. Flow Efficiency
   - Reduce wait times between teams
   - Minimize coordination overhead
   - Optimize team interfaces

2. Team Autonomy
   - Clarify team boundaries
   - Reduce cross-team dependencies
   - Empower local decision-making

## Implementation Strategy

1. Short-term Actions
   - Optimize existing meeting structures
   - Document and review current dependencies
   - Identify quick-win reductions

2. Medium-term Goals
   - Restructure team interfaces
   - Implement new coordination mechanisms
   - Monitor and adjust team sizes

3. Long-term Vision
   - Build towards optimal team autonomy
   - Develop scalable coordination patterns
   - Establish sustainable practices

## Monitoring & Success Metrics

1. Key Performance Indicators
   - Flow efficiency improvement
   - Lead time reduction
   - Cost per delivery
   - Team satisfaction

2. Risk Factors
   - Communication gaps
   - Delivery delays
   - Quality impacts
   - Team overload

3. Review Cycle
   - Monthly metrics review
   - Quarterly dependency assessment
   - Annual structure evaluation

## Questions for Analysis

Based on this data, please provide:
1. Analysis of the current team structure and dependency patterns
2. Identification of potential bottlenecks or inefficiencies
3. Recommendations for optimizing team interactions and reducing coordination overhead
4. Suggestions for improving flow efficiency and reducing lead times
5. Cost-benefit analysis of the current structure vs potential improvements`;


  return template;
}

export const teamDependencyTemplateStore = writable({
  generateTemplate
}); 