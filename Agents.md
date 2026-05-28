
Create a production-ready Node.js backend using Express.js and PostgreSQL for a multi-step form submission system.

Requirements:

## Tech Stack

* Node.js
* Express.js
* PostgreSQL
* pg package
* CommonJS syntax (require/module.exports)
* REST API architecture

---

# Database Requirements

Create PostgreSQL tables with proper relationships and indexes.

## Tables

### form_configs

Store dynamic form configurations.

Fields:

* id (TEXT PRIMARY KEY)
* title (TEXT NOT NULL)
* config_json (JSONB NOT NULL)
* created_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

---

### submissions

Store user form submissions.

Fields:

* id (TEXT PRIMARY KEY)
* config_id (TEXT REFERENCES form_configs(id))
* user_id (TEXT NOT NULL DEFAULT 'user-1')
* title (TEXT NOT NULL)
* status (TEXT CHECK(status IN ('draft','completed')))
* current_step (INTEGER DEFAULT 0)
* created_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
* updated_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

---

### step_answers

Store answers for each form step.

Fields:

* id (SERIAL PRIMARY KEY)
* submission_id (TEXT REFERENCES submissions(id) ON DELETE CASCADE)
* step_id (TEXT NOT NULL)
* answers_json (JSONB NOT NULL)
* is_completed (BOOLEAN DEFAULT FALSE)
* updated_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

Add:

* UNIQUE(submission_id, step_id)

---

# Database Features

Include:

* foreign keys
* indexes
* JSONB support
* ON CONFLICT upsert support
* proper relational schema
* optimized indexes

Create indexes:

* submissions(user_id, status)
* step_answers(submission_id)

---

# Backend Architecture

Use modular folder structure:

backend/
├── db.js
├── init-db.js
├── server.js
├── routes/
│   ├── configs.js
│   └── submissions.js
├── validation.js

---

# API Requirements

## Config APIs

GET /api/configs

* return all form configs

GET /api/configs/:id

* return full config JSON

---

## Submission APIs

POST /api/submissions

* create draft submission

GET /api/submissions

* list all submissions

GET /api/submissions/:id

* get full submission with answers

PATCH /api/submissions/:id/steps/:stepIndex

* save step answers
* support draft saving
* validate fields
* support moveNext logic
* support upsert queries

POST /api/submissions/:id/submit

* validate all steps
* mark submission completed

DELETE /api/submissions/:id

* delete submission

---

# Validation Requirements

Create reusable validation utilities:

* validateField()
* validateStep()
* validateForm()
* isStepComplete()

Validation rules:

* required fields
* regex pattern validation
* min/max validation
* select/radio option validation

---

# Implementation Requirements

Use:

* async/await
* pool.query()
* PostgreSQL parameterized queries ($1, $2)

Avoid:

* SQLite syntax
* db.prepare()
* synchronous queries

---

# Additional Requirements

Include:

* global error handler
* 404 handler
* health check route
* environment variable support
* proper HTTP status codes
* clean JSON responses
* reusable helper functions

Generate complete production-ready backend code with all files fully implemented.



These are the tables which is require to run the code in the backend by using postgreSQL:


# CREATE TABLE configs (
#   id SERIAL PRIMARY KEY,
#   name VARCHAR(255) NOT NULL,
#   description TEXT,
#   steps JSONB NOT NULL,
#   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
# );



# CREATE TABLE submissions (
#   id SERIAL PRIMARY KEY,
#   config_id INTEGER REFERENCES configs(id) ON DELETE CASCADE,
#   current_step INTEGER DEFAULT 0,
#   is_submitted BOOLEAN DEFAULT FALSE,
#   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
#   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
# );



# CREATE TABLE submission_steps (
#   id SERIAL PRIMARY KEY,
#   submission_id INTEGER REFERENCES submissions(id) ON DELETE CASCADE,
#   step_index INTEGER NOT NULL,
#   answers JSONB NOT NULL,
#   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
#   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
# );




# UPDATE form_configs
# SET config_json = jsonb_set(
#   config_json,
#   '{steps,0,fields,1,validation,pattern}',
#   '"^\\\\d+$"'
# )
# WHERE id = 'wellness-intake';
