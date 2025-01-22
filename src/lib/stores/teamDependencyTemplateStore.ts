import { writable } from 'svelte/store';

interface Team {
  name: string;
  size: number;
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
  directMeetingCost: number;
  communicationOverhead: number;
  opportunityCost: number;
  flowEfficiencyCost: number;
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

interface TeamParams {
  dependencyImpact: number;
  baseLeadTime: number;
}

const defaultTeamParams: TeamParams = {
  dependencyImpact: 0.2,
  baseLeadTime: 5
};

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
  const teamParams = defaultTeamParams;
  
  // Create a map of team names to nodes for safer lookup
  const nodeMap = new Map(nodes.map(node => [node.data.label, node]));
  
  const template = `# Team Dependency Analysis

## Input Configuration

### Organization Structure
- Distribution Mode: ${distributionMode === 'hub-spoke' ? 'Hub and Spoke' : 'Even Distribution'}
- Number of Teams: ${teamCount}
- Company-wide Dependency Level: ${companyDependencyLevel}/5

### Cost Parameters
1. Labor Rates
   - Developer: $${costParams.hourlyRate.developer}/hr

2. Meeting Configuration
   - Duration: ${costParams.meetings.duration}hr
   - Frequency: ${costParams.meetings.recurrence}
   - Attendees per Team: ${costParams.meetings.attendeesPerTeam}
   - Communication Overhead: ${(costParams.meetings.communicationOverhead * 100 - 100).toFixed(0)}% additional time
   - Additional Hours: ${costParams.meetings.additionalHours} hrs/month

3. Overhead Parameters
   - Communication Overhead: ${(costParams.overhead.communicationOverhead * 100 - 100).toFixed(0)}% additional time
   - Wait Time Impact: ${(costParams.overhead.waitTimeMultiplier * 100).toFixed(0)}% of base time
   - Baseline Communication: ${costParams.overhead.baselineCommunicationHours} hrs/month
   - Dependency Cost Rate: ${costParams.overhead.dependencyHoursRate} hrs/dependency

## Team Composition & Performance

### Team Details
${teams.map(team => {
    const node = nodeMap.get(team.name);
    return `
${team.name}
   - Size: ${team.size} members
   - Base Efficiency: ${(team.efficiency * 100).toFixed(1)}%${node ? `
   - Current Throughput: ${node.data.throughput.toFixed(2)} items/day
   - Lead Time: ${node.data.leadTime.toFixed(1)} days
   - Dependency Impact: ${(node.data.dependencyFactor * 100).toFixed(1)}% efficiency` : ''}`
  }).join('\n')}

### Dependency Matrix
\`\`\`
${dependencyMatrix.teams.map((team, i) => 
  `${team.padEnd(15)} → ${dependencyMatrix.teams.map((_, j) => 
    (i === j ? 'X' : dependencyMatrix.dependencies[i][j]).toString().padStart(2)
  ).join(' | ')}`
).join('\n')}
\`\`\`

## Models & Formulas

### 1. Dependency Impact Model
Formula: dependencyFactor = max(0.5, 1 - (totalDependencyStrength * dependencyImpact))
where:
- totalDependencyStrength = sum of incoming and outgoing dependency strengths
- dependencyImpact = ${teamParams.dependencyImpact.toFixed(2)} (configurable impact factor)
Reasoning: Models how dependencies reduce team efficiency, with a floor of 50%

### 2. Team Performance Model
a) Throughput = (baseCapacity * dependencyFactor) / 5
where:
- baseCapacity = team.size * 8 (hours per day)
- Divided by 5 to convert to daily rate
Reasoning: Captures how dependencies affect daily output

b) Lead Time = waitTime + processingTime
where:
- waitTime = incomingDependencies.length * baseLeadTime * 0.5
- processingTime = baseLeadTime * (1 + (outgoingDependencies.length * 0.3))
- baseLeadTime = ${teamParams.baseLeadTime} days
Reasoning: Models both queue time from dependencies and increased processing complexity

### 3. Cost Model
Current Monthly Costs:
1. Direct Meeting Cost: $${costs.directMeetingCost.toFixed(2)}
   Formula: duration * meetingMultiplier * attendeesPerTeam * hourlyRate * totalConnections
   where meetingMultiplier = twice-weekly:8, weekly:4, biweekly:2, monthly:1

2. Communication Overhead: $${costs.communicationOverhead.toFixed(2)}
   Formula: (connections * overhead * rate * baselineHours) + 
           Σ(manualOverhead + additionalHours) * hourlyRate

3. Opportunity Cost: $${costs.opportunityCost.toFixed(2)}
   Formula: directMeetingCost + communicationOverhead
   Reasoning: Represents total coordination cost impact

4. Flow Efficiency Impact: $${costs.flowEfficiencyCost.toFixed(2)}
   Formula: totalMonthlyHours * hourlyRate * sigmoid(totalDependencyStrength)
   where:
   - totalMonthlyHours = avgTeamSize * 160 (160 hours per person per month)
   - sigmoid(x) = maxImpact * (1 / (1 + e^-((x-midpoint)/steepness)))
   - maxImpact = 0.4 (40% max efficiency loss)
   - midpoint = 15 (typical dependency sum)
   - steepness = 10 (curve steepness)
   Reasoning: Models non-linear impact of dependencies on productivity through lost time

Total Monthly Cost: $${costs.totalCost.toFixed(2)}

## Key Metrics & Results

### Performance Metrics
1. Flow Efficiency: ${metrics.flowEfficiency.toFixed(1)}%
   Formula: (processTime / (processTime + waitTime)) * 100
   - Process Time = Σ(node.throughput * (8 / node.efficiency))
   - Wait Time = Σ(edge.strength * baseLeadTime * 0.5)
   Target: 15-40%

2. Utilization Rate: ${metrics.utilizationRate.toFixed(1)}%
   Formula: ((actualWork + coordinationOverhead) / totalCapacity) * 100
   - Actual Work = Σ(node.throughput * 8 * 5)
   - Coordination = Σ(edge.strength * 2)
   Target: 70-85%

3. Service Efficiency: ${metrics.serviceEfficiency.toFixed(1)}%
   Formula: (totalServiceTime / (totalServiceTime + overheadTime + waitTime)) * 100
   Target: >80%

4. Cost Efficiency
   - Cost per FTE: $${metrics.costPerFTE.toFixed(2)}/month
   - Overhead Ratio: ${(metrics.overheadRatio * 100).toFixed(1)}%

5. Dependency Metrics
   - Complexity Score: ${metrics.dependencyComplexity.toFixed(2)}
   - Impact Score: ${metrics.dependencyImpactScore.toFixed(1)}%
     Formula: (actualDependencyScore / maxPossibleDependencies) * 100

## Analysis Questions

1. Structural Analysis
   - What patterns emerge from the dependency matrix?
   - Are there clear clusters or bottleneck teams?
   - How well does the ${distributionMode} structure serve the organization?

2. Performance Impact
   - Which teams show the highest dependency impact?
   - How do lead times correlate with dependency patterns?
   - What's the relationship between team size and dependency impact?

3. Cost Analysis
   - Which cost component shows the greatest opportunity for optimization?
   - How do meeting costs compare to async communication costs?
   - What's the ROI potential of reducing dependencies?

4. Recommendations
   - What structural changes could improve flow efficiency?
   - Which specific dependencies should be prioritized for reduction?
   - How can meeting and communication patterns be optimized?

5. Implementation Strategy
   - What's the recommended sequence for implementing changes?
   - How should success metrics be tracked?
   - What risks should be monitored during transformation?`;

  return template;
}

function calculateCosts(nodes: Node[], edges: Edge[], teams: Team[], costParams: CostParams): CostAnalysis {
  const totalTeams = nodes.length;
  const totalConnections = edges.length;
  
  // Calculate monthly meeting multiplier based on recurrence
  const getMonthlyMeetingMultiplier = (recurrence: string) => {
    switch (recurrence.toLowerCase()) {
      case 'daily': return 20; // 20 working days per month
      case 'weekly': return 4; // 4 weeks per month
      case 'biweekly': return 2; // 2 times per month
      case 'monthly': return 1; // Once per month
      default: return 1;
    }
  };

  // Direct meeting costs
  const directMeetingCost = 
    costParams.meetings.duration * 
    getMonthlyMeetingMultiplier(costParams.meetings.recurrence) *
    costParams.meetings.attendeesPerTeam * 
    costParams.hourlyRate.developer * 
    totalConnections;

  // Communication overhead
  const communicationOverhead =
    totalConnections * 
    costParams.meetings.communicationOverhead *
    costParams.hourlyRate.developer * 
    costParams.overhead.baselineCommunicationHours;

  // Opportunity cost from context switching
  const opportunityCost = directMeetingCost + communicationOverhead;

  // Flow efficiency impact cost
  const totalDependencyStrength = edges.reduce((sum, edge) => sum + edge.data.strength, 0);
  const avgTeamSize = nodes.reduce((sum, node) => sum + node.data.size, 0) / nodes.length;
  const totalMonthlyHours = avgTeamSize * 160; // 160 hours per person per month
  
  // Calculate impact using sigmoid function
  const maxImpact = 0.4; // Maximum 40% efficiency loss
  const midpoint = 15; // Sigmoid midpoint - typical dependency sum
  const steepness = 10; // Controls how fast the curve rises
  
  const impactFactor = maxImpact * (1 / (1 + Math.exp(-(totalDependencyStrength - midpoint) / steepness)));
  
  // Flow efficiency cost represents lost productivity due to dependencies
  const flowEfficiencyCost = Math.round(
    totalMonthlyHours * 
    costParams.hourlyRate.developer * 
    impactFactor
  );

  return {
    monthlyMeetingCost: directMeetingCost,
    communicationCost: communicationOverhead,
    totalCost: opportunityCost + flowEfficiencyCost,
    directMeetingCost,
    communicationOverhead,
    opportunityCost,
    flowEfficiencyCost
  };
}

export const teamDependencyTemplateStore = writable({
  generateTemplate
}); 