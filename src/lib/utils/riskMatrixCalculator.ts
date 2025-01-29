// Types for risk assessment
export type RiskProbability = 1 | 2 | 3 | 4 | 5;
export type RiskSeverity = 1 | 2 | 3 | 4 | 5;

export interface RiskAssessment {
    id: string;
    label: string;
    description: string;
    probability: RiskProbability;
    severity: RiskSeverity;
    details: {
        probabilityFactors: string[];
        severityFactors: string[];
        reasoning: string[];
        calculation: {
            probability: string[];
            severity: string[];
        };
    };
}

export interface RiskMatrix {
    buildRisks: RiskAssessment[];
    buyRisks: RiskAssessment[];
}

// Form state interface
export interface RiskFormState {
    solutionType: string;
    businessRole: string;
    timelineNeeded: string;
    usageDuration: string;
    alternativeSolutions: string;
    marketEvolution: string;
    marketStandardization: string;
    teamCompetency: string;
    controlNeeded: string;
    buildFTEs: number;
    strategicAlignment: string;
    alternativeFitness: string;
}

// Helper function to cap risk scores between 1 and 5
function capRiskScore(score: number): RiskProbability | RiskSeverity {
    return Math.min(Math.max(Math.round(score), 1), 5) as RiskProbability | RiskSeverity;
}

// Build Risk Calculations
function calculateDeliveryDelays(state: RiskFormState): RiskAssessment {
    let probability = 3;
    let severity = 3;

    const probabilityFactors = [];
    const severityFactors = [];

    // Probability factors
    if (state.teamCompetency === 'full') {
        probability -= 1;
        probabilityFactors.push("Team has full expertise (-1)");
    } else if (state.teamCompetency === 'none') {
        probability += 1;
        probabilityFactors.push("Team lacks expertise (+1)");
    }

    if (state.timelineNeeded === '0-3') {
        probability += 2;
        probabilityFactors.push("Very short timeline increases pressure (+2)");
    } else if (state.timelineNeeded === '3-6') {
        probability += 1;
        probabilityFactors.push("Short timeline adds pressure (+1)");
    } else if (state.timelineNeeded === '12-24') {
        probability -= 1;
        probabilityFactors.push("Extended timeline reduces pressure (-1)");
    }

    if (state.solutionType === 'platform') {
        probability += 1;
        probabilityFactors.push("Platform complexity increases delay risk (+1)");
    } else if (state.solutionType === 'component') {
        probability -= 1;
        probabilityFactors.push("Component simplicity reduces delay risk (-1)");
    }

    // Severity factors
    if (state.businessRole === 'critical') {
        severity += 2;
        severityFactors.push("Critical business function increases impact (+2)");
    } else if (state.businessRole === 'enabling') {
        severity += 1;
        severityFactors.push("Business enabling function moderates impact (+1)");
    }

    if (state.timelineNeeded === '0-3') {
        severity += 1;
        severityFactors.push("Immediate timeline amplifies delay impact (+1)");
    }

    return {
        id: 'delivery-delays',
        label: 'Delivery Delays',
        description: 'Risk of project timeline overruns and scope delays',
        probability: capRiskScore(probability),
        severity: capRiskScore(severity),
        details: {
            probabilityFactors,
            severityFactors,
            reasoning: [
                "Team capability directly impacts delivery speed and quality",
                "Shorter timelines leave less room for recovery from delays",
                "Complex solutions (platforms) have more potential delay points",
                "Business criticality affects impact of delays"
            ],
            calculation: {
                probability: [
                    "Base score: 3",
                    "Team competency adjustment: -1 to +1",
                    "Timeline pressure: -1 to +2",
                    "Solution complexity: -1 to +1"
                ],
                severity: [
                    "Base score: 3",
                    "Business role impact: 0 to +2",
                    "Timeline urgency: 0 to +1"
                ]
            }
        }
    };
}

function calculateTechnicalDebt(state: RiskFormState): RiskAssessment {
    let probability = 3;
    let severity = 3;

    const probabilityFactors = [];
    const severityFactors = [];

    // Probability factors
    if (state.teamCompetency === 'full') {
        probability -= 2;
        probabilityFactors.push("Team has full expertise reduces debt risk (-2)");
    } else if (state.teamCompetency === 'none') {
        probability += 2;
        probabilityFactors.push("Lack of expertise increases debt risk (+2)");
    }

    if (state.marketEvolution === 'fast') {
        probability += 2;
        probabilityFactors.push("Fast market evolution forces quick solutions (+2)");
    } else if (state.marketEvolution === 'moderate') {
        probability += 1;
        probabilityFactors.push("Moderate evolution pace allows some technical debt (+1)");
    }

    if (state.solutionType === 'platform') {
        probability += 1;
        probabilityFactors.push("Platform complexity increases debt potential (+1)");
    } else if (state.solutionType === 'component') {
        probability -= 1;
        probabilityFactors.push("Component simplicity reduces debt potential (-1)");
    }

    // Severity factors
    if (state.usageDuration === '>5') {
        severity += 2;
        severityFactors.push("Long-term usage amplifies debt impact (+2)");
    } else if (state.usageDuration === '3-5') {
        severity += 1;
        severityFactors.push("Medium-term usage increases debt impact (+1)");
    } else if (state.usageDuration === '<1') {
        severity -= 1;
        severityFactors.push("Short-term usage reduces debt impact (-1)");
    }

    if (state.businessRole === 'critical') {
        severity += 1;
        severityFactors.push("Critical business function increases debt impact (+1)");
    } else if (state.businessRole === 'supporting') {
        severity -= 1;
        severityFactors.push("Supporting role reduces debt impact (-1)");
    }

    return {
        id: 'technical-debt',
        label: 'Technical Debt',
        description: 'Risk of accumulated technical complexity and maintenance burden',
        probability: capRiskScore(probability),
        severity: capRiskScore(severity),
        details: {
            probabilityFactors,
            severityFactors,
            reasoning: [
                "Team expertise affects code quality and architecture decisions",
                "Fast-evolving markets require frequent updates, increasing debt",
                "Longer usage duration amplifies impact of poor decisions",
                "Complex solutions accumulate more technical debt"
            ],
            calculation: {
                probability: [
                    "Base score: 3",
                    "Team expertise impact: -2 to +2",
                    "Market evolution pace: 0 to +2",
                    "Solution complexity: -1 to +1"
                ],
                severity: [
                    "Base score: 3",
                    "Usage duration impact: -1 to +2",
                    "Business criticality: -1 to +1"
                ]
            }
        }
    };
}

function calculateResourceDependencies(state: RiskFormState): RiskAssessment {
    let probability = 3;
    let severity = 3;
    
    const probabilityFactors = [];
    const severityFactors = [];

    // Probability factors
    if (state.teamCompetency === 'full') {
        probability -= 1;
        probabilityFactors.push("Team has full expertise (-1)");
    } else if (state.teamCompetency === 'partial') {
        probability += 1;
        probabilityFactors.push("Team has partial expertise (+1)");
    } else if (state.teamCompetency === 'none') {
        probability += 2;
        probabilityFactors.push("Team lacks expertise (+2)");
    }

    if (state.buildFTEs <= 2) {
        probability += 2;
        probabilityFactors.push("Small team size increases dependency (+2)");
    } else if (state.buildFTEs <= 5) {
        probability += 1;
        probabilityFactors.push("Medium team size adds some dependency (+1)");
    }

    if (state.solutionType === 'platform') {
        probability += 1;
        probabilityFactors.push("Platform complexity increases specialist needs (+1)");
    } else if (state.solutionType === 'component') {
        probability -= 1;
        probabilityFactors.push("Component simplicity reduces specialist needs (-1)");
    }

    // Severity factors
    if (state.businessRole === 'critical') {
        severity += 2;
        severityFactors.push("Critical business function increases impact (+2)");
    } else if (state.businessRole === 'enabling') {
        severity += 1;
        severityFactors.push("Business enabling function moderates impact (+1)");
    }

    if (state.controlNeeded === 'full') {
        severity += 1;
        severityFactors.push("High control needs require more expertise (+1)");
    } else if (state.controlNeeded === 'none') {
        severity -= 1;
        severityFactors.push("Low control needs reduce expertise requirements (-1)");
    }

    return {
        id: 'resource-dependencies',
        label: 'Resource Dependencies',
        description: 'Risk of key personnel reliance and knowledge concentration',
        probability: capRiskScore(probability),
        severity: capRiskScore(severity),
        details: {
            probabilityFactors,
            severityFactors,
            reasoning: [
                "Smaller teams create single points of failure",
                "Expertise level affects knowledge distribution",
                "Complex solutions require more specialized knowledge",
                "Critical systems need more reliable staffing"
            ],
            calculation: {
                probability: [
                    "Base score: 3",
                    "Team expertise impact: -1 to +2",
                    "Team size impact: 0 to +2",
                    "Solution complexity: -1 to +1"
                ],
                severity: [
                    "Base score: 3",
                    "Business criticality: 0 to +2",
                    "Control requirements: -1 to +1"
                ]
            }
        }
    };
}

function calculateFeatureScopeCreep(state: RiskFormState): RiskAssessment {
    let probability = 3;
    let severity = 3;

    const probabilityFactors = [];
    const severityFactors = [];

    // Probability factors
    if (state.marketEvolution === 'fast') {
        probability += 2;
        probabilityFactors.push("Fast market evolution drives feature demands (+2)");
    } else if (state.marketEvolution === 'moderate') {
        probability += 1;
        probabilityFactors.push("Moderate market evolution adds some feature pressure (+1)");
    }

    if (state.controlNeeded === 'full') {
        probability += 1;
        probabilityFactors.push("High control needs increase change frequency (+1)");
    } else if (state.controlNeeded === 'none') {
        probability -= 1;
        probabilityFactors.push("Low control needs reduce change frequency (-1)");
    }

    if (state.solutionType === 'platform') {
        probability += 1;
        probabilityFactors.push("Platform complexity attracts more changes (+1)");
    } else if (state.solutionType === 'component') {
        probability -= 1;
        probabilityFactors.push("Component simplicity limits scope changes (-1)");
    }

    // Severity factors
    if (state.businessRole === 'critical') {
        severity += 1;
        severityFactors.push("Critical function faces more pressure for changes (+1)");
    } else if (state.businessRole === 'supporting') {
        severity -= 1;
        severityFactors.push("Supporting function has less pressure for changes (-1)");
    }

    if (['0-3', '3-6'].includes(state.timelineNeeded)) {
        severity += 1;
        severityFactors.push("Short timeline amplifies impact of scope changes (+1)");
    }

    return {
        id: 'feature-scope-creep',
        label: 'Feature Scope Creep',
        description: 'Risk of expanding requirements and feature additions',
        probability: capRiskScore(probability),
        severity: capRiskScore(severity),
        details: {
            probabilityFactors,
            severityFactors,
            reasoning: [
                "Fast-evolving markets drive feature demands",
                "Control requirements affect change flexibility",
                "Complex solutions invite more additions",
                "Business criticality influences change pressure"
            ],
            calculation: {
                probability: [
                    "Base score: 3",
                    "Market evolution: 0 to +2",
                    "Control needs: -1 to +1",
                    "Solution complexity: -1 to +1"
                ],
                severity: [
                    "Base score: 3",
                    "Business criticality: -1 to +1",
                    "Timeline impact: 0 to +1"
                ]
            }
        }
    };
}

function calculateMaintenanceBurden(state: RiskFormState): RiskAssessment {
    let probability = 3;
    let severity = 3;

    const probabilityFactors = [];
    const severityFactors = [];

    // Probability factors
    if (state.marketEvolution === 'fast') {
        probability += 2;
        probabilityFactors.push("Fast market evolution requires frequent updates (+2)");
    } else if (state.marketEvolution === 'moderate') {
        probability += 1;
        probabilityFactors.push("Moderate evolution needs regular updates (+1)");
    }

    if (state.teamCompetency === 'full') {
        probability -= 1;
        probabilityFactors.push("High team expertise improves maintenance efficiency (-1)");
    } else if (state.teamCompetency === 'none') {
        probability += 1;
        probabilityFactors.push("Low team expertise reduces maintenance efficiency (+1)");
    }

    if (state.solutionType === 'platform') {
        probability += 1;
        probabilityFactors.push("Platform complexity increases maintenance needs (+1)");
    }

    // Severity factors
    if (state.usageDuration === '>5') {
        severity += 2;
        severityFactors.push("Long-term usage increases maintenance impact (+2)");
    } else if (state.usageDuration === '3-5') {
        severity += 1;
        severityFactors.push("Medium-term usage moderates maintenance impact (+1)");
    } else if (state.usageDuration === '<1') {
        severity -= 1;
        severityFactors.push("Short-term usage reduces maintenance impact (-1)");
    }

    if (state.businessRole === 'critical') {
        severity += 1;
        severityFactors.push("Critical systems need faster maintenance (+1)");
    } else if (state.businessRole === 'supporting') {
        severity -= 1;
        severityFactors.push("Supporting systems have flexible maintenance (-1)");
    }

    return {
        id: 'maintenance-burden',
        label: 'Maintenance Burden',
        description: 'Risk of ongoing maintenance effort, updates, and fixes required',
        probability: capRiskScore(probability),
        severity: capRiskScore(severity),
        details: {
            probabilityFactors,
            severityFactors,
            reasoning: [
                "Fast-evolving markets require more frequent updates",
                "Team expertise affects maintenance efficiency",
                "Complex solutions have more components to maintain",
                "Long-term usage increases maintenance importance",
                "Business criticality determines acceptable downtime"
            ],
            calculation: {
                probability: [
                    "Base score: 3",
                    "Market evolution: 0 to +2",
                    "Team expertise: -1 to +1",
                    "Solution complexity: 0 to +1"
                ],
                severity: [
                    "Base score: 3",
                    "Usage duration: -1 to +2",
                    "Business criticality: -1 to +1"
                ]
            }
        }
    };
}

function calculateIntegrationComplexity(state: RiskFormState): RiskAssessment {
    let probability = 3;
    let severity = 3;

    const probabilityFactors = [];
    const severityFactors = [];

    // Probability factors
    if (state.solutionType === 'platform') {
        probability += 2;
        probabilityFactors.push("Platform solutions have more integration points (+2)");
    } else if (state.solutionType === 'application') {
        probability += 1;
        probabilityFactors.push("Applications need moderate integration (+1)");
    }

    if (state.marketStandardization === 'low') {
        probability += 1;
        probabilityFactors.push("Low standardization complicates integration (+1)");
    } else if (state.marketStandardization === 'high') {
        probability -= 1;
        probabilityFactors.push("High standardization simplifies integration (-1)");
    }

    if (state.teamCompetency === 'full') {
        probability -= 1;
        probabilityFactors.push("High expertise reduces integration challenges (-1)");
    } else if (state.teamCompetency === 'none') {
        probability += 1;
        probabilityFactors.push("Low expertise increases integration challenges (+1)");
    }

    // Severity factors
    if (state.businessRole === 'critical') {
        severity += 2;
        severityFactors.push("Critical systems need reliable integration (+2)");
    } else if (state.businessRole === 'enabling') {
        severity += 1;
        severityFactors.push("Business enabling systems need stable integration (+1)");
    }

    if (state.controlNeeded === 'full') {
        severity += 1;
        severityFactors.push("High control needs affect integration complexity (+1)");
    } else if (state.controlNeeded === 'none') {
        severity -= 1;
        severityFactors.push("Low control needs simplify integration (-1)");
    }

    return {
        id: 'integration-complexity',
        label: 'Integration Complexity',
        description: 'Risk of difficulties in connecting with other systems',
        probability: capRiskScore(probability),
        severity: capRiskScore(severity),
        details: {
            probabilityFactors,
            severityFactors,
            reasoning: [
                "Platform solutions have more integration points",
                "Market standardization affects integration ease",
                "Team expertise impacts integration capability",
                "Critical systems often need more integrations",
                "Control requirements affect integration flexibility"
            ],
            calculation: {
                probability: [
                    "Base score: 3",
                    "Solution type impact: 0 to +2",
                    "Market standardization: -1 to +1",
                    "Team expertise: -1 to +1"
                ],
                severity: [
                    "Base score: 3",
                    "Business criticality: 0 to +2",
                    "Control requirements: -1 to +1"
                ]
            }
        }
    };
}

function calculateKnowledgeGaps(state: RiskFormState): RiskAssessment {
    let probability = 3;
    let severity = 3;

    const probabilityFactors = [];
    const severityFactors = [];

    // Probability factors
    if (state.teamCompetency === 'full') {
        probability -= 2;
        probabilityFactors.push("Full team expertise minimizes knowledge gaps (-2)");
    } else if (state.teamCompetency === 'partial') {
        probability += 1;
        probabilityFactors.push("Partial expertise indicates knowledge gaps (+1)");
    } else if (state.teamCompetency === 'none') {
        probability += 2;
        probabilityFactors.push("No expertise means significant knowledge gaps (+2)");
    }

    if (state.marketStandardization === 'low') {
        probability += 1;
        probabilityFactors.push("Low standardization requires more specialized knowledge (+1)");
    } else if (state.marketStandardization === 'high') {
        probability -= 1;
        probabilityFactors.push("High standardization provides common patterns (-1)");
    }

    if (state.marketEvolution === 'fast') {
        probability += 1;
        probabilityFactors.push("Fast evolution requires constant learning (+1)");
    } else if (state.marketEvolution === 'slow') {
        probability -= 1;
        probabilityFactors.push("Slow evolution allows knowledge consolidation (-1)");
    }

    // Severity factors
    if (state.businessRole === 'critical') {
        severity += 2;
        severityFactors.push("Critical systems need deeper knowledge (+2)");
    } else if (state.businessRole === 'enabling') {
        severity += 1;
        severityFactors.push("Business enabling systems need good understanding (+1)");
    }

    if (state.solutionType === 'platform') {
        severity += 1;
        severityFactors.push("Platform solutions need broader expertise (+1)");
    }

    return {
        id: 'knowledge-gaps',
        label: 'Knowledge Gaps',
        description: 'Risk of missing crucial domain expertise or technical knowledge',
        probability: capRiskScore(probability),
        severity: capRiskScore(severity),
        details: {
            probabilityFactors,
            severityFactors,
            reasoning: [
                "Team competency directly impacts knowledge risk",
                "Market standardization affects knowledge availability",
                "Complex solutions require more diverse knowledge",
                "Critical systems need deeper understanding",
                "Fast markets require constant learning"
            ],
            calculation: {
                probability: [
                    "Base score: 3",
                    "Team competency: -2 to +2",
                    "Market standardization: -1 to +1",
                    "Market evolution: -1 to +1"
                ],
                severity: [
                    "Base score: 3",
                    "Business criticality: 0 to +2",
                    "Solution complexity: 0 to +1"
                ]
            }
        }
    };
}

function calculateSecurityVulnerabilities(state: RiskFormState): RiskAssessment {
    let probability = 3;
    let severity = 3;

    const probabilityFactors = [];
    const severityFactors = [];

    // Probability factors
    if (state.teamCompetency === 'full') {
        probability -= 2;
        probabilityFactors.push("Full security expertise reduces risk (-2)");
    } else if (state.teamCompetency === 'none') {
        probability += 2;
        probabilityFactors.push("Lack of security expertise increases risk (+2)");
    }

    if (state.marketStandardization === 'low') {
        probability += 1;
        probabilityFactors.push("Low standardization affects security patterns (+1)");
    } else if (state.marketStandardization === 'high') {
        probability -= 1;
        probabilityFactors.push("High standardization provides security patterns (-1)");
    }

    if (['platform', 'application'].includes(state.solutionType)) {
        probability += 1;
        probabilityFactors.push("Complex solutions have larger attack surface (+1)");
    }

    // Severity factors
    if (state.businessRole === 'critical') {
        severity += 2;
        severityFactors.push("Critical systems are prime targets (+2)");
    } else if (state.businessRole === 'enabling') {
        severity += 1;
        severityFactors.push("Business enabling systems need protection (+1)");
    }

    if (['3-5', '>5'].includes(state.usageDuration)) {
        severity += 1;
        severityFactors.push("Long-term exposure increases impact (+1)");
    }

    return {
        id: 'security-vulnerabilities',
        label: 'Security Vulnerabilities',
        description: 'Risk of security implementation issues and potential vulnerabilities',
        probability: capRiskScore(probability),
        severity: capRiskScore(severity),
        details: {
            probabilityFactors,
            severityFactors,
            reasoning: [
                "Team expertise crucial for security implementation",
                "Market standardization provides security patterns",
                "Critical systems are more attractive targets",
                "Complex solutions have larger attack surface",
                "Security issues have lasting impact"
            ],
            calculation: {
                probability: [
                    "Base score: 3",
                    "Team expertise: -2 to +2",
                    "Market standardization: -1 to +1",
                    "Solution complexity: 0 to +1"
                ],
                severity: [
                    "Base score: 3",
                    "Business criticality: 0 to +2",
                    "Usage duration: 0 to +1"
                ]
            }
        }
    };
}

function calculateOpportunityCost(state: RiskFormState): RiskAssessment {
    let probability = 3;
    let severity = 3;

    const probabilityFactors = [];
    const severityFactors = [];

    // Probability factors
    if (state.buildFTEs > 5) {
        probability += 2;
        probabilityFactors.push("Large team has high opportunity cost (+2)");
    } else if (state.buildFTEs > 2) {
        probability += 1;
        probabilityFactors.push("Medium team has moderate opportunity cost (+1)");
    }

    if (['0-3', '3-6'].includes(state.timelineNeeded)) {
        probability += 1;
        probabilityFactors.push("Short timeline increases resource pressure (+1)");
    }

    if (state.solutionType === 'platform') {
        probability += 1;
        probabilityFactors.push("Platform development needs more resources (+1)");
    }

    // Severity factors
    if (state.businessRole === 'critical') {
        severity += 2;
        severityFactors.push("Critical functions justify resource use (+2)");
    } else if (state.businessRole === 'enabling') {
        severity += 1;
        severityFactors.push("Business enabling functions need resources (+1)");
    }

    if (state.strategicAlignment === 'core') {
        severity += 1;
        severityFactors.push("Core strategic importance affects priority (+1)");
    } else if (['nice', 'cost'].includes(state.strategicAlignment)) {
        severity -= 1;
        severityFactors.push("Non-strategic functions have less priority (-1)");
    }

    return {
        id: 'opportunity-cost',
        label: 'Opportunity Cost',
        description: 'Risk of tying up valuable resources that could be used for other initiatives',
        probability: capRiskScore(probability),
        severity: capRiskScore(severity),
        details: {
            probabilityFactors,
            severityFactors,
            reasoning: [
                "Larger teams have higher opportunity cost",
                "Short timelines increase resource pressure",
                "Critical projects justify resource allocation",
                "Strategic alignment affects resource priority",
                "Complex solutions need more resources"
            ],
            calculation: {
                probability: [
                    "Base score: 3",
                    "Team size: 0 to +2",
                    "Timeline pressure: 0 to +1",
                    "Solution complexity: 0 to +1"
                ],
                severity: [
                    "Base score: 3",
                    "Business criticality: 0 to +2",
                    "Strategic importance: -1 to +1"
                ]
            }
        }
    };
}

function calculateTestingComplexity(state: RiskFormState): RiskAssessment {
    let probability = 3;
    let severity = 3;

    const probabilityFactors = [];
    const severityFactors = [];

    // Probability factors
    if (state.solutionType === 'platform') {
        probability += 2;
        probabilityFactors.push("Platform solutions need comprehensive testing (+2)");
    } else if (state.solutionType === 'application') {
        probability += 1;
        probabilityFactors.push("Applications need thorough testing (+1)");
    }

    if (state.teamCompetency === 'full') {
        probability -= 1;
        probabilityFactors.push("High expertise improves testing efficiency (-1)");
    } else if (state.teamCompetency === 'none') {
        probability += 1;
        probabilityFactors.push("Low expertise complicates testing (+1)");
    }

    if (state.marketStandardization === 'low') {
        probability += 1;
        probabilityFactors.push("Low standardization affects testing patterns (+1)");
    } else if (state.marketStandardization === 'high') {
        probability -= 1;
        probabilityFactors.push("High standardization provides testing patterns (-1)");
    }

    // Severity factors
    if (state.businessRole === 'critical') {
        severity += 2;
        severityFactors.push("Critical systems need thorough testing (+2)");
    } else if (state.businessRole === 'enabling') {
        severity += 1;
        severityFactors.push("Business enabling systems need good testing (+1)");
    }

    if (['3-5', '>5'].includes(state.usageDuration)) {
        severity += 1;
        severityFactors.push("Long-term use needs robust testing (+1)");
    }

    return {
        id: 'testing-complexity',
        label: 'Testing Complexity',
        description: 'Risk of difficulties in ensuring quality and reliability through testing',
        probability: capRiskScore(probability),
        severity: capRiskScore(severity),
        details: {
            probabilityFactors,
            severityFactors,
            reasoning: [
                "Complex solutions need more testing",
                "Team expertise affects testing effectiveness",
                "Market standards provide testing patterns",
                "Critical systems need thorough testing",
                "Long usage requires robust test suites"
            ],
            calculation: {
                probability: [
                    "Base score: 3",
                    "Solution complexity: 0 to +2",
                    "Team expertise: -1 to +1",
                    "Market standardization: -1 to +1"
                ],
                severity: [
                    "Base score: 3",
                    "Business criticality: 0 to +2",
                    "Usage duration: 0 to +1"
                ]
            }
        }
    };
}

// Buy Risk Calculations
function calculateVendorLockIn(state: RiskFormState): RiskAssessment {
    let probability = 3;
    let severity = 3;

    const probabilityFactors = [];
    const severityFactors = [];

    // Probability factors
    if (state.marketStandardization === 'low') {
        probability += 2;
        probabilityFactors.push("Low standardization increases lock-in risk (+2)");
    } else if (state.marketStandardization === 'moderate') {
        probability += 1;
        probabilityFactors.push("Moderate standardization adds some lock-in risk (+1)");
    } else if (state.marketStandardization === 'high') {
        probability -= 1;
        probabilityFactors.push("High standardization reduces lock-in risk (-1)");
    }

    if (state.alternativeSolutions === 'none') {
        probability += 2;
        probabilityFactors.push("No alternatives greatly increases lock-in (+2)");
    } else if (state.alternativeSolutions === '1-3') {
        probability += 1;
        probabilityFactors.push("Limited alternatives increase lock-in (+1)");
    } else if (state.alternativeSolutions === '>10') {
        probability -= 1;
        probabilityFactors.push("Many alternatives reduce lock-in (-1)");
    }

    if (state.solutionType === 'platform') {
        probability += 1;
        probabilityFactors.push("Platform solutions create deeper integrations (+1)");
    } else if (state.solutionType === 'component') {
        probability -= 1;
        probabilityFactors.push("Component solutions are more replaceable (-1)");
    }

    // Severity factors
    if (state.usageDuration === '>5') {
        severity += 2;
        severityFactors.push("Long-term usage increases switching cost (+2)");
    } else if (state.usageDuration === '3-5') {
        severity += 1;
        severityFactors.push("Medium-term usage adds switching cost (+1)");
    } else if (state.usageDuration === '<1') {
        severity -= 1;
        severityFactors.push("Short-term usage reduces switching cost (-1)");
    }

    if (state.businessRole === 'critical') {
        severity += 2;
        severityFactors.push("Critical business function faces higher impact (+2)");
    } else if (state.businessRole === 'enabling') {
        severity += 1;
        severityFactors.push("Business enabling function moderates impact (+1)");
    }

    return {
        id: 'vendor-lock-in',
        label: 'Vendor Lock-in',
        description: 'Risk of becoming overly dependent on a specific vendor\'s solution',
        probability: capRiskScore(probability),
        severity: capRiskScore(severity),
        details: {
            probabilityFactors,
            severityFactors,
            reasoning: [
                "Low market standardization increases dependency",
                "Fewer alternatives increase switching difficulty",
                "Longer usage deepens vendor dependency",
                "Critical systems face higher switching costs",
                "Platform solutions create deeper integrations"
            ],
            calculation: {
                probability: [
                    "Base score: 3",
                    "Market standardization: -1 to +2",
                    "Alternative solutions: -1 to +2",
                    "Solution type impact: -1 to +1"
                ],
                severity: [
                    "Base score: 3",
                    "Usage duration impact: -1 to +2",
                    "Business criticality: 0 to +2"
                ]
            }
        }
    };
}

function calculateLimitedCustomization(state: RiskFormState): RiskAssessment {
    let probability = 3;
    let severity = 3;

    const probabilityFactors = [];
    const severityFactors = [];

    // Probability factors
    if (state.controlNeeded === 'full') {
        probability += 2;
        probabilityFactors.push("High control requirements increase customization needs (+2)");
    } else if (state.controlNeeded === 'partial') {
        probability += 1;
        probabilityFactors.push("Moderate control needs require some customization (+1)");
    } else if (state.controlNeeded === 'none') {
        probability -= 1;
        probabilityFactors.push("Low control needs reduce customization requirements (-1)");
    }

    if (state.alternativeFitness === 'low') {
        probability += 2;
        probabilityFactors.push("Poor solution fit indicates customization gaps (+2)");
    } else if (state.alternativeFitness === 'moderate') {
        probability += 1;
        probabilityFactors.push("Moderate fit suggests some customization needs (+1)");
    } else if (state.alternativeFitness === 'high') {
        probability -= 1;
        probabilityFactors.push("High fit reduces customization needs (-1)");
    }

    if (state.solutionType === 'platform') {
        probability += 1;
        probabilityFactors.push("Platform solutions need more adaptation (+1)");
    }

    // Severity factors
    if (state.businessRole === 'critical') {
        severity += 2;
        severityFactors.push("Critical functions need precise functionality (+2)");
    } else if (state.businessRole === 'enabling') {
        severity += 1;
        severityFactors.push("Business enabling functions need some customization (+1)");
    }

    if (state.strategicAlignment === 'core') {
        severity += 1;
        severityFactors.push("Core strategic importance requires customization flexibility (+1)");
    } else if (['nice', 'cost'].includes(state.strategicAlignment)) {
        severity -= 1;
        severityFactors.push("Non-strategic functions can use standard features (-1)");
    }

    return {
        id: 'limited-customization',
        label: 'Limited Customization',
        description: 'Risk of being constrained by vendor solution capabilities',
        probability: capRiskScore(probability),
        severity: capRiskScore(severity),
        details: {
            probabilityFactors,
            severityFactors,
            reasoning: [
                "High control needs increase customization importance",
                "Poor alternative fitness indicates customization gaps",
                "Critical functions need precise functionality",
                "Strategic alignment affects customization importance",
                "Complex solutions need more adaptation"
            ],
            calculation: {
                probability: [
                    "Base score: 3",
                    "Control requirements: -1 to +2",
                    "Solution fitness: -1 to +2",
                    "Solution complexity: 0 to +1"
                ],
                severity: [
                    "Base score: 3",
                    "Business criticality: 0 to +2",
                    "Strategic importance: -1 to +1"
                ]
            }
        }
    };
}

function calculateRisingCosts(state: RiskFormState): RiskAssessment {
    let probability = 3;
    let severity = 3;

    const probabilityFactors = [];
    const severityFactors = [];

    // Probability factors
    if (state.marketEvolution === 'fast') {
        probability += 2;
        probabilityFactors.push("Fast market evolution drives price changes (+2)");
    } else if (state.marketEvolution === 'moderate') {
        probability += 1;
        probabilityFactors.push("Moderate evolution allows some price stability (+1)");
    } else if (state.marketEvolution === 'slow') {
        probability -= 1;
        probabilityFactors.push("Slow evolution provides price stability (-1)");
    }

    if (state.alternativeSolutions === 'none') {
        probability += 2;
        probabilityFactors.push("No alternatives allow unconstrained pricing (+2)");
    } else if (state.alternativeSolutions === '1-3') {
        probability += 1;
        probabilityFactors.push("Limited alternatives reduce pricing pressure (+1)");
    } else if (state.alternativeSolutions === '>10') {
        probability -= 1;
        probabilityFactors.push("Many alternatives maintain competitive pricing (-1)");
    }

    if (['3-5', '>5'].includes(state.usageDuration)) {
        probability += 1;
        probabilityFactors.push("Long-term usage increases exposure to price changes (+1)");
    }

    // Severity factors
    if (state.businessRole === 'critical') {
        severity += 2;
        severityFactors.push("Critical functions have less price negotiation power (+2)");
    } else if (state.businessRole === 'enabling') {
        severity += 1;
        severityFactors.push("Business enabling functions have some flexibility (+1)");
    }

    if (state.strategicAlignment === 'core') {
        severity += 1;
        severityFactors.push("Core strategic importance affects budget flexibility (+1)");
    } else if (['nice', 'cost'].includes(state.strategicAlignment)) {
        severity -= 1;
        severityFactors.push("Non-strategic functions have budget flexibility (-1)");
    }

    return {
        id: 'rising-costs',
        label: 'Rising Costs',
        description: 'Risk of unexpected price increases and hidden costs',
        probability: capRiskScore(probability),
        severity: capRiskScore(severity),
        details: {
            probabilityFactors,
            severityFactors,
            reasoning: [
                "Fast market evolution drives price changes",
                "Limited alternatives allow price increases",
                "Long usage exposes to more price changes",
                "Critical systems have less negotiation power",
                "User count affects cost scaling"
            ],
            calculation: {
                probability: [
                    "Base score: 3",
                    "Market evolution: -1 to +2",
                    "Alternative availability: -1 to +2",
                    "Usage duration impact: 0 to +1"
                ],
                severity: [
                    "Base score: 3",
                    "Business criticality: 0 to +2",
                    "Strategic importance: -1 to +1"
                ]
            }
        }
    };
}

function calculateVendorViability(state: RiskFormState): RiskAssessment {
    let probability = 3;
    let severity = 3;

    const probabilityFactors = [];
    const severityFactors = [];

    // Probability factors
    if (state.alternativeSolutions === 'none') {
        probability += 2;
        probabilityFactors.push("No alternatives indicates market instability (+2)");
    } else if (state.alternativeSolutions === '1-3') {
        probability += 1;
        probabilityFactors.push("Limited alternatives suggest market uncertainty (+1)");
    } else if (state.alternativeSolutions === '>10') {
        probability -= 1;
        probabilityFactors.push("Many alternatives indicate market stability (-1)");
    }

    if (state.marketEvolution === 'fast') {
        probability += 2;
        probabilityFactors.push("Fast markets have more vendor volatility (+2)");
    } else if (state.marketEvolution === 'moderate') {
        probability += 1;
        probabilityFactors.push("Moderate evolution has some vendor changes (+1)");
    } else if (state.marketEvolution === 'slow') {
        probability -= 1;
        probabilityFactors.push("Slow markets have stable vendors (-1)");
    }

    if (state.solutionType === 'platform') {
        probability += 1;
        probabilityFactors.push("Platform vendors have higher operational costs (+1)");
    } else if (state.solutionType === 'component') {
        probability -= 1;
        probabilityFactors.push("Component vendors have lower overhead (-1)");
    }

    // Severity factors
    if (state.businessRole === 'critical') {
        severity += 2;
        severityFactors.push("Critical functions need stable vendors (+2)");
    } else if (state.businessRole === 'enabling') {
        severity += 1;
        severityFactors.push("Business enabling functions need reliable vendors (+1)");
    }

    if (['3-5', '>5'].includes(state.usageDuration)) {
        severity += 1;
        severityFactors.push("Long-term commitment increases impact (+1)");
    }

    return {
        id: 'vendor-viability',
        label: 'Vendor Viability',
        description: 'Risk of vendor instability, acquisition, or discontinuation',
        probability: capRiskScore(probability),
        severity: capRiskScore(severity),
        details: {
            probabilityFactors,
            severityFactors,
            reasoning: [
                "Limited alternatives indicate market instability",
                "Fast evolution creates vendor uncertainty",
                "Critical systems need stable vendors",
                "Longer usage increases exposure",
                "Complex solutions have higher stakes"
            ],
            calculation: {
                probability: [
                    "Base score: 3",
                    "Market alternatives: -1 to +2",
                    "Market evolution: -1 to +2",
                    "Solution complexity: -1 to +1"
                ],
                severity: [
                    "Base score: 3",
                    "Business criticality: 0 to +2",
                    "Usage duration: 0 to +1"
                ]
            }
        }
    };
}

function calculateIntegrationLimitations(state: RiskFormState): RiskAssessment {
    let probability = 3;
    let severity = 3;

    const probabilityFactors = [];
    const severityFactors = [];

    // Probability factors
    if (state.marketStandardization === 'low') {
        probability += 2;
        probabilityFactors.push("Low standardization complicates integration (+2)");
    } else if (state.marketStandardization === 'moderate') {
        probability += 1;
        probabilityFactors.push("Moderate standardization allows some integration (+1)");
    } else if (state.marketStandardization === 'high') {
        probability -= 1;
        probabilityFactors.push("High standardization simplifies integration (-1)");
    }

    if (state.alternativeFitness === 'low') {
        probability += 1;
        probabilityFactors.push("Poor fit suggests integration issues (+1)");
    } else if (state.alternativeFitness === 'high') {
        probability -= 1;
        probabilityFactors.push("Good fit indicates better integration (-1)");
    }

    if (['platform', 'application'].includes(state.solutionType)) {
        probability += 1;
        probabilityFactors.push("Complex solutions need more integration (+1)");
    }

    // Severity factors
    if (state.businessRole === 'critical') {
        severity += 2;
        severityFactors.push("Critical systems need reliable integration (+2)");
    } else if (state.businessRole === 'enabling') {
        severity += 1;
        severityFactors.push("Business enabling systems need good integration (+1)");
    }

    if (state.controlNeeded === 'full') {
        severity += 1;
        severityFactors.push("High control needs affect integration flexibility (+1)");
    } else if (state.controlNeeded === 'none') {
        severity -= 1;
        severityFactors.push("Low control needs simplify integration (-1)");
    }

    return {
        id: 'integration-limitations',
        label: 'Integration Limitations',
        description: 'Risk of difficulties or restrictions in integrating with other systems',
        probability: capRiskScore(probability),
        severity: capRiskScore(severity),
        details: {
            probabilityFactors,
            severityFactors,
            reasoning: [
                "Low standardization complicates integration",
                "Poor alternative fitness indicates integration challenges",
                "Complex solutions need more integrations",
                "Critical systems need reliable connections",
                "Control requirements affect integration flexibility"
            ],
            calculation: {
                probability: [
                    "Base score: 3",
                    "Market standardization: -1 to +2",
                    "Solution fitness: -1 to +1",
                    "Solution complexity: 0 to +1"
                ],
                severity: [
                    "Base score: 3",
                    "Business criticality: 0 to +2",
                    "Control requirements: -1 to +1"
                ]
            }
        }
    };
}

function calculatePerformanceIssues(state: RiskFormState): RiskAssessment {
    let probability = 3;
    let severity = 3;

    const probabilityFactors = [];
    const severityFactors = [];

    // Probability factors
    if (state.controlNeeded === 'full') {
        probability += 2;
        probabilityFactors.push("High control needs limit optimization ability (+2)");
    } else if (state.controlNeeded === 'partial') {
        probability += 1;
        probabilityFactors.push("Partial control affects optimization flexibility (+1)");
    } else if (state.controlNeeded === 'none') {
        probability -= 1;
        probabilityFactors.push("Low control needs allow vendor optimization (-1)");
    }

    if (state.alternativeFitness === 'low') {
        probability += 2;
        probabilityFactors.push("Poor fit indicates performance gaps (+2)");
    } else if (state.alternativeFitness === 'moderate') {
        probability += 1;
        probabilityFactors.push("Moderate fit suggests some performance issues (+1)");
    } else if (state.alternativeFitness === 'high') {
        probability -= 1;
        probabilityFactors.push("High fit suggests good performance (-1)");
    }

    if (['platform', 'application'].includes(state.solutionType)) {
        probability += 1;
        probabilityFactors.push("Complex solutions have more performance points (+1)");
    }

    // Severity factors
    if (state.businessRole === 'critical') {
        severity += 2;
        severityFactors.push("Critical systems need high performance (+2)");
    } else if (state.businessRole === 'enabling') {
        severity += 1;
        severityFactors.push("Business enabling systems need good performance (+1)");
    }

    if (['3-5', '>5'].includes(state.usageDuration)) {
        severity += 1;
        severityFactors.push("Long-term impact of performance issues (+1)");
    }

    return {
        id: 'performance-issues',
        label: 'Performance Issues',
        description: 'Risk of inadequate performance, scalability limitations, or reliability problems',
        probability: capRiskScore(probability),
        severity: capRiskScore(severity),
        details: {
            probabilityFactors,
            severityFactors,
            reasoning: [
                "Control limitations affect performance optimization",
                "Poor alternative fitness suggests performance gaps",
                "Critical systems have stricter performance needs",
                "Complex solutions have more performance points",
                "High user counts amplify performance issues"
            ],
            calculation: {
                probability: [
                    "Base score: 3",
                    "Control requirements: -1 to +2",
                    "Solution fitness: -1 to +2",
                    "Solution complexity: 0 to +1"
                ],
                severity: [
                    "Base score: 3",
                    "Business criticality: 0 to +2",
                    "Usage duration: 0 to +1"
                ]
            }
        }
    };
}

function calculateDataPrivacyConcerns(state: RiskFormState): RiskAssessment {
    let probability = 3;
    let severity = 3;

    const probabilityFactors = [];
    const severityFactors = [];

    // Probability factors
    if (state.marketStandardization === 'low') {
        probability += 2;
        probabilityFactors.push("Low standardization affects privacy practices (+2)");
    } else if (state.marketStandardization === 'moderate') {
        probability += 1;
        probabilityFactors.push("Moderate standards provide some privacy guidance (+1)");
    } else if (state.marketStandardization === 'high') {
        probability -= 1;
        probabilityFactors.push("High standards include privacy practices (-1)");
    }

    if (['none', '1-3'].includes(state.alternativeSolutions)) {
        probability += 1;
        probabilityFactors.push("Limited options for privacy requirements (+1)");
    } else if (state.alternativeSolutions === '>10') {
        probability -= 1;
        probabilityFactors.push("Many options for privacy compliance (-1)");
    }

    if (['platform', 'application'].includes(state.solutionType)) {
        probability += 1;
        probabilityFactors.push("Complex solutions handle more sensitive data (+1)");
    }

    // Severity factors
    if (state.businessRole === 'critical') {
        severity += 2;
        severityFactors.push("Critical systems face higher privacy impact (+2)");
    } else if (state.businessRole === 'enabling') {
        severity += 1;
        severityFactors.push("Business enabling systems need privacy protection (+1)");
    }

    if (state.controlNeeded === 'full') {
        severity += 1;
        severityFactors.push("High control needs affect data handling (+1)");
    } else if (state.controlNeeded === 'none') {
        severity -= 1;
        severityFactors.push("Low control reduces data handling complexity (-1)");
    }

    return {
        id: 'data-privacy-concerns',
        label: 'Data Privacy Concerns',
        description: 'Risk of inadequate data protection, compliance issues, or privacy breaches',
        probability: capRiskScore(probability),
        severity: capRiskScore(severity),
        details: {
            probabilityFactors,
            severityFactors,
            reasoning: [
                "Market standards affect privacy practices",
                "Limited alternatives reduce privacy options",
                "Critical data needs stronger protection",
                "Platform solutions handle more data",
                "Long usage increases exposure risk"
            ],
            calculation: {
                probability: [
                    "Base score: 3",
                    "Market standardization: -1 to +2",
                    "Alternative availability: -1 to +1",
                    "Solution complexity: 0 to +1"
                ],
                severity: [
                    "Base score: 3",
                    "Business criticality: 0 to +2",
                    "Control requirements: -1 to +1"
                ]
            }
        }
    };
}

function calculateFeatureDependency(state: RiskFormState): RiskAssessment {
    let probability = 3;
    let severity = 3;

    const probabilityFactors = [];
    const severityFactors = [];

    // Probability factors
    if (state.marketEvolution === 'fast') {
        probability += 2;
        probabilityFactors.push("Fast market pace drives feature needs (+2)");
    } else if (state.marketEvolution === 'moderate') {
        probability += 1;
        probabilityFactors.push("Moderate evolution requires feature updates (+1)");
    } else if (state.marketEvolution === 'slow') {
        probability -= 1;
        probabilityFactors.push("Slow evolution reduces feature pressure (-1)");
    }

    if (state.alternativeSolutions === 'none') {
        probability += 2;
        probabilityFactors.push("No alternatives increase feature dependency (+2)");
    } else if (state.alternativeSolutions === '1-3') {
        probability += 1;
        probabilityFactors.push("Limited alternatives affect feature choice (+1)");
    } else if (state.alternativeSolutions === '>10') {
        probability -= 1;
        probabilityFactors.push("Many alternatives provide feature options (-1)");
    }

    if (state.controlNeeded === 'full') {
        probability += 1;
        probabilityFactors.push("High control needs increase feature dependency (+1)");
    } else if (state.controlNeeded === 'none') {
        probability -= 1;
        probabilityFactors.push("Low control reduces feature dependency (-1)");
    }

    // Severity factors
    if (state.businessRole === 'critical') {
        severity += 2;
        severityFactors.push("Critical functions need timely features (+2)");
    } else if (state.businessRole === 'enabling') {
        severity += 1;
        severityFactors.push("Business enabling functions need good features (+1)");
    }

    if (state.strategicAlignment === 'core') {
        severity += 1;
        severityFactors.push("Core strategic importance requires feature control (+1)");
    } else if (['nice', 'cost'].includes(state.strategicAlignment)) {
        severity -= 1;
        severityFactors.push("Non-strategic functions have feature flexibility (-1)");
    }

    return {
        id: 'feature-dependency',
        label: 'Feature Dependency',
        description: 'Risk of relying on vendor\'s roadmap and feature development priorities',
        probability: capRiskScore(probability),
        severity: capRiskScore(severity),
        details: {
            probabilityFactors,
            severityFactors,
            reasoning: [
                "Fast markets need quicker feature updates",
                "Limited alternatives increase dependency",
                "Control needs affect feature flexibility",
                "Critical functions need timely updates",
                "Strategic alignment affects priority"
            ],
            calculation: {
                probability: [
                    "Base score: 3",
                    "Market evolution: -1 to +2",
                    "Alternative availability: -1 to +2",
                    "Control requirements: -1 to +1"
                ],
                severity: [
                    "Base score: 3",
                    "Business criticality: 0 to +2",
                    "Strategic importance: -1 to +1"
                ]
            }
        }
    };
}

