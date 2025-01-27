# Team Performance Metrics Documentation

## Base Calculations and Assumptions

### Default Values and Standardization
To maintain consistency across team comparisons while avoiding information overload for users, several operational parameters are standardized across all teams:

**Work Item Sizing**:
- Default: 5 hours per work item
- Rationale: Represents a typical medium-sized task that can be completed within a day
- Applied uniformly: All teams use the same work item size to ensure fair comparison
- Impact: Throughput calculations convert from hours to items using this standard size

**Base Lead Time**:
- Default: 3 days per item
- Rationale: Accounts for typical process steps (design, implementation, review, test)
- Applied uniformly: Serves as baseline before dependency impacts
- Impact: Used in wait time and processing time calculations

**Dependency Impact**:
- Default: 0.15 (15% impact per dependency strength point)
- Rationale: Based on empirical observations of coordination overhead
- Applied uniformly: Same impact factor across all team relationships
- Impact: Controls how much dependencies affect team performance

### Base Capacity and Throughput
**Base Assumptions**:
- Standard work day: 8 hours
- Base capacity per team member = 8 hours × team size
- Monthly throughput is affected by dependencies through a dependency factor

**Throughput Calculation**:
```typescript
baseCapacity = team.size * 8;  // hours per day
dependencyFactor = Math.max(0.5, 1 - (totalDependencyStrength * dependencyImpact));
throughput = (baseCapacity * dependencyFactor) / 5;  // Convert to daily rate
```

**Key Modeling Decisions**:
- Dependency factor cannot reduce capacity by more than 50% (minimum 0.5)
- Impact of dependencies is configurable through dependencyImpact parameter (default 0.15)
- Division by 5 converts from hours to work items (assuming average item takes 5 hours)

### Lead Time
**Components**:
1. Wait Time: Delays from incoming dependencies
2. Processing Time: Base time plus overhead from outgoing dependencies

**Calculation**:
```typescript
waitTime = incomingDependencies.length * baseLeadTime * 0.5;
processingTime = baseLeadTime * (1 + (outgoingDependencies.length * 0.3));
leadTime = waitTime + processingTime;
```

**Modeling Assumptions**:
- Each incoming dependency adds 50% of base lead time as wait time
  - Rationale: Coordination and blocking delays
- Each outgoing dependency increases processing time by 30%
  - Rationale: Additional complexity and context-switching overhead
- Base lead time is configurable (default: 3 days)
  - Represents standard processing time without dependencies

## Core Metrics Explained

### 1. Flow Rate
**Definition**: Average number of work items completed per day.
**Calculation**:
```typescript
// First calculate base capacity in hours
baseCapacity = team.size * 8;  // 8 hours per person per day

// Apply dependency impact
dependencyFactor = Math.max(0.5, 1 - (totalDependencyStrength * dependencyImpact));
adjustedCapacity = baseCapacity * dependencyFactor;

// Convert from hours to work items
flowRate = adjustedCapacity / 5;  // Assuming 5 hours per work item
```
- Inputs:
  - Team size (user provided)
  - Dependencies (from dependency matrix)
  - Standard work day (8 hours)
  - Work item size (5 hours standard)
- Output: Daily completion rate in number of work items
- Purpose: Measures team's delivery cadence
- Note: Flow rate is calculated directly from capacity and dependencies, not from historical throughput data

### 2. Efficiency Score
**Definition**: Team's ability to deliver work quickly relative to their lead time.
**Calculation**:
```typescript
efficiencyScore = (baseEfficiency * flowRate) / (leadTime * 100)
```
- Components:
  - Base efficiency: Team's core efficiency rating (1.0 by default)
  - Flow rate: Daily throughput
  - Lead time: Total processing time including dependencies
- Purpose: Measures how effectively team converts effort into output
- Normalization: Multiplied by 100 for percentage scale

### 3. Value Density
**Definition**: Value delivered per unit of team size and dependency complexity.
**Calculation**:
```typescript
valueDensity = (throughput * efficiency) / (teamSize * totalDependencies || 1)
```
- Factors:
  - Team throughput: Daily work items completed
  - Team efficiency: Base efficiency rating
  - Team size: Number of team members
  - Dependencies: Total number of connections
- Purpose: Measures value generation efficiency accounting for team constraints
- Note: Uses || 1 to avoid division by zero when no dependencies exist

### 4. Dependency Impact
**Definition**: Total effect of dependencies on team performance.
**Calculation**:
```typescript
totalDependencyStrength = sum(incomingDeps) + sum(outgoingDeps)
dependencyImpact = totalDeps * (totalDependencyStrength / (totalDeps * 5 || 1))
```
- Components:
  - Number of dependencies (both incoming and outgoing)
  - Strength of each dependency (1-5 scale)
- Purpose: Quantifies dependency overhead
- Scale: Higher values indicate more impactful dependencies

### 5. Resource Utilization
**Definition**: Percentage of available time actively used.
**Calculation**:
```typescript
totalAvailableHours = teamSize * 160  // Hours per month (40h/week * 4)
totalUsedHours = meetingHours + overheadHours + additionalHours
resourceUtilization = (totalUsedHours / totalAvailableHours) * 100
```
- Includes:
  - Direct meeting time
  - Communication overhead
  - Additional coordination time
- Purpose: Measures capacity usage
- Assumption: 160 working hours per person per month

### 6. Autonomy
**Definition**: Team's independence from other teams.
**Calculation**:
```typescript
maxPossibleDeps = (totalTeams - 1) * 2  // Maximum bi-directional connections
autonomy = (1 - (totalDeps / maxPossibleDeps)) * 100
```
- Scale: 0-100%
- Higher is better
- Considers bi-directional connections
- Purpose: Measures team's self-sufficiency

### 7. Cost Efficiency
**Definition**: Value delivered per unit of cost.
**Calculation**:
```typescript
totalCost = totalHours * hourlyRate
costEfficiency = (throughput * efficiency) / (totalCost / 1000)
```
- Factors:
  - Team throughput
  - Team efficiency
  - Total cost (hours × rate)
- Purpose: Measures cost-effectiveness
- Note: Division by 1000 for scale normalization

### 8. Team Velocity
**Definition**: Actual delivery rate accounting for dependencies.
**Calculation**:
```typescript
teamVelocity = (monthlyThroughput / 30) * (1 - dependencyFactor)
```
- Converts monthly throughput to daily
- Adjusts for dependency impact
- Purpose: Shows actual delivery capacity

## Visualization and Normalization

### Data Normalization
```typescript
normalizedValue = ((value - minValue) / (maxValue - minValue)) * 100
```
- Applied to all metrics for consistent scale
- Relative to all teams in analysis
- Default 50 if all values are same

### Radar Chart Configuration
- Scale: 0-100 for all metrics
- Higher values are better
- Octagonal shape for 8 metrics
- Interactive tooltips with raw values

### Notes
1. All metrics use standardized assumptions to ensure fair comparison
2. Absolute values should be interpreted in context of the standardized parameters
3. Relative comparisons between teams are more meaningful than absolute values
4. Trends over time provide more insight than point-in-time measurements
5. Consider the standardized parameters when applying insights to specific situations 