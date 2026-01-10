import { graphqlRequest } from "../services/graphql.js";

export async function renderLevel(container) {
  const query = `
  {
  progress(
    where: { grade: { _is_null: false } }
    order_by: { grade: desc }
    limit: 2
  ) {
    grade
    path
    createdAt
  }
}

  `;

  const data = await graphqlRequest(query);

  const current = data.progress[0];
  const level = current?.grade ?? 0;

  container.innerHTML += `
    <h3>Current Level</h3>
    <p><strong>Level ${level}</strong></p>
  `;
}
