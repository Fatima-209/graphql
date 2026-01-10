import { graphqlRequest } from "../services/graphql.js";
// changed file name
export async function renderBasicInfo(container) {
  const query = `
    {
      user {
        login
        id
        attrs
      }
    }
  `;

  const data = await graphqlRequest(query);
  const user = data.user[0];

  // Extract name safely from attrs
  const firstName = user.attrs?.firstName;
  const lastName = user.attrs?.lastName;

  const displayName =
    firstName || lastName
      ? `${firstName ?? ""} ${lastName ?? ""}`.trim()
      : user.login;

  container.innerHTML = `
  <section class="hero-card">
    <h2 class="hero-title">
      Welcome to your dashboard, <span>${displayName}</span>
    </h2>

    <div class="hero-stats">
      <div class="stat-item">
        <label>User</label>
        <span>${user.login}</span>
      </div>

      <div class="stat-item">
        <label>ID</label>
        <span>${user.id}</span>
      </div>
    </div>
  </section>
`;

}
