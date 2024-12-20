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

    // Base monthly cost: team size × hourly rate × working hours
    const baseMonthly = teamSize * hourlyRate * this.WORKING_HOURS;
    
    // Apply service efficiency and operational overhead
    // C_b = n × h × w × η_s × (1 + η_o)
    const monthlyTotal = baseMonthly * serviceEfficiency * (1 + operationalOverhead);

    return {
      initial: 0,
      monthly: monthlyTotal,
      breakdown: {
        labor: baseMonthly,
        efficiency: baseMonthly * (1 - serviceEfficiency),
        overhead: monthlyTotal - (baseMonthly * serviceEfficiency)
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
    const teamReductionFactor = teamReduction;  // [0,1] - 0=no reduction, 1=full reduction
    const processEfficiencyFactor = processEfficiency;  // [0,1] - 0=no improvement, 1=full improvement
    
    // Calculate each component
    const laborCost = baseline.monthly * (1 - teamReductionFactor) * (1 - processEfficiencyFactor);
    const monthlyAfterBuild = laborCost + platformMaintenance;
    
    // Calculate total investment needed to recover
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
        labor: laborCost,
        savings: monthlySavings
      }
    };
  }

  static calculateOutsourceSolution(model, values) {
    const {
      vendorRate,
      managementOverhead,
      qualityImpact,  // [-0.5,0.5] - -0.5=50% worse, 0=same, 0.5=50% better
      knowledgeLoss,
      transitionTime,
      transitionCost = 0
    } = values;

    const baseline = this.calculateBaseline(model, values);
    
    // Calculate vendor costs with all factors
    const baselineHours = baseline.monthly / values.hourlyRate;
    const vendorBase = baselineHours * vendorRate;
    const overheadFactor = 1 + managementOverhead;  // [0,1] overhead becomes [1,2] factor
    const qualityFactor = qualityImpact >= 0 ? 
      (1 - qualityImpact) :  // [0,0.5] becomes [1,0.5] factor (improvement reduces cost)
      (1 + Math.abs(qualityImpact));  // [-0.5,0] becomes [1.5,1] factor (degradation increases cost)
    const knowledgeFactor = 1 + knowledgeLoss * Math.log10(transitionTime + 1);  // [0,1] knowledge loss
    
    const monthlyAfterTransition = vendorBase * overheadFactor * qualityFactor * knowledgeFactor;
    
    // Monthly savings only start after transition
    const monthlySavings = baseline.monthly - monthlyAfterTransition;
    
    // Calculate break-even point
    const breakEvenMonths = monthlySavings > 0 ? Math.ceil(transitionCost / monthlySavings) : Infinity;
    const isViable = breakEvenMonths <= 24;

    return {
      type: 'outsourcing',
      initial: transitionCost,
      monthly: monthlyAfterTransition,
      monthlySavings,
      breakEvenMonths,
      isViable,
      breakdown: {
        vendor: monthlyAfterTransition,
        savings: monthlySavings
      }
    };
  }

  static calculateHybridSolution(model, values) {
    const {
      platformCost,
      platformMaintenance,
      processEfficiency,  // [0,1] - 0=no improvement, 1=full improvement
      vendorRate,
      managementOverhead,  // [0,1] - 0=no overhead, 1=100% overhead
      qualityImpact,  // [-0.5,0.5] - -0.5=50% worse, 0=same, 0.5=50% better
      knowledgeLoss,  // [0,1] - 0=no loss, 1=full loss
      transitionTime,
      platformPortion,  // [0-100] - percentage of work to platform
      vendorPortion,  // [0-100] - percentage of work to vendor
      transitionCost = 0
    } = values;

    if (platformPortion + vendorPortion > 100) {
      throw new Error('Platform and vendor portions cannot exceed 100%');
    }

    const baseline = this.calculateBaseline(model, values);
    
    // Platform portion - using same factors as platform solution
    const platformPercentage = platformPortion / 100;  // Convert to [0,1]
    const processEfficiencyFactor = processEfficiency;  // [0,1]
    const platformLaborCost = baseline.monthly * platformPercentage * (1 - processEfficiencyFactor);
    const platformMonthly = platformLaborCost + platformMaintenance;
    
    // Vendor portion with all factors
    const vendorPercentage = vendorPortion / 100;  // Convert to [0,1]
    const vendorHours = baseline.monthly * vendorPercentage / values.hourlyRate;
    const vendorBase = vendorHours * vendorRate;
    const overheadFactor = 1 + managementOverhead;  // [0,1] overhead becomes [1,2] factor
    const qualityFactor = qualityImpact >= 0 ? 
      (1 - qualityImpact) :  // [0,0.5] becomes [1,0.5] factor (improvement reduces cost)
      (1 + Math.abs(qualityImpact));  // [-0.5,0] becomes [1.5,1] factor (degradation increases cost)
    const knowledgeFactor = 1 + knowledgeLoss * Math.log10(transitionTime + 1);  // [0,1] knowledge loss
    const vendorMonthly = vendorBase * overheadFactor * qualityFactor * knowledgeFactor;
    
    // Internal portion (remaining work)
    const internalPercentage = (100 - platformPortion - vendorPortion) / 100;  // Convert to [0,1]
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
        platformLabor: platformLaborCost,
        vendor: vendorMonthly,
        internal: internalMonthly,
        savings: monthlySavings
      }
    };
  }
} 