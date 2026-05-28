
const express = require("express");
const { randomUUID } = require("crypto");

const { pool } = require("../db");

const {
  validateStep,
  validateForm,
  isStepComplete,
} = require("../validation");

const router = express.Router();

const USER_ID = "user-1";



// =========================
// Helper: Get Config
// =========================

async function getConfig(configId, res) {
  try {

    const result = await pool.query(
      `
      SELECT config_json
      FROM form_configs
      WHERE id = $1
      `,
      [configId]
    );

    const row = result.rows[0];

    if (!row) {
      res.status(400).json({
        error: `Config '${configId}' not found`
      });

      return null;
    }

    return row.config_json;

  } catch (e) {

    console.error(e);

    res.status(500).json({
      error: "Broken form configuration"
    });

    return null;
  }
}



// =========================
// Helper: Build Submission Response
// =========================

async function buildSubmissionResponse(submission) {

  const configResult = await pool.query(
    `
    SELECT config_json
    FROM form_configs
    WHERE id = $1
    `,
    [submission.config_id]
  );

  const config = configResult.rows[0]?.config_json || null;

  const answersResult = await pool.query(
    `
    SELECT
      step_id,
      answers_json,
      is_completed
    FROM step_answers
    WHERE submission_id = $1
    `,
    [submission.id]
  );

  const answers = answersResult.rows.reduce((acc, row) => {

    acc[row.step_id] = {
      answers: row.answers_json,
      isCompleted: row.is_completed
    };

    return acc;

  }, {});

  const completedSteps = Object.entries(answers)
    .filter(([, value]) => value.isCompleted)
    .map(([key]) => key);

  const totalSteps = config?.steps?.length || 0;

  return {
    id: submission.id,
    configId: submission.config_id,
    title: submission.title,
    status: submission.status,
    currentStep: submission.current_step,
    createdAt: submission.created_at,
    updatedAt: submission.updated_at,

    progress: {
      completed: completedSteps.length,
      total: totalSteps
    },

    completedSteps,

    answers: Object.fromEntries(
      Object.entries(answers).map(([k, v]) => [k, v.answers])
    ),
  };
}



// =========================
// GET /api/submissions
// =========================

router.get("/", async (req, res) => {
  try {

    const result = await pool.query(
      `
      SELECT
        s.id,
        s.config_id,
        s.title,
        s.status,
        s.current_step,
        s.created_at,
        s.updated_at,

        (
          SELECT COUNT(*)
          FROM step_answers sa
          WHERE sa.submission_id = s.id
          AND sa.is_completed = true
        ) AS completed_steps,

        (
          SELECT jsonb_array_length(fc.config_json->'steps')
          FROM form_configs fc
          WHERE fc.id = s.config_id
        ) AS total_steps

      FROM submissions s
      WHERE s.user_id = $1
      ORDER BY s.updated_at DESC
      `,
      [USER_ID]
    );

    const data = result.rows.map((row) => ({
      id: row.id,
      configId: row.config_id,
      title: row.title,
      status: row.status,
      currentStep: row.current_step,
      createdAt: row.created_at,
      updatedAt: row.updated_at,

      progress: {
        completed: Number(row.completed_steps),
        total: Number(row.total_steps)
      }
    }));

    res.json({ data });

  } catch (e) {

    console.error(e);

    res.status(500).json({
      error: "Failed to list submissions"
    });
  }
});



// =========================
// POST /api/submissions
// =========================

router.post("/", async (req, res) => {

  try {

    const { configId } = req.body;

    if (!configId) {
      return res.status(400).json({
        error: "configId is required"
      });
    }

    const config = await getConfig(configId, res);

    if (!config) return;

    const now = new Date().toISOString();

    const title = `${config.title} — ${new Date().toLocaleString(
      "en-GB",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }
    )}`;

    const id = randomUUID();

    await pool.query(
      `
      INSERT INTO submissions (
        id,
        config_id,
        user_id,
        title,
        status,
        current_step,
        created_at,
        updated_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        'draft',
        0,
        $5,
        $6
      )
      `,
      [
        id,
        configId,
        USER_ID,
        title,
        now,
        now
      ]
    );

    const subResult = await pool.query(
      `
      SELECT *
      FROM submissions
      WHERE id = $1
      `,
      [id]
    );

    const response = await buildSubmissionResponse(
      subResult.rows[0]
    );

    res.status(201).json({
      data: response
    });

  } catch (e) {

    console.error(e);

    res.status(500).json({
      error: "Failed to create submission"
    });
  }
});



// =========================
// GET /api/submissions/:id
// =========================

router.get("/:id", async (req, res) => {

  try {

    const result = await pool.query(
      `
      SELECT *
      FROM submissions
      WHERE id = $1
      AND user_id = $2
      `,
      [req.params.id, USER_ID]
    );

    const sub = result.rows[0];

    if (!sub) {
      return res.status(404).json({
        error: "Submission not found"
      });
    }

    const response = await buildSubmissionResponse(sub);

    res.json({
      data: response
    });

  } catch (e) {

    console.error(e);

    res.status(500).json({
      error: "Failed to fetch submission"
    });
  }
});



// =========================
// PATCH Step
// =========================

router.patch("/:id/steps/:stepIndex", async (req, res) => {

  try {

    const { id, stepIndex } = req.params;

    const stepIdx = parseInt(stepIndex, 10);

    const {
      answers = {},
      moveNext = false
    } = req.body;

    if (isNaN(stepIdx) || stepIdx < 0) {
      return res.status(400).json({
        error: "Invalid step index"
      });
    }

    const subResult = await pool.query(
      `
      SELECT *
      FROM submissions
      WHERE id = $1
      AND user_id = $2
      `,
      [id, USER_ID]
    );

    const sub = subResult.rows[0];

    if (!sub) {
      return res.status(404).json({
        error: "Submission not found"
      });
    }

    if (sub.status === "completed") {
      return res.status(400).json({
        error: "Cannot edit a completed submission"
      });
    }

    const config = await getConfig(sub.config_id, res);

    if (!config) return;

    if (stepIdx >= config.steps.length) {
      return res.status(400).json({
        error: "Step index out of range"
      });
    }

    const step = config.steps[stepIdx];

    const { errors } = validateStep(step, answers);

    const completed = isStepComplete(step, answers);

    const now = new Date().toISOString();

    await pool.query(
      `
      INSERT INTO step_answers (
        submission_id,
        step_id,
        answers_json,
        is_completed,
        updated_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5
      )

      ON CONFLICT(submission_id, step_id)

      DO UPDATE SET
        answers_json = EXCLUDED.answers_json,
        is_completed = EXCLUDED.is_completed,
        updated_at = EXCLUDED.updated_at
      `,
      [
        id,
        step.id,
        answers,
        completed,
        now
      ]
    );

    let newCurrentStep = sub.current_step;

    if (
      moveNext &&
      Object.keys(errors).length === 0 &&
      stepIdx + 1 < config.steps.length
    ) {
      newCurrentStep = stepIdx + 1;
    }

    await pool.query(
      `
      UPDATE submissions
      SET
        current_step = $1,
        updated_at = $2
      WHERE id = $3
      `,
      [
        newCurrentStep,
        now,
        id
      ]
    );

    const updatedResult = await pool.query(
      `
      SELECT *
      FROM submissions
      WHERE id = $1
      `,
      [id]
    );

    const response = await buildSubmissionResponse(
      updatedResult.rows[0]
    );

    res.json({
      data: response,
      validationErrors:
        Object.keys(errors).length > 0
          ? errors
          : null
    });

  } catch (e) {

    console.error(e);

    res.status(500).json({
      error: "Failed to save step"
    });
  }
});



// =========================
// POST Final Submit
// =========================

router.post("/:id/submit", async (req, res) => {

  try {

    const subResult = await pool.query(
      `
      SELECT *
      FROM submissions
      WHERE id = $1
      AND user_id = $2
      `,
      [req.params.id, USER_ID]
    );

    const sub = subResult.rows[0];

    if (!sub) {
      return res.status(404).json({
        error: "Submission not found"
      });
    }

    if (sub.status === "completed") {
      return res.status(400).json({
        error: "Already submitted"
      });
    }

    const config = await getConfig(
      sub.config_id,
      res
    );

    if (!config) return;

    const answersResult = await pool.query(
      `
      SELECT
        step_id,
        answers_json
      FROM step_answers
      WHERE submission_id = $1
      `,
      [sub.id]
    );

    const allAnswers = answersResult.rows.reduce(
      (acc, row) => {

        acc[row.step_id] = row.answers_json;

        return acc;

      },
      {}
    );

    const {
      valid,
      stepErrors
    } = validateForm(config, allAnswers);

    if (!valid) {
      return res.status(422).json({
        error:
          "Form has validation errors. Please complete all required fields.",
        stepErrors,
      });
    }

    const now = new Date().toISOString();

    await pool.query(
      `
      UPDATE submissions
      SET
        status = 'completed',
        updated_at = $1
      WHERE id = $2
      `,
      [now, sub.id]
    );

    const updatedResult = await pool.query(
      `
      SELECT *
      FROM submissions
      WHERE id = $1
      `,
      [sub.id]
    );

    const response = await buildSubmissionResponse(
      updatedResult.rows[0]
    );

    res.json({
      data: response
    });

  } catch (e) {

    console.error(e);

    res.status(500).json({
      error: "Failed to submit form"
    });
  }
});



// =========================
// DELETE Submission
// =========================

router.delete("/:id", async (req, res) => {

  try {

    const result = await pool.query(
      `
      SELECT id
      FROM submissions
      WHERE id = $1
      AND user_id = $2
      `,
      [req.params.id, USER_ID]
    );

    const sub = result.rows[0];

    if (!sub) {
      return res.status(404).json({
        error: "Submission not found"
      });
    }

    await pool.query(
      `
      DELETE FROM submissions
      WHERE id = $1
      `,
      [req.params.id]
    );

    res.json({
      message: "Deleted"
    });

  } catch (e) {

    console.error(e);

    res.status(500).json({
      error: "Failed to delete submission"
    });
  }
});



module.exports = router;
