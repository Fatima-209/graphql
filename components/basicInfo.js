import { graphqlRequest } from "../services/graphql.js";
// changed file name
export async function renderBasicInfo(container) {
  const query = `
    {
      user {
        login
        id
      }
    }
  `;

  const data = await graphqlRequest(query);
  const user = data.user[0];

  container.innerHTML = `
    <h3>Basic Info</h3>
    <p>Welcome to your dashboard, ${user.login}</p>
    <p><strong>ID:</strong> ${user.id}</p>
    <p><strong>Username:</strong> ${user.login}</p>
  `;
}
