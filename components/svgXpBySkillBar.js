function el(tag, attrs = {}, children = []) {
  const n = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  for (const c of children) n.appendChild(c);
  return n;
}

function niceNumber(x) {
  return x.toLocaleString();
}

function categorize(path = "") {
  const p = path.toLowerCase();
  if (p.includes("go")) return "Go";
  if (p.includes("js") || p.includes("javascript")) return "JavaScript";
  if (p.includes("shell") || p.includes("bash")) return "Shell";
  return "Other";
}

export function renderXpBySkillBarSvg(container, xpTx) {
  container.innerHTML = `
    <h3>XP By Skill</h3>
    <p class="muted">How your XP is distributed across different skills.</p>
  `;

  // 1) Sum XP by category
  const totals = { JavaScript: 0, Go: 0, Shell: 0, Other: 0 };
  for (const tx of xpTx) {
    const key = categorize(tx.path);
    totals[key] += tx.amount;
  }

  const data = Object.entries(totals).map(([label, value]) => ({ label, value }));
  const max = Math.max(...data.map((d) => d.value), 1);

  const width = 900;
  const height = 280;
  const padding = { top: 20, right: 18, bottom: 46, left: 56 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const svg = el("svg", {
  viewBox: "0 0 900 320",
  width: "100%",
  height: "100%",
  preserveAspectRatio: "xMidYMid meet",
  role: "img",
    "aria-label": "XP by skill bar chart",
    class: "svg-chart",
});
    

  // Axes
  svg.appendChild(el("line", {
    x1: padding.left, y1: padding.top,
    x2: padding.left, y2: height - padding.bottom,
    stroke: "rgba(255,255,255,0.15)",
  }));

  svg.appendChild(el("line", {
    x1: padding.left, y1: height - padding.bottom,
    x2: width - padding.right, y2: height - padding.bottom,
    stroke: "rgba(255,255,255,0.15)",
  }));

  // Y grid + labels
  const gridLines = 4;
  for (let i = 0; i <= gridLines; i++) {
    const yVal = (max / gridLines) * i;
    const y = padding.top + (1 - yVal / max) * innerH;

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
      fill: "rgba(255,255,255,0.65)",
      "text-anchor": "end",
      "font-size": "12",
}, [document.createTextNode(niceNumber(Math.round(yVal))) ]));
  }

  // 2) Bars
  const barCount = data.length;
  const gap = 18;
  const barW = (innerW - gap * (barCount - 1)) / barCount;

  data.forEach((d, i) => {
    const x = padding.left + i * (barW + gap);
    const h = (d.value / max) * innerH;
    const y = padding.top + (innerH - h);

    // Bar
    svg.appendChild(el("rect", {
      x,
      y,
      width: barW,
      height: h,
      rx: 10,
      fill: "rgba(155,92,255,0.85)",
    }));

    // Label under bar
    svg.appendChild(el("text", {
      x: x + barW / 2,
      y: height - 18,
      fill: "rgba(255,255,255,0.75)",
      "text-anchor": "middle",
      "font-size": "12",
    }, [document.createTextNode(d.label)]));

    // Value above bar
    svg.appendChild(el("text", {
      x: x + barW / 2,
      y: y - 8,
      fill: "rgba(255,255,255,0.65)",
      "text-anchor": "middle",
      "font-size": "12",
    }, [document.createTextNode(niceNumber(d.value))]));
  });

  container.appendChild(svg);
}
