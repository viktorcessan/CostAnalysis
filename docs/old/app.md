# Service Delivery Cost Calculator Application Documentation

## Tech Stack

The application is built with modern web technologies chosen for their performance, developer experience, and maintainability:

1. **SvelteKit**: A modern web framework that offers:
   - Exceptional performance through compile-time optimizations
   - Zero-config deployments
   - Built-in routing and server-side rendering
   - Minimal boilerplate code

2. **TypeScript**: Provides type safety and better developer experience:
   - Catch errors early in development
   - Better IDE support and autocompletion
   - Self-documenting code through type definitions

3. **TailwindCSS**: A utility-first CSS framework chosen for:
   - Rapid UI development
   - Consistent design system
   - Zero runtime overhead
   - Built-in responsive design

4. **Chart.js**: A powerful charting library that offers:
   - Wide range of chart types
   - Good performance with large datasets
   - Extensive customization options
   - Strong TypeScript support

## Overview

The Service Delivery Cost Calculator is a web application built with SvelteKit that helps organizations analyze and optimize their service delivery costs. The application provides multiple analysis modes:

1. Base Analysis - Calculate current service delivery costs
2. Target-Based Planning - Plan implementation based on ROI targets
3. Internal Analysis - Analyze process efficiency and team dependencies

## Repository Structure

```
migrationapp/
├── src/
│   ├── lib/
│   │   ├── stores/           # Svelte stores for state management
│   │   ├── types/            # TypeScript type definitions
│   │   └── utils/            # Utility functions
│   ├── features/
│   │   └── calculator/
│   │       └── components/   # Calculator-related components
│   └── routes/               # SvelteKit routes
├── static/                   # Static assets
├── docs/                     # Documentation
```

### Key Files

- `src/routes/calculator/+page.svelte`: Main calculator page
- `src/lib/stores/calculatorStore.ts`: Central state management
- `src/lib/types/calculator.ts`: TypeScript interfaces and types
- `src/features/calculator/components/`: Calculator components
  - `CalculatorForm.svelte`: Base analysis form
  - `ResultsDisplay.svelte`: Cost analysis results
  - `ReverseAnalysisForm.svelte`: Target-based planning
  - `ProcessEfficiencyForm.svelte`: Internal analysis

## Architecture

### Frontend Architecture

The application follows a component-based architecture using Svelte:

1. **Routing**: SvelteKit handles routing with file-based routing in the `routes` directory
2. **State Management**: Svelte stores manage application state
3. **Components**: Modular components in the `features` directory
4. **TypeScript**: Strong typing throughout the application
5. **TailwindCSS**: Utility-first CSS framework for styling

### State Management

The application uses a centralized store (`calculatorStore.ts`) that handles:

1. Calculator model state (team/ticket-based)
2. Input management
3. Calculation logic
4. Results storage

### Data Flow

1. User inputs → Component state
2. Component state → Calculator store
3. Calculator store → Calculations
4. Results → Display components

## Deployment

### Prerequisites

- Node.js (v16 or later)
- npm
- Git

### Local Development

1. Clone the repository:
```bash
git clone <repository-url>
cd migrationapp
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

### Production Deployment

1. Build the application:
```bash
npm run build
```

2. Preview the production build:
```bash
npm run preview
```

3. Deploy the `build` directory to your hosting platform

### Deployment Platforms

The application can be deployed to various platforms:

1. **GitHub Pages**
   - Create `.github/workflows/deploy.yml`:
   ```yaml
   name: Deploy to GitHub Pages
   on:
     push:
       branches: ['main']
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
           with:
             node-version: 16
         - run: npm ci
         - run: npm run build
         - uses: actions/upload-pages-artifact@v1
           with:
             path: build
         - uses: actions/deploy-pages@v2
   ```
   - Enable GitHub Pages in repository settings
   - Set build directory to `build`
   - Push changes to main branch

2. **Vercel**
   - Connect your GitHub repository
   - Vercel will automatically detect SvelteKit
   - Configure environment variables if needed

3. **Netlify**
   - Connect your GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `build`

4. **Docker**
   ```dockerfile
   FROM node:16-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["node", "build"]
   ```

## Customization

### Landing Page Modifications

The landing page can be customized by editing `src/routes/+page.svelte`:

1. **Content**: Update the text content directly in the file
2. **Styling**: Modify TailwindCSS classes or add custom CSS
3. **Layout**: Adjust the component structure
4. **Images**: Add images to the `static` directory and reference them

### Theme Customization

1. **Colors**: Modify `tailwind.config.js`:
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {...},
        secondary: {...}
      }
    }
  }
}
```

2. **Typography**: Update font settings in `app.html` or `tailwind.config.js`

3. **Components**: Modify component styles in their respective `.svelte` files

### Adding New Features

1. Create new components in `src/features/`
2. Add new types to `src/lib/types/`
3. Update the store in `src/lib/stores/`
4. Add new routes in `src/routes/`