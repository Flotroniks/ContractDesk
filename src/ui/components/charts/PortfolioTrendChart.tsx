/* eslint-disable jsdoc/require-jsdoc, jsdoc/require-param, jsdoc/require-param-type, jsdoc/require-returns, jsdoc/require-returns-type, jsdoc/check-tag-names */
import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import type { MonthlyAggregate } from "../../hooks/usePortfolioDashboard";

const HEIGHT = 280;
type LinePoint = MonthlyAggregate & { value: number };
const series = [
    { key: "income", label: "Revenus", color: "#2563eb" },
    { key: "expenses", label: "Depenses", color: "#f97316" },
    { key: "cashflow", label: "Cashflow", color: "#10b981" },
] as const;

function formatMonth(month: number) {
    return new Date(2000, month - 1, 1).toLocaleString(undefined, { month: "short" });
}

/**
 * Multi-series trend chart for portfolio income/expenses/cashflow.
 */
export function PortfolioTrendChart({ data }: { data: MonthlyAggregate[] }) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const svgRef = useRef<SVGSVGElement | null>(null);
    const tooltipRef = useRef<HTMLDivElement | null>(null);
    const [width, setWidth] = useState(0);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const observer = new ResizeObserver((entries) => setWidth(entries[0].contentRect.width));
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!svgRef.current || width === 0) return;
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();
        if (data.length === 0) return;

        const margin = { top: 24, right: 16, bottom: 32, left: 64 };
        const innerWidth = Math.max(0, width - margin.left - margin.right);
        const innerHeight = HEIGHT - margin.top - margin.bottom;

        const months = data.map((d) => d.month);
        const values = data.flatMap((d) => [d.income, d.expenses, d.cashflow]);
        const maxVal = Math.max(0, d3.max(values) ?? 0);
        const minVal = Math.min(0, d3.min(values) ?? 0);

        const x = d3.scaleBand<number>().domain(months).range([0, innerWidth]).padding(0.1);
        const y = d3.scaleLinear().domain([minVal, maxVal || 1]).nice().range([innerHeight, 0]);

        const g = svg.attr("width", width).attr("height", HEIGHT).append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        g.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(
                d3
                    .axisBottom(x)
                    .tickFormat((d) => formatMonth(Number(d)))
                    .tickSizeOuter(0)
            )
            .selectAll("text")
            .style("font-size", "11px");

        g.append("g")
            .call(
                d3
                    .axisLeft(y)
                    .ticks(5)
                    .tickFormat((d) => `${Number(d).toLocaleString()}€`)
            )
            .selectAll("text")
            .style("font-size", "11px");

        const tooltip = d3.select(tooltipRef.current);
        const showTooltip = (event: MouseEvent, payload: { series: string; value: number; month: number }) => {
            if (!containerRef.current) return;
            const [xPos, yPos] = d3.pointer(event, containerRef.current);
            tooltip
                .style("opacity", 1)
                .style("left", `${xPos + 12}px`)
                .style("top", `${yPos - 10}px`)
                .html(
                    `<div><strong>${formatMonth(payload.month)}</strong></div><div>${payload.series}</div><div>${payload.value.toLocaleString()} €</div>`
                );
        };
        const hideTooltip = () => tooltip.style("opacity", 0);

        const line = d3
            .line<LinePoint>()
            .x((d) => (x(d.month) ?? 0) + x.bandwidth() / 2)
            .y((d) => y(d.value));

        series.forEach((serie) => {
            const lineData: LinePoint[] = data.map((d) => ({ ...d, value: d[serie.key] }));
            const pathData = line(lineData) ?? "";
            g.append("path")
                .datum(lineData)
                .attr("fill", "none")
                .attr("stroke", serie.color)
                .attr("stroke-width", 2.5)
                .attr("d", pathData);

            g.selectAll(`circle.${serie.key}`)
                .data(lineData)
                .enter()
                .append("circle")
                .attr("class", serie.key)
                .attr("cx", (d) => (x(d.month) ?? 0) + x.bandwidth() / 2)
                .attr("cy", (d) => y(d.value as number))
                .attr("r", 4)
                .attr("fill", "white")
                .attr("stroke", serie.color)
                .attr("stroke-width", 2)
                .on("mouseenter", function (event, d) {
                    showTooltip(event as unknown as MouseEvent, { series: serie.label, value: d.value as number, month: d.month });
                })
                .on("mouseleave", hideTooltip);
        });

        const legend = g.append("g").attr("transform", `translate(0, -8)`);
        legend
            .selectAll("g")
            .data(series)
            .enter()
            .append("g")
            .attr("transform", (_, i) => `translate(${i * 150}, 0)`)
            .call((legendItem) => {
                legendItem
                    .append("rect")
                    .attr("width", 12)
                    .attr("height", 12)
                    .attr("rx", 3)
                    .attr("fill", (d) => d.color);
                legendItem
                    .append("text")
                    .attr("x", 18)
                    .attr("y", 10)
                    .attr("fill", "#334155")
                    .attr("font-size", 12)
                    .text((d) => d.label);
            });

        return () => {
            svg.selectAll("*").remove();
        };
    }, [data, width]);

    return (
        <div ref={containerRef} className="relative h-[280px] w-full">
            <svg ref={svgRef} className="w-full h-full" />
            <div
                ref={tooltipRef}
                className="pointer-events-none absolute rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 shadow-sm"
                style={{ opacity: 0 }}
            />
        </div>
    );
}
