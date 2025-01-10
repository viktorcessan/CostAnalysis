import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';

export function initTutorial() {
  const tour = new Shepherd.Tour({
    useModalOverlay: true,
    defaultStepOptions: {
      classes: 'bg-white rounded-lg shadow-lg border border-slate-200',
      scrollTo: { behavior: 'auto', block: 'center' },
      modalOverlayOpeningPadding: 8,
      modalOverlayOpeningRadius: 4,
      cancelIcon: {
        enabled: true
      },
      when: {
        show() {
          const currentStep = tour.getCurrentStep();
          if (currentStep && currentStep.id !== 'welcome') {
            const targetSelector = (currentStep.options.attachTo?.element as string) || '';
            if (targetSelector) {
              const target = document.querySelector(targetSelector);
              if (target instanceof HTMLElement) {
                target.style.boxShadow = '0 0 0 4px rgba(249, 115, 22, 0.3)';
                target.scrollIntoView({ behavior: 'auto', block: 'center' });
              }
            }
          }
        },
        hide() {
          const currentStep = tour.getCurrentStep();
          if (currentStep) {
            const targetSelector = (currentStep.options.attachTo?.element as string) || '';
            if (targetSelector) {
              const target = document.querySelector(targetSelector);
              if (target instanceof HTMLElement) {
                target.style.boxShadow = '';
              }
            }
          }
        }
      }
    }
  });

  // Helper function for consistent button styling
  const getButtonClasses = (isPrimary: boolean) => {
    return isPrimary 
      ? 'px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600'
      : 'px-4 py-2 mr-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50';
  };

  // Helper function for consistent card layout
  const createCardContent = (title: string, content: string) => {
    return `<div class="shepherd-header-container">
      <div class="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h3 class="text-xl font-semibold text-slate-900">${title}</h3>
      </div>
      <div class="p-4">
        ${content}
      </div>
    </div>`;
  };

  tour.addStep({
    id: 'welcome',
    text: createCardContent(
      'Welcome to Team Dependencies Analysis',
      `<p class="text-slate-600 leading-relaxed">Discover how to optimize your organizational structure through data-driven analysis. This tool helps you understand team interactions, evaluate coordination costs, and make informed decisions about your team structure.</p>`
    ),
    buttons: [
      {
        text: 'Skip',
        action: tour.cancel,
        classes: getButtonClasses(false)
      },
      {
        text: 'Start Tour',
        action: tour.next,
        classes: getButtonClasses(true)
      }
    ]
  });

  tour.addStep({
    id: 'distribution-pattern',
    text: createCardContent(
      'Team Structure Patterns',
      `<p class="text-slate-600 mb-3">Choose how your teams will interact and coordinate:</p>
      <ul class="space-y-3 text-slate-600">
        <li class="flex items-start">
          <span class="text-orange-500 mr-2">•</span>
          <div>
            <strong class="text-slate-900">Even Distribution:</strong>
            <p class="mt-1">Teams work collaboratively with balanced dependencies, promoting equal participation and shared responsibility.</p>
          </div>
        </li>
        <li class="flex items-start">
          <span class="text-orange-500 mr-2">•</span>
          <div>
            <strong class="text-slate-900">Hub & Spoke:</strong>
            <p class="mt-1">A central team coordinates activities, ideal for projects requiring strong central oversight and standardization.</p>
          </div>
        </li>
      </ul>`
    ),
    attachTo: {
      element: '.grid.grid-cols-1.md\\:grid-cols-2.gap-6',
      on: 'bottom'
    },
    buttons: [
      {
        text: 'Back',
        action: tour.back,
        classes: getButtonClasses(false)
      },
      {
        text: 'Next',
        action: tour.next,
        classes: getButtonClasses(true)
      }
    ]
  });

  tour.addStep({
    id: 'team-config',
    text: createCardContent(
      'Organization Setup',
      `<p class="text-slate-600 mb-3">Configure your organization's fundamental structure:</p>
      <ul class="space-y-3 text-slate-600">
        <li class="flex items-start">
          <span class="text-orange-500 mr-2">•</span>
          <div>
            <strong class="text-slate-900">Team Count:</strong>
            <p class="mt-1">Define how many teams will be part of your analysis, impacting overall coordination complexity.</p>
          </div>
        </li>
        <li class="flex items-start">
          <span class="text-orange-500 mr-2">•</span>
          <div>
            <strong class="text-slate-900">Dependency Levels:</strong>
            <p class="mt-1">Set how closely teams need to work together, affecting communication overhead and coordination costs.</p>
          </div>
        </li>
      </ul>`
    ),
    attachTo: {
      element: '.grid.grid-cols-1.md\\:grid-cols-3.gap-6',
      on: 'bottom'
    },
    buttons: [
      {
        text: 'Back',
        action: tour.back,
        classes: getButtonClasses(false)
      },
      {
        text: 'Next',
        action: tour.next,
        classes: getButtonClasses(true)
      }
    ]
  });

  tour.addStep({
    id: 'cost-params',
    text: createCardContent(
      'Cost Parameters',
      `<p class="text-slate-600 mb-3">Define the financial aspects of team coordination:</p>
      <ul class="space-y-3 text-slate-600">
        <li class="flex items-start">
          <span class="text-orange-500 mr-2">•</span>
          <div>
            <strong class="text-slate-900">Coordination Costs:</strong>
            <p class="mt-1">Set the cost of communication and collaboration between teams, including meetings, documentation, and alignment activities.</p>
          </div>
        </li>
        <li class="flex items-start">
          <span class="text-orange-500 mr-2">•</span>
          <div>
            <strong class="text-slate-900">Efficiency Factors:</strong>
            <p class="mt-1">Adjust how team size and interactions affect productivity and overhead costs.</p>
          </div>
        </li>
      </ul>`
    ),
    attachTo: {
      element: '.grid.grid-cols-1.md\\:grid-cols-3.gap-4.bg-gray-50',
      on: 'bottom'
    },
    buttons: [
      {
        text: 'Back',
        action: tour.back,
        classes: getButtonClasses(false)
      },
      {
        text: 'Next',
        action: tour.next,
        classes: getButtonClasses(true)
      }
    ]
  });

  tour.addStep({
    id: 'team-details',
    text: createCardContent(
      'Team Details',
      `<p class="text-slate-600 mb-3">Configure individual team characteristics:</p>
      <ul class="space-y-3 text-slate-600">
        <li class="flex items-start">
          <span class="text-orange-500 mr-2">•</span>
          <div>
            <strong class="text-slate-900">Team Size:</strong>
            <p class="mt-1">Set the number of members in each team, affecting their capacity and coordination needs.</p>
          </div>
        </li>
        <li class="flex items-start">
          <span class="text-orange-500 mr-2">•</span>
          <div>
            <strong class="text-slate-900">Base Capacity:</strong>
            <p class="mt-1">Define each team's story points per sprint, representing their baseline delivery capability.</p>
          </div>
        </li>
        <li class="flex items-start">
          <span class="text-orange-500 mr-2">•</span>
          <div>
            <strong class="text-slate-900">Efficiency:</strong>
            <p class="mt-1">Adjust team efficiency multipliers (0.1-2.0) to account for team maturity and performance factors.</p>
          </div>
        </li>
      </ul>`
    ),
    attachTo: {
      element: '.overflow-x-auto.border.rounded-lg table',
      on: 'right'
    },
    buttons: [
      {
        text: 'Back',
        action: tour.back,
        classes: getButtonClasses(false)
      },
      {
        text: 'Next',
        action: tour.next,
        classes: getButtonClasses(true)
      }
    ]
  });

  tour.addStep({
    id: 'dependency-matrix',
    text: createCardContent(
      'Team Dependencies',
      `<p class="text-slate-600 mb-3">Map out how teams work together using the dependency matrix:</p>
      <ul class="space-y-3 text-slate-600">
        <li class="flex items-start">
          <span class="text-orange-500 mr-2">•</span>
          <div>
            <strong class="text-slate-900">Strong Dependencies (4-5):</strong>
            <p class="mt-1">Teams require frequent communication and tight coordination for success.</p>
          </div>
        </li>
        <li class="flex items-start">
          <span class="text-orange-500 mr-2">•</span>
          <div>
            <strong class="text-slate-900">Moderate Dependencies (3):</strong>
            <p class="mt-1">Regular alignment and information sharing is needed.</p>
          </div>
        </li>
        <li class="flex items-start">
          <span class="text-orange-500 mr-2">•</span>
          <div>
            <strong class="text-slate-900">Light Dependencies (1-2):</strong>
            <p class="mt-1">Teams operate mostly independently with occasional touchpoints.</p>
          </div>
        </li>
      </ul>`
    ),
    attachTo: {
      element: '.lg\\:col-span-2 .overflow-x-auto.border.rounded-lg',
      on: 'left'
    },
    buttons: [
      {
        text: 'Back',
        action: tour.back,
        classes: getButtonClasses(false)
      },
      {
        text: 'Next',
        action: tour.next,
        classes: getButtonClasses(true)
      }
    ]
  });

  tour.addStep({
    id: 'visualization',
    text: createCardContent(
      'Interactive Visualization',
      `<p class="text-slate-600 mb-3">Explore your team structure through an interactive diagram:</p>
      <ul class="space-y-3 text-slate-600">
        <li class="flex items-start">
          <span class="text-orange-500 mr-2">•</span>
          <div>
            <strong class="text-slate-900">Dependency Strength:</strong>
            <p class="mt-1">Line thickness shows how closely teams work together.</p>
          </div>
        </li>
        <li class="flex items-start">
          <span class="text-orange-500 mr-2">•</span>
          <div>
            <strong class="text-slate-900">Team Relationships:</strong>
            <p class="mt-1">Identify key collaboration patterns and potential bottlenecks.</p>
          </div>
        </li>
      </ul>`
    ),
    attachTo: {
      element: '.relative.w-full.h-\\[660px\\]',
      on: 'bottom'
    },
    buttons: [
      {
        text: 'Back',
        action: tour.back,
        classes: getButtonClasses(false)
      },
      {
        text: 'Next',
        action: tour.next,
        classes: getButtonClasses(true)
      }
    ]
  });

  tour.addStep({
    id: 'cost-analysis',
    text: createCardContent(
      'Cost Analysis',
      `<p class="text-slate-600 mb-3">Understand the financial impact of team interactions:</p>
      <ul class="space-y-3 text-slate-600">
        <li class="flex items-start">
          <span class="text-orange-500 mr-2">•</span>
          <div>
            <strong class="text-slate-900">Coordination Costs:</strong>
            <p class="mt-1">See how team dependencies affect overall operational costs.</p>
          </div>
        </li>
        <li class="flex items-start">
          <span class="text-orange-500 mr-2">•</span>
          <div>
            <strong class="text-slate-900">Efficiency Metrics:</strong>
            <p class="mt-1">Track how team structure impacts productivity and resource utilization.</p>
          </div>
        </li>
      </ul>`
    ),
    attachTo: {
      element: '.cost-analysis-section',
      on: 'bottom'
    },
    buttons: [
      {
        text: 'Back',
        action: tour.back,
        classes: getButtonClasses(false)
      },
      {
        text: 'Next',
        action: tour.next,
        classes: getButtonClasses(true)
      }
    ]
  });

  tour.addStep({
    id: 'impact-analysis',
    text: createCardContent(
      'Impact Analysis',
      `<p class="text-slate-600 mb-3">Make informed decisions about your team structure:</p>
      <ul class="space-y-3 text-slate-600">
        <li class="flex items-start">
          <span class="text-orange-500 mr-2">•</span>
          <div>
            <strong class="text-slate-900">Structure Comparison:</strong>
            <p class="mt-1">Compare different team configurations to find the optimal setup.</p>
          </div>
        </li>
        <li class="flex items-start">
          <span class="text-orange-500 mr-2">•</span>
          <div>
            <strong class="text-slate-900">Optimization Insights:</strong>
            <p class="mt-1">Get recommendations for improving team efficiency and reducing coordination overhead.</p>
          </div>
        </li>
      </ul>`
    ),
    attachTo: {
      element: '.impact-analysis-section',
      on: 'bottom'
    },
    buttons: [
      {
        text: 'Back',
        action: tour.back,
        classes: getButtonClasses(false)
      },
      {
        text: 'Finish',
        action: tour.complete,
        classes: getButtonClasses(true)
      }
    ]
  });

  return tour;
}

// Store tour completion status
export function setTutorialComplete() {
  localStorage.setItem('teamDependencyTutorialComplete', 'true');
}

export function isTutorialComplete(): boolean {
  return localStorage.getItem('teamDependencyTutorialComplete') === 'true';
} 