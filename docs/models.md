# Mathematical Models Documentation

## Base Analysis

### Team-Based Model

The team-based cost model calculates the total monthly cost based on team size, hourly rates, and efficiency factors:

```
C_b = n · h · w · η_s · (1 + η_o)

where:
n = team size
h = hourly rate
w = working hours per month (typically 160)
η_s = service efficiency (0-1)
η_o = operational overhead (0-1)
```

### Ticket-Based Model

The ticket-based model calculates costs based on ticket volume and resource requirements:

```
C_t = m · t_h · p · h

where:
m = monthly tickets
t_h = hours per ticket
p = people per ticket
h = vendor hourly rate
```

## Target-Based Planning

### Maximum Allowable Cost

Calculates the maximum investment based on ROI period and savings targets:

```
C_max = min(0.5 · A, 1.5 · S_t)

where:
A = annual labor cost
S_t = target savings over ROI period
```

### Required Efficiency Gains

Determines necessary efficiency improvements to achieve savings:

```
E_req = min(S_m / (n · h · w), M_current)

where:
S_m = desired monthly savings
M_current = current manual work percentage
```

### Break-even Scenarios

Generates scenarios with different timeframes (T) and assumptions:

```
S_required = C_max / T

Assumptions vary by timeframe:
- Conservative (24m): η_e = 15%, η_t = 10%, η_q = 5%
- Moderate (18m): η_e = 25%, η_t = 15%, η_q = 10%
- Aggressive (12m): η_e = 35%, η_t = 20%, η_q = 15%

where:
η_e = efficiency gain
η_t = team reduction
η_q = quality improvement
```

## Process Analysis

### Quality Value

Calculates the potential value of quality improvements:

```
V_q = Q_t · 1.5

where:
Q_t = quality improvement target
```

### Knowledge Retention Impact

Estimates the impact of improved knowledge management:

```
I_k = K_g · 1.2

where:
K_g = knowledge retention goal
```

### Standardization Benefits

Quantifies benefits from process standardization:

```
B_s = S_l · 2

where:
S_l = standardization level
```

## Team Dependencies

### Dependency Impact Score

Calculates the total impact of team dependencies:

```
I_total = Σ(i_n)

where:
i_n = impact level of dependency n
```

### WIP Effects

Measures the impact of work-in-progress limits:

```
E_wip = W_avg · 0.8

where:
W_avg = average WIP limit across teams
```

### Lead Time Optimization

Calculates potential lead time improvements:

```
O_lt = 100 - L_avg

where:
L_avg = average lead time across teams
```

## Solution Cost Models

### Platform Solution

```
C_p = C_b · (1 - α_t) · (1 - α_p) + P_m

where:
α_t = team reduction factor
α_p = process efficiency improvement
P_m = platform maintenance cost
```

### Outsourcing Solution

```
C_o = v · h_b · (1 + β_m) · Q(β_q) · K(β_k, T_t)

where:
v = vendor rate
h_b = baseline hours
β_m = management overhead
β_q = quality impact factor
β_k = knowledge loss factor
T_t = transition time
```

### Hybrid Solution

```
C_h = γ_p · C_p + γ_v · C_o + (1 - γ_p - γ_v) · C_b

where:
γ_p = platform portion
γ_v = vendor portion
C_p = platform solution cost
C_o = outsourcing solution cost
C_b = baseline cost
```
```

