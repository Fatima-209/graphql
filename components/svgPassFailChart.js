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

/**
 * mode = "project" | "piscine"
 */
export async function renderPassFailChart(container, userId, mode) {
  if (!container) return;

  container.innerHTML = `
    <h3>${mode === "piscine" ? "Piscine Outcomes" : "Project Outcomes"} (Pass / Fail)</h3>
    <p class="muted">Based on validated progress results.</p>
  `;

  const query = `
    query Progress($userId: Int!) {
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

  // FILTER BY MODE
  const filtered = rows.filter(r => {
    const p = r.path?.toLowerCase() ?? "";
    if (mode === "piscine") {
      return p.includes("piscine") || p.includes("checkpoint");
    }
    return !p.includes("piscine") && !p.includes("checkpoint");
  });

  // PASS / FAIL LOGIC (IMPORTANT)
  const passed = filtered.filter(r => Number(r.grade) >= 1).length;
  const failed = filtered.filter(r => Number(r.grade) < 1).length;

  const total = passed + failed || 1;

  // SVG SETUP
  const width = 520;
  const height = 360;
  const radius = 110;
  const cx = width / 2;
  const cy = height / 2 + 10;

  const passAngle = (passed / total) * Math.PI * 2;
  const largeArc = passAngle > Math.PI ? 1 : 0;

  const x = cx + radius * Math.cos(passAngle - Math.PI / 2);
  const y = cy + radius * Math.sin(passAngle - Math.PI / 2);

  const svg = el("svg", {
    viewBox: `0 0 ${width} ${height}`,
    width: "100%",
    class: "svg-chart",
  });

  // PASS
  svg.appendChild(el("path", {
    d: `
      M ${cx} ${cy - radius}
      A ${radius} ${radius} 0 ${largeArc} 1 ${x} ${y}
      L ${cx} ${cy}
      Z
    `,
    fill: "rgba(155,92,255,0.92)",
  }));

  // FAIL
  svg.appendChild(el("path", {
    d: `
      M ${cx} ${cy}
      L ${x} ${y}
      A ${radius} ${radius} 0 ${largeArc ? 0 : 1} 1 ${cx} ${cy - radius}
      Z
    `,
    fill: "rgba(255,255,255,0.18)",
  }));

  // CENTER TEXT
  svg.appendChild(el("text", {
    x: cx,
    y: cy - 8,
    "text-anchor": "middle",
    fill: "#fff",
    "font-size": "26",
    "font-weight": "700",
  }, [`${passed}`]));

  svg.appendChild(el("text", {
    x: cx,
    y: cy + 20,
    "text-anchor": "middle",
    fill: "rgba(255,255,255,0.65)",
    "font-size": "14",
  }, ["Passed"]));

  // LEGEND
  const legendY = height - 26;

  svg.appendChild(el("rect", { x: cx - 120, y: legendY, width: 14, height: 14, rx: 4, fill: "rgba(155,92,255,0.92)" }));
  svg.appendChild(el("text", { x: cx - 96, y: legendY + 12, fill: "rgba(255,255,255,0.85)", "font-size": "14" }, [`Pass (${passed})`]));

  svg.appendChild(el("rect", { x: cx + 20, y: legendY, width: 14, height: 14, rx: 4, fill: "rgba(255,255,255,0.25)" }));
  svg.appendChild(el("text", { x: cx + 44, y: legendY + 12, fill: "rgba(255,255,255,0.85)", "font-size": "14" }, [`Fail (${failed})`]));

  container.appendChild(svg);
}
