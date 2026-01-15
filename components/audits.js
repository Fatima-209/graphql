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

export async function renderAuditRatioChart(container) {
  if (!container) return;

  container.innerHTML = `
    <h3>Audit Ratio</h3>
    <p class="muted">XP given to peers vs XP received</p>
  `;

  const query = `
    {
      given: transaction(where: { type: { _eq: "up" } }) { amount }
      received: transaction(where: { type: { _eq: "down" } }) { amount }
    }
  `;

  const data = await graphqlRequest(query);

  const givenXP = (data.given || []).reduce((s, a) => s + a.amount, 0);
  const receivedXP = (data.received || []).reduce((s, a) => s + a.amount, 0);

  const ratio =
    receivedXP > 0 ? (givenXP / receivedXP).toFixed(2) : "∞";

  let feedback = "Balanced";
  if (ratio < 1) feedback = "You can do better!";
  if (ratio > 1.1) feedback = "Great contribution!";

  /* ---------- LAYOUT CONSTANTS ---------- */
  const width = 700;
  const height = 300;

  const labelX = 30;
  const barX = 200;
  const barWidth = 400;
  const barHeight = 20;

  const doneY = 120;
  const receivedY = 180;

  const ratioY = 260;
  const ratioX = width / 2;

  const max = Math.max(givenXP, receivedXP, 1);
  const givenW = (givenXP / max) * barWidth;
  const receivedW = (receivedXP / max) * barWidth;

  const svg = el("svg", {
    viewBox: `0 0 ${width} ${height}`,
    width: "100%",
    class: "svg-chart",
  });

  /* ---------- DONE ---------- */
  svg.appendChild(el("text", {
    x: labelX,
    y: doneY - 6,
    fill: "#ffffff",
    "font-size": 18,
    "font-weight": 600,
  }, ["Done"]));

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
    width: 0,
    height: barHeight,
    rx: 8,
    fill: "#f7b6d2",
  });

  svg.appendChild(givenBar);

  givenBar.animate(
    [{ width: "0px" }, { width: `${givenW}px` }],
    { duration: 700, easing: "ease-out", fill: "forwards" }
  );

  svg.appendChild(el("text", {
    x: barX + barWidth + 10,
    y: doneY - 6,
    fill: "#ffffff",
    "font-size": 16,
  }, [`${formatXP(givenXP)} ↑`]));

  /* ---------- RECEIVED ---------- */
  svg.appendChild(el("text", {
    x: labelX,
    y: receivedY - 6,
    fill: "#ffffff",
    "font-size": 18,
    "font-weight": 600,
  }, ["Received"]));

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
    width: 0,
    height: barHeight,
    rx: 8,
    fill: "#ffffff",
  });

  svg.appendChild(receivedBar);

  receivedBar.animate(
    [{ width: "0px" }, { width: `${receivedW}px` }],
    { duration: 700, delay: 100, easing: "ease-out", fill: "forwards" }
  );

  svg.appendChild(el("text", {
    x: barX + barWidth + 10,
    y: receivedY - 6,
    fill: "rgba(255,255,255,0.75)",
    "font-size": 16,
  }, [`${formatXP(receivedXP)} ↓`]));

  /* ---------- RATIO ---------- */
  svg.appendChild(el("text", {
    class: "ratio-number",
    "text-anchor": "middle",
    x: ratioX,
    y: ratioY,
    fill: "#f7b6d2",
    "font-size": 96,
    "font-weight": 800,
  }, [ratio]));

  svg.appendChild(el("text", {
    class: "ratio-feedback",
    "text-anchor": "middle",
    x: ratioX,
    y: ratioY + 28,
    fill: "#f7b6d2",
    "font-size": 18,
    "font-weight": 600,
  }, [feedback]));

  container.appendChild(svg);
}
