import { graphqlRequest } from "../services/graphql.js";

function el(tag, attrs = {}, children = []) {
  const n = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  for (const c of children) {
    n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return n;
}

export async function renderPiscineGradesBar(container, userId) {
  if (!container) return;

  container.innerHTML = `
    <h3>Piscine Top Grades</h3>
    <p class="muted">Highest grades achieved during piscine & checkpoints.</p>
  `;

  const query = `
    query PiscineGrades($userId: Int!) {
      progress(
        where: {
          userId: { _eq: $userId }
          path: { _ilike: "%piscine%" }
        }
        order_by: { grade: desc }
        limit: 10
      ) {
        grade
        path
      }
    }
  `;

  const data = await graphqlRequest(query, { userId });
  const rows = data?.progress ?? [];

  if (!rows.length) {
    container.innerHTML += `<p class="muted">No piscine data found.</p>`;
    return;
  }

  const width = 640;
  const height = 260;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };

  const maxGrade = Math.max(...rows.map(r => Number(r.grade)));

  const svg = el("svg", {
    viewBox: `0 0 ${width} ${height}`,
    width: "100%",
    height: height,
    class: "svg-chart",
  });

  // Axes
  svg.appendChild(el("line", {
    x1: padding.left,
    y1: padding.top,
    x2: padding.left,
    y2: height - padding.bottom,
    stroke: "rgba(255,255,255,0.15)",
  }));

  svg.appendChild(el("line", {
    x1: padding.left,
    y1: height - padding.bottom,
    x2: width - padding.right,
    y2: height - padding.bottom,
    stroke: "rgba(255,255,255,0.15)",
  }));

  const barGap = 12;
  const barWidth =
    (width - padding.left - padding.right - barGap * (rows.length - 1)) /
    rows.length;

  rows.forEach((r, i) => {
    const value = Number(r.grade);
    const barHeight =
      ((value / maxGrade) * (height - padding.top - padding.bottom)) || 0;

    const x =
      padding.left + i * (barWidth + barGap);

    const y =
      height - padding.bottom - barHeight;

    // Bar
    svg.appendChild(el("rect", {
      x,
      y,
      width: barWidth,
      height: barHeight,
      rx: 8,
      fill: "rgba(155,92,255,0.9)",
    }));

    // Value label
    svg.appendChild(el("text", {
      x: x + barWidth / 2,
      y: y - 6,
      "text-anchor": "middle",
      fill: "rgba(255,255,255,0.85)",
      "font-size": "12",
    }, [value.toFixed(2)]));
  });

  container.appendChild(svg);
}
