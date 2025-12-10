import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { ElectronApi, Property, PropertyMonthlyStats } from "../types";
import { useMonthlyStats } from "../hooks/useMonthlyStats";
import { MonthlyIncomeExpenseChart } from "./charts/MonthlyIncomeExpenseChart";
import { CashflowChart } from "./charts/CashflowChart";
import { CreditChart } from "./charts/CreditChart";
import { VacancyChart } from "./charts/VacancyChart";
import * as d3 from "d3";

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 5 }, (_, idx) => currentYear - 2 + idx);
const colorRange = ["#2563eb", "#10b981", "#f97316", "#ec4899", "#22c55e", "#a855f7", "#8b5cf6", "#14b8a6"];

type StatsViewProps = {
    electronApi: ElectronApi;
    properties: Property[];
};

export function StatsView({ electronApi, properties }: StatsViewProps) {
    const { t } = useTranslation();
    const activeProperties = useMemo(() => properties.filter((p) => p.status !== "archived"), [properties]);
    const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(activeProperties[0]?.id ?? null);
    const [mode, setMode] = useState<"single" | "multi">("single");
    const [selectedPropertyIds, setSelectedPropertyIds] = useState<number[]>(selectedPropertyId ? [selectedPropertyId] : []);

    useEffect(() => {
        if (!selectedPropertyId && activeProperties.length > 0) {
            setSelectedPropertyId(activeProperties[0].id);
            setSelectedPropertyIds([activeProperties[0].id]);
        }
    }, [activeProperties, selectedPropertyId]);

    const propertyNameMap = useMemo(() => new Map(activeProperties.map((p) => [p.id, p.name])), [activeProperties]);

    const propertyIdsForFetch = mode === "single" ? (selectedPropertyId ? [selectedPropertyId] : []) : selectedPropertyIds;
    const { statsByProperty, year, setYear, loading, error, refresh } = useMonthlyStats(
        electronApi,
        propertyIdsForFetch,
        propertyNameMap,
        currentYear
    );

    const normalizedStatsByProperty: PropertyMonthlyStats[] = useMemo(() => {
        return statsByProperty.map((entry) => {
            const map = new Map(entry.stats.map((s) => [s.month, s]));
            const filled = Array.from({ length: 12 }, (_, idx) => {
                const month = idx + 1;
                const existing = map.get(month);
                return existing ?? { month, income: 0, expense: 0, credit: 0, cashflow: 0, vacancy: 0 };
            });
            return { ...entry, stats: filled };
        });
    }, [statsByProperty]);

    const hasActiveCredits = useMemo(
        () => normalizedStatsByProperty.some((entry) => entry.stats.some((s) => s.credit > 0)),
        [normalizedStatsByProperty]
    );

    const colorScale = useMemo(() => {
        const ids = normalizedStatsByProperty.map((p) => p.propertyId);
        return d3.scaleOrdinal<number, string>().domain(ids).range(colorRange);
    }, [normalizedStatsByProperty]);

    const colorForProperty = useCallback((id: number) => colorScale(id) ?? colorRange[0], [colorScale]);

    const shouldShowCharts = propertyIdsForFetch.length > 0 && normalizedStatsByProperty.length > 0;

    if (activeProperties.length === 0) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 text-sm text-slate-600">
                {t("stats.addPropertyPrompt")}
            </div>
        );
    }

    return (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-6">
            <div className="flex flex-wrap gap-3 items-end">
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-600">{t("stats.mode")}</label>
                    <div className="flex items-center gap-3 text-sm text-slate-700">
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="stats-mode"
                                value="single"
                                checked={mode === "single"}
                                onChange={() => {
                                    setMode("single");
                                    const fallback = selectedPropertyIds[0] ?? activeProperties[0]?.id ?? null;
                                    setSelectedPropertyId(fallback);
                                    setSelectedPropertyIds(fallback ? [fallback] : []);
                                }}
                            />
                            {t("stats.singleMode")}
                        </label>
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="stats-mode"
                                value="multi"
                                checked={mode === "multi"}
                                onChange={() => {
                                    setMode("multi");
                                    setSelectedPropertyIds((prev) => {
                                        if (prev.length > 0) return prev;
                                        if (selectedPropertyId) return [selectedPropertyId];
                                        if (activeProperties[0]) return [activeProperties[0].id];
                                        return [];
                                    });
                                }}
                            />
                            {t("stats.multiMode")}
                        </label>
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-600">{t("stats.year")}</label>
                    <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                        {yearOptions.map((y) => (
                            <option key={y} value={y}>
                                {y}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-3 ml-auto flex-wrap">
                    <button
                        onClick={() => void refresh()}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        {t("stats.refresh")}
                    </button>
                </div>
            </div>

            {mode === "single" ? (
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-600">{t("stats.property")}</label>
                    <select
                        value={selectedPropertyId ?? ""}
                        onChange={(e) => {
                            const val = e.target.value ? Number(e.target.value) : null;
                            setSelectedPropertyId(val);
                            setSelectedPropertyIds(val ? [val] : []);
                        }}
                        className="min-w-[240px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                        {activeProperties.map((property) => (
                            <option key={property.id} value={property.id}>
                                {property.name}
                                {property.address ? ` · ${property.address}` : ""}
                            </option>
                        ))}
                    </select>
                </div>
            ) : (
                <div className="w-full rounded-lg border border-slate-200 bg-white p-3">
                    <div className="text-xs font-semibold text-slate-600 mb-2">{t("stats.propertiesMulti")}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-sm text-slate-700">
                        {activeProperties.map((property) => {
                            const checked = selectedPropertyIds.includes(property.id);
                            return (
                                <label key={property.id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 shadow-sm">
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={(e) => {
                                            const isChecked = e.target.checked;
                                            setSelectedPropertyIds((prev) => {
                                                if (isChecked) return Array.from(new Set([...prev, property.id]));
                                                return prev.filter((id) => id !== property.id);
                                            });
                                        }}
                                    />
                                    <span className="truncate">{property.name}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            )}

            {error && <div className="text-sm text-red-600">{error}</div>}
            {loading && <div className="text-sm text-slate-500">{t("stats.loading")}</div>}

            {mode === "multi" && propertyIdsForFetch.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    {t("stats.selectAtLeastOne")}
                </div>
            )}

            {shouldShowCharts && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ChartCard title={t("stats.incomeVsExpenses")}>
                        <MonthlyIncomeExpenseChart
                            data={normalizedStatsByProperty}
                            colorScale={colorForProperty}
                            incomeLabel={t("finances.income")}
                            expenseLabel={t("finances.expenses")}
                        />
                    </ChartCard>
                    <ChartCard title={t("stats.cashflow")}>
                        <CashflowChart data={normalizedStatsByProperty} colorScale={colorForProperty} cashflowLabel={t("finances.cashflow")} />
                    </ChartCard>
                    <ChartCard title={t("stats.credit")}>
                        {hasActiveCredits ? (
                            <CreditChart
                                data={normalizedStatsByProperty}
                                colorScale={colorForProperty}
                                creditLabel={t("finances.credit")}
                            />
                        ) : (
                            <EmptyState message={t("stats.noActiveCredit") ?? ""} />
                        )}
                    </ChartCard>
                    <ChartCard title={t("stats.vacancy")}>
                        <VacancyChart
                            data={normalizedStatsByProperty}
                            colorScale={colorForProperty}
                            vacancyLabel={t("finances.vacancy")}
                        />
                    </ChartCard>
                </div>
            )}
        </section>
    );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-inner space-y-3">
            <div className="text-sm font-semibold text-slate-800">{title}</div>
            {children}
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return <div className="text-sm text-slate-500">{message}</div>;
}
