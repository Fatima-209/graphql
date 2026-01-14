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

/* ---------- Main render ---------- */
export async function renderAuditRatioChart(container) {
  if (!container) return;

  container.innerHTML = `
    <h3>Audit Ratio</h3>
    <p class="muted">XP given to peers vs XP received</p>
  `;

  /* ---------- Fetch data ---------- */
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
  if (ratio < 1) feedback = "You can do better";
  if (ratio > 1.2) feedback = "Great contribution";

  /* ---------- Layout constants ---------- */
  const width = 560;
  const height = 340;

  const labelX = 20;
  const valueX = 110;
  const barX = 180;

  const barWidth = 300;
  const barHeight = 10;

  const doneY = 90;
  const receivedY = 140;

  const max = Math.max(givenXP, receivedXP, 1);
  const givenW = (givenXP / max) * barWidth;
  const receivedW = (receivedXP / max) * barWidth;

  /* ---------- SVG ---------- */
  const svg = el("svg", {
    viewBox: `0 0 ${width} ${height}`,
    width: "100%",
    class: "svg-chart",
  });

  /* ---------- Labels ---------- */
  svg.appendChild(el("text", {
    x: labelX,
    y: doneY,
    fill: "rgba(255,255,255,0.9)",
    "font-size": 14,
    "font-weight": 600,
  }, ["Done"]));

  svg.appendChild(el("text", {
    x: labelX,
    y: receivedY,
    fill: "rgba(255,255,255,0.9)",
    "font-size": 14,
    "font-weight": 600,
  }, ["Received"]));

  /* ---------- Values ---------- */
  svg.appendChild(el("text", {
    x: valueX,
    y: doneY,
    fill: "#ffffff",
    "font-size": 14,
    "font-weight": 600,
  }, [`${formatXP(givenXP)} ↑`]));

  svg.appendChild(el("text", {
    x: valueX,
    y: receivedY,
    fill: "rgba(255,255,255,0.75)",
    "font-size": 14,
    "font-weight": 600,
  }, [`${formatXP(receivedXP)} ↓`]));

  /* ---------- Background bars ---------- */
  [doneY, receivedY].forEach(y => {
    svg.appendChild(el("rect", {
      x: barX,
      y: y - barHeight / 2,
      width: barWidth,
      height: barHeight,
      rx: 6,
      fill: "rgba(255,255,255,0.15)",
    }));
  });

  /* ---------- Foreground bars ---------- */
  const givenBar = el("rect", {
    x: barX,
    y: doneY - barHeight / 2,
    width: 0,
    height: barHeight,
    rx: 6,
    fill: "rgba(94, 214, 151, 0.95)", // green = contribution
  });

  const receivedBar = el("rect", {
    x: barX,
    y: receivedY - barHeight / 2,
    width: 0,
    height: barHeight,
    rx: 6,
    fill: "rgba(255,255,255,0.7)",
  });

  svg.append(givenBar, receivedBar);

  /* ---------- Animate bars ---------- */
  givenBar.animate(
    [{ width: "0px" }, { width: `${givenW}px` }],
    { duration: 800, easing: "cubic-bezier(0.22,1,0.36,1)", fill: "forwards" }
  );

  receivedBar.animate(
    [{ width: "0px" }, { width: `${receivedW}px` }],
    { duration: 800, delay: 120, easing: "cubic-bezier(0.22,1,0.36,1)", fill: "forwards" }
  );

  /* ---------- Ratio (HERO) ---------- */
  svg.appendChild(el("text", {
    x: width / 2,
    y: 245,
    "text-anchor": "middle",
    fill: "#f7b6d2",
    "font-size": 80,
    "font-weight": 800,
    filter: "drop-shadow(0 0 18px rgba(247,182,210,0.6))",
  }, [ratio]));

  /* ---------- Feedback ---------- */
  svg.appendChild(el("text", {
    x: width / 2,
    y: 285,
    "text-anchor": "middle",
    fill: "rgba(255,255,255,0.65)",
    "font-size": 16,
    "font-weight": 500,
  }, [feedback]));

  container.appendChild(svg);
}
