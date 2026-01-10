function el(tag, attrs = {}, children = []) {
  const n = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  for (const c of children) n.appendChild(c);
  return n;
}

function fmtDate(d) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function niceNumber(x) {
  return x.toLocaleString();
}

// Optional: bucket per day to reduce points (makes line cleaner)
function groupByDay(transactions) {
  const map = new Map();
  for (const tx of transactions) {
    const day = fmtDate(new Date(tx.createdAt));
    map.set(day, (map.get(day) || 0) + tx.amount);
  }
  // sort by date
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([day, amount]) => ({ day, amount }));
}

export function renderCumulativeXpLineSvg(container, xpTx) {
  container.innerHTML = `
    <h3>Skills Progression (Cumulative XP Over Time)</h3>
    <p class="muted">Running total of all XP earned across time.</p>
  `;

  const width = 900;
  const height = 320;
  const padding = { top: 20, right: 18, bottom: 36, left: 56 };

  // 1) Bucket per day, then convert to cumulative points
  const daily = groupByDay(xpTx);
  let cumulative = 0;

  const points = daily.map((d) => {
    cumulative += d.amount;
    return {
      x: new Date(d.day).getTime(),
      y: cumulative,
      label: d.day,
    };
  });

  if (points.length === 0) {
    container.innerHTML += `<p class="muted">No XP data found.</p>`;
    return;
  }

  const minX = points[0].x;
  const maxX = points[points.length - 1].x;
  const maxY = Math.max(...points.map((p) => p.y));

  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const scaleX = (x) =>
    padding.left + ((x - minX) / (maxX - minX || 1)) * innerW;

  const scaleY = (y) =>
    padding.top + (1 - y / (maxY || 1)) * innerH;

  // 2) Build SVG path
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${scaleX(p.x)} ${scaleY(p.y)}`)
    .join(" ");

const svg = el("svg", {
  viewBox: "0 0 900 320",
  width: "100%",
  height: "100%",
  preserveAspectRatio: "xMidYMid meet",
  role: "img",
    "aria-label": "Cumulative XP line chart",
    class: "svg-chart",
});

    
  

  // Background grid lines (Y)
  const gridLines = 4;
  for (let i = 0; i <= gridLines; i++) {
    const yVal = (maxY / gridLines) * i;
    const y = scaleY(yVal);
    svg.appendChild(
      el("line", {
        x1: padding.left,
        y1: y,
        x2: width - padding.right,
        y2: y,
        stroke: "rgba(255,255,255,0.07)",
      })
    );

    // Y-axis labels
    svg.appendChild(
      el("text", {
        x: padding.left - 10,
        y: y + 4,
        fill: "rgba(255,255,255,0.65)",
        "text-anchor": "end",
        "font-size": "12",
      }, [document.createTextNode(niceNumber(Math.round(yVal)))])
    );
  }

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

  // Line path
  svg.appendChild(el("path", {
    d,
    fill: "none",
    stroke: "rgba(155,92,255,0.95)",
    "stroke-width": "3",
    "stroke-linejoin": "round",
    "stroke-linecap": "round",
  }));

  // Optional: last point marker
  const last = points[points.length - 1];
  svg.appendChild(el("circle", {
    cx: scaleX(last.x),
    cy: scaleY(last.y),
    r: 4,
    fill: "rgba(155,92,255,1)",
  }));

  // X labels (start & end)
  const startLabel = new Date(minX).toISOString().slice(0, 10);
  const endLabel = new Date(maxX).toISOString().slice(0, 10);

  svg.appendChild(el("text", {
    x: padding.left,
    y: height - 12,
    fill: "rgba(255,255,255,0.65)",
    "text-anchor": "start",
    "font-size": "12",
  }, [document.createTextNode(startLabel)]));

  svg.appendChild(el("text", {
    x: width - padding.right,
    y: height - 12,
    fill: "rgba(255,255,255,0.65)",
    "text-anchor": "end",
    "font-size": "12",
  }, [document.createTextNode(endLabel)]));

  // Title inside (optional)
  svg.appendChild(el("text", {
    x: padding.left,
    y: 14,
    fill: "rgba(255,255,255,0.75)",
    "font-size": "12",
  }, [document.createTextNode("All XP")]))

  container.appendChild(svg);

  // Small summary
  container.innerHTML += `
    <p class="muted"><strong>Total XP:</strong> ${niceNumber(last.y)}</p>
  `;
}
