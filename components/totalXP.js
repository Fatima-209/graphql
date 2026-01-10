import { graphqlRequest } from "../services/graphql.js";

export async function renderTotalXP(container, userId) {
  const query = `
    query XPStats($userId: Int!) {
      xpUp: transaction(
        where: {
          userId: { _eq: $userId }
          type: { _eq: "xp" }
        }
      ) {
        amount
      }

      xpDown: transaction(
        where: {
          userId: { _eq: $userId }
          type: { _eq: "down" }
        }
      ) {
        amount
      }
    }
  `;

  const data = await graphqlRequest(query, { userId });

  // calculations
  const totalUp = (data.xpUp || []).reduce((s, x) => s + x.amount, 0);
const totalDown = (data.xpDown || []).reduce((s, x) => s + x.amount, 0);

  const netXP = totalUp - totalDown;

  container.innerHTML += `
    <h3>XP Summary</h3>
    <p><strong>All XP:</strong> ${totalUp.toLocaleString()}</p>
    <p><strong>XP Down:</strong> ${totalDown.toLocaleString()}</p>
    <p><strong>Net XP:</strong> ${netXP.toLocaleString()}</p>
  `;
}
