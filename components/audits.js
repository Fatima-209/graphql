import { graphqlRequest } from "../services/graphql.js";

/* ---------- SVG helper ---------- */
function el(tag, attrs = {}, children = []) {
  const n = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) {
    n.setAttribute(k, String(v));
  }
  for (const c of children) {
    if (typeof c === "string") n.appendChild(document.createTextNode(c));
    else if (c instanceof Node) n.appendChild(c);
  }
  return n;
}

function formatXP(amount) {
  if (amount >= 1024) return (amount / 1024).toFixed(2) + " MB";
  return amount.toFixed(0) + " KB";
}

/**
 * container: DOM element
 * userId: number (REQUIRED)
 */
export async function renderAuditRatioChart(container, userId) {
  if (!container || !userId) return;

  container.innerHTML = `
    <h3>Audit Ratio</h3>
    <p class="muted">XP given to peers vs XP received</p>
  `;

  const query = `
    query Audit($userId: Int!) {
      given: transaction(
        where: {
          userId: { _eq: $userId }
          type: { _eq: "up" }
        }
      ) { amount }

      received: transaction(
        where: {
          userId: { _eq: $userId }
          type: { _eq: "down" }
        }
      ) { amount }
    }
  `;

  const data = await graphqlRequest(query, { userId });

  const givenXP = (data.given || []).reduce((s, a) => s + a.amount, 0);
  const receivedXP = (data.received || []).reduce((s, a) => s + a.amount, 0);

  const rawRatio = receivedXP > 0 ? givenXP / receivedXP : Infinity;
  const ratio = rawRatio === Infinity ? "∞" : rawRatio.toFixed(1);

  let feedback = "Balanced";
  if (rawRatio < 1) feedback = "You can do better!";
  if (rawRatio > 1.1) feedback = "Great contribution!";

  /* ---------- LAYOUT ---------- */
  const width = 760;
  const height = 360;

  const labelX = 30;
  const barX = 200;
  const barWidth = 400;
  const barHeight = 18;

  const doneY = 120;
  const receivedY = 180;

  const ratioX = width / 2;
  const ratioY = 290;

  const max = Math.max(givenXP, receivedXP, 1);
  const givenW = (givenXP / max) * barWidth;
  const receivedW = (receivedXP / max) * barWidth;

  const svg = el("svg", {
    viewBox: `0 0 ${width} ${height}`,
    width: "100%",
    class: "svg-chart",
  });

  /* ---------- DONE ---------- */
  svg.appendChild(el("text", { x: labelX, y: doneY - 6, fill: "#fff" }, ["Done"]));
  svg.appendChild(el("rect", {
    x: barX,
    y: doneY - barHeight / 2,
    width: barWidth,
    height: barHeight,
    rx: 8,
    fill: "rgba(255,255,255,0.15)",
  }));

  const givenBar = el("rect", {
    x: barX,
    y: doneY - barHeight / 2,
    width: givenW,
    height: barHeight,
    rx: 8,
    fill: "#f7b6d2",
  });

  svg.appendChild(givenBar);
  svg.appendChild(el("text", {
    x: barX + barWidth + 10,
    y: doneY - 6,
    fill: "#fff",
  }, [`${formatXP(givenXP)} ↑`]));

  /* ---------- RECEIVED ---------- */
  svg.appendChild(el("text", { x: labelX, y: receivedY - 6, fill: "#fff" }, ["Received"]));
  svg.appendChild(el("rect", {
    x: barX,
    y: receivedY - barHeight / 2,
    width: barWidth,
    height: barHeight,
    rx: 8,
    fill: "rgba(255,255,255,0.15)",
  }));

  const receivedBar = el("rect", {
    x: barX,
    y: receivedY - barHeight / 2,
    width: receivedW,
    height: barHeight,
    rx: 8,
    fill: "#ffffff",
  });

  svg.appendChild(receivedBar);
  svg.appendChild(el("text", {
    x: barX + barWidth + 10,
    y: receivedY - 6,
    fill: "rgba(255,255,255,0.75)",
  }, [`${formatXP(receivedXP)} ↓`]));

  /* ---------- RATIO ---------- */
  svg.appendChild(el("text", {
    x: ratioX,
    y: ratioY,
    "text-anchor": "middle",
    class: "ratio-number",
    fill: "#f7b6d2",
  }, [ratio]));

  svg.appendChild(el("text", {
    x: ratioX,
    y: ratioY + 28,
    "text-anchor": "middle",
    class: "ratio-feedback",
    fill: "#f7b6d2",
  }, [feedback]));

  container.appendChild(svg);
}
