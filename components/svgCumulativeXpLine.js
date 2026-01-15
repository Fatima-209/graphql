function el(tag, attrs = {}, children = []) {
  const n = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  for (const c of children) n.appendChild(c);
  return n;
}

function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}

function niceNumber(x) {
  return x.toLocaleString();
}

function groupByDay(transactions) {
  const map = new Map();
  for (const tx of transactions) {
    const day = fmtDate(new Date(tx.createdAt));
    map.set(day, (map.get(day) || 0) + tx.amount);
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([day, amount]) => ({ day, amount }));
}

export function renderCumulativeXpLineSvg(container, xpTx) {
  container.innerHTML = `
    <h3>Skills Progression (Cumulative XP Over Time)</h3>
    <p class="muted">XP growth over time based on validated completions.</p>
  `;

  const width = 1430;
  const height = 420;
  const padding = { top: 40, right: 40, bottom: 60, left: 90 };

  const daily = groupByDay(xpTx);
  let cumulative = 0;

  const points = daily.map(d => {
    cumulative += d.amount;
    return {
      x: new Date(d.day).getTime(),
      y: cumulative,
    };
  });

  if (!points.length) {
    container.innerHTML += `<p class="muted">No XP data found.</p>`;
    return;
  }

  const minX = points[0].x;
  const maxX = points[points.length - 1].x;

  const rawMaxY = Math.max(...points.map(p => p.y));
  const step = Math.pow(10, Math.floor(Math.log10(rawMaxY)));
  const maxY = Math.ceil(rawMaxY / step) * step;

  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const scaleX = x =>
    padding.left + ((x - minX) / (maxX - minX || 1)) * innerW;

  const scaleY = y =>
    padding.top + (1 - y / maxY) * innerH;

  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${scaleX(p.x)} ${scaleY(p.y)}`)
    .join(" ");

  const svg = el("svg", {
    viewBox: `0 0 ${width} ${height}`,
    width: "100%",
    height: height,
    class: "svg-chart",
  });

  /* Y grid + labels */
  const gridLines = 5;
  for (let i = 0; i <= gridLines; i++) {
    const yVal = (maxY / gridLines) * i;
    const y = scaleY(yVal);

    svg.appendChild(el("line", {
      x1: padding.left,
      y1: y,
      x2: width - padding.right,
      y2: y,
      stroke: "rgba(255,255,255,0.07)",
    }));

    svg.appendChild(el("text", {
      x: padding.left - 12,
      y: y + 4,
      fill: "rgba(255,255,255,0.7)",
      "text-anchor": "end",
      "font-size": "13",
    }, [document.createTextNode(niceNumber(Math.round(yVal)))]));
  }

  /* X ticks */
  const tickCount = 6;
  for (let i = 0; i <= tickCount; i++) {
    const t = minX + (i / tickCount) * (maxX - minX);
    const x = scaleX(t);

    svg.appendChild(el("text", {
      x,
      y: height - 14,
      fill: "rgba(255,255,255,0.65)",
      "text-anchor": "middle",
      "font-size": "12",
    }, [document.createTextNode(fmtDate(new Date(t)))]));
  }

  /* Axes */
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

  /* Path */
  const path = el("path", {
    d,
    fill: "none",
    stroke:"rgba(252, 193, 219, 0.9)",
    "stroke-width": "3",
    "stroke-linecap": "round",
  });

  svg.appendChild(path);

  const len = path.getTotalLength();
  path.style.strokeDasharray = len;
  path.style.strokeDashoffset = len;
  path.animate(
    [{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
    { duration: 1200, easing: "ease-out", fill: "forwards" }
  );
path.animate(
  [
    { filter: "drop-shadow(0 0 6px rgba(247,182,210,0.4))" },
    { filter: "drop-shadow(0 0 14px rgba(247,182,210,0.7))" },
    { filter: "drop-shadow(0 0 6px rgba(247,182,210,0.4))" }
  ],
  {
    duration: 1800,
    iterations: Infinity,
    easing: "ease-in-out",
    delay: 1200 // starts after line draws
  }
);

  container.appendChild(svg);
}
