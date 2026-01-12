import { graphqlRequest } from "../services/graphql.js";

function el(tag, attrs = {}, children = []) {
  const n = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  for (const c of children) {
    if (typeof c === "string") n.appendChild(document.createTextNode(c));
    else if (c instanceof Node) n.appendChild(c);
  }
  return n;
}

export async function renderPiscineProgressBar(container, userId) {
  if (!container) return;

  container.innerHTML = `
    <h3>Piscine Progress</h3>
    <p class="muted">Completion rate based on validated piscine & checkpoint tasks.</p>
  `;

  const query = `
    query PiscineProgress($userId: Int!) {
      progress(
        where: { userId: { _eq: $userId } }
      ) {
        grade
        path
      }
    }
  `;

  const data = await graphqlRequest(query, { userId });
  const rows = data?.progress ?? [];

  // 🧠 Piscine-only rows
  const piscine = rows.filter(r => {
    const p = r.path?.toLowerCase() ?? "";
    return p.includes("piscine") || p.includes("checkpoint");
  });

  if (piscine.length === 0) {
    container.innerHTML += `<p class="muted">No piscine data found.</p>`;
    return;
  }

  const passed = piscine.filter(r => Number(r.grade) >= 1).length;
  const total = piscine.length;
  const percent = Math.round((passed / total) * 100);

  // SVG sizes
  const width = 520;
  const height = 90;
  const barWidth = 420;
  const barHeight = 16;
  const x = (width - barWidth) / 2;
  const y = 30;

  const svg = el("svg", {
    viewBox: `0 0 ${width} ${height}`,
    width: "100%",
    class: "svg-chart",
  });

  // Background bar
  svg.appendChild(el("rect", {
    x,
    y,
    width: barWidth,
    height: barHeight,
    rx: 8,
    fill: "rgba(255,255,255,0.15)",
  }));

  // Filled bar
  svg.appendChild(el("rect", {
    x,
    y,
    width: (barWidth * percent) / 100,
    height: barHeight,
    rx: 8,
    fill: "rgba(155,92,255,0.95)",
  }));

  // Percentage text
  svg.appendChild(el("text", {
    x: width / 2,
    y: y + barHeight + 28,
    "text-anchor": "middle",
    fill: "#fff",
    "font-size": "20",
    "font-weight": "600",
  }, [`${percent}% Completed`]));

  container.appendChild(svg);
}
