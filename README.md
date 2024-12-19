# Platform Cost Analysis

A comprehensive tool for analyzing service delivery models and their associated costs. Compare different service delivery approaches and make data-driven decisions about service transformation initiatives.

## Features

- Team-Based and Ticket-Based cost models
- Platform, Outsourcing, and Hybrid solution analysis
- Interactive cost calculations and break-even analysis
- Comprehensive charts and visualizations
- PDF and Excel export capabilities
- Detailed technical documentation with LaTeX formulas


## Deployment

The project is configured for automatic deployment to GitHub Pages:

1. Push your changes to the main branch
2. GitHub Actions will automatically build and deploy to GitHub Pages
3. Your site will be available at: https://yourusername.github.io/platform-cost-analysis/

To deploy manually:

1. Build the project:
```bash
npm run build
```

2. Deploy the `dist` folder to your hosting provider

## Configuration

- Update `vite.config.js` base URL to match your repository name
- Adjust GitHub Actions workflow in `.github/workflows/deploy.yml` if needed

## License

MIT 