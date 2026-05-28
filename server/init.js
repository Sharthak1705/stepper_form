
const { pool } = require("./db");

async function initDB() {

  // =========================
  // Tables
  // =========================

  await pool.query(`
    CREATE TABLE IF NOT EXISTS form_configs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      config_json JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS submissions (

      id UUID PRIMARY KEY,

      config_id TEXT NOT NULL
      REFERENCES form_configs(id),

      user_id TEXT NOT NULL DEFAULT 'user-1',

      title TEXT NOT NULL,

      status TEXT NOT NULL DEFAULT 'draft'
      CHECK(status IN ('draft', 'completed')),

      current_step INTEGER NOT NULL DEFAULT 0,

      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS step_answers (

      id SERIAL PRIMARY KEY,

      submission_id UUID NOT NULL
      REFERENCES submissions(id)
      ON DELETE CASCADE,

      step_id TEXT NOT NULL,

      answers_json JSONB NOT NULL,

      is_completed BOOLEAN DEFAULT FALSE,

      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      UNIQUE(submission_id, step_id)
    );
  `);




  // =========================
  // Indexes
  // =========================

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_submissions_user
    ON submissions(user_id, status);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_answers_submission
    ON step_answers(submission_id);
  `);




  // =========================
  // Seed Default Config
  // =========================

  const existing = await pool.query(
    `
    SELECT id
    FROM form_configs
    WHERE id = $1
    `,
    ["wellness-intake"]
  );



  if (existing.rows.length === 0) {

    const config = {
      id: "wellness-intake",

      title: "Wellness Intake",

      steps: [

        {
          id: "personal-details",

          title: "Personal Details",

          fields: [
            {
              id: "fullName",
              label: "Full Name",
              type: "text",
              required: true,
              placeholder: "Enter your full name"
            },

            {
              id: "age",
              label: "Age",
              type: "text",
              required: true,
              placeholder: "Enter your age",

              validation: {
               pattern: "^\\d+$",
                message: "Age must be a number",
                min: 1,
                max: 120
              }
            },

            {
              id: "gender",
              label: "Gender",
              type: "select",
              required: true,

              options: [
                "Male",
                "Female",
                "Non-binary",
                "Prefer not to say"
              ]
            }
          ]
        },



        {
          id: "wellness-preferences",

          title: "Wellness Preferences",

          fields: [
            {
              id: "primaryGoals",
              label: "Primary Goals",
              type: "select",

              options: [
                "Sleep better",
                "Improve focus",
                "Reduce stress",
                "Build habits",
                "Increase energy"
              ]
            },

            {
              id: "supportType",
              label: "Preferred Support Type",
              type: "radio",
              required: true,

              options: [
                "Self-Guided",
                "Coach Support",
                "Not Sure"
              ]
            },

            {
              id: "notes",
              label: "Notes",
              type: "text",
              placeholder: "Any additional notes..."
            }
          ]
        },



        {
          id: "availability",

          title: "Availability",

          fields: [
            {
              id: "preferredTime",
              label: "Preferred Time",
              type: "select",

              options: [
                "Morning (6-12)",
                "Afternoon (12-18)",
                "Evening (18-22)"
              ]
            },

            {
              id: "contactMethod",
              label: "Preferred Contact Method",
              type: "radio",
              required: true,

              options: [
                "Email",
                "Phone",
                "SMS"
              ]
            },

            {
              id: "additionalDetails",
              label: "Additional Details",
              type: "text",

              placeholder:
                "e.g. Available mostly after 6 PM"
            }
          ]
        }
      ]
    };



    await pool.query(
      `
      INSERT INTO form_configs (
        id,
        title,
        config_json
      )
      VALUES ($1, $2, $3)
      `,
      [
        config.id,
        config.title,
        JSON.stringify(config)
      ]
    );



    console.log(
      "Seeded default config: wellness-intake"
    );
  }



  console.log(
    "PostgreSQL tables ready"
  );
}

module.exports = {
  initDB
};
