import type { LoadEvent } from '@sveltejs/kit';

export const prerender = true;

export const entries = () => [
  { model: 'team_model' },
  { model: 'ticket_model' }
];

export const load = ((event: LoadEvent) => {
  return {
    model: event.params.model
  };
}); 