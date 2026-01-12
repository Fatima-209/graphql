import { renderCumulativeXpLineSvg } from "./svgCumulativeXpLine.js";
import { renderPassFailChart } from "./svgPassFailChart.js";
import { renderPiscineProgressBar } from "./svgPiscineProgressBar.js";
import { graphqlRequest } from "../services/graphql.js";

export async function renderStatsSection(container, userId) {
  container.innerHTML += `
    <section class="stats">
      <h2>Statistics</h2>
      <p class="muted">Visualize your XP journey and achievements.</p>

      <div class="stats-grid">
        <div class="card chart-card" id="chart-cumulative"></div>
        <div class="card chart-card" id="chart-project-passfail"></div>
        <div class="card chart-card" id="chart-piscine-progress"></div>
      </div>
    </section>
  `;

  // XP CUMULATIVE GRAPH (unchanged)
  const xpQuery = `
    query XpTransactions($userId: Int!) {
      transaction(
        where: {
          userId: { _eq: $userId }
          type: { _eq: "xp" }
        }
        order_by: { createdAt: asc }
      ) {
        amount
        createdAt
      }
    }
  `;

  const xpData = await graphqlRequest(xpQuery, { userId });
  const xpTx = xpData.transaction || [];

  renderCumulativeXpLineSvg(
    document.getElementById("chart-cumulative"),
    xpTx
  );

  // PROJECT PASS / FAIL (pie chart)
  await renderPassFailChart(
    document.getElementById("chart-project-passfail"),
    userId,
    "project"
  );

  // PISCINE COMPLETION (progress bar)
  await renderPiscineProgressBar(
    document.getElementById("chart-piscine-progress"),
    userId
  );
}
