import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import type { MonthlyStat, PropertyMonthlyStats } from "../../types";

const HEIGHT = 320;

function formatMonth(month: number) {
    return new Date(2000, month - 1, 1).toLocaleString(undefined, { month: "short" });
}

type Props = { data: PropertyMonthlyStats[]; colorScale: (propertyId: number) => string };

export function MonthlyIncomeExpenseChart({ data, colorScale }: Props) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const svgRef = useRef<SVGSVGElement | null>(null);
    const tooltipRef = useRef<HTMLDivElement | null>(null);
    const [width, setWidth] = useState(0);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            setWidth(entry.contentRect.width);
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!svgRef.current || !containerRef.current || width === 0) return;
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        if (data.length === 0) return;

        const margin = { top: 28, right: 16, bottom: 32, left: 64 };
        const innerWidth = Math.max(0, width - margin.left - margin.right);
        const innerHeight = HEIGHT - margin.top - margin.bottom;

        const months = data[0]?.stats?.map((d) => d.month) ?? [];
        const propertyIds = data.map((d) => d.propertyId);

        const g = svg.attr("width", width).attr("height", HEIGHT).append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        const x0 = d3.scaleBand<number>().domain(months).range([0, innerWidth]).padding(0.15);
        const x1 = d3.scaleBand<number>().domain(propertyIds).range([0, x0.bandwidth()]).padding(0.15);
        const x2 = d3.scaleBand<"income" | "expense">().domain(["income", "expense"]).range([0, x1.bandwidth()]).padding(0.25);

        const maxValue =
            d3.max(data.flatMap((p) => p.stats.map((s) => Math.max(s.income, s.expense)))) ?? 1;
        const y = d3.scaleLinear().domain([0, maxValue === 0 ? 1 : maxValue]).nice().range([innerHeight, 0]);

        const xAxis = d3.axisBottom(x0).tickFormat((d) => formatMonth(Number(d))).tickSizeOuter(0);
        const yAxis = d3.axisLeft(y).ticks(5).tickFormat((d) => `${Number(d).toFixed(0)}€`);

        g.append("g").attr("transform", `translate(0,${innerHeight})`).call(xAxis).selectAll("text").style("font-size", "11px");
        g.append("g").call(yAxis).selectAll("text").style("font-size", "11px");

        const tooltip = d3.select(tooltipRef.current);
        const showTooltip = (
            event: MouseEvent,
            args: { stat: MonthlyStat; key: "income" | "expense"; propertyName: string }
        ) => {
            if (!containerRef.current) return;
            const [xPos, yPos] = d3.pointer(event, containerRef.current);
            const value = args.key === "income" ? args.stat.income : args.stat.expense;
            tooltip
                .style("opacity", 1)
                .style("left", `${xPos + 12}px`)
                .style("top", `${yPos - 10}px`)
                .html(
                    `<div><strong>${formatMonth(args.stat.month)}</strong></div><div>${args.propertyName}</div><div>${
                        args.key === "income" ? "Revenus" : "Dépenses"
                        }: ${value.toLocaleString("fr-FR")} €</div>`
                );
        };
        const hideTooltip = () => tooltip.style("opacity", 0);

        const monthGroups = g
            .selectAll("g.month-group")
            .data(months)
            .enter()
            .append("g")
            .attr("class", "month-group")
            .attr("transform", (month) => `translate(${x0(month)},0)`);

        monthGroups
            .selectAll("g.property-group")
            .data((month) =>
                data.map((prop) => ({
                    propertyId: prop.propertyId,
                    propertyName: prop.propertyName,
                    stat: prop.stats.find((s) => s.month === month) ?? { month, income: 0, expense: 0, credit: 0, cashflow: 0, vacancy: 0 },
                }))
            )
            .enter()
            .append("g")
            .attr("class", "property-group")
            .attr("transform", (d) => `translate(${x1(d.propertyId)},0)`)
            .selectAll("rect")
            .data((d) => [
                { key: "income" as const, value: d.stat.income, propertyId: d.propertyId, propertyName: d.propertyName, stat: d.stat },
                { key: "expense" as const, value: d.stat.expense, propertyId: d.propertyId, propertyName: d.propertyName, stat: d.stat },
            ])
            .enter()
            .append("rect")
            .attr("x", (d) => x2(d.key) ?? 0)
            .attr("y", (d) => y(d.value))
            .attr("width", x2.bandwidth())
            .attr("height", (d) => innerHeight - y(d.value))
            .attr("fill", (d) => {
                const base = colorScale(d.propertyId);
                if (d.key === "income") return base;
                const adjusted = d3.color(base)?.brighter(0.8)?.formatHex();
                return adjusted ?? "#f97316";
            })
            .attr("rx", 3)
            .on("mouseenter", function (event, d) {
                showTooltip(event as unknown as MouseEvent, { stat: d.stat, key: d.key, propertyName: d.propertyName });
            })
            .on("mouseleave", hideTooltip);

        const legend = g.append("g").attr("transform", `translate(0, -12)`);
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

        return () => svg.selectAll("*").remove();
    }, [colorScale, data, width]);

    return (
        <div ref={containerRef} className="relative h-[320px] w-full">
            <svg ref={svgRef} className="w-full h-full" />
            <div
                ref={tooltipRef}
                className="pointer-events-none absolute rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 shadow-sm"
                style={{ opacity: 0 }}
            />
        </div>
    );
}
