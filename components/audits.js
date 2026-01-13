import { graphqlRequest } from "../services/graphql.js";

function el(tag, attrs = {}, children = []) {
  const n = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  for (const c of children) {
    if (typeof c === "string") {
      n.appendChild(document.createTextNode(c));
    } else if (c instanceof Node) {
      n.appendChild(c);
    }
  }
  return n;
}


export async function renderAuditRatioChart(container) {
  if (!container) return;

  container.innerHTML = `
    <h3>Audit Ratio</h3>
    <p class="muted">XP received vs XP given to peers</p>
  `;

  const query = `
    {
      up: transaction(where: { type: { _eq: "up" } }) { amount }
      down: transaction(where: { type: { _eq: "down" } }) { amount }
    }
  `;

  const data = await graphqlRequest(query);

  const up = (data.up || []).reduce((s, a) => s + a.amount, 0);
  const down = (data.down || []).reduce((s, a) => s + a.amount, 0);

  const ratio = down > 0 ? up / down : 1;
  const capped = Math.min(ratio, 2); // avoid huge arcs

  const width = 320;
  const height = 260;
  const radius = 90;
  const cx = width / 2;
  const cy = height / 2 + 10;

  const angle = capped * Math.PI;
  const x = cx + radius * Math.cos(angle - Math.PI);
  const y = cy + radius * Math.sin(angle - Math.PI);

  const svg = el("svg", {
    viewBox: `0 0 ${width} ${height}`,
    width: "100%",
    class: "svg-chart",
  });

  // Background arc
  svg.appendChild(el("path", {
    d: `
      M ${cx - radius} ${cy}
      A ${radius} ${radius} 0 1 1 ${cx + radius} ${cy}
    `,
    fill: "none",
    stroke: "rgba(255,255,255,0.15)",
    "stroke-width": 16,
  }));

  const fg = el("path", {
    d: `
      M ${cx - radius} ${cy}
      A ${radius} ${radius} 0 0 1 ${x} ${y}
    `,
    fill: "none",
    stroke: "rgba(247,182,210,0.95)",
    "stroke-width": 16,
    "stroke-linecap": "round",
  });

  svg.appendChild(fg);

  // ✨ Animate arc
  const len = fg.getTotalLength();
  fg.style.strokeDasharray = len;
  fg.style.strokeDashoffset = len;

  fg.animate(
    [{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
    { duration: 1000, easing: "ease-out", fill: "forwards" }
  );

  // Center text
  svg.appendChild(el("text", {
    x: cx,
    y: cy + 6,
    "text-anchor": "middle",
    fill: "#fff",
    "font-size": 28,
    "font-weight": 700,
  }, [ratio.toFixed(2)]));

  container.appendChild(svg);
}
