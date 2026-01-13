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

export async function renderProjectGradesBar(container, userId) {
    if (!container) return;

    container.innerHTML = `
    <h3>Top Project Grades</h3>
    <p class="muted">Highest grades achieved across validated projects.</p>
  `;

    const query = `
    query ProjectGrades($userId: Int!) {
      progress(
        where: {
          userId: { _eq: $userId }
          path: { _nlike: "%piscine%" }
        }
        order_by: { grade: desc }
        limit: 10
      ) {
        grade
        path
      }
    }
  `;

    const data = await graphqlRequest(query, { userId });
    const rows = (data?.progress ?? []).filter(r => r.grade !== null);

    if (!rows.length) {
        container.innerHTML += `<p class="muted">No project grades found.</p>`;
        return;
    }

    const width = 720;
    const height = 300;
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };

    const maxGrade = Math.max(...rows.map(r => Number(r.grade)));

    const svg = el("svg", {
        viewBox: `0 0 ${width} ${height}`,
        width: "100%",
        class: "svg-chart",
    });
    const tooltip = el("g", { opacity: 0 });

    const tooltipBg = el("rect", {
        rx: 8,
        ry: 8,
        fill: "rgba(20,20,30,0.95)",
        stroke: "rgba(155,92,255,0.6)",
        "stroke-width": 1,
    });

    const tooltipText = el("text", {
        fill: "#fff",
        "font-size": "12",
    });

    tooltip.appendChild(tooltipBg);
    tooltip.appendChild(tooltipText);
    svg.appendChild(tooltip);

    // Y axis
    svg.appendChild(el("line", {
        x1: padding.left,
        y1: padding.top,
        x2: padding.left,
        y2: height - padding.bottom,
        stroke: "rgba(255,255,255,0.2)",
    }));

    // X axis
    svg.appendChild(el("line", {
        x1: padding.left,
        y1: height - padding.bottom,
        x2: width - padding.right,
        y2: height - padding.bottom,
        stroke: "rgba(255,255,255,0.2)",
    }));

    // Y grid + labels
    const gridLines = 4;
    for (let i = 0; i <= gridLines; i++) {
        const value = (maxGrade / gridLines) * i;
        const y =
            padding.top +
            (1 - value / maxGrade) * (height - padding.top - padding.bottom);

        svg.appendChild(el("line", {
            x1: padding.left,
            y1: y,
            x2: width - padding.right,
            y2: y,
            stroke: "rgba(255,255,255,0.06)",
        }));

        svg.appendChild(el("text", {
            x: padding.left - 10,
            y: y + 4,
            "text-anchor": "end",
            fill: "rgba(255,255,255,0.65)",
            "font-size": "12",
        }, [value.toFixed(1)]));
    }

    const barGap = 14;
    const barWidth =
        (width - padding.left - padding.right - barGap * (rows.length - 1)) /
        rows.length;

    rows.forEach((r, i) => {
        const value = Number(r.grade);
        const barHeight =
            (value / maxGrade) * (height - padding.top - padding.bottom);

        const x = padding.left + i * (barWidth + barGap);
        const y = height - padding.bottom - barHeight;

        const rect = el("rect", {
            x,
            y,
            width: barWidth,
            height: barHeight,
            rx: 8,
            fill: "rgba(252, 193, 219, 0.9)",

            cursor: "pointer",
        });

        const label = r.path.split("/").pop();
        const textValue = `${label}\nGrade: ${value.toFixed(2)}`;

        rect.addEventListener("mouseenter", () => {
            tooltip.setAttribute("opacity", 1);

            tooltipText.textContent = textValue;

            const bbox = tooltipText.getBBox();
            const padding = 8;

            tooltipBg.setAttribute("x", x + barWidth / 2 - bbox.width / 2 - padding);
            tooltipBg.setAttribute("y", y - bbox.height - 28);
            tooltipBg.setAttribute("width", bbox.width + padding * 2);
            tooltipBg.setAttribute("height", bbox.height + padding * 2);

            tooltipText.setAttribute("x", x + barWidth / 2 - bbox.width / 2);
            tooltipText.setAttribute("y", y - 12);
        });

        rect.addEventListener("mouseleave", () => {
            tooltip.setAttribute("opacity", 0);
        });


        // Tooltip (native SVG title)
        rect.appendChild(
            el("title", {}, [
                `${r.path.split("/").pop()}\nGrade: ${value.toFixed(2)}`
            ])
        );

        svg.appendChild(rect);

        // Value on top
        svg.appendChild(el("text", {
            x: x + barWidth / 2,
            y: y - 6,
            "text-anchor": "middle",
            fill: "#fff",
            "font-size": "12",
            "font-weight": "600",
        }, [value.toFixed(2)]));
    });

    container.appendChild(svg);
}