function calculateSupportQuality(state: RiskFormState): RiskAssessment {
    let probability = 3;
    let severity = 3;

    const probabilityFactors = [];
    const severityFactors = [];

    // Probability factors
    if (state.alternativeSolutions === 'none') {
        probability += 2;
        probabilityFactors.push("No alternatives reduce support quality pressure (+2)");
    } else if (state.alternativeSolutions === '1-3') {
        probability += 1;
        probabilityFactors.push("Limited alternatives affect support standards (+1)");
    } else if (state.alternativeSolutions === '>10') {
        probability -= 1;
        probabilityFactors.push("Many alternatives drive support quality (-1)");
    }

    if (state.marketStandardization === 'low') {
        probability += 1;
        probabilityFactors.push("Low standardization affects support levels (+1)");
    } else if (state.marketStandardization === 'high') {
        probability -= 1;
        probabilityFactors.push("High standardization improves support (-1)");
    }

    if (['platform', 'application'].includes(state.solutionType)) {
        probability += 1;
        probabilityFactors.push("Complex solutions need more support (+1)");
    }

    // Severity factors
    if (state.businessRole === 'critical') {
        severity += 2;
        severityFactors.push("Critical systems need reliable support (+2)");
    } else if (state.businessRole === 'enabling') {
        severity += 1;
        severityFactors.push("Business enabling systems need good support (+1)");
    }

    if (state.controlNeeded === 'full') {
        severity += 1;
        severityFactors.push("High control needs require vendor support (+1)");
    } else if (state.controlNeeded === 'none') {
        severity -= 1;
        severityFactors.push("Low control needs reduce support importance (-1)");
    }

    return {
        id: 'support-quality',
        label: 'Support Quality',
        description: 'Risk of inadequate vendor support, slow response times, or unresolved issues',
        probability: capRiskScore(probability),
        severity: capRiskScore(severity),
        details: {
            probabilityFactors,
            severityFactors,
            reasoning: [
                "Limited alternatives affect support quality",
                "Market maturity influences support standards",
                "Critical systems need reliable support",
                "Complex solutions need more support",
                "Control needs affect support importance"
            ],
            calculation: {
                probability: [
                    "Base score: 3",
                    "Alternative availability: -1 to +2",
                    "Market standardization: -1 to +1",
                    "Solution complexity: 0 to +1"
                ],
                severity: [
                    "Base score: 3",
                    "Business criticality: 0 to +2",
                    "Control requirements: -1 to +1"
                ]
            }
        }
    };
}

function calculateMigrationComplexity(state: RiskFormState): RiskAssessment {
    let probability = 3;
    let severity = 3;

    const probabilityFactors = [];
    const severityFactors = [];

    // Probability factors
    if (state.marketStandardization === 'low') {
        probability += 2;
        probabilityFactors.push("Low standardization complicates data portability (+2)");
    } else if (state.marketStandardization === 'moderate') {
        probability += 1;
        probabilityFactors.push("Moderate standards provide some migration paths (+1)");
    } else if (state.marketStandardization === 'high') {
        probability -= 1;
        probabilityFactors.push("High standards simplify migration (-1)");
    }

    if (state.alternativeFitness === 'low') {
        probability += 1;
        probabilityFactors.push("Poor fit indicates migration challenges (+1)");
    } else if (state.alternativeFitness === 'high') {
        probability -= 1;
        probabilityFactors.push("Good fit suggests easier migration (-1)");
    }

    if (state.solutionType === 'platform') {
        probability += 2;
        probabilityFactors.push("Platform migrations are more complex (+2)");
    } else if (state.solutionType === 'application') {
        probability += 1;
        probabilityFactors.push("Application migrations need careful planning (+1)");
    }

    // Severity factors
    if (state.businessRole === 'critical') {
        severity += 2;
        severityFactors.push("Critical systems need smooth transitions (+2)");
    } else if (state.businessRole === 'enabling') {
        severity += 1;
        severityFactors.push("Business enabling systems need managed migration (+1)");
    }

    if (['3-5', '>5'].includes(state.usageDuration)) {
        severity += 1;
        severityFactors.push("Long usage accumulates more data to migrate (+1)");
    }

    return {
        id: 'migration-complexity',
        label: 'Migration Complexity',
        description: 'Risk of difficulties in data migration, system transition, or vendor switching',
        probability: capRiskScore(probability),
        severity: capRiskScore(severity),
        details: {
            probabilityFactors,
            severityFactors,
            reasoning: [
                "Market standards affect migration ease",
                "Poor alternative fitness complicates migration",
                "Complex solutions have more migration points",
                "Critical systems need smooth transitions",
                "Long usage accumulates more data"
            ],
            calculation: {
                probability: [
                    "Base score: 3",
                    "Market standardization: -1 to +2",
                    "Solution fitness: -1 to +1",
                    "Solution complexity: 0 to +2"
                ],
                severity: [
                    "Base score: 3",
                    "Business criticality: 0 to +2",
                    "Usage duration: 0 to +1"
                ]
            }
        }
    };
}

// Main calculation function
export function calculateRiskMatrix(state: RiskFormState): RiskMatrix {
    return {
        buildRisks: [
            calculateDeliveryDelays(state),
            calculateTechnicalDebt(state),
            calculateResourceDependencies(state),
            calculateFeatureScopeCreep(state),
            calculateMaintenanceBurden(state),
            calculateIntegrationComplexity(state),
            calculateKnowledgeGaps(state),
            calculateSecurityVulnerabilities(state),
            calculateOpportunityCost(state),
            calculateTestingComplexity(state)
        ],
        buyRisks: [
            calculateVendorLockIn(state),
            calculateLimitedCustomization(state),
            calculateRisingCosts(state),
            calculateVendorViability(state),
            calculateIntegrationLimitations(state),
            calculatePerformanceIssues(state),
            calculateDataPrivacyConcerns(state),
            calculateFeatureDependency(state),
            calculateSupportQuality(state),
            calculateMigrationComplexity(state)
        ]
    };
}

// Helper function to get risk level description
export function getRiskLevel(probability: RiskProbability, severity: RiskSeverity): string {
    const riskScore = probability * severity;
    if (riskScore >= 20) return 'Critical';
    if (riskScore >= 15) return 'High';
    if (riskScore >= 10) return 'Medium';
    if (riskScore >= 5) return 'Low';
    return 'Minimal';
}

// Helper function to get risk color
export function getRiskColor(probability: RiskProbability, severity: RiskSeverity): string {
    const level = getRiskLevel(probability, severity);
    switch (level) {
        case 'Critical': return 'rgb(220, 38, 38)'; // red-600
        case 'High': return 'rgb(234, 88, 12)'; // orange-600
        case 'Medium': return 'rgb(234, 179, 8)'; // yellow-600
        case 'Low': return 'rgb(22, 163, 74)'; // green-600
        default: return 'rgb(37, 99, 235)'; // blue-600
    }
}

// Example of how to update the risk matrix display in BuildBuyForm.svelte:
function getRiskDetails(risk: RiskAssessment): string {
    return `
        ${risk.description}
        
        Probability Factors:
        ${risk.details.probabilityFactors.join('\n')}
        
        Severity Factors:
        ${risk.details.severityFactors.join('\n')}
        
        Key Considerations:
        ${risk.details.reasoning.join('\n')}
        
        Calculation Method:
        Probability: ${risk.details.calculation.probability.join(', ')}
        Severity: ${risk.details.calculation.severity.join(', ')}
    `;
} 