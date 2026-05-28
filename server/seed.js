const existing = await pool.query(
  `SELECT id FROM form_configs WHERE id = $1`,
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
          }
        ]
      }
    ]
  };

  await pool.query(
    `
    INSERT INTO form_configs (id, title, config_json)
    VALUES ($1, $2, $3)
    `,
    [config.id, config.title, JSON.stringify(config)]
  );

  console.log("Seeded default config");
}