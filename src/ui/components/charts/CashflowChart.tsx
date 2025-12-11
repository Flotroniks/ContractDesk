/* eslint-disable jsdoc/require-jsdoc, jsdoc/require-param, jsdoc/require-param-type, jsdoc/require-returns, jsdoc/require-returns-type, jsdoc/check-tag-names */
import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import type { MonthlyStat, PropertyMonthlyStats } from "../../types";

const HEIGHT = 260;

function formatMonth(month: number) {
    return new Date(2000, month - 1, 1).toLocaleString(undefined, { month: "short" });
}

type Props = { data: PropertyMonthlyStats[]; colorScale: (propertyId: number) => string; cashflowLabel: string };

/**
 * Line chart visualizing monthly cashflow trends per property with tooltips.
 */
export function CashflowChart({ data, colorScale, cashflowLabel }: Props) {
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
        if (!svgRef.current || !containerRef.current || width === 0) return;
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        if (data.length === 0) return;

        const margin = { top: 24, right: 24, bottom: 32, left: 64 };
        const innerWidth = Math.max(0, width - margin.left - margin.right);
        const innerHeight = HEIGHT - margin.top - margin.bottom;

        const g = svg.attr("width", width).attr("height", HEIGHT).append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleLinear().domain([1, 12]).range([0, innerWidth]);
        const minVal = d3.min(data.flatMap((p) => p.stats.map((s) => s.cashflow))) ?? 0;
        const maxVal = d3.max(data.flatMap((p) => p.stats.map((s) => s.cashflow))) ?? 0;
        const y = d3.scaleLinear().domain([Math.min(minVal, 0), Math.max(maxVal, 0)]).nice().range([innerHeight, 0]);

        g.append("g").attr("transform", `translate(0,${innerHeight})`).call(
            d3
                .axisBottom(x)
                .ticks(12)
                .tickFormat((d) => formatMonth(Number(d)))
        );
        g.append("g").call(d3.axisLeft(y).ticks(5).tickFormat((d) => `${Number(d).toFixed(0)}€`));

        const line = d3
            .line<MonthlyStat>()
            .x((d) => x(d.month))
            .y((d) => y(d.cashflow))
            .curve(d3.curveMonotoneX);

        data.forEach((series) => {
            g.append("path")
                .datum(series.stats)
                .attr("fill", "none")
                .attr("stroke", colorScale(series.propertyId))
                .attr("stroke-width", 2)
                .attr("d", line);
        });

        const tooltip = d3.select(tooltipRef.current);
        const showTooltip = (event: MouseEvent, d: MonthlyStat, propertyName: string) => {
            if (!containerRef.current) return;
            const [xPos, yPos] = d3.pointer(event, containerRef.current);
            tooltip
                .style("opacity", 1)
                .style("left", `${xPos + 12}px`)
                .style("top", `${yPos - 10}px`)
                .html(
                    `<div><strong>${propertyName}</strong></div><div>${formatMonth(d.month)}</div><div>${cashflowLabel}: ${d.cashflow.toFixed(2)} €</div>`
                );
        };
        const hideTooltip = () => tooltip.style("opacity", 0);

        data.forEach((series) => {
            g.selectAll(`circle-${series.propertyId}`)
                .data(series.stats)
                .enter()
                .append("circle")
                .attr("cx", (d) => x(d.month))
                .attr("cy", (d) => y(d.cashflow))
                .attr("r", 4)
                .attr("fill", colorScale(series.propertyId))
                .on("mouseenter", function (event, d) {
                    showTooltip(event as unknown as MouseEvent, d, series.propertyName);
                })
                .on("mouseleave", hideTooltip);
        });

        const legend = g.append("g").attr("transform", `translate(0, -8)`);
        legend
            .selectAll("g")
            .data(data)
            .enter()
            .append("g")
            .attr("transform", (_, i) => `translate(${i * 150}, 0)`)
            .call((legendItem) => {
                legendItem
                    .append("rect")
                    .attr("width", 12)
                    .attr("height", 12)
                    .attr("rx", 3)
                    .attr("fill", (d) => colorScale(d.propertyId));
                legendItem
                    .append("text")
                    .attr("x", 18)
                    .attr("y", 10)
                    .attr("fill", "#334155")
                    .attr("font-size", 12)
                    .text((d) => d.propertyName);
            });

        return () => { svg.selectAll("*").remove(); };
    }, [cashflowLabel, colorScale, data, width]);

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
