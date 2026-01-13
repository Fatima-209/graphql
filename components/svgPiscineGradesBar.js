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

function shortPath(path = "") {
  // show last 1-2 segments (cleaner than full URL)
  const parts = path.split("/").filter(Boolean);
  const last = parts.slice(-2).join("/");
  return last || path;
}

function ensureTooltip(container) {
  let tip = container.querySelector(".chart-tooltip");
  if (!tip) {
    tip = document.createElement("div");
    tip.className = "chart-tooltip";
    tip.style.display = "none";
    container.style.position = "relative";
    container.appendChild(tip);
  }
  return tip;
}

export async function renderPiscineGradesBar(container, userId) {
  if (!container) return;

  container.innerHTML = `
    <h3>Piscine Top Grades</h3>
    <p class="muted">Top grades achieved during piscine & checkpoints (tap a bar for details).</p>
  `;

  // ✅ piscine + checkpoint
  // ✅ only this user
  const query = `
    query PiscineGrades($userId: Int!) {
      progress(
        where: {
          userId: { _eq: $userId }
          _or: [
            { path: { _ilike: "%piscine%" } }
            { path: { _ilike: "%checkpoint%" } }
          ]
        }
        order_by: { grade: desc }
        limit: 20
      ) {
        grade
        path
        createdAt
      }
    }
  `;

  const data = await graphqlRequest(query, { userId });
  const rows = (data?.progress ?? [])
    .filter(r => r.grade !== null && r.grade !== undefined)
    .map(r => ({ ...r, grade: Number(r.grade) }))
    .filter(r => Number.isFinite(r.grade) && r.grade > 0); // ✅ remove 0.00 + junk

  if (!rows.length) {
    container.innerHTML += `<p class="muted">No piscine/checkpoint grades found.</p>`;
    return;
  }

  // keep top 10 (after filtering)
  const top = rows.slice(0, 10);

  // Layout
  const width = 980;
  const height = 360;
  const padding = { top: 34, right: 26, bottom: 64, left: 70 };

  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const maxGrade = Math.max(...top.map(r => r.grade), 1);

  // nice max for grid (so bars aren't all maxed at 1.00)
  // if maxGrade is close to 1, use 1.2 or 1.5 for nicer spacing
  const yMax =
    maxGrade <= 1.05 ? 1.2 :
    maxGrade <= 1.25 ? 1.5 :
    Math.ceil(maxGrade * 10) / 10;

  const scaleY = (v) => padding.top + (1 - v / yMax) * innerH;

  const svg = el("svg", {
    viewBox: `0 0 ${width} ${height}`,
    width: "100%",
    height: height,
    class: "svg-chart",
    role: "img",
    "aria-label": "Piscine top grades bar chart",
  });

  // background grid + y labels
  const gridLines = 4;
  for (let i = 0; i <= gridLines; i++) {
    const val = (yMax / gridLines) * i;
    const y = scaleY(val);

    svg.appendChild(el("line", {
      x1: padding.left,
      y1: y,
      x2: width - padding.right,
      y2: y,
      stroke: "rgba(255,255,255,0.07)",
    }));

    svg.appendChild(el("text", {
      x: padding.left - 10,
      y: y + 4,
      fill: "rgba(255,255,255,0.6)",
      "text-anchor": "end",
      "font-size": "12",
    }, [val.toFixed(2)]));
  }

  // axes
  svg.appendChild(el("line", {
    x1: padding.left,
    y1: padding.top,
    x2: padding.left,
    y2: height - padding.bottom,
    stroke: "rgba(255,255,255,0.16)",
  }));

  svg.appendChild(el("line", {
    x1: padding.left,
    y1: height - padding.bottom,
    x2: width - padding.right,
    y2: height - padding.bottom,
    stroke: "rgba(255,255,255,0.16)",
  }));

  const count = top.length;
  const gap = 18;
  const barW = (innerW - gap * (count - 1)) / count;

  const tooltip = ensureTooltip(container);

  // Bars + click/hover
  top.forEach((r, i) => {
    const x = padding.left + i * (barW + gap);
    const barH = (r.grade / yMax) * innerH;
    const y = padding.top + (innerH - barH);

    // bar
    const rect = el("rect", {
      x,
      y,
      width: barW,
      height: barH,
      rx: 14,
      fill: "rgba(155,92,255,0.9)",
    });

    // subtle animation
    rect.animate(
      [{ height: 0, y: height - padding.bottom }, { height: barH, y }],
      { duration: 700, easing: "ease-out", fill: "forwards" }
    );

    svg.appendChild(rect);

    // value label (only once per bar, not 0 spam)
    svg.appendChild(el("text", {
      x: x + barW / 2,
      y: y - 10,
      fill: "rgba(255,255,255,0.9)",
      "text-anchor": "middle",
      "font-size": "14",
      "font-weight": "700",
    }, [r.grade.toFixed(2)]));

    // short x label
    const label = shortPath(r.path);
    svg.appendChild(el("text", {
      x: x + barW / 2,
      y: height - 30,
      fill: "rgba(255,255,255,0.65)",
      "text-anchor": "middle",
      "font-size": "11",
    }, [label.length > 18 ? label.slice(0, 18) + "…" : label]));

    // Interaction overlay (bigger hit area)
    const hit = el("rect", {
      x,
      y: padding.top,
      width: barW,
      height: innerH,
      fill: "transparent",
      style: "cursor:pointer;",
    });

    const showTip = (clientX, clientY) => {
      tooltip.innerHTML = `
        <div class="tip-title">${shortPath(r.path)}</div>
        <div class="tip-row"><span>Grade</span><b>${r.grade.toFixed(2)}</b></div>
        <div class="tip-small">${r.path}</div>
      `;
      tooltip.style.display = "block";

      // position within card
      const card = container.getBoundingClientRect();
      const xIn = clientX - card.left;
      const yIn = clientY - card.top;

      tooltip.style.left = Math.min(xIn + 12, card.width - 260) + "px";
      tooltip.style.top = Math.max(yIn - 10, 10) + "px";
    };

    hit.addEventListener("mousemove", (e) => showTip(e.clientX, e.clientY));
    hit.addEventListener("click", (e) => showTip(e.clientX, e.clientY));
    hit.addEventListener("mouseleave", () => (tooltip.style.display = "none"));

    svg.appendChild(hit);
  });

  container.appendChild(svg);

  // click anywhere in card to close tooltip
  container.addEventListener("click", (e) => {
    const isInsideTooltip = e.target.closest?.(".chart-tooltip");
    if (!isInsideTooltip && e.target.tagName !== "rect") {
      tooltip.style.display = "none";
    }
  });
}
