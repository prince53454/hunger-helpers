# Hunger Helpers — Restaurant Operations Platform

Hunger Helpers brings three restaurant workflows into one web app. Use the three buttons in the top navigation to switch between them without deploying separate sites.

## Three screens

- **Customer** — browse the menu, add items to the cart, place orders, view past orders, and track an active order.
- **Kitchen** — view incoming tickets and update order progress from the kitchen display.
- **Admin** — review restaurant analytics and manage menu items and availability.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS and Lucide icons
- Node.js + Express API
- Server-Sent Events (SSE) for live order updates
- JSON-file demo storage

## Run locally

Requirements: Node.js 22 or newer.

```bash
npm install
cp .env.example .env
npm run dev
```

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`. The development command starts the Express application. Open the local URL printed in the terminal.

Run the backend tests with:

```bash
npm test
```

Build the frontend with:

```bash
npm run build
```

## GitHub repository

Recommended repository name: `hunger-helpers`

## Deployment notes

The app has a frontend and a persistent Express API. Vercel can host the Vite frontend, but it does **not** run this project’s long-lived Express/SSE server simply by serving `dist`. For a fully working deployment, deploy the Express server to a Node host that supports long-lived SSE connections (for example Render) and deploy the frontend to Vercel. Set `VITE_API_BASE_URL` in Vercel to the public backend origin, such as `https://YOUR-BACKEND.onrender.com`, with no trailing slash. Configure the backend CORS policy to allow the Vercel site origin before production use.

The current API stores demo data in `data/restaurant-db.json`; ephemeral hosting filesystems can reset, so use a persistent disk or migrate to a managed database before relying on it for real restaurant operations. Change `JWT_SECRET` to a strong private value in the backend environment. Never commit `.env` or real secrets.
