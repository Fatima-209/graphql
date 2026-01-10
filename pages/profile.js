import { logout } from "../services/auth.js";
import { renderLogin } from "./login.js";
import { renderTotalXP } from "../components/totalXP.js";
import { graphqlRequest } from "../services/graphql.js";
import { renderBasicInfo } from "../components/basicinfo.js";
import { renderLevel } from "../components/renderLevel.js";
import { renderStatsSection } from "../components/statsSection.js";
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
  await renderLevel(content);
  await renderStatsSection(content, userId);

} catch (err) {
  console.error(err);

  // VERY IMPORTANT UX FALLBACK
  logout();
  renderLogin(app);
}

}
