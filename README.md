# Multi-Step Wellness Intake Form

A full-stack multi-step form application built with:

* React + Vite (Frontend)
* Node.js + Express (Backend)
* PostgreSQL (Database)

The application supports:

* Dynamic form configuration
* Draft saving
* Step-by-step validation
* Progress tracking
* Final submission workflow
* PostgreSQL JSONB storage

---

# Project Structure

```txt
project/
├── client/
├── server/
```

---

# Frontend Setup (client)

## Navigate to client

```bash
cd client
```

---

## Install dependencies

```bash
npm install
```

---

## Create .env file

```env
VITE_API_URL=http://localhost:3001/api
```

---

## Start frontend

```bash
npm run dev
```

Frontend runs on:

```txt
http://localhost:5173
```

---

# Backend Setup (server)

## Navigate to server

```bash
cd server
```

---

## Install dependencies

```bash
npm install
```

Required packages:

```bash
npm install express cors pg dotenv nodemon
```

---

# PostgreSQL Setup

Create a PostgreSQL database.

Example:

```sql
CREATE DATABASE wellness_app;
```

---

# Create .env file

Inside `server/.env`

```env
PORT=3001

DB_USER=DB_Username
DB_HOST=localhost
DB_NAME=stepper
DB_PASSWORD=your_password
DB_PORT=5432
```

---

# Start Backend

```bash
npm run dev
```

or

```bash
npx nodemon
```

Backend runs on:

```txt
http://localhost:3001
```

---

# Database Initialization

On server start:

* tables are automatically created
* indexes are created
* default form config is seeded

Tables:

* form_configs
* submissions
* step_answers

---

# API Endpoints

## Config APIs

### Get all configs

```http
GET /api/configs
```

### Get config by ID

```http
GET /api/configs/:id
```

---

## Submission APIs

### Create submission

```http
POST /api/submissions
```

### List submissions

```http
GET /api/submissions
```

### Get single submission

```http
GET /api/submissions/:id
```

### Save step

```http
PATCH /api/submissions/:id/steps/:stepIndex
```

### Submit form

```http
POST /api/submissions/:id/submit
```

### Delete submission

```http
DELETE /api/submissions/:id
```

---

# Features

* Dynamic form rendering
* Draft save support
* Step validation
* Unsaved changes warning
* Progress tracking
* PostgreSQL JSONB storage
* REST API architecture
* UUID-based submissions

---

# Technologies Used

## Frontend

* React
* Vite
* Fetch API

## Backend

* Node.js
* Express.js
* PostgreSQL
* pg

---

# Development Commands

## Frontend

```bash
npm run dev
```

## Backend

```bash
npx nodemon
```
