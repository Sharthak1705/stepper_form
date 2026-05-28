
const BASE =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3001/api";



async function request(path, options = {}) {

  try {

    const response = await fetch(
      `${BASE}${path}`,
      {
        method: options.method || "GET",

        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },

        credentials: "include",

        body: options.body
          ? JSON.stringify(options.body)
          : undefined,
      }
    );



    // Handle empty response safely
    let data = null;

    const contentType =
      response.headers.get("content-type");

    if (
      contentType &&
      contentType.includes("application/json")
    ) {
      data = await response.json();
    }



    // Error handling
    if (!response.ok) {

      throw new Error(
        data?.error ||
        data?.message ||
        "Request failed"
      );
    }

    return data;

  } catch (error) {

    console.error(
      "API Request Error:",
      error
    );

    throw error;
  }
}




export const api = {

  // =========================
  // Configs
  // =========================

  listConfigs: () =>
    request("/configs"),


  getConfig: (id) =>
    request(`/configs/${id}`),




  // =========================
  // Submissions
  // =========================

  listSubmissions: () =>
    request("/submissions"),


  getSubmission: (id) =>
    request(`/submissions/${id}`),


  createSubmission: (configId) =>
    request("/submissions", {
      method: "POST",

      body: {
        configId,
      },
    }),



  saveStep: (
    id,
    stepIndex,
    answers,
    moveNext = false
  ) =>
    request(
      `/submissions/${id}/steps/${stepIndex}`,
      {
        method: "PATCH",

        body: {
          answers,
          moveNext,
        },
      }
    ),



  submitForm: (id) =>
    request(
      `/submissions/${id}/submit`,
      {
        method: "POST",
      }
    ),



  deleteSubmission: (id) =>
    request(`/submissions/${id}`, {
      method: "DELETE",
    }),
};