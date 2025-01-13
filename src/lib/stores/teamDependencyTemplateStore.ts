import { writable } from 'svelte/store';

interface Team {
  name: string;
  size: number;
  baseCapacity: number;
  efficiency: number;
}

interface Node {
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

interface Edge {
  id: string;
  source: string;
  target: string;
  data: {
    strength: number;
    type: string;
  };
}

interface DependencyMatrix {
  teams: string[];
  dependencies: number[][];
}

interface CostAnalysis {
  monthlyMeetingCost: number;
  communicationCost: number;
  totalCost: number;
}

interface Metrics {
  avgThroughput: number;
  avgLeadTime: number;
  dependencyComplexity: number;
  flowEfficiency: number;
  dependencyImpactScore: number;
  utilizationRate: number;
  serviceEfficiency: number;
  costPerFTE: number;
  overheadRatio: number;
}

interface CostParams {
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
  };
}

function generateTemplate(
  distributionMode: 'even' | 'hub-spoke',
  teamCount: number,
  companyDependencyLevel: number,
  teams: Team[],
  nodes: Node[],
  edges: Edge[],
  dependencyMatrix: DependencyMatrix,
  metrics: Metrics,
  costParams: CostParams
): string {
  const costs = calculateCosts(nodes, edges, teams, costParams);
  
  const template = `I'm analyzing a team dependency structure with the following configuration:

Distribution Mode: ${distributionMode}
Number of Teams: ${teamCount}
Dependency Level: ${companyDependencyLevel} (Scale 1-5, where 1 is Very Low and 5 is Very High)
Dev Rate ($/hr): $${costParams.hourlyRate.developer.toFixed(2)}
Meeting Duration: ${costParams.meetings.duration}hr
Meeting Frequency: ${costParams.meetings.recurrence}
Meeting Attendees: ${costParams.meetings.attendeesPerTeam}
Communication Overhead: ${costParams.overhead.communicationOverhead.toFixed(2)}x
Baseline Communication Hours: ${costParams.overhead.baselineCommunicationHours} hrs/month
Dependency Hours Rate: ${costParams.overhead.dependencyHoursRate} hrs/dependency

Teams:
${teams.map(team => `- ${team.name}:
  * Team Size: ${team.size}
  * Base Capacity: ${team.baseCapacity} items per week
  * Team Efficiency: ${team.efficiency * 100}%`).join('\n')}

Team Performance Metrics:
${nodes.map(node => `- ${node.data.label}:
  * Throughput: ${node.data.throughput.toFixed(2)} items per day
  * Lead Time: ${node.data.leadTime.toFixed(2)} days
  * Dependency Factor: ${(node.data.dependencyFactor * 100).toFixed(2)}%`).join('\n')}

Dependency Matrix:
${dependencyMatrix.teams.map((team, i) => 
  `${team} → ${dependencyMatrix.teams.map((_, j) => 
    i === j ? 'X' : dependencyMatrix.dependencies[i][j]
  ).join(' | ')}`
).join('\n')}

Key Metrics:
- Average Throughput: ${metrics.avgThroughput.toFixed(2)} items per day
- Average Lead Time: ${metrics.avgLeadTime.toFixed(2)} days
- Flow Efficiency: ${metrics.flowEfficiency.toFixed(2)}%
- Dependency Impact Score: ${metrics.dependencyImpactScore.toFixed(2)}
- Utilization Rate: ${metrics.utilizationRate.toFixed(2)}%
- Service Efficiency: ${metrics.serviceEfficiency.toFixed(2)}%
- Cost per FTE: $${metrics.costPerFTE.toFixed(2)}
- Overhead Ratio: ${(metrics.overheadRatio * 100).toFixed(2)}%

Cost Analysis:
- Monthly Meeting Cost: $${costs.monthlyMeetingCost.toFixed(2)}
- Communication Cost: $${costs.communicationCost.toFixed(2)}
- Total Monthly Cost: $${costs.totalCost.toFixed(2)}

Formulas Used:
1. Dependency Factor = max(0.5, 1 - (totalDependencyStrength * dependencyImpact))
2. Throughput = baseCapacity * dependencyFactor
3. Monthly Meeting Cost = monthlyDuration * attendeesPerTeam * hourlyRate * totalConnections * communicationOverhead
4. Communication Cost = (totalConnections * communicationOverhead * hourlyRate * baselineCommunicationHours) + (dependencyStrength * dependencyHoursRate * hourlyRate)
5. Lead Time = waitTime + processingTime
   where:
   - waitTime = incomingDependencies.length * baseLeadTime * 0.5
   - processingTime = baseLeadTime * (1 + (outgoingDependencies.length * 0.3))
6. Flow Efficiency = (processTime / (processTime + waitTime)) * 100
7. Dependency Impact Score = (totalDependencies / maxPossibleDependencies) * 100

Based on this data, please provide:
1. Analysis of the current team structure and dependency patterns
2. Identification of potential bottlenecks or inefficiencies
3. Recommendations for optimizing team interactions and reducing coordination overhead
4. Suggestions for improving flow efficiency and reducing lead times
5. Cost-benefit analysis of the current structure vs potential improvements`;

  return template;
}

function calculateCosts(nodes: Node[], edges: Edge[], teams: Team[], costParams: CostParams): CostAnalysis {
  const totalTeams = nodes.length;
  const totalConnections = edges.length;
  const totalPeople = nodes.reduce((sum, node) => sum + node.data.size, 0);
  
  // Meeting costs
  const monthlyMeetingCost = 
    costParams.meetings.duration * 
    costParams.meetings.attendeesPerTeam * 
    costParams.hourlyRate.developer * 
    totalConnections * 
    costParams.overhead.communicationOverhead;

  // Communication costs
  const communicationCost =
    totalConnections * costParams.overhead.communicationOverhead *
    costParams.hourlyRate.developer * costParams.overhead.baselineCommunicationHours + // Baseline communication
    edges.reduce((sum, edge) => sum + (edge.data.strength * costParams.overhead.dependencyHoursRate * costParams.hourlyRate.developer), 0);

  return {
    monthlyMeetingCost,
    communicationCost,
    totalCost: monthlyMeetingCost + communicationCost
  };
}

export const teamDependencyTemplateStore = writable({
  generateTemplate
}); 