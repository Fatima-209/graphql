import { graphqlRequest } from "../services/graphql.js";

function el(tag, attrs = {}, children = []) {
  const n = document.createElementNS("http://www.w3.org/2000/svg", tag);

  for (const [k, v] of Object.entries(attrs)) {
    n.setAttribute(k, String(v));
  }

  for (const c of children) {
    if (typeof c === "string") {
      n.appendChild(document.createTextNode(c));
    } else if (c instanceof Node) {
      n.appendChild(c);
    }
  }

  return n;
}

export async function renderPassFailChart(container, userId) {
  // ✅ SAFETY GUARD (prevents logout loops)
  if (!container) return;

  container.innerHTML = `
    <h3>Project Outcomes (Pass / Fail)</h3>
    <p class="muted">Based on validated project results (excluding piscine).</p>
  `;

  // ✅ VALID GRAPHQL QUERY (no deep filtering)
  const query = `
    query PassFail($userId: Int!) {
      result(where: { userId: { _eq: $userId } }) {
        grade
        object {
           type: { _eq: "project" }
          path: { _nlike: "%piscine%" }
        }
      }
    }
  `;

  const data = await graphqlRequest(query, { userId });

  // ✅ SAFE ACCESS (prevents undefined crash)
  const results = data?.result ?? [];

  // ✅ FILTER IN JS (audit-safe)
  const projectResults = results.filter(r =>
    r.object?.type === "project" &&
    !r.object?.path?.toLowerCase().includes("piscine")
  );

  const passed = projectResults.filter(r => r.grade === 1).length;
  const failed = projectResults.filter(r => r.grade === 0).length;
  const total = passed + failed || 1;

  // --- SVG SETUP ---
  const width = 390;
  const height = 320;
  const radius = 90;
  const cx = width / 2;
  const cy = height / 2;

  const passAngle = (passed / total) * Math.PI * 2;
  const largeArc = passAngle > Math.PI ? 1 : 0;

  const x = cx + radius * Math.cos(passAngle - Math.PI / 2);
  const y = cy + radius * Math.sin(passAngle - Math.PI / 2);

  const svg = el("svg", {
    viewBox: `0 0 ${width} ${height}`,
    width: "100%",
    height: height,
    class: "svg-chart",
  });

  // PASS arc
  svg.appendChild(el("path", {
    d: `
      M ${cx} ${cy - radius}
      A ${radius} ${radius} 0 ${largeArc} 1 ${x} ${y}
      L ${cx} ${cy}
      Z
    `,
    fill: "rgba(155,92,255,0.9)",
  }));

  // FAIL arc
  svg.appendChild(el("path", {
    d: `
      M ${cx} ${cy}
      L ${x} ${y}
      A ${radius} ${radius} 0 ${largeArc ? 0 : 1} 1 ${cx} ${cy - radius}
      Z
    `,
    fill: "rgba(255,255,255,0.15)",
  }));

  // Center text
  svg.appendChild(el("text", {
    x: cx,
    y: cy - 6,
    "text-anchor": "middle",
    fill: "#fff",
    "font-size": "22",
    "font-weight": "600",
  }, [`${passed}`]));

  svg.appendChild(el("text", {
    x: cx,
    y: cy + 18,
    "text-anchor": "middle",
    fill: "rgba(255,255,255,0.65)",
    "font-size": "13",
  }, ["Passed"]));

  // Legend
  const legendY = height - 28;

  svg.appendChild(el("rect", {
    x: cx - 80,
    y: legendY,
    width: 12,
    height: 12,
    rx: 3,
    fill: "rgba(155,92,255,0.9)",
  }));

  svg.appendChild(el("text", {
    x: cx - 60,
    y: legendY + 11,
    fill: "rgba(255,255,255,0.8)",
    "font-size": "14",
  }, [`Pass (${passed})`]));

  svg.appendChild(el("rect", {
    x: cx + 20,
    y: legendY,
    width: 12,
    height: 12,
    rx: 3,
    fill: "rgba(255,255,255,0.2)",
  }));

  svg.appendChild(el("text", {
    x: cx + 40,
    y: legendY + 11,
    fill: "rgba(255,255,255,0.8)",
    "font-size": "14",
  }, [`Fail (${failed})`]));

  container.appendChild(svg);
}
