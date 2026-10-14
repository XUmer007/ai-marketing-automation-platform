const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8000";


async function parseResponse(response) {
  let data;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    let errorMessage = "Something went wrong.";

    if (typeof data?.detail === "string") {
      errorMessage = data.detail;
    } else if (data?.detail?.message) {
      errorMessage = data.detail.message;
    } else if (data?.message) {
      errorMessage = data.message;
    }

    throw new Error(errorMessage);
  }

  return data;
}


export async function connectFacebook() {
  const response = await fetch(
    `${API_BASE_URL}/facebook/connect-url`,
  );

  const data = await parseResponse(response);

  if (!data?.connect_url) {
    throw new Error(
      "Facebook connection URL was not returned.",
    );
  }

  window.location.href = data.connect_url;
}


export async function getFacebookStatus() {
  const response = await fetch(
    `${API_BASE_URL}/facebook/status`,
  );

  return parseResponse(response);
}


export async function publishFacebookPost(
  message,
) {
  const response = await fetch(
    `${API_BASE_URL}/facebook/publish`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        message,
      }),
    },
  );

  return parseResponse(response);
}


export async function publishFacebookPhoto(
  message,
  image,
) {
  const formData = new FormData();

  formData.append(
    "message",
    message || "",
  );

  formData.append(
    "image",
    image,
  );

  const response = await fetch(
    `${API_BASE_URL}/facebook/publish-photo`,
    {
      method: "POST",
      body: formData,
    },
  );

  return parseResponse(response);
}


export async function disconnectFacebook() {
  const response = await fetch(
    `${API_BASE_URL}/facebook/disconnect`,
    {
      method: "POST",
    },
  );

  return parseResponse(response);
}