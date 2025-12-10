/* eslint-disable jsdoc/require-jsdoc, jsdoc/require-param, jsdoc/require-param-type, jsdoc/require-returns, jsdoc/require-returns-type, jsdoc/check-tag-names */
import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import type { ExpenseSlice } from "../../hooks/usePortfolioDashboard";

const COLORS = ["#2563eb", "#10b981", "#f97316", "#a855f7", "#ec4899", "#22c55e", "#6366f1", "#06b6d4"];

/**
 * Donut chart for expense distribution by category.
 */
export function ExpenseDistributionChart({ data }: { data: ExpenseSlice[] }) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const svgRef = useRef<SVGSVGElement | null>(null);
    const tooltipRef = useRef<HTMLDivElement | null>(null);
    const [size, setSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const observer = new ResizeObserver((entries) => {
            const rect = entries[0].contentRect;
            setSize({ width: rect.width, height: rect.height });
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!svgRef.current || size.width === 0 || size.height === 0) return;
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        if (data.length === 0) return;

        const radius = Math.min(size.width, size.height) / 2 - 10;
        const g = svg
            .attr("width", size.width)
            .attr("height", size.height)
            .append("g")
            .attr("transform", `translate(${size.width / 2},${size.height / 2})`);

        const color = d3.scaleOrdinal<string>().domain(data.map((d) => d.category)).range(COLORS);
        const pie = d3.pie<ExpenseSlice>().value((d) => d.total);
        const arc = d3.arc<d3.PieArcDatum<ExpenseSlice>>().innerRadius(radius * 0.55).outerRadius(radius);

        const tooltip = d3.select(tooltipRef.current);
        const showTooltip = (event: MouseEvent, d: d3.PieArcDatum<ExpenseSlice>) => {
            if (!containerRef.current) return;
            const [xPos, yPos] = d3.pointer(event, containerRef.current);
            tooltip
                .style("opacity", 1)
                .style("left", `${xPos + 12}px`)
                .style("top", `${yPos - 10}px`)
                .html(
                    `<div><strong>${d.data.category}</strong></div><div>${d.data.total.toLocaleString()} €</div><div>${Math.round(
                        (d.data.total / d3.sum(data, (s) => s.total)) * 100
                    )}%</div>`
                );
        };
        const hideTooltip = () => tooltip.style("opacity", 0);

        g.selectAll("path")
            .data(pie(data))
            .enter()
            .append("path")
            .attr("d", (d) => arc(d) ?? "")
            .attr("fill", (d) => color(d.data.category) ?? COLORS[0])
            .attr("stroke", "white")
            .attr("stroke-width", 1.5)
            .on("mouseenter", function (event, d) {
                showTooltip(event as unknown as MouseEvent, d);
            })
            .on("mouseleave", hideTooltip);

        const legend = svg.append("g").attr("transform", `translate(12, 12)`).attr("class", "text-xs fill-slate-600");
        legend
            .selectAll("g")
            .data(data)
            .enter()
            .append("g")
            .attr("transform", (_, i) => `translate(0, ${i * 18})`)
            .call((item) => {
                item
                    .append("rect")
                    .attr("width", 12)
                    .attr("height", 12)
                    .attr("rx", 3)
                    .attr("fill", (d) => color(d.category) ?? COLORS[0]);
                item
                    .append("text")
                    .attr("x", 16)
                    .attr("y", 10)
                    .text((d) => d.category);
            });

        return () => {
            svg.selectAll("*").remove();
        };
    }, [data, size.height, size.width]);

    return (
        <div ref={containerRef} className="relative h-[260px] w-full">
            <svg ref={svgRef} className="w-full h-full" />
            <div
                ref={tooltipRef}
                className="pointer-events-none absolute rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 shadow-sm"
                style={{ opacity: 0 }}
            />
        </div>
    );
}
