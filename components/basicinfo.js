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
    <h3>Basic Info</h3>
    <p>Welcome to your dashboard, ${displayName}</p>
    <p><strong>ID:</strong> ${user.id}</p>
    <p><strong>Username:</strong> ${user.login}</p>
  `;
}
