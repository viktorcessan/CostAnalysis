# Service Delivery Cost Analysis Tool

A web-based application for analyzing and comparing different service delivery models. This tool helps organizations make data-driven decisions about service transformation initiatives by providing detailed cost analysis, break-even calculations, and visualizations.


## Features

- Multiple cost models:
  - Team-based (FTE-driven calculations)
  - Ticket-based (volume-driven calculations)
- Three transformation solutions:
  - Platform automation
  - Outsourcing
  - Hybrid approach
- Interactive visualizations:
  - Cost comparison charts
  - Break-even analysis
  - Monthly savings projections
- Responsive design for desktop and mobile
- Built with modern web components


## Technical Stack

- **Framework**: Vanilla JavaScript with Web Components (Lit)
- **Bundler**: Vite
- **Styling**: Tailwind CSS
- **Charts**: Chart.js
- **Math Rendering**: KaTeX
- **Build Output**: Static HTML/JS/CSS

## Cost Models

### Team-Based Model (FTE-Driven)

Calculates costs based on team size and efficiency:
```math
C_b = n × h × w × η_s × (1 + η_o)
```
Where:
- n: Team size (FTEs)
- h: Hourly rate
- w: Working hours per month
- η_s: Service efficiency (0-1)
- η_o: Operational overhead (0-1)

### Ticket-Based Model (Volume-Driven)

Calculates costs based on ticket volume:
```math
C_t = m × t_h × p × h
```
Where:
- m: Monthly tickets
- t_h: Hours per ticket
- p: People per ticket
- h: Hourly rate

## Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/cost-analysis.git
   cd cost-analysis
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:5173 in your browser

## Deployment

### GitHub Pages

1. Update `vite.config.js`:
   ```javascript
   export default defineConfig({
     base: '/cost-analysis/',  // Replace with your repo name
     // ... other config
   });
   ```

2. Build the project:
   ```bash
   npm run build
   ```

3. Deploy using GitHub Actions:
   ```yaml
   name: Deploy to GitHub Pages
   on:
     push:
       branches: [ main ]
   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         - name: Install
           run: npm ci
         - name: Build
           run: npm run build
         - name: Deploy
           uses: JamesIves/github-pages-deploy-action@4.1.5
           with:
             branch: gh-pages
             folder: dist
   ```

### Netlify

1. Connect your GitHub repository to Netlify

2. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`

3. Deploy:
   ```bash
   npm install netlify-cli -g
   netlify deploy
   ```

### Azure Static Web Apps

1. Create a Static Web App in Azure Portal

2. Configure build settings:
   ```yaml
   app_location: "/"
   api_location: "api"
   output_location: "dist"
   ```

3. Deploy using Azure CLI:
   ```bash
   az staticwebapp create \
     --name "cost-analysis" \
     --resource-group "your-resource-group" \
     --source "https://github.com/your-username/cost-analysis" \
     --branch "main" \
     --app-location "/" \
     --output-location "dist"
   ```

