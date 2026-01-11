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

export async function renderPassFailChart(container, userId) {
  if (!container) return;

  container.innerHTML = `
    <h3>Project Outcomes (Pass / Fail)</h3>
    <p class="muted">Based on validated results (uses grades; excludes piscine when path is available).</p>
  `;

  // ✅ This query works even if object relation is restricted
  const query = `
    query PassFail($userId: Int!) {
      result(where: { userId: { _eq: $userId } }) {
        grade
        object {
          path
          type
        }
      }
    }
  `;

  const data = await graphqlRequest(query, { userId });
  const rows = data?.result ?? [];

  // ✅ keep only graded rows
  const graded = rows.filter(r => r.grade !== null && r.grade !== undefined);

  // ✅ exclude piscine ONLY if we can see the path
  // if object is null (permissions), we keep it (better than 0/0)
  const filtered = graded.filter(r => {
    const p = r.object?.path?.toLowerCase();
    if (!p) return true; // no path info → don't exclude
    return !p.includes("piscine");
  });

  // ✅ pass/fail logic
  // In Reboot data, grade can be 0/1 or sometimes a positive number for success.
  const passed = filtered.filter(r => Number(r.grade) > 0).length;
  const failed = filtered.filter(r => Number(r.grade) === 0).length;

  const total = passed + failed || 1;

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
    height: height,
    class: "svg-chart",
  });

  // PASS slice
  svg.appendChild(
    el("path", {
      d: `
        M ${cx} ${cy - radius}
        A ${radius} ${radius} 0 ${largeArc} 1 ${x} ${y}
        L ${cx} ${cy}
        Z
      `,
      fill: "rgba(155,92,255,0.92)",
    })
  );

  // FAIL slice
  svg.appendChild(
    el("path", {
      d: `
        M ${cx} ${cy}
        L ${x} ${y}
        A ${radius} ${radius} 0 ${largeArc ? 0 : 1} 1 ${cx} ${cy - radius}
        Z
      `,
      fill: "rgba(255,255,255,0.14)",
    })
  );

  // Center numbers
  svg.appendChild(
    el(
      "text",
      {
        x: cx,
        y: cy - 8,
        "text-anchor": "middle",
        fill: "#fff",
        "font-size": "26",
        "font-weight": "700",
      },
      [`${passed}`]
    )
  );

  svg.appendChild(
    el(
      "text",
      {
        x: cx,
        y: cy + 20,
        "text-anchor": "middle",
        fill: "rgba(255,255,255,0.65)",
        "font-size": "14",
      },
      ["Passed"]
    )
  );

  // Legend
  const legendY = height - 26;

  svg.appendChild(el("rect", { x: cx - 120, y: legendY, width: 14, height: 14, rx: 4, fill: "rgba(155,92,255,0.92)" }));
  svg.appendChild(el("text", { x: cx - 96, y: legendY + 12, fill: "rgba(255,255,255,0.85)", "font-size": "14" }, [`Pass (${passed})`] ));

  svg.appendChild(el("rect", { x: cx + 20, y: legendY, width: 14, height: 14, rx: 4, fill: "rgba(255,255,255,0.22)" }));
  svg.appendChild(el("text", { x: cx + 44, y: legendY + 12, fill: "rgba(255,255,255,0.85)", "font-size": "14" }, [`Fail (${failed})`] ));

  container.appendChild(svg);
}
