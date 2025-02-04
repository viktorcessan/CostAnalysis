# Build vs Buy Analysis Logic

This document explains the scoring and confidence calculation logic used in the build vs buy analysis tool.

## Overview

The analysis uses a multi-dimensional scoring system that evaluates six key dimensions:
1. Business Criticality
2. Time to Implement
3. Cost Efficiency
4. Solution Control
5. Team Competency
6. Market Fit

Each dimension is scored on a scale of 1-5, where 5 represents the best score. The final recommendation is based on the weighted sum of these scores, and the confidence level is calculated based on the score differential.

## Section-by-Section Scoring

### 1. Define your Need (Solution Type)
The solution type affects the weighting of other factors but doesn't contribute directly to scoring:
- Platform: Increases weight of control and competency factors
- Application: Balanced weighting across all factors
- Component: Increases weight of market fit and cost factors

### 2. Business Impact & Timeline

#### Business Role
Affects Business Criticality score:
- Critical path for revenue (5 points)
  - Build: +5 (full control needed)
  - Buy: +5 (proven solutions preferred)
- Business enabling (3 points)
  - Build: +3
  - Buy: +3
- Internal supporting (1 point)
  - Build: +1
  - Buy: +1

#### Timeline Needed
Affects Time to Implement score:
- 0-3 months
  - Build: +1 (challenging to build quickly)
  - Buy: +5 (quick deployment)
- 3-6 months
  - Build: +2
  - Buy: +4
- 6-12 months
  - Build: +3
  - Buy: +3
- 12-24 months
  - Build: +4
  - Buy: +2

#### Usage Duration
Affects Cost Efficiency score multiplier:
- <1 year: 0.8x multiplier
- 1-3 years: 1.0x multiplier
- 3-5 years: 1.2x multiplier
- >5 years: 1.5x multiplier

### 3. Market Maturity

The market maturity scoring uses a combination matrix of four factors:
- Market Standardization (High/Medium/Low)
- Speed of Evolution (Fast/Moderate/Slow)
- Solution Fit (High/Medium/Low)
- Solution Type Availability (Open Source/Commercial/Both/None)

#### Solution Type Availability
Initial Market Fit modifier based on available solutions:
- Both (Commercial & Open Source):
  - Buy: +2 (more options and flexibility)
  - Build: -1 (reinventing the wheel)
  Additional factors:
  - If market standardization is high: Buy score +1
  - If solution fit is high: Buy score +1
  
- Commercial Only:
  - Buy: +1 (proven solutions but less flexibility)
  - Build: No adjustment
  Additional factors:
  - If cost efficiency score is low (>20% more expensive than build): Build score +1
  - If control needed is "Full control": Build score +1

- Open Source Only:
  - Buy: +1 (flexible implementation)
  - Build: No adjustment
  Additional factors:
  - If control needed is "Full control": Build score +1
  - If timeline needed is "0-3 months": Buy score +1
  
- None Available:
  - Buy: -2 (high risk)
  - Build: +2 (only viable option)
  Additional factors:
  - If market evolution is "Fast": Build score +1
  - If business role is "Critical path": Build score +1

These modifiers are applied before the Market Evolution & Standardization Matrix calculations.

#### Market Evolution & Standardization Matrix
Combined impact on Market Fit score:

| Standardization | Evolution Speed | Solution Fit | Build Score | Buy Score | Notes |
|----------------|-----------------|--------------|-------------|-----------|--------|
| High           | Slow           | High         | +1          | +5        | Strong buy signal - mature, stable market |
| High           | Slow           | Medium       | +2          | +4        | Buy leaning - proven solutions available |
| High           | Slow           | Low          | +3          | +3        | Tie - might need customization |
| High           | Moderate       | High         | +2          | +4        | Buy leaning - manageable change pace |
| High           | Moderate       | Medium       | +3          | +3        | Tie - evaluate other factors |
| High           | Moderate       | Low          | +4          | +2        | Build leaning - significant customization needed |
| High           | Fast           | High         | +3          | +3        | Tie - rapid changes require adaptability |
| High           | Fast           | Medium       | +3          | +3        | Tie - consider team capabilities |
| High           | Fast           | Low          | +4          | +2        | Build leaning - custom needs in dynamic space |
| Low            | Slow           | High         | +3          | +3        | Tie - unique but stable requirements |
| Low            | Slow           | Medium       | +4          | +2        | Build leaning - non-commercialized space |
| Low            | Slow           | Low          | +5          | +1        | Strong build signal - custom solution needed |
| Low            | Moderate       | High         | +2          | +4        | Buy leaning - unique solution exists |
| Low            | Moderate       | Medium       | +3          | +3        | Tie - evaluate strategic importance |
| Low            | Moderate       | Low          | +4          | +2        | Build leaning - market gaps |
| Low            | Fast           | High         | +1          | +5        | Strong buy signal - leverage market innovation |
| Low            | Fast           | Medium       | +3          | +3        | Tie - complex decision space |
| Low            | Fast           | Low          | +5          | +1        | Strong build signal - custom innovation needed |

#### Confidence Adjustments
Market conditions affect confidence levels:

##### Evolution Speed Impact
- Fast: -15% confidence (high uncertainty)
- Moderate: No adjustment
- Slow: +10% confidence (stable environment)

##### Standardization Impact
- High: +10% confidence (clear patterns)
- Moderate: No adjustment
- Low: -10% confidence (unclear patterns)

##### Solution Fit Impact
- High: +10% confidence
- Medium: No adjustment
- Low: -10% confidence

#### Alternative Solutions Count
Additional modifier to Market Fit score:
- None: 
  - Build: +1 additional point
  - Buy: -1 point
- 1-3:
  - Build: No adjustment
  - Buy: No adjustment
- 4-10:
  - Buy: +1 additional point
  - Build: No adjustment
- >10:
  - Buy: +2 additional points
  - Build: -1 point

### 4. Build Capability

#### Control Needed
Affects Solution Control score:
- Full control:
  - Build: +5
  - Buy: +1
- Partial control:
  - Build: +3
  - Buy: +3
- Standard control:
  - Build: +1
  - Buy: +5

#### Team Competency
Affects Team Competency score:
- Ready now:
  - Build: +5
  - Buy: +3
- Ready with investment:
  - Build: +3
  - Buy: +4
- Significant gaps:
  - Build: +1
  - Buy: +5

### 5. Costs Analysis

#### Cost Efficiency Score
Calculated based on total cost of ownership (TCO):
```
Build TCO = (Build Cost + (Yearly Maintenance × Usage Duration))
Buy TCO = (License Cost + Implementation Cost + (Yearly Costs × Usage Duration))
```

Cost score is then calculated:
- If Build TCO < Buy TCO by >20%:
  - Build: +5
  - Buy: +2
- If TCOs within 20%:
  - Build: +3
  - Buy: +3
- If Buy TCO < Build TCO by >20%:
  - Build: +2
  - Buy: +5

### 6. Strategic Assessment

#### Strategic Alignment
Affects final recommendation weighting:
- Core to differentiation:
  - Build: +2 to all scores
  - Buy: No adjustment
- Necessary for operations:
  - Build: +1 to all scores
  - Buy: +1 to all scores
- Nice to have:
  - Build: No adjustment
  - Buy: +1 to all scores
- Cost of doing business:
  - Build: -1 to all scores
  - Buy: +2 to all scores

## Final Calculations

### Total Score Calculation
```
Total Score = Sum of all dimension scores × Strategic weight
Maximum possible score = 30 points (6 dimensions × 5 points)
```

### Confidence Calculation
```
Base Confidence = (|Build Score - Buy Score| / Maximum Score Difference) × 100

Adjustments:
+ Market evolution modifier (-10% to +10%)
+ Number of alternatives modifier (-10% to +10%)
+ Cost differential modifier (-20% to +20%)
```

### Final Recommendation Logic
```javascript
if (buildTotal > buyTotal + 6) {
  recommendation = 'Build';
} else if (buyTotal > buildTotal + 6) {
  recommendation = 'Buy';
} else {
  recommendation = 'Tie - Consider Other Factors';
}
```
