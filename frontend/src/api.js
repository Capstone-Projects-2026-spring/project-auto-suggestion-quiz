const API_URL = "http://localhost:8000";

export async function authenticateUser(email, password) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || "Login failed");
  }

  const data = await response.json();
  localStorage.setItem("token", data.token);
  return data.user;
}

export async function registerUser(name, email, password, role = "student") {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, role }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || "Registration failed");
  }

  const data = await response.json();
  localStorage.setItem("token", data.token);
  return data.user;
}
