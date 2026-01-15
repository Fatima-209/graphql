import { logout } from "../services/auth.js";
import { renderLogin } from "./login.js";
import { renderTotalXP } from "../components/totalXP.js";
import { graphqlRequest } from "../services/graphql.js";
import { renderBasicInfo } from "../components/basicinfo.js";
import { renderLevel } from "../components/renderLevel.js";
import { renderStatsSection } from "../components/statsSection.js";
export async function renderProfile(app) {
  app.innerHTML = `
    <header class="top-bar">
      <span class="logo">GraphQL Profile</span>
      <button id="logout-btn" class="logout-btn">Logout</button>
    </header>

    <section class="page">
      <div id="profile-content">Loading...</div>
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
        login
      }
    }
  `;

  const userData = await graphqlRequest(userQuery);

  if (!userData?.user?.length) {
    throw new Error("No user data returned");
  }

  const userId = userData.user[0].id;

  await renderBasicInfo(content);
  await renderTotalXP(content, userId);
await renderLevel(content, userId);
  await renderStatsSection(content, userId);

} catch (err) {
  console.error(err);

  // VERY IMPORTANT UX FALLBACK
  logout();
  renderLogin(app);
}

}
