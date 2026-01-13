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
function formatXP(amount) {
    if (amount >= 1024) {
        return (amount / 1024).toFixed(2) + " MB";
    }
    return amount.toFixed(0) + " KB";
}

export async function renderAuditRatioChart(container) {
    if (!container) return;

    container.innerHTML = `
    <h3>Audit Ratio</h3>
    <p class="muted">XP given to peers vs XP received</p>
  `;

    const query = `
    {
      given: transaction(where: { type: { _eq: "up" } }) { amount }
      received: transaction(where: { type: { _eq: "down" } }) { amount }
    }
  `;

    const data = await graphqlRequest(query);

    const givenXP = (data.given || []).reduce((s, a) => s + a.amount, 0);
    const receivedXP = (data.received || []).reduce((s, a) => s + a.amount, 0);

    const ratio =
        receivedXP > 0 ? (givenXP / receivedXP).toFixed(2) : "∞";

    const max = Math.max(givenXP, receivedXP, 1);

    const width = 520;
    const height = 220;
    const barWidth = 360;
    const barHeight = 10;
    const startX = 120;

    const svg = el("svg", {
        viewBox: `0 0 ${width} ${height}`,
        width: "100%",
        class: "svg-chart",
    });

    // ---------- Labels ----------
    svg.appendChild(el("text", {
        x: 20,
        y: 70,
        fill: "rgba(255,255,255,0.85)",
        "font-size": 14,
    }, ["Done"]));

    svg.appendChild(el("text", {
        x: 20,
        y: 120,
        fill: "rgba(255,255,255,0.85)",
        "font-size": 14,
    }, ["Received"]));

    // ---------- Background bars ----------
    [70, 120].forEach(y => {
        svg.appendChild(el("rect", {
            x: startX,
            y: y - barHeight / 2,
            width: barWidth,
            height: barHeight,
            rx: 6,
            fill: "rgba(255,255,255,0.15)",
        }));
    });

    // ---------- Foreground bars ----------
    const givenW = (givenXP / max) * barWidth;
    const receivedW = (receivedXP / max) * barWidth;

    const givenBar = el("rect", {
        x: startX,
        y: 70 - barHeight / 2,
        width: 0,
        height: barHeight,
        rx: 6,
        fill: "rgba(29, 90, 59, 0.95)",
    });

    const receivedBar = el("rect", {
        x: startX,
        y: 120 - barHeight / 2,
        width: 0,
        height: barHeight,
        rx: 6,
        fill: "rgba(255,255,255,0.7)",
    });

    svg.append(givenBar, receivedBar);

    // ---------- Animate bars ----------
    givenBar.animate(
        [{ width: 0 }, { width: givenW }],
        { duration: 800, easing: "ease-out", fill: "forwards" }
    );

    receivedBar.animate(
        [{ width: 0 }, { width: receivedW }],
        { duration: 800, delay: 120, easing: "ease-out", fill: "forwards" }
    );

    // ---------- Values ----------
    svg.appendChild(el("text", {
        x: startX + barWidth + 10,
        y: 74,
        fill: "#fff",
        "font-size": 13,
    }, [`${formatXP(givenXP)} ↑`]));

    svg.appendChild(el("text", {
        x: startX + barWidth + 10,
        y: 124,
        fill: "rgba(255,255,255,0.7)",
        "font-size": 13,
    }, [`${formatXP(receivedXP)} ↓`]));

    // ---------- Ratio & feedback ----------
    let feedback = "Balanced";
    if (ratio < 1) feedback = "You can do better";
    if (ratio > 1.2) feedback = "Great contribution";

    svg.appendChild(el("text", {
        x: width / 2,
        y: 180,
        "text-anchor": "middle",
        fill: "rgba(247,182,210,0.95)",
        "font-size": 56,
        "font-weight": 700,
        filter: "drop-shadow(0 0 12px rgba(247,182,210,0.45))",
    }, [ratio]));


    svg.appendChild(el("text", {
        x: width / 2,
        y: 198,
        "text-anchor": "middle",
        fill: "rgba(255,255,255,0.65)",
        "font-size": 14,
    }, [feedback]));

    container.appendChild(svg);
}
