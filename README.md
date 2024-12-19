# Platform Cost Analysis

A comprehensive tool for analyzing service delivery models and their associated costs. Compare different service delivery approaches and make data-driven decisions about service transformation initiatives.

## Features

- Team-Based and Ticket-Based cost models
- Platform, Outsourcing, and Hybrid solution analysis
- Interactive cost calculations and break-even analysis
- Comprehensive charts and visualizations
- PDF and Excel export capabilities
- Detailed technical documentation with LaTeX formulas

## Models

### Team-Based Model

Base cost calculation:
```math
C_b = n \cdot h \cdot w \cdot \eta_s \cdot (1 + \eta_o)
```
Where:
- n = team size (FTEs)
- h = hourly rate
- w = working hours
- η_s = service efficiency
- η_o = operational overhead

### Ticket-Based Model

Base cost calculation:
```math
C_t = m \cdot t_h \cdot p \cdot h
```
Where:
- m = monthly tickets
- t_h = hours per ticket
- p = people per ticket
- h = hourly rate

## Solutions

### Platform Solution

Cost calculation:
```math
C_p = C_b \cdot (1 - \alpha_t) \cdot (1 - \alpha_p) + P_m
```
Where:
- α_t = team reduction
- α_p = process efficiency
- P_m = monthly maintenance

### Outsourcing Solution

Cost calculation:
```math
C_o = v \cdot w \cdot n \cdot (1 + \beta_m) \cdot Q(\beta_q) \cdot (1 + \beta_k \cdot \log_{10}(T_t + 1))
```
Where:
- v = vendor rate
- β_m = management overhead
- β_q = quality impact
- β_k = knowledge loss
- T_t = transition time

Quality impact function:
```math
Q(\beta_q) = \begin{cases}
    1 - \beta_q & \text{if } \beta_q \geq 0 \text{ (quality improvement)} \\
    1 + |\beta_q| & \text{if } \beta_q < 0 \text{ (quality degradation)}
\end{cases}
```

### Hybrid Solution

Cost calculation:
```math
C_h = \gamma_p \cdot C_p + \gamma_o \cdot C_o + (1 - \gamma_p - \gamma_o) \cdot C_b
```
Where:
- γ_p = platform portion [0,1]
- γ_o = outsourced portion [0,1]
- 1 - γ_p - γ_o = internal portion

## Break-Even Analysis

For any solution s, the break-even period T_be is calculated as:
```math
T_{be} = \begin{cases}
    \lceil\frac{I_s}{C_b - C_s}\rceil & \text{if } C_b > C_s \\
    \infty & \text{otherwise}
\end{cases}
```
Where:
- I_s = Initial investment for solution s
- C_s = Monthly cost for solution s
- Solution is viable if T_be ≤ 24 months

## Usage

1. Select your base model (Team-Based or Ticket-Based)
2. Enter your current operational parameters
3. Choose a transformation solution
4. Configure solution parameters
5. Review cost analysis and break-even calculations
6. Export results in PDF or Excel format

## Documentation

For detailed information about the models and calculations, see:
- [Models Documentation](docs/models.md)
- [Technical Definitions](docs/definitions.tex)

