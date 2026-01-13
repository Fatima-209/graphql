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

export async function renderPiscineHighestGrade(container, userId) {
  if (!container) return;

  container.innerHTML = `
    <h3>Piscine Performance</h3>
    <p class="muted">Highest grade achieved during piscine & checkpoints.</p>
  `;

  const query = `
    query PiscineGrades($userId: Int!) {
      progress(where: { userId: { _eq: $userId } }) {
        grade
        path
      }
    }
  `;

  const data = await graphqlRequest(query, { userId });
  const rows = data?.progress ?? [];

  // ✅ piscine + checkpoint only
  const piscine = rows.filter(r => {
    const p = r.path?.toLowerCase() ?? "";
    return p.includes("piscine") || p.includes("checkpoint");
  });

  if (piscine.length === 0) {
    container.innerHTML += `<p class="muted">No piscine data available.</p>`;
    return;
  }

  // ✅ IMPORTANT: highest grade
  const highest = Math.max(...piscine.map(r => Number(r.grade) || 0));

  // visual scale (safe upper bound)
  const maxScale = Math.max(3, Math.ceil(highest));

  // SVG sizing
  const width = 200;
  const height = 300;
  const barWidth = 46;
  const barHeight = 180;
  const x = (width - barWidth) / 2;
  const y = 70;

  const filledHeight = (highest / maxScale) * barHeight;

  const svg = el("svg", {
    viewBox: `0 0 ${width} ${height}`,
    width: "100%",
    class: "svg-chart",
  });

  // axis
  svg.appendChild(el("line", {
    x1: width / 2,
    y1: y,
    x2: width / 2,
    y2: y + barHeight,
    stroke: "rgba(255,255,255,0.25)",
  }));

  // background bar
  svg.appendChild(el("rect", {
    x,
    y,
    width: barWidth,
    height: barHeight,
    rx: 10,
    fill: "rgba(255,255,255,0.12)",
  }));

  // filled bar
  svg.appendChild(el("rect", {
    x,
    y: y + barHeight - filledHeight,
    width: barWidth,
    height: filledHeight,
    rx: 10,
    fill: "rgba(155,92,255,0.95)",
  }));

  // grade value
  svg.appendChild(el("text", {
    x: width / 2,
    y: y + barHeight - filledHeight - 10,
    "text-anchor": "middle",
    fill: "#fff",
    "font-size": "22",
    "font-weight": "700",
  }, [highest.toFixed(2)]));

  // label
  svg.appendChild(el("text", {
    x: width / 2,
    y: y + barHeight + 28,
    "text-anchor": "middle",
    fill: "rgba(255,255,255,0.65)",
    "font-size": "13",
  }, ["Highest Grade"]));

  container.appendChild(svg);
}
