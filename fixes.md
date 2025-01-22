General:
- Fix formula accordeons

Business case:

- Fix business case card balance: went to 2x2 grid
- Fix labeling issues with charts

Target:

- Remove the model explanation at the top
- From target, remove from the graph the monthly savings, make a bigger pointer to crossover
- From target, add hourly rate for the ticket system


Team dependencies:

- Improve matrix design for sequential topology
- Remove hightlight from current costs
- Improve team details table: bigger efficiency cells and visual cue for team name edit.
- Fix team dependency costs:
  - Direct meeting costs
  - Indirect meeting costs
  - Cost of opporutnity
  - Efficiency costs
- Fix LLM templates: One per type: base, target, team dependency. for base and target, make it depend on team or ticket. Be sure that math matches results in chatgpt (still needed to be tested further: i've tried some scenarios, but not all)



To do:

- Fix hierarchy levels: put restrictions in relation to the number of teams
- In base and target, the input boxes arrows hide some of the units. 
