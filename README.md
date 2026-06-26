# Backend deployment

This folder contains the Express backend for the IBID app.

## Deploying the backend

1. Choose a Node.js host such as Render, Railway, or Fly.io.
2. Point the service to this `server/` folder.
3. Use the start command:
   ```bash
   npm install
   npm start
   ```
4. Make sure the app is accessible over HTTPS.
5. Copy the backend URL and use it in the frontend deployment as `VITE_API_BASE_URL`.

## Local development

From the repository root, run:

```bash
npm run dev
```

This starts:
- frontend on `http://localhost:5173`
- backend on `http://localhost:4000`

The frontend uses `VITE_API_BASE_URL=http://localhost:4000` during local development.
