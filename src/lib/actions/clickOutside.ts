import type { Action } from 'svelte/action';

interface ClickOutsideEvents {
  'click_outside': CustomEvent<void>;
}

export const clickOutside: Action<HTMLElement, void, ClickOutsideEvents> = (node) => {
  const handleClick = (event: MouseEvent) => {
    if (node && !node.contains(event.target as Node) && !event.defaultPrevented) {
      node.dispatchEvent(new CustomEvent('click_outside'));
    }
  };

  document.addEventListener('click', handleClick, true);

  return {
    destroy() {
      document.removeEventListener('click', handleClick, true);
    }
  };
}; 