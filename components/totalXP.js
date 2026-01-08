import { graphqlRequest } from "../services/graphql.js";

export async function renderTotalXP(container) {
  const query = `
    query TotalXP {
      transaction(
        where: {
          type: { _eq: "xp" }
        }
      ) {
        amount
      }
    }
  `;

  const data = await graphqlRequest(query);

  const totalXP = data.transaction.reduce(
    (sum, tx) => sum + tx.amount,
    0
  );

  container.innerHTML += `
    <h3>Total XP</h3>
    <p><strong>${totalXP.toLocaleString()}</strong></p>
  `;
}
