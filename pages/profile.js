import { logout } from "../services/auth.js";
import { renderLogin } from "./login.js";
import { renderBasicInfo } from "../components/basicinfo.js";
import { renderTotalXP } from "../components/totalXP.js";
import { graphqlRequest } from "../services/graphql.js";

export async function renderProfile(app) {
  app.innerHTML = `
    <section class="page">
      <h1>Profile</h1>
      <div id="profile-content">Loading...</div>
      <button id="logout-btn">Logout</button>
    </section>
  `;

  document.getElementById("logout-btn").addEventListener("click", () => {
    logout();
    renderLogin(app);
  });

  const content = document.getElementById("profile-content");
  content.innerHTML = "";

  try {
    const userQuery = `
      {
        user {
          id
        }
      }
    `;
    const userData = await graphqlRequest(userQuery);
    const userId = userData.user[0].id;

    await renderBasicInfo(content);
    await renderTotalXP(content, userId);

  } catch (err) {
    console.error("PROFILE LOAD ERROR:", err);
    content.innerHTML = `<p style="color:red">Failed to load profile</p>`;
  }
}
