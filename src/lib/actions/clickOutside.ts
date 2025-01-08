import type { Action } from 'svelte/action';

interface ClickOutsideConfig {
  enabled?: boolean;
  callback?: () => void;
}

interface ClickOutsideEvents {
  'click_outside': CustomEvent<void>;
}

export const clickOutside: Action<HTMLElement, ClickOutsideConfig | undefined, ClickOutsideEvents> = (node, config) => {
  const handleClick = (event: MouseEvent) => {
    if (
      node && 
      !node.contains(event.target as Node) && 
      !event.defaultPrevented && 
      (!config || config.enabled !== false)
    ) {
      if (config?.callback) {
        config.callback();
      } else {
        node.dispatchEvent(new CustomEvent('click_outside'));
      }
    }
  };

  document.addEventListener('click', handleClick, true);

  return {
    destroy() {
      document.removeEventListener('click', handleClick, true);
    },
    update(newConfig) {
      config = newConfig;
    }
  };
}; 