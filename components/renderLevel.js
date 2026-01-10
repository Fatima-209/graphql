import { graphqlRequest } from "../services/graphql.js";

export async function renderLevel(container) {
  const query = `
    {
      progress(
        where: { grade: { _is_null: false } }
        order_by: { grade: desc }
        limit: 1
      ) {
        grade
        path
      }
    }
  `;

  const data = await graphqlRequest(query);

  const level = Math.floor(data.progress[0]?.grade ?? 0);

  container.innerHTML += `
    <h3>Current Level</h3>
    <p><strong>Level ${level}</strong></p>
  `;
}
