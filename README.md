# Getting Started

## First, install the dependencies

```sh
npm install
```

## Create a PostgreSQL database configuration in the Secrets tab

Add these secrets:

- DATABASE_URL: Your PostgreSQL connection URL
- SESSION_SECRET: A random string for session security

## Set up the database schema

```sh
npm run db:push
```

## Start the development server

```sh
npm run dev
```

The app will be running on port 5000. In development mode, it uses Vite's dev server for hot module reloading and serves both the frontend and API.

## PostgreSQL

The error function gen_random_uuid() does not exist typically occurs when using Drizzle ORM with a PostgreSQL database, and the database is trying to execute the gen_random_uuid() function, which is not available. This function is a built-in PostgreSQL function for generating UUIDs, but it was introduced in PostgreSQL 13.

```sh
error: function gen_random_uuid() does not exist
```

To make it simple, use PostgreSQL greater than or equal to 13

## Note

> The application is already configured with a workflow to run npm run dev. You can simply click the "Run" button at the top of the Replit interface to start the application.
