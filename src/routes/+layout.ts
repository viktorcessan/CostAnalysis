import { base } from '$app/paths';

// Ensure static site generation
export const prerender = true;

// Enable server-side rendering
export const ssr = false;

// Handle trailing slashes
export const trailingSlash = 'always';

// Load function to provide base path to all routes
/** @type {import('./$types').LayoutLoad} */
export function load() {
  return {
    base
  };
} 