import { login } from "../services/auth.js";
import { renderProfile } from "./profile.js";

export function renderLogin(app) {
  app.innerHTML = `
    <section class="login-page">
      <div class="login-card">
        <h1 class="login-title">Welcome back</h1>
        <p class="login-sub">Sign in to your GraphQL dashboard</p>

        <form id="login-form">
          <input id="identifier" placeholder="Username or Email" required />
          <input id="password" type="password" placeholder="Password" required />
          <button type="submit" class="login-btn">Login</button>
        </form>

        <p id="login-error" class="error hidden">
          Invalid credentials
        </p>
      </div>
    </section>
  `;

  document
    .getElementById("login-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        await login(
          identifier.value,
          password.value
        );
        renderProfile(app);
      } catch {
        document.getElementById("login-error").classList.remove("hidden");
      }
    });
}


  

