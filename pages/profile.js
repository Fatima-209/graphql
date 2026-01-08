import { logout } from "../services/auth.js";
import { renderLogin } from "./login.js";
import { renderBasicInfo } from "../components/basicInfo.js";

export async function renderProfile(app) {
  app.innerHTML = `
    <section class="page">
      <h1>Profile</h1>
      <div id="profile-content">Loading...</div>
      <button id="logout-btn">Logout</button>
    </section>
  `;

  document
    .getElementById("logout-btn")
    .addEventListener("click", () => {
      logout();
      renderLogin(app);
    });

  const content = document.getElementById("profile-content");
  content.innerHTML = "";

  await renderBasicInfo(content);
}
