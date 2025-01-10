# Team Dependency Cost Analysis Explained

This document explains how team dependency costs are calculated in the analysis tool, breaking down each component with examples.

## Overview

The total cost of team dependencies is broken down into three main components:
1. Weekly Meeting Costs
2. Communication Costs
3. Process Overhead

## 1. Weekly Meeting Costs

Weekly meeting costs account for formal synchronous meetings between teams.

### Formula
```typescript
weeklyMeetingCost = 
  meetingDuration * 
  attendeesPerTeam * 
  hourlyRate * 
  totalConnections * 
  communicationOverhead
```

### Example
Given:
- Meeting Duration: 4 hours/week
- Attendees per Team: 5 people
- Developer Rate: $75/hour
- Total Connections: 3 teams
- Communication Overhead: 1.2x

```
weeklyMeetingCost = 4 * 5 * $75 * 3 * 1.2
                  = $5,400/week
```

## 2. Communication Costs

Communication costs include asynchronous communication, documentation, and cross-team coordination.

### Configurable Parameters
1. **Baseline Communication Hours**: 
   - Default: 10 hours/week per connection
   - Range: 4-20 hours
   - Represents the minimum communication overhead for any team connection
   - Adjustable based on team communication patterns

2. **Dependency Hours Rate**:
   - Default: 4 hours per dependency strength unit
   - Range: 1-8 hours
   - Represents additional hours needed per unit of dependency strength
   - Higher values indicate more time needed for complex dependencies

### Formula
```typescript
communicationCost = 
  // Base communication cost
  (totalConnections * 
   communicationOverhead * 
   hourlyRate * 
   baselineHours) + // configurable (4-20 hours)
  // Additional cost based on dependency strength
  sum(dependencyStrength * dependencyHoursRate * hourlyRate) // dependencyHoursRate configurable (1-8 hours)
```

### Components
1. **Base Communication Cost**:
   - Configurable baseline hours per connection
   - Adjusted by communication overhead multiplier
   - Applied to all team connections
   - Example: If baselineHours = 8, each connection requires minimum 8 hours/week

2. **Dependency-Based Cost**:
   - Configurable hours per unit of dependency strength
   - Higher dependency strength = more communication needed
   - Accumulated across all team dependencies
   - Example: If dependencyHoursRate = 3, a dependency strength of 2 requires 6 additional hours

### Example
Given:
- 3 team connections
- 1.2x communication overhead
- $75/hour rate
- Dependency strengths: [2, 3, 1]
- Baseline Hours: 8 (configured down from default 10)
- Dependency Hours Rate: 3 (configured down from default 4)

```
Base Cost = 3 * 1.2 * $75 * 8
         = $2,160

Dependency Cost = (2 * 3 * $75) + (3 * 3 * $75) + (1 * 3 * $75)
                = $450 + $675 + $225
                = $1,350

Total Communication Cost = $2,160 + $1,350
                        = $3,510/week
```

### Impact of Parameter Changes
1. **Baseline Hours Impact**:
   - Increasing baseline hours affects all connections equally
   - Useful for teams with high base communication needs
   - Example: Changing from 8 to 12 hours would increase base cost by 50%

2. **Dependency Hours Rate Impact**:
   - Affects teams proportionally to their dependency strength
   - Higher rate amplifies the cost of strong dependencies
   - Example: Changing from 3 to 6 hours would double dependency-based costs

## 3. Process Overhead

Process overhead accounts for additional coordination and process-related costs.

### Formula
```typescript
processOverhead = 
  sum(dependencyStrength * hourlyRate * 3)
```

### Example
Given:
- Same dependency strengths: [2, 3, 1]
- $75/hour rate

```
processOverhead = (2 * $75 * 3) + (3 * $75 * 3) + (1 * $75 * 3)
                = $450 + $675 + $225
                = $1,350/week
```

## Total Cost Calculation

The total weekly cost is the sum of all three components:

```
totalCost = weeklyMeetingCost + communicationCost + processOverhead
```

Using our examples:
```
totalCost = $5,400 + $3,510 + $1,350
         = $10,260/week
```

## Cost Distribution

The cost distribution shows the relative proportion of each cost component:
- Weekly Meetings: $5,400 (52%)
- Communication: $3,510 (34%)
- Process Overhead: $1,350 (14%)

## Factors Affecting Costs

1. **Team Size Impact**
   - More team members = higher meeting costs
   - Larger teams require more coordination

2. **Dependency Strength Impact**
   - Higher dependency = more communication needed
   - Stronger dependencies increase process overhead

3. **Communication Overhead Multiplier**
   - Ranges from 1.0x to 2.0x
   - Accounts for organizational communication efficiency

## Cost Optimization Opportunities

The analysis suggests optimization when:
- Meeting costs > 40% of total → Consider reducing meeting frequency/attendees
- Communication costs > 40% of total → Review communication channels
- Process overhead > 30% of total → Optimize coordination processes
- Total costs too high relative to team size → Review team structure

## Example Optimization Scenario

If we reduce:
- Meeting duration from 4 to 3 hours
- Attendees from 5 to 4
- Communication overhead from 1.2x to 1.1x

New costs would be:
```
New Meeting Cost = 3 * 4 * $75 * 3 * 1.1
                = $2,970/week

New Communication Cost = (3 * 1.1 * $75 * 10) + $1,800
                      = $2,475 + $1,800
                      = $4,275/week

Process Overhead remains = $1,350/week

New Total = $8,595/week
Savings = $2,655/week
```

This represents a 23.6% cost reduction through targeted optimizations.
``` 