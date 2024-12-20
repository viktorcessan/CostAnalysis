# Cost Analysis Models Documentation

This document provides detailed information about the cost analysis models used in the application.

## Base Models

### Team-Based Model

The team-based model calculates costs based on the full-time equivalent (FTE) team size and associated parameters.

Base cost calculation:
```math
C_b = n \cdot h \cdot w \cdot \eta_s \cdot (1 + \eta_o)
```

Parameters:
- n: Team size in FTEs
- h: Hourly rate per FTE
- w: Working hours per month
- η_s: Service efficiency factor [0,1]
- η_o: Operational overhead factor [0,∞)

### Ticket-Based Model

The ticket-based model calculates costs based on the volume of tickets and effort required per ticket.

Base cost calculation:
```math
C_t = m \cdot t_h \cdot p \cdot h
```

Parameters:
- m: Monthly ticket volume
- t_h: Average hours per ticket
- p: Average people per ticket
- h: Hourly rate

## Transformation Solutions

### Platform Solution

The platform solution aims to reduce costs through automation and process efficiency.

Cost calculation:
```math
C_p = C_b \cdot (1 - \alpha_t) \cdot (1 - \alpha_p) + P_m
```

Parameters:
- α_t: Team reduction factor [0,1]
- α_p: Process efficiency improvement [0,1]
- P_m: Monthly platform maintenance cost
- C_b: Base cost (from team or ticket model)
- T_b: Time to build (months)

Break-even calculation:
```math
T_{be} = \begin{cases}
    T_b + \lceil\frac{P_i}{C_b - C_p}\rceil & \text{if } C_b > C_p \\
    \infty & \text{otherwise}
\end{cases}
```

The break-even period includes both:
- Initial build time (T_b)
- Time to recover investment through savings

### Outsourcing Solution

The outsourcing solution considers vendor rates, quality impact, and knowledge loss over time.

Cost calculation:
```math
C_o = v \cdot w \cdot n \cdot (1 + \beta_m) \cdot Q(\beta_q) \cdot (1 + \beta_k \cdot \log_{10}(T_t + 1))
```

Parameters:
- v: Vendor hourly rate
- w: Working hours per month
- n: Team size in FTEs
- β_m: Management overhead factor [0,∞)
- β_q: Quality impact factor [-1,1]
- β_k: Knowledge loss factor [0,1]
- T_t: Time since transition (months)

Quality impact function:
```math
Q(\beta_q) = \begin{cases}
    1 - \beta_q & \text{if } \beta_q \geq 0 \text{ (quality improvement)} \\
    1 + |\beta_q| & \text{if } \beta_q < 0 \text{ (quality degradation)}
\end{cases}
```

### Hybrid Solution

The hybrid solution combines platform, outsourcing, and internal delivery.

Cost calculation:
```math
C_h = \gamma_p \cdot C_p + \gamma_o \cdot C_o + (1 - \gamma_p - \gamma_o) \cdot C_b
```

Parameters:
- γ_p: Platform portion [0,1]
- γ_o: Outsourced portion [0,1]
- 1 - γ_p - γ_o: Internal portion
- C_p: Platform solution cost
- C_o: Outsourcing solution cost
- C_b: Base cost

## Break-Even Analysis

The break-even analysis determines how long it takes for a solution to become cost-effective.

Break-even period calculation:
```math
T_{be} = \begin{cases}
    \lceil\frac{I_s}{C_b - C_s}\rceil & \text{if } C_b > C_s \\
    \infty & \text{otherwise}
\end{cases}
```

For platform solutions, the build time T_b is added to this period.

Parameters:
- I_s: Initial investment for solution s
- C_b: Current base cost
- C_s: Monthly cost for solution s
- T_b: Time to build (for platform solutions)

A solution is considered viable if T_be ≤ 24 months.

## Cost Structure

Each solution includes the following cost components:

1. Base Pay
   - Regular working hours
   - Standard rates

2. Operational Costs
   - Management overhead
   - Tools and infrastructure
   - Training and documentation

3. Transition Costs (where applicable)
   - Knowledge transfer
   - Setup and configuration
   - Initial training

4. Quality Impact Costs
   - Service level adjustments
   - Rework and corrections
   - Customer satisfaction measures

## Implementation Notes

1. All monetary values should be in the same currency
2. Time periods are calculated in months
3. Percentages are expressed as decimals [0,1]
4. Logarithmic functions use base 10
5. Ceiling function is used for break-even calculations
```

