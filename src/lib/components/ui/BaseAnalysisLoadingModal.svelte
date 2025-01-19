<!-- BaseAnalysisLoadingModal.svelte -->
<script lang="ts">
  import { fade } from 'svelte/transition';
  import { clickOutside } from '$lib/actions/clickOutside';
  import type { CalculatorModel, TeamInputs, TicketInputs, SolutionInputs } from '$lib/types/calculator';

  export let show = false;
  export let model: CalculatorModel;
  export let baseInputs: TeamInputs | TicketInputs;
  export let solutionInputs: SolutionInputs | undefined;
  export let onConfirm: () => void;
  export let onCancel: () => void;

  function formatValue(value: number): string {
    if (value >= 1) return value.toString();
    return (value * 100).toFixed(1) + '%';
  }
</script>

{#if show}
  <div
    class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    transition:fade={{ duration: 200 }}
  >
    <div
      class="bg-white/95 backdrop-blur rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-100"
      use:clickOutside={{ enabled: show, cb: onCancel }}
      on:click|stopPropagation
    >
      <!-- Header -->
      <div class="px-8 py-5 border-b border-gray-100">
        <h3 class="text-xl font-semibold text-gray-800">Load Shared Configuration</h3>
        <p class="mt-2 text-sm text-gray-600">
          Review the shared configuration before loading it. This will replace your current configuration.
        </p>
      </div>
      
      <!-- Content -->
      <div class="px-8 py-6 space-y-6 max-h-[60vh] overflow-y-auto">
        <!-- Model Type -->
        <div class="bg-gray-50/50 backdrop-blur-sm rounded-xl p-5 border border-gray-100">
          <div class="text-sm font-medium text-gray-700 mb-2">Model Type</div>
          <div class="text-sm text-gray-600 capitalize flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-secondary/30"></div>
            {model} Model
          </div>
        </div>
        
        <!-- Base Parameters -->
        <div class="bg-gray-50/50 backdrop-blur-sm rounded-xl p-5 border border-gray-100">
          <div class="text-sm font-medium text-gray-700 mb-3">Base Parameters</div>
          {#if model === 'team'}
            {@const inputs = baseInputs as TeamInputs}
            <div class="grid grid-cols-2 gap-3">
              <div class="col-span-2 flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">Team Size</span>
                <span class="text-sm font-medium text-gray-900">{inputs.teamSize}</span>
              </div>
              <div class="col-span-2 flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">Hourly Rate</span>
                <span class="text-sm font-medium text-gray-900">${inputs.hourlyRate}</span>
              </div>
              <div class="col-span-2 flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">Service Efficiency</span>
                <span class="text-sm font-medium text-gray-900">{formatValue(inputs.serviceEfficiency)}</span>
              </div>
              <div class="col-span-2 flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">Operational Overhead</span>
                <span class="text-sm font-medium text-gray-900">{formatValue(inputs.operationalOverhead)}</span>
              </div>
            </div>
          {:else}
            {@const inputs = baseInputs as TicketInputs}
            <div class="grid grid-cols-2 gap-3">
              <div class="col-span-2 flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">Monthly Tickets</span>
                <span class="text-sm font-medium text-gray-900">{inputs.monthlyTickets}</span>
              </div>
              <div class="col-span-2 flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">Hours per Ticket</span>
                <span class="text-sm font-medium text-gray-900">{inputs.hoursPerTicket}</span>
              </div>
              <div class="col-span-2 flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">People per Ticket</span>
                <span class="text-sm font-medium text-gray-900">{inputs.peoplePerTicket}</span>
              </div>
              <div class="col-span-2 flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">Hourly Rate</span>
                <span class="text-sm font-medium text-gray-900">${inputs.hourlyRate}</span>
              </div>
              <div class="col-span-2 flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">SLA Compliance</span>
                <span class="text-sm font-medium text-gray-900">{inputs.slaCompliance}%</span>
              </div>
            </div>
          {/if}
        </div>
        
        <!-- Solution Parameters -->
        {#if solutionInputs}
          <div class="bg-gray-50/50 backdrop-blur-sm rounded-xl p-5 border border-gray-100">
            <div class="text-sm font-medium text-gray-700 mb-3">Solution Parameters</div>
            {#if solutionInputs.type === 'platform' && solutionInputs.platform}
              <div class="grid grid-cols-2 gap-3">
                <div class="col-span-2 flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                  <span class="text-sm text-gray-600">Platform Cost</span>
                  <span class="text-sm font-medium text-gray-900">${solutionInputs.platform.platformCost}</span>
                </div>
                <div class="col-span-2 flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                  <span class="text-sm text-gray-600">Monthly Maintenance</span>
                  <span class="text-sm font-medium text-gray-900">${solutionInputs.platform.platformMaintenance}</span>
                </div>
                <div class="col-span-2 flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                  <span class="text-sm text-gray-600">Time to Build</span>
                  <span class="text-sm font-medium text-gray-900">{solutionInputs.platform.timeToBuild} months</span>
                </div>
                <div class="col-span-2 flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                  <span class="text-sm text-gray-600">Team Reduction</span>
                  <span class="text-sm font-medium text-gray-900">{formatValue(solutionInputs.platform.teamReduction)}</span>
                </div>
                <div class="col-span-2 flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                  <span class="text-sm text-gray-600">Process Efficiency</span>
                  <span class="text-sm font-medium text-gray-900">{formatValue(solutionInputs.platform.processEfficiency)}</span>
                </div>
              </div>
            {:else if solutionInputs.type === 'outsource' && solutionInputs.outsource}
              <div class="grid grid-cols-2 gap-3">
                <div class="col-span-2 flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                  <span class="text-sm text-gray-600">Vendor Rate</span>
                  <span class="text-sm font-medium text-gray-900">${solutionInputs.outsource.vendorRate}</span>
                </div>
                <div class="col-span-2 flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                  <span class="text-sm text-gray-600">Management Overhead</span>
                  <span class="text-sm font-medium text-gray-900">{formatValue(solutionInputs.outsource.managementOverhead)}</span>
                </div>
                <div class="col-span-2 flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                  <span class="text-sm text-gray-600">Quality Impact</span>
                  <span class="text-sm font-medium text-gray-900">{formatValue(solutionInputs.outsource.qualityImpact)}</span>
                </div>
                <div class="col-span-2 flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                  <span class="text-sm text-gray-600">Knowledge Loss</span>
                  <span class="text-sm font-medium text-gray-900">{formatValue(solutionInputs.outsource.knowledgeLoss)}</span>
                </div>
                <div class="col-span-2 flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                  <span class="text-sm text-gray-600">Transition Time</span>
                  <span class="text-sm font-medium text-gray-900">{solutionInputs.outsource.transitionTime} months</span>
                </div>
                <div class="col-span-2 flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                  <span class="text-sm text-gray-600">Transition Cost</span>
                  <span class="text-sm font-medium text-gray-900">${solutionInputs.outsource.transitionCost}</span>
                </div>
              </div>
            {:else if solutionInputs.type === 'hybrid' && solutionInputs.hybrid}
              <div class="grid grid-cols-2 gap-3">
                <div class="col-span-2 flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                  <span class="text-sm text-gray-600">Platform Portion</span>
                  <span class="text-sm font-medium text-gray-900">{solutionInputs.hybrid.platformPortion}%</span>
                </div>
                <div class="col-span-2 flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                  <span class="text-sm text-gray-600">Vendor Portion</span>
                  <span class="text-sm font-medium text-gray-900">{solutionInputs.hybrid.vendorPortion}%</span>
                </div>
                <div class="col-span-2 flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                  <span class="text-sm text-gray-600">Platform Cost</span>
                  <span class="text-sm font-medium text-gray-900">${solutionInputs.hybrid.platformCost}</span>
                </div>
                <div class="col-span-2 flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                  <span class="text-sm text-gray-600">Platform Maintenance</span>
                  <span class="text-sm font-medium text-gray-900">${solutionInputs.hybrid.platformMaintenance}</span>
                </div>
                <div class="col-span-2 flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                  <span class="text-sm text-gray-600">Time to Build</span>
                  <span class="text-sm font-medium text-gray-900">{solutionInputs.hybrid.timeToBuild} months</span>
                </div>
                <div class="col-span-2 flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                  <span class="text-sm text-gray-600">Team Reduction</span>
                  <span class="text-sm font-medium text-gray-900">{formatValue(solutionInputs.hybrid.teamReduction)}</span>
                </div>
                <div class="col-span-2 flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                  <span class="text-sm text-gray-600">Process Efficiency</span>
                  <span class="text-sm font-medium text-gray-900">{formatValue(solutionInputs.hybrid.processEfficiency)}</span>
                </div>
                <div class="col-span-2 flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                  <span class="text-sm text-gray-600">Vendor Rate</span>
                  <span class="text-sm font-medium text-gray-900">${solutionInputs.hybrid.vendorRate}</span>
                </div>
                <div class="col-span-2 flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                  <span class="text-sm text-gray-600">Management Overhead</span>
                  <span class="text-sm font-medium text-gray-900">{formatValue(solutionInputs.hybrid.managementOverhead)}</span>
                </div>
                <div class="col-span-2 flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                  <span class="text-sm text-gray-600">Quality Impact</span>
                  <span class="text-sm font-medium text-gray-900">{formatValue(solutionInputs.hybrid.qualityImpact)}</span>
                </div>
                <div class="col-span-2 flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                  <span class="text-sm text-gray-600">Knowledge Loss</span>
                  <span class="text-sm font-medium text-gray-900">{formatValue(solutionInputs.hybrid.knowledgeLoss)}</span>
                </div>
                <div class="col-span-2 flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                  <span class="text-sm text-gray-600">Transition Time</span>
                  <span class="text-sm font-medium text-gray-900">{solutionInputs.hybrid.transitionTime} months</span>
                </div>
                <div class="col-span-2 flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                  <span class="text-sm text-gray-600">Transition Cost</span>
                  <span class="text-sm font-medium text-gray-900">${solutionInputs.hybrid.transitionCost}</span>
                </div>
              </div>
            {/if}
          </div>
        {/if}
      </div>
      
      <!-- Footer -->
      <div class="px-8 py-5 bg-gray-50/50 backdrop-blur-sm flex justify-end gap-3 border-t border-gray-100">
        <button
          class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary/60 transition-all shadow-sm hover:shadow-md active:shadow-sm"
          on:click={onCancel}
        >
          Cancel
        </button>
        <button
          class="px-5 py-2.5 text-sm font-medium text-white bg-secondary rounded-lg hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary/60 transition-all shadow-sm hover:shadow-md active:shadow-sm"
          on:click={onConfirm}
        >
          Load Configuration
        </button>
      </div>
    </div>
  </div>
{/if} 