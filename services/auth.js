const API_AUTH_URL = "https://learn.reboot01.com/api/auth/signin";

export async function login(identifier, password) {
  // btoa converts text to base64
  const credentials = btoa(`${identifier}:${password}`);
  // POST requesto to sign in 
  const response = await fetch(API_AUTH_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
    },
  });

  if (!response.ok) {
    throw new Error("Invalid credentials");
  }

  const token = await response.json();
  localStorage.setItem("jwt", token);
  return token;
}

export function logout() {
  localStorage.removeItem("jwt");
}

export function getToken() {
  return localStorage.getItem("jwt");
}
