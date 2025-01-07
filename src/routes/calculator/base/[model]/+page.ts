import type { PageLoad } from './$types';
import { parseShareLink } from '$lib/utils/baseAnalysisShare';
import type { CalculatorModel } from '$lib/types/calculator';
import { redirect } from '@sveltejs/kit';

export const load: PageLoad = ({ params, url }) => {
  // Remove _model suffix from the model parameter
  const model = params.model.replace('_model', '') as CalculatorModel;
  
  // Check if we're on the old path and redirect if necessary
  if (url.pathname.includes('/base_analysis/')) {
    throw redirect(302, url.pathname.replace('/base_analysis/', '/base/'));
  }
  
  // Parse share link parameters if present
  const searchParams = url.searchParams;
  
  // If the URL contains another URL in the query params, extract the actual query params
  const fullUrl = searchParams.toString();
  const questionMarkIndex = fullUrl.lastIndexOf('?');
  const actualParams = questionMarkIndex !== -1 
    ? new URLSearchParams(fullUrl.substring(questionMarkIndex + 1))
    : searchParams;
  
  const sharedConfig = actualParams.size > 0 ? parseShareLink(actualParams) : null;
  
  console.log('URL:', url.toString());
  console.log('Search params:', actualParams.toString());
  console.log('Shared config:', sharedConfig);
  
  return {
    model,
    sharedConfig
  };
}; 