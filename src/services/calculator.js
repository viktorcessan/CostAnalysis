export class CalculatorService {
  static MONTHS = 24;
  static WORKING_HOURS = 160;

  static calculate(model, solution, values) {
    const baselineCosts = this.calculateBaseline(model, values);
    const solutionCosts = this.calculateSolution(model, solution, values);
    
    const monthlySavings = baselineCosts.monthly - solutionCosts.monthly;
    const monthlyData = Array(this.MONTHS).fill(0).map((_, month) => {
      const baseline = baselineCosts.monthly * (month + 1);
      const solution = solutionCosts.monthly * (month + 1) + solutionCosts.initial;
      return {
        month: month + 1,
        baseline,
        solution,
        savings: baseline - solution
      };
    });

    const breakevenMonth = monthlyData.findIndex(data => data.savings > 0) + 1;
    
    return {
      baseline: baselineCosts,
      solution: solutionCosts,
      monthly: monthlySavings,
      breakeven: breakevenMonth,
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
      processEfficiency
    } = values;

    const baseline = this.calculateBaseline(model, values);
    const efficiencyGain = 1 - processEfficiency;
    const teamReductionFactor = 1 - teamReduction;
    
    const monthlyTotal = baseline.monthly * efficiencyGain * teamReductionFactor + platformMaintenance;

    return {
      initial: platformCost,
      monthly: monthlyTotal,
      breakdown: {
        platform: platformMaintenance,
        labor: baseline.monthly * teamReductionFactor * efficiencyGain
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
    
    // Add overhead factors
    const overheadFactor = 1 + managementOverhead;
    const qualityFactor = 1 + qualityImpact;
    const knowledgeFactor = 1 + knowledgeLoss;
    
    const monthlyTotal = vendorMonthly * overheadFactor * qualityFactor * knowledgeFactor;

    return {
      initial: transitionCost,
      monthly: monthlyTotal,
      breakdown: {
        vendor: vendorMonthly,
        overhead: vendorMonthly * managementOverhead,
        quality: vendorMonthly * qualityImpact,
        knowledge: vendorMonthly * knowledgeLoss
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
      workSplit
    } = values;

    const baseline = this.calculateBaseline(model, values);
    
    // Platform portion
    const platformPortion = workSplit;
    const platformEfficiency = 1 - processEfficiency;
    const platformMonthly = baseline.monthly * platformPortion * platformEfficiency + platformMaintenance;
    
    // Vendor portion - removed quality impact factor
    const vendorPortion = 1 - workSplit;
    const baselineHours = (baseline.monthly * vendorPortion) / values.hourlyRate;
    const vendorMonthly = baselineHours * vendorRate * (1 + managementOverhead);
    
    const monthlyTotal = platformMonthly + vendorMonthly;

    return {
      initial: platformCost,
      monthly: monthlyTotal,
      breakdown: {
        platform: platformMaintenance,
        platformLabor: baseline.monthly * platformPortion * platformEfficiency,
        vendor: vendorMonthly
      }
    };
  }
} 