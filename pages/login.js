import { login } from "../services/auth.js";
import { renderProfile } from "./profile.js";

export function renderLogin(app) {
  app.innerHTML = `
    <section class="page">
      <h1>Login</h1>

      <form id="login-form">
        <input id="identifier" placeholder="Username or Email" required />
        <input id="password" type="password" placeholder="Password" required />
        <button type="submit">Login</button>
      </form>

      <p id="login-error" class="error hidden">
        Invalid credentials
      </p>
    </section>
  `;

  document
    .getElementById("login-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      const identifier = document.getElementById("identifier").value;
      const password = document.getElementById("password").value;
      const errorEl = document.getElementById("login-error");

      errorEl.classList.add("hidden");

      try {
        await login(identifier, password);
        renderProfile(app);
      } catch {
        errorEl.classList.remove("hidden");
      }
    });
}
