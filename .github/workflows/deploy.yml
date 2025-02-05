name: Build and Deploy

on:
  push:
    branches: ["main"]
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Sync SvelteKit files
        run: npx svelte-kit sync
        
      - name: Build
        run: npm run build
        
      - name: Copy .htaccess
        run: cp static/.htaccess build/
        
      - name: Set Permissions
        run: chmod -R 755 build/

      - name: Debug Build Directory
        run: |
          echo "Build directory contents:"
          ls -la build/
          echo "Content of build/index.html:"
          cat build/index.html

      - name: SFTP Upload
        uses: Dylan700/sftp-upload-action@latest
        with:
          server: ${{ secrets.SFTP_HOST }}
          username: ${{ secrets.SFTP_USERNAME }}
          password: ${{ secrets.SFTP_PASSWORD }}
          port: ${{ secrets.SFTP_PORT }}
          uploads: |
            ./build/ => /customers/1/0/6/napkin-ops.com/httpd.www/
          delete: 'true'