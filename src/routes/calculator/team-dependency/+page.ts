import type { PageLoad } from './$types';
import { parseShareLink } from '$lib/utils/teamDependencyShare';
import { redirect } from '@sveltejs/kit';

export const prerender = true;

export const load: PageLoad = ({ url }) => {
  // Parse share link parameters if present
  const searchParams = url.searchParams;
  
  // If the URL contains another URL in the query params, extract the actual query params
  const fullUrl = searchParams.toString();
  const questionMarkIndex = fullUrl.lastIndexOf('?');
  const actualParams = questionMarkIndex !== -1 
    ? new URLSearchParams(fullUrl.substring(questionMarkIndex + 1))
    : searchParams;
  
  const sharedConfig = actualParams.size > 0 ? parseShareLink(actualParams) : null;
  
  // If we have shared config params but they're invalid, redirect to the base URL
  if (actualParams.size > 0 && !sharedConfig) {
    throw redirect(307, '/calculator/team-dependency');
  }
  
  return {
    sharedConfig
  };
}; 