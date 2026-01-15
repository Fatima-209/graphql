import { graphqlRequest } from "../services/graphql.js";

export async function renderLevel(container, userId) {
  const query = `
    query Level($userId: Int!) {
      level: transaction(
        where: {
          userId: { _eq: $userId }
          type: { _eq: "level" }
        }
        order_by: { amount: desc }
        limit: 1
      ) {
        amount
      }
    }
  `;

  const data = await graphqlRequest(query, { userId });

  const level =
    data.level && data.level.length > 0
      ? data.level[0].amount
      : 0;

  container.innerHTML += `
    <div class="stat-item">
      <label>Level</label>
      <span>${level}</span>
    </div>
  `;
}
