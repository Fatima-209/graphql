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
  const totalXP = totalUp;
  container.innerHTML += `
  <div class="stat-item">
    <label>Total XP</label>
    <span>${totalUp.toLocaleString()}</span>
     <label>XP Down</label>
    <span>${totalDown.toLocaleString()}</span>
    <label>Net XP</label>
    <span>${netXP.toLocaleString()}</span>
  </div>
`;

    return totalXP;

}
