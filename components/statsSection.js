import { graphqlRequest } from "../services/graphql.js";
import { renderCumulativeXpLineSvg } from "./svgCumulativeXpLine.js";
//import { renderXpBySkillBarSvg } from "./svgXpBySkillBar.js";
import { renderPassFailChart } from "./svgPassFailChart.js";
export async function renderStatsSection(container, userId) {
  container.innerHTML += `
    <section class="stats">
      <h2>Statistics</h2>
      <p class="muted">Visualize your XP journey and achievements.</p>

      <div class="stats-grid">
       <div class="card chart-card" id="chart-cumulative"></div>
      <div class="card chart-card" id="chart-pass-fail"></div>
      </div>
    </section>
  `;

  const query = `
    query XpTransactions($userId: Int!) {
      xp: transaction(
        where: {
          userId: { _eq: $userId }
          type: { _eq: "xp" }
        }
        order_by: { createdAt: asc }
      ) {
        amount
        createdAt
        path
      }
    }
  `;

  const data = await graphqlRequest(query, { userId });
  const xpTx = data.xp || [];

  // Render Graph 1: cumulative XP line chart
  renderCumulativeXpLineSvg(document.getElementById("chart-cumulative"), xpTx);
  await renderPassFailChart(
    document.getElementById("chart-pass-fail"),
    userId
  );

  // Render Graph 2: XP by skill bar chart
  //renderXpBySkillBarSvg(document.getElementById("chart-by-skill"), xpTx);
}
