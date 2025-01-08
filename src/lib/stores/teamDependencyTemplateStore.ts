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
  weeklyMeetingCost: number;
  communicationCost: number;
  processOverhead: number;
  totalCost: number;
  hourlyRate: number;
  weeklyDuration: number;
  attendeesPerTeam: number;
  communicationOverhead: number;
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

function generateTemplate(
  distributionMode: 'even' | 'hub-spoke',
  teamCount: number,
  companyDependencyLevel: number,
  teams: Team[],
  nodes: Node[],
  edges: Edge[],
  dependencyMatrix: DependencyMatrix,
  metrics: Metrics
): string {
  const costs = calculateCosts(nodes, edges, teams);
  
  const template = `I'm analyzing a team dependency structure with the following configuration:

Distribution Mode: ${distributionMode === 'even' ? 'Even Distribution (teams work together with balanced dependencies)' : 'Hub and Spoke (central team coordinates with satellite teams)'}
Number of Teams: ${teamCount}
Dependency Level: ${companyDependencyLevel} (Scale 1-5, where 1 is Very Low and 5 is Very High)
Dev Rate ($/hr): $${costs.hourlyRate}
Weekly Meeting Hours: ${costs.weeklyDuration}
Meeting Attendees: ${costs.attendeesPerTeam}
Communication Overhead: ${costs.communicationOverhead}x

Team Configuration:
${teams.map((team, i) => `- ${team.name}:
  * Team Size: ${team.size} members
  * Base Capacity: ${team.baseCapacity} items per person per week
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
- Weekly Meeting Cost: $${costs.weeklyMeetingCost.toFixed(2)}
- Communication Cost: $${costs.communicationCost.toFixed(2)}
- Process Overhead: $${costs.processOverhead.toFixed(2)}
- Total Weekly Cost: $${costs.totalCost.toFixed(2)}

Formulas Used:
1. Dependency Factor = max(0.5, 1 - (totalDependencyStrength * dependencyImpact))
2. Throughput = baseCapacity * dependencyFactor
3. Weekly Meeting Cost = weeklyDuration * attendeesPerTeam * hourlyRate * totalConnections * communicationOverhead
4. Lead Time = waitTime + processingTime
   where:
   - waitTime = incomingDependencies.length * baseLeadTime * 0.5
   - processingTime = baseLeadTime * (1 + (outgoingDependencies.length * 0.3))
5. Flow Efficiency = (processTime / (processTime + waitTime)) * 100
6. Dependency Impact Score = (totalDependencies / maxPossibleDependencies) * 100

Based on this data, please provide:
1. Analysis of the current team structure and dependency patterns
2. Identification of potential bottlenecks or inefficiencies
3. Recommendations for optimizing team interactions and reducing coordination overhead
4. Suggestions for improving flow efficiency and reducing lead times
5. Cost-benefit analysis of the current structure vs potential improvements`;

  return template;
}

function calculateCosts(nodes: Node[], edges: Edge[], teams: Team[]): CostAnalysis {
  const hourlyRate = 75; // Default developer rate
  const weeklyDuration = 4; // Default weekly meeting hours
  const attendeesPerTeam = 5; // Default attendees per team
  const communicationOverhead = 1.2; // Default communication overhead

  const totalTeams = nodes.length;
  const totalConnections = edges.length;
  const totalPeople = nodes.reduce((sum, node) => sum + node.data.size, 0);
  
  // Meeting costs
  const weeklyMeetingCost = 
    weeklyDuration * 
    attendeesPerTeam * 
    hourlyRate * 
    totalConnections * 
    communicationOverhead;

  // Communication costs
  const communicationCost =
    totalConnections * communicationOverhead *
    hourlyRate * 10 + // 10 hours baseline communication
    edges.reduce((sum, edge) => sum + (edge.data.strength * 4 * hourlyRate), 0);

  // Process overhead
  const processOverhead = 
    edges.reduce((sum, edge) => sum + (edge.data.strength * hourlyRate * 3), 0);

  return {
    weeklyMeetingCost,
    communicationCost,
    processOverhead,
    totalCost: weeklyMeetingCost + communicationCost + processOverhead,
    hourlyRate,
    weeklyDuration,
    attendeesPerTeam,
    communicationOverhead
  };
}

export const teamDependencyTemplateStore = writable({
  generateTemplate
}); 