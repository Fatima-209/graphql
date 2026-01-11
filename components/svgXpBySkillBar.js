/*function el(tag, attrs = {}, children = []) {
  const n = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  for (const c of children) n.appendChild(c);
  return n;
}

function niceNumber(x) {
  return x.toLocaleString();
}

function getSkillFromPath(path = "") {
  const parts = path.toLowerCase().split("/").filter(Boolean);
  return parts.find(p =>
    p.includes("go") ||
    p.includes("js") ||
    p.includes("javascript") ||
    p.includes("shell")
  ) || "other";
}

export function renderXpBySkillBarSvg(container, xpTx) {
  container.innerHTML = `
    <h3>XP Distribution by Skill</h3>
    <p class="muted">XP grouped dynamically based on your learning paths.</p>
  `;

  const totals = {};
  for (const tx of xpTx) {
    const skill = getSkillFromPath(tx.path);
    totals[skill] = (totals[skill] || 0) + tx.amount;
  }

  const data = Object.entries(totals).map(([label, value]) => ({
    label,
    value,
  }));

  const max = Math.max(...data.map(d => d.value), 1);

  const width = 1400;
  const height = 360;
  const padding = { top: 40, right: 40, bottom: 70, left: 90 };

  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const svg = el("svg", {
    viewBox: `0 0 ${width} ${height}`,
    width: "100%",
    height: height,
    class: "svg-chart",
  });

  
  svg.appendChild(el("line", {
    x1: padding.left,
    y1: padding.top,
    x2: padding.left,
    y2: height - padding.bottom,
    stroke: "rgba(255,255,255,0.2)",
  }));

  svg.appendChild(el("line", {
    x1: padding.left,
    y1: height - padding.bottom,
    x2: width - padding.right,
    y2: height - padding.bottom,
    stroke: "rgba(255,255,255,0.2)",
  }));

  const barW = innerW / data.length * 0.7;
  const gap = innerW / data.length * 0.3;

  data.forEach((d, i) => {
    const x = padding.left + i * (barW + gap);
    const h = (d.value / max) * innerH;
    const y = padding.top + innerH - h;

    const rect = el("rect", {
      x,
      y,
      width: barW,
      height: h,
      rx: 12,
      fill: "rgba(155,92,255,0.85)",
    });

    svg.appendChild(rect);

    rect.animate(
      [{ height: 0, y: height - padding.bottom }, { height: h, y }],
      { duration: 900, easing: "ease-out", fill: "forwards" }
    );

    svg.appendChild(el("text", {
      x: x + barW / 2,
      y: height - 20,
      fill: "rgba(255,255,255,0.75)",
      "text-anchor": "middle",
      "font-size": "13",
    }, [document.createTextNode(d.label)]));

    svg.appendChild(el("text", {
      x: x + barW / 2,
      y: y - 10,
      fill: "rgba(255,255,255,0.7)",
      "text-anchor": "middle",
      "font-size": "13",
    }, [document.createTextNode(niceNumber(d.value))]));
  });

  container.appendChild(svg);
}*/