import { graphqlRequest } from "../services/graphql.js";

/* ---------- SVG helper ---------- */
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
    <p class="muted">Final validated result per real project.</p>
  `;

  /* ---------- FETCH DATA ---------- */
  const query = `
    query Progress($userId: Int!) {
      progress(where: { userId: { _eq: $userId } }) {
        grade
        path
      }
    }
  `;

  const data = await graphqlRequest(query, { userId });
  const rows = data?.progress ?? [];

  /* ---------- STRICT PROJECT FILTER ---------- */
  const projectsOnly = rows.filter(r => {
    if (!r.path) return false;

    const p = r.path.toLowerCase();

    // ❌ Exclusions
    if (p.includes("piscine")) return false;
    if (p.includes("checkpoint")) return false;
    if (p.includes("exam")) return false;
    if (p.includes("rush")) return false;
    if (p.includes("onboarding")) return false;

    // ✅ Must look like a real project path
    // example: /module/ft_printf
    return p.split("/").length >= 3;
  });

  /* ---------- FINAL RESULT PER PROJECT ---------- */
  const finalResult = new Map();

  projectsOnly.forEach(r => {
    const grade = r.grade == null ? -1 : Number(r.grade);
    const prev = finalResult.get(r.path);

    if (prev === undefined || grade > prev) {
      finalResult.set(r.path, grade);
    }
  });

  const grades = [...finalResult.values()];

  const passed = grades.filter(g => g >= 1).length;
  const failed = grades.filter(g => g < 1).length;
  const total = passed + failed || 1;

  /* ---------- SVG SETUP ---------- */
  const width = 520;
  const height = 360;
  const radius = 110;
  const cx = width / 2;
  const cy = height / 2 + 10;

  const passAngle = (passed / total) * Math.PI * 2;
  const failAngle = Math.PI * 2 - passAngle;

  const px = cx + radius * Math.cos(passAngle - Math.PI / 2);
  const py = cy + radius * Math.sin(passAngle - Math.PI / 2);

  const svg = el("svg", {
    viewBox: `0 0 ${width} ${height}`,
    width: "100%",
    class: "svg-chart",
  });

  /* ---------- PASS SLICE ---------- */
  svg.appendChild(el("path", {
    d: `
      M ${cx} ${cy - radius}
      A ${radius} ${radius} 0 ${passAngle > Math.PI ? 1 : 0} 1 ${px} ${py}
      L ${cx} ${cy}
      Z
    `,
    fill: "rgba(252,193,219,0.9)",
  }));

  /* ---------- FAIL SLICE ---------- */
  if (failed > 0) {
    svg.appendChild(el("path", {
      d: `
        M ${cx} ${cy}
        L ${px} ${py}
        A ${radius} ${radius} 0 ${passAngle > Math.PI ? 0 : 1} 1 ${cx} ${cy - radius}
        Z
      `,
      fill: "rgba(255,255,255,0.25)",
    }));
  }

  /* ---------- CENTER TEXT ---------- */
  svg.appendChild(el("text", {
    x: cx,
    y: cy - 6,
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

  /* ---------- LEGEND ---------- */
  const y = height - 26;

  svg.appendChild(el("rect", { x: cx - 120, y, width: 14, height: 14, rx: 4, fill: "rgba(252,193,219,0.9)" }));
  svg.appendChild(el("text", { x: cx - 96, y: y + 12, fill: "#fff", "font-size": "14" }, [`Pass (${passed})`]));

  svg.appendChild(el("rect", { x: cx + 20, y, width: 14, height: 14, rx: 4, fill: "rgba(255,255,255,0.25)" }));
  svg.appendChild(el("text", { x: cx + 44, y: y + 12, fill: "#fff", "font-size": "14" }, [`Fail (${failed})`]));

  container.appendChild(svg);
}
