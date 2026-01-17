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

// ✅ same function name, just added userId parameter
export async function renderAuditRatioChart(container, userId) {
  if (!container) return;

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
        path: { _ilike: "%/bh-module/%" }
      }
    ) {
      amount
      path
      createdAt
    }

    received: transaction(
      where: {
        userId: { _eq: $userId }
        type: { _eq: "down" }
        path: { _ilike: "%/bh-module/%" }
      }
    ) {
      amount
      path
      createdAt
    }
  }
`;


  // if userId missing, show message instead of failing silently
  if (userId == null) {
    container.innerHTML += `<p class="muted">Audit data unavailable (missing userId).</p>`;
    return;
  }

  const data = await graphqlRequest(query, { userId });

   function latestPerProject(rows) {
    const map = new Map();

    rows
      .filter(t => t.amount > 0)
      .forEach(t => {
        const prev = map.get(t.path);
        if (!prev || new Date(t.createdAt) > new Date(prev.createdAt)) {
          map.set(t.path, t);
        }
      });

    return [...map.values()];
  }

  const finalGiven = latestPerProject(data.given || []);
  const finalReceived = latestPerProject(data.received || []);

  const givenXP = finalGiven.reduce((s, a) => s + a.amount, 0);
  const receivedXP = finalReceived.reduce((s, a) => s + a.amount, 0);

  //  platform-style rounding (1 decimal)
  const rawRatio = receivedXP > 0 ? givenXP / receivedXP : Infinity;
  const ratio =
    rawRatio === Infinity
      ? "∞"
      : (Math.round(rawRatio * 10) / 10).toFixed(1);

  //  compare using rawRatio (number), NOT ratio (string)
  let feedback = "Balanced";
  if (rawRatio < 1) feedback = "You can do better!";
  if (rawRatio > 1.1) feedback = "Great contribution!";

  /* ---------- LAYOUT CONSTANTS ---------- */
  const width = 760;
  const height = 360;

  const labelX = 30;
  const barX = 200;
  const barWidth = 400;
  const barHeight = 18;

  const doneY = 120;
  const receivedY = 180;

  const ratioY = 290;
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
    "font-weight": 800,
  }, [ratio]));

  svg.appendChild(el("text", {
    class: "ratio-feedback",
    "text-anchor": "middle",
    x: ratioX,
    y: ratioY + 28,
    fill: "#f7b6d2",
    "font-weight": 600,
  }, [feedback]));

  container.appendChild(svg);
}
