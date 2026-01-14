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

/* ---------- XP formatter ---------- */
function formatXP(amount) {
  if (amount >= 1024) return (amount / 1024).toFixed(2) + " MB";
  return amount.toFixed(0) + " KB";
}

/* ---------- Main ---------- */
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
  if (ratio > 1.2) feedback = "Great contribution!";

  /* ---------- SCALE UP EVERYTHING ---------- */
  const width = 700;
  const height = 420;

  const leftX = 40;
  const barX = 180;
  const barWidth = 440;
  const barHeight = 14;

  const doneY = 120;
  const receivedY = 180;

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
    x: leftX,
    y: doneY - 18,
    fill: "#ffffff",
    "font-size": 18,
    "font-weight": 700,
  }, ["Done"]));

  svg.appendChild(el("text", {
    x: width - 40,
    y: doneY - 18,
    "text-anchor": "end",
    fill: "#ffffff",
    "font-size": 18,
    "font-weight": 600,
  }, [`${formatXP(givenXP)} ↑`]));

  svg.appendChild(el("rect", {
    x: barX,
    y: doneY,
    width: barWidth,
    height: barHeight,
    rx: 8,
    fill: "rgba(255,255,255,0.15)",
  }));

  const givenBar = el("rect", {
    x: barX,
    y: doneY,
    width: 0,
    height: barHeight,
    rx: 8,
    fill: "#f0c14b", // reboot gold
  });

  svg.appendChild(givenBar);

  givenBar.animate(
    [{ width: "0px" }, { width: `${givenW}px` }],
    { duration: 900, easing: "ease-out", fill: "forwards" }
  );

  /* ---------- RECEIVED ---------- */
  svg.appendChild(el("text", {
    x: leftX,
    y: receivedY - 18,
    fill: "#ffffff",
    "font-size": 18,
    "font-weight": 700,
  }, ["Received"]));

  svg.appendChild(el("text", {
    x: width - 40,
    y: receivedY - 18,
    "text-anchor": "end",
    fill: "rgba(255,255,255,0.8)",
    "font-size": 18,
    "font-weight": 600,
  }, [`${formatXP(receivedXP)} ↓`]));

  svg.appendChild(el("rect", {
    x: barX,
    y: receivedY,
    width: barWidth,
    height: barHeight,
    rx: 8,
    fill: "rgba(255,255,255,0.15)",
  }));

  const receivedBar = el("rect", {
    x: barX,
    y: receivedY,
    width: 0,
    height: barHeight,
    rx: 8,
    fill: "#ffffff",
  });

  svg.appendChild(receivedBar);

  receivedBar.animate(
    [{ width: "0px" }, { width: `${receivedW}px` }],
    { duration: 900, delay: 120, easing: "ease-out", fill: "forwards" }
  );

  /* ---------- HUGE RATIO (REBOOT STYLE) ---------- */
  svg.appendChild(el("text", {
    x: leftX,
    y: 300,
    fill: "#f0c14b",
    "font-size": 120,
    "font-weight": 800,
  }, [ratio]));

  svg.appendChild(el("text", {
    x: leftX + 170,
    y: 300,
    fill: "#f0c14b",
    "font-size": 24,
    "font-weight": 600,
  }, [feedback]));

  container.appendChild(svg);
}
