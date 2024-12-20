export class CalculatorService {
  static MONTHS = 24;
  static WORKING_HOURS = 160;

  static calculate(model, solution, values) {
    const baselineCosts = this.calculateBaseline(model, values);
    const solutionCosts = this.calculateSolution(model, solution, values);
    
    let monthlyData;
    let breakevenMonth;
    
    if (solution === 'platform') {
      const buildTime = values.timeToBuild || 3;
      monthlyData = Array(this.MONTHS).fill(0).map((_, month) => {
        const baseline = baselineCosts.monthly * (month + 1);
        let solutionCost;
        
        if (month < buildTime) {
          solutionCost = solutionCosts.initial + (baselineCosts.monthly * (month + 1));
        } else {
          const operationalMonths = month + 1 - buildTime;
          solutionCost = solutionCosts.initial + 
                        (baselineCosts.monthly * buildTime) + 
                        (solutionCosts.monthly * operationalMonths);
        }
        
        return {
          month: month + 1,
          baseline,
          solution: solutionCost,
          savings: baseline - solutionCost
        };
      });
      
      breakevenMonth = monthlyData.findIndex((data, index) => 
        index >= buildTime && data.savings > 0
      ) + 1;
      
    } else {
      monthlyData = Array(this.MONTHS).fill(0).map((_, month) => {
        const baseline = baselineCosts.monthly * (month + 1);
        const solutionCost = solutionCosts.monthly * (month + 1) + solutionCosts.initial;
        
        return {
          month: month + 1,
          baseline,
          solution: solutionCost,
          savings: baseline - solutionCost
        };
      });
      
      breakevenMonth = monthlyData.findIndex(data => data.savings > 0) + 1;
    }
    
    const monthlySavings = baselineCosts.monthly - solutionCosts.monthly;
    let breakeven = null;

    if (monthlySavings > 0) {
      if (breakevenMonth > 0 && breakevenMonth <= this.MONTHS) {
        breakeven = breakevenMonth;
      } else {
        const totalInvestment = solutionCosts.initial + 
          (solution === 'platform' ? baselineCosts.monthly * (values.timeToBuild || 3) : 0);
        breakeven = Math.ceil(totalInvestment / monthlySavings);
      }
    }
    
    return {
      baseline: baselineCosts,
      solution: {
        ...solutionCosts,
        type: solution
      },
      monthly: monthlySavings,
      breakeven: breakeven,
      data: monthlyData
    };
  }

  static calculateBaseline(model, values) {
    switch (model) {
      case 'team':
        return this.calculateTeamBaseline(values);
      case 'ticket':
        return this.calculateTicketBaseline(values);
      default:
        throw new Error(`Unknown model: ${model}`);
    }
  }

  static calculateSolution(model, solution, values) {
    switch (solution) {
      case 'platform':
        return this.calculatePlatformSolution(model, values);
      case 'outsource':
        return this.calculateOutsourceSolution(model, values);
      case 'hybrid':
        return this.calculateHybridSolution(model, values);
      default:
        throw new Error(`Unknown solution: ${solution}`);
    }
  }

  static calculateTeamBaseline(values) {
    const {
      teamSize,
      hourlyRate,
      serviceEfficiency,
      operationalOverhead
    } = values;

    const baseMonthly = teamSize * hourlyRate * this.WORKING_HOURS;
    const inefficiencyFactor = 1 + (1 - serviceEfficiency) + operationalOverhead;
    const monthlyTotal = baseMonthly * inefficiencyFactor;

    return {
      initial: 0,
      monthly: monthlyTotal,
      breakdown: {
        labor: baseMonthly,
        inefficiency: baseMonthly * (1 - serviceEfficiency),
        overhead: baseMonthly * operationalOverhead
      }
    };
  }

  static calculateTicketBaseline(values) {
    const {
      monthlyTickets,
      hoursPerTicket,
      peoplePerTicket,
      hourlyRate
    } = values;

    const monthlyHours = monthlyTickets * hoursPerTicket * peoplePerTicket;
    const monthlyTotal = monthlyHours * hourlyRate;

    return {
      initial: 0,
      monthly: monthlyTotal,
      breakdown: {
        labor: monthlyTotal
      }
    };
  }

  static calculatePlatformSolution(model, values) {
    const {
      platformCost,
      platformMaintenance,
      teamReduction,
      processEfficiency,
      timeToBuild = 3
    } = values;

    const baseline = this.calculateBaseline(model, values);
    
    // Calculate reduced monthly costs after platform is built
    const teamReductionFactor = 1 - (teamReduction / 100);
    const efficiencyGain = 1 - (processEfficiency / 100);
    const monthlyAfterBuild = baseline.monthly * teamReductionFactor * efficiencyGain + platformMaintenance;
    
    // Calculate total investment needed to recover
    // This includes: platform cost + (baseline costs during build - reduced costs during build)
    const buildPeriodDelta = baseline.monthly * timeToBuild;
    const totalInvestment = platformCost + buildPeriodDelta;
    
    // Monthly savings only start after build period
    const monthlySavings = baseline.monthly - monthlyAfterBuild;
    
    // Calculate break-even point
    let breakEvenMonths = null;
    if (monthlySavings > 0) {
      const recoveryMonths = Math.ceil(totalInvestment / monthlySavings);
      breakEvenMonths = timeToBuild + recoveryMonths;
    }

    return {
      type: 'platform',
      initial: platformCost,
      monthly: monthlyAfterBuild,
      monthlySavings,
      timeToBuild,
      buildPeriodCost: buildPeriodDelta,
      breakEvenMonths,
      breakdown: {
        platform: platformMaintenance,
        labor: baseline.monthly * teamReductionFactor * efficiencyGain,
        savings: monthlySavings
      }
    };
  }

  static calculateOutsourceSolution(model, values) {
    const {
      vendorRate,
      managementOverhead,
      qualityImpact,
      knowledgeLoss,
      transitionTime,
      transitionCost
    } = values;

    const baseline = this.calculateBaseline(model, values);
    
    // Convert baseline cost to equivalent vendor hours
    const baselineHours = baseline.monthly / values.hourlyRate;
    const vendorMonthly = baselineHours * vendorRate;
    
    // Add overhead factors with proper percentage conversion
    const overheadFactor = 1 + (managementOverhead / 100);
    const qualityFactor = qualityImpact >= 0 ? 
      (1 - qualityImpact / 100) : // Improved quality reduces cost
      (1 + Math.abs(qualityImpact) / 100); // Degraded quality increases cost
    const knowledgeFactor = 1 + (knowledgeLoss / 100) * Math.log10(transitionTime + 1);
    
    const monthlyTotal = vendorMonthly * overheadFactor * qualityFactor * knowledgeFactor;
    const monthlySavings = baseline.monthly - monthlyTotal;
    
    // Calculate break-even months, handle case where it exceeds 24
    const breakEvenMonths = monthlySavings > 0 ? Math.ceil(transitionCost / monthlySavings) : Infinity;
    const isViable = breakEvenMonths <= 24;

    return {
      initial: transitionCost,
      monthly: monthlyTotal,
      monthlySavings: monthlySavings,
      breakEvenMonths: breakEvenMonths,
      isViable: isViable,
      breakdown: {
        vendor: vendorMonthly,
        overhead: vendorMonthly * (overheadFactor - 1),
        quality: vendorMonthly * (qualityFactor - 1),
        knowledge: vendorMonthly * (knowledgeFactor - 1),
        savings: monthlySavings
      }
    };
  }

  static calculateHybridSolution(model, values) {
    const {
      platformCost,
      platformMaintenance,
      processEfficiency,
      vendorRate,
      managementOverhead,
      qualityImpact,
      knowledgeLoss,
      transitionTime,
      platformPortion,
      vendorPortion,
      transitionCost = 0
    } = values;

    if (platformPortion + vendorPortion > 100) {
      throw new Error('Platform and vendor portions cannot exceed 100%');
    }

    const baseline = this.calculateBaseline(model, values);
    
    // Platform portion
    const platformPercentage = platformPortion / 100;
    const platformEfficiency = 1 - (processEfficiency / 100);
    const platformMonthly = baseline.monthly * platformPercentage * platformEfficiency + platformMaintenance;
    
    // Vendor portion with all factors
    const vendorPercentage = vendorPortion / 100;
    const baselineHours = (baseline.monthly * vendorPercentage) / values.hourlyRate;
    const vendorBase = baselineHours * vendorRate;
    const overheadFactor = 1 + (managementOverhead / 100);
    const qualityFactor = qualityImpact >= 0 ? 
      (1 - qualityImpact / 100) : 
      (1 + Math.abs(qualityImpact) / 100);
    const knowledgeFactor = 1 + (knowledgeLoss / 100) * Math.log10(transitionTime + 1);
    const vendorMonthly = vendorBase * overheadFactor * qualityFactor * knowledgeFactor;
    
    // Internal portion
    const internalPercentage = 1 - (platformPercentage + vendorPercentage);
    const internalMonthly = baseline.monthly * internalPercentage;
    
    const monthlyTotal = platformMonthly + vendorMonthly + internalMonthly;
    const monthlySavings = baseline.monthly - monthlyTotal;
    
    // Calculate break-even months, handle case where it exceeds 24
    const totalInitialCost = platformCost + (transitionCost * vendorPercentage);
    const breakEvenMonths = monthlySavings > 0 ? Math.ceil(totalInitialCost / monthlySavings) : Infinity;
    const isViable = breakEvenMonths <= 24;

    return {
      initial: totalInitialCost,
      monthly: monthlyTotal,
      monthlySavings: monthlySavings,
      breakEvenMonths: breakEvenMonths,
      isViable: isViable,
      breakdown: {
        platform: platformMaintenance,
        platformLabor: baseline.monthly * platformPercentage * platformEfficiency,
        vendor: vendorMonthly,
        internal: internalMonthly,
        savings: monthlySavings
      }
    };
  }
} 