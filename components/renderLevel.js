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
      }
    }
  `;

  const data = await graphqlRequest(query);
  const current = data.progress[0];

  const raw = current?.grade ?? 0;
  const level = Math.round(raw * 10);

  container.innerHTML += `
  <div class="stat-item">
    <label>Level</label>
    <span>${level}</span>
  </div>
`;

}

