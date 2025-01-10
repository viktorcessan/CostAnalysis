# URL State Encoding Specification

## Overview

This document specifies the encoding format for sharing analysis states via URLs. The encoding is optimized for minimal URL length by using number-based encoding and minimal separators.

## URL Format

```
https://app.com/calculator/{analysis_type}/{model}#s={encoded_state}
```

## Encoding Format

### General Structure
```
v_m_a_d
```
Where:
- v: Version number (e.g., "1")
- m: Model type (1: team, 2: ticket)
- a: Analysis type (1: base, 2: target, 3: team)
- d: Model-specific data (format depends on analysis type)

### Separators
- "_" separates main sections
- "," separates values within sections
- ";" separates subsections

### 1. Base Analysis Encoding

#### Solution Types
- 1: Platform
- 2: Outsource
- 3: Hybrid

#### Team Model Format
```
v_1_1_ts,hr,se,oo;st[,pc,pm,tb,tr,pe][,vr,mo,qi,kl,tt,tc][,pp,vp]
```
Where:
- ts: Team size (number)
- hr: Hourly rate (number)
- se: Service efficiency (0-100)
- oo: Operational overhead (0-100)
- st: Solution type (1,2,3)
- Solution-specific inputs:
  - Platform (st=1):
    - pc: Platform cost
    - pm: Platform maintenance
    - tb: Time to build
    - tr: Team reduction
    - pe: Process efficiency
  - Outsource (st=2):
    - vr: Vendor rate
    - mo: Management overhead
    - qi: Quality impact
    - kl: Knowledge loss
    - tt: Transition time
    - tc: Transition cost
  - Hybrid (st=3):
    - [All platform inputs]
    - [All outsource inputs]
    - pp: Platform portion
    - vp: Vendor portion

Example:
```
1_1_1_10,75,85,20;1,100000,2000,3,30,40
```
Decodes to: Team model, base analysis, 10 team members, $75/hr, 85% efficiency, 20% overhead, platform solution with $100k cost, $2k maintenance, 3 months build, 30% reduction, 40% efficiency

#### Ticket Model Format
```
v_2_1_mt,ht,pt,sc;st[,pc,pm,tb,ar,tr][,vr,mo,qi,kl,tt,tc,vc][,pp,vp]
```
Where:
- mt: Monthly tickets
- ht: Hours per ticket
- pt: People per ticket
- sc: SLA compliance
- st: Solution type (1,2,3)
- Solution-specific inputs (same as team model)

Example:
```
1_2_1_50,4,2,95;2,80,15,-10,20,3,50000
```
Decodes to: Ticket model, base analysis, 50 tickets/month, 4 hours/ticket, 2 people/ticket, 95% SLA, outsource solution with specified parameters

### 2. Target Analysis Encoding

#### Team Model Format
```
v_1_2_[base_inputs];tt,tv,tf[;at,av]*
```
Where:
- [base_inputs]: Same as base analysis
- tt: Target type (1: roi, 2: team, 3: efficiency)
- tv: Target value
- tf: Timeframe
- at,av: Additional targets (optional, can repeat)

#### Ticket Model Format
```
v_2_2_[base_inputs];tt,tv,tf[;at,av]*
```
Same structure as team model but with ticket base inputs

### 3. Team Analysis Encoding
```
v_1_3_at;t1,t2,t3;d1,d2,d3
```
Where:
- at: Analysis type (1: even, 2: hub_spoke)
- t1,t2,t3: Team definitions (id,name,size,efficiency)
- d1,d2,d3: Dependencies (from,to,type,strength)

## Implementation Notes

1. All numbers should be rounded to 2 decimal places
2. Percentages are stored as integers (0-100)
3. No base64 encoding needed - just URL encode the final string
4. Empty/optional values can be omitted
5. Maximum URL length consideration is still needed but much less likely to be hit

## Example Implementation

```typescript
// Encoding
function encodeState(model: string, analysisType: string, data: any): string {
  const version = "1";
  const modelCode = model === 'team' ? '1' : '2';
  const analysisCode = {
    'base': '1',
    'target': '2',
    'team': '3'
  }[analysisType];

  // Encode data based on model and analysis type
  const encodedData = encodeModelData(model, analysisType, data);
  
  return `${version}_${modelCode}_${analysisCode}_${encodedData}`;
}

// Decoding
function decodeState(encoded: string): State {
  const [version, model, analysis, data] = encoded.split('_');
  return {
    version,
    model: model === '1' ? 'team' : 'ticket',
    analysisType: ['base', 'target', 'team'][parseInt(analysis) - 1],
    data: decodeModelData(model, analysis, data)
  };
}
``` 