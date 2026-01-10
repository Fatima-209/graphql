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
    createdAt
  }
}

  `;

  const data = await graphqlRequest(query);
const totalXP = await renderTotalXP(content, userId);

const LEVEL_XP = 50_000;
const level = Math.floor(totalXP / LEVEL_XP);

container.innerHTML += `
  <h3>Current Level</h3>
  <p><strong>Level ${level}</strong></p>
`;

}
