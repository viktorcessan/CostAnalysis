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
      'Welcome to the Team Dependency Cost Calculator',
      `<p class="text-slate-600 leading-relaxed">This tool is designed to help you uncover and understand the hidden costs of team dependencies. Let's walk through the process together.</p>`
    ),
    buttons: [
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
      'Step 1: Define Your Team Structure',
      `<p class="text-slate-600 mb-3">Start by selecting the team structure pattern that best represents how your teams collaborate today. You'll choose from options like evenly balanced teams, hub-and-spoke models, hierarchical setups, and more. This helps us establish a baseline for understanding your dependencies.</p>
      <p class="text-slate-600">Choose the structure that feels the closest fit to your current setup.</p>`
    ),
    attachTo: {
      element: '#distribution-pattern-section',
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
    id: 'team-params',
    text: createCardContent(
      'Step 2: Provide Team Details',
      `<p class="text-slate-600 mb-3">Next, input some basic information about your teams:</p>
      <ul class="space-y-3 text-slate-600">
        <li class="flex items-start">
          <span class="text-orange-500 mr-2">•</span>
          <div>How many teams are involved?</div>
        </li>
        <li class="flex items-start">
          <span class="text-orange-500 mr-2">•</span>
          <div>What's the average hourly cost per employee?</div>
        </li>
        <li class="flex items-start">
          <span class="text-orange-500 mr-2">•</span>
          <div>How large is each team?</div>
        </li>
      </ul>
      <p class="text-slate-600 mt-3">This step allows us to understand your team composition and cost structure. You can name your teams in this step if you'd like.</p>`
    ),
    attachTo: {
      element: '#team-params-section',
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
    id: 'dependency-params',
    text: createCardContent(
      'Step 3: Map Team Dependencies',
      `<p class="text-slate-600 mb-3">Once your team details are set, you'll map the dependencies between teams. Specify the strength of your dependencies e.g., high, medium, or low, or input exact dependencies between teams in the dependency table.</p>
      <p class="text-slate-600">This step helps visualize how teams rely on each other and where potential bottlenecks exist.</p>`
    ),
    attachTo: {
      element: '#dependency-params-section',
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
    id: 'meeting-params',
    text: createCardContent(
      'Step 4: Account for Communication Costs',
      `<p class="text-slate-600 mb-3">Communication plays a significant role in dependency costs. You'll provide details like:</p>
      <ul class="space-y-3 text-slate-600">
        <li class="flex items-start">
          <span class="text-orange-500 mr-2">•</span>
          <div>The average duration and frequency of cross-team meetings</div>
        </li>
        <li class="flex items-start">
          <span class="text-orange-500 mr-2">•</span>
          <div>The number of attendees per meeting</div>
        </li>
        <li class="flex items-start">
          <span class="text-orange-500 mr-2">•</span>
          <div>Any additional overhead, such as preparation or follow-up time</div>
        </li>
      </ul>
      <p class="text-slate-600 mt-3">This ensures a complete picture of the costs associated with collaboration.</p>`
    ),
    attachTo: {
      element: '#meeting-params-section',
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
    id: 'visualization',
    text: createCardContent(
      'Step 5: Visualize Your Dependencies',
      `<p class="text-slate-600 mb-3">After entering the data, you'll see an interactive visualization of your team's dependencies. This diagram shows:</p>
      <ul class="space-y-3 text-slate-600">
        <li class="flex items-start">
          <span class="text-orange-500 mr-2">•</span>
          <div>How closely teams work together</div>
        </li>
        <li class="flex items-start">
          <span class="text-orange-500 mr-2">•</span>
          <div>Where dependencies are strongest</div>
        </li>
        <li class="flex items-start">
          <span class="text-orange-500 mr-2">•</span>
          <div>Potential bottlenecks or inefficiencies</div>
        </li>
      </ul>`
    ),
    attachTo: {
      element: '#visualization-container',
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
      'Step 6: Analyze the Costs',
      `<p class="text-slate-600 mb-3">With everything mapped, the tool calculates the costs of your team dependencies. You'll see a breakdown of:</p>
      <ul class="space-y-3 text-slate-600">
        <li class="flex items-start">
          <span class="text-orange-500 mr-2">•</span>
          <div>Total costs related to meetings and communication</div>
        </li>
        <li class="flex items-start">
          <span class="text-orange-500 mr-2">•</span>
          <div>The impact of dependencies on team efficiency</div>
        </li>
        <li class="flex items-start">
          <span class="text-orange-500 mr-2">•</span>
          <div>Opportunities for cost reduction</div>
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
      'Step 7: Explore Alternative Scenarios',
      `<p class="text-slate-600 mb-3">Finally, you'll evaluate potential changes to your team structure. Compare your current setup with optimized configurations to:</p>
      <ul class="space-y-3 text-slate-600">
        <li class="flex items-start">
          <span class="text-orange-500 mr-2">•</span>
          <div>Identify ways to reduce costs and improve efficiency</div>
        </li>
        <li class="flex items-start">
          <span class="text-orange-500 mr-2">•</span>
          <div>Align team structures with your product and organizational goals</div>
        </li>
      </ul>
      <p class="text-slate-600 mt-3">Ready to Begin?</p>`
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