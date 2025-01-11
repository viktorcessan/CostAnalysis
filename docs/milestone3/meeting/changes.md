# Global Changes
1. Remove all decimals in graphs and cost analysis
2. Reduce slider decimals to max 1 decimal
3. Copy changes pending:
   - Change "team size reduction" to "Time freed up"
   - Change mode names to: "Build Business Case", "Define Platform Budget", "Reveal Team Dependency Costs"
   - Rename "Service Calculator" to "Operations Cost Planning"

# Questions & Observations

## Base Analysis Questions
1. **Knowledge Loss Impact Question**
   - Q: When analyzing outsourcing using the Team based financing model, what financial metric does knowledge loss extend/negatively impact?
   - A: Knowledge loss impacts and extends the Total Monthly Cost through a Knowledge Factor multiplier. Here's how it works specifically:
     - The Knowledge Factor is calculated as:
     - This Knowledge Factor is then multiplied with the base outsourcing costs (which include vendor costs and management overhead) to increase the Total Monthly Cost:
     - The key points about how knowledge loss impacts costs:
     - The impact grows logarithmically with the transition time - meaning longer transitions amplify the cost impact of knowledge loss
     - The knowledge loss percentage (0-50%) directly affects how much the monthly costs increase
     - The impact is multiplicative - it increases the entire base cost structure rather than just adding a fixed amount
     - The longer the transition period, the more the knowledge loss impacts total costs due to the logarithmic scaling
     - This means that high knowledge loss percentages combined with longer transition times can significantly increase the total monthly operating costs of the outsourcing solution, potentially making it less financially viable compared to other options.

2. **Resolution Time Metric Question**
   - Q: With ticket based model, it is supposed to extend the hours per ticket, but that field does not exist in the team based, so is it in use? Or should we add "average resolution time as a field for team based model?
   - A: The team model already accounts for time through the serviceEfficiency metric which measures "actual Operations Costs time"
   - Service efficiency is used in the base cost calculation: Team Size × Hourly Rate × 160 × Service Efficiency × (1 + Overhead)
   - The model is designed to look at team capacity as a whole rather than individual transaction times

## Graph & UI Issues
1. **Outsourcing Graph Issues**
   - Missing legend for graphs under outsourcing
   - Graphs show incorrect direction when cost is negative (should show added costs, not reduced costs)

2. **Monthly Savings Visualization**
   - Costs should accumulate and become higher since the cost is 12277 higher, but the graph shows lower
   - Suggestion: Use red color when there is a cost increase
   - Alternative: Invert Y-axis to show it more clearly

3. **Platform ROI Projection Issues**
   - Monthly cost for platform ROI projection (find break even point) works wrong when the projection is negative
   - Currently capped at the cost of monthly maintenance
   - Example case: team of 10 people, 100usd hourly rate, service efficiency 100%, overhead 0%
   - Issue: Results indicate the additional monthly cost is only the monthly maintenance cost, but because we can never break even on the extra investment we also make a huge loss which is not visible anywhere

4. **Outsourcing Math Concerns**
   - Issue: Management overhead calculation has disproportionate impact on costs
   - Current Implementation:
     - Management overhead (0-100%) is applied as direct multiplier to base vendor cost
     - Formula: Total Cost = Base Cost × (1 + Management Overhead)
     - Example: 25% overhead increases total cost by 25%
   - Problems:
     - Direct percentage multiplier creates too large an impact
     - Overhead is applied to entire vendor cost rather than just management portion
     - Current naming doesn't clearly indicate it affects total cost
   - Proposed Solution:
     - Rename to "Management Cost %" for clarity
     - Reduce slider range to 0-50% (more realistic range)
     - Apply overhead only to management portion:
       New Formula: Total Cost = Base Cost + (Base Cost × Management % × Management Factor)
       where Management Factor = 0.5 (meaning management cost is max 25% of base cost)
     - This means:
       - 0% = No additional management cost
       - 25% = Additional 12.5% of base cost
       - 50% = Additional 25% of base cost
   - Implementation:
     - Update slider label and tooltip
     - Modify cost calculation formula
     - Update constraints.managementOverhead.max to 0.5
     - Add managementFactor constant = 0.5

5. **Platform Mode Graph**
   - Q: The graph under Find break even point for "Platform mode" looks a bit incorrect?
   - Observation: Not sure if the cost is supposed to be logarithmic like that?

6. **Monthly Cost Calculation Question**
   - Q: Is the monthly cost before the platform completion "platform cost/time to build"?
   - Q: And then after that the ongoing costs = (time size * hourly rate) - (team reduction * hourly rate) * process efficiency gains?

7. **Break Even Visualization**
   - Break even missing on monthly savings graph
   - Would be great if there could be a break even marker on the monthly savings view for platforms
   - Would help users know when the accumulated savings offset the early investment
