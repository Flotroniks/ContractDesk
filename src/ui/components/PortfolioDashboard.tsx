/* eslint-disable jsdoc/require-jsdoc, jsdoc/require-param, jsdoc/require-param-type, jsdoc/require-returns, jsdoc/require-returns-type, jsdoc/check-tag-names */
import { useMemo } from "react";
import { usePortfolioDashboard } from "../hooks/usePortfolioDashboard";
import type { ElectronApi, Property } from "../types";
import { PortfolioTrendChart } from "./charts/PortfolioTrendChart";
import { ExpenseDistributionChart } from "./charts/ExpenseDistributionChart";
import { formatCurrency, formatPercentInteger } from "../lib/formatters";
import { useTranslation } from "react-i18next";

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 6 }, (_, idx) => currentYear - idx);

export function PortfolioDashboard({ electronApi, properties }: { electronApi: ElectronApi; properties: Property[] }) {
    const { t } = useTranslation();
    const { year, setYear, monthlyAggregates, performances, expenseBreakdown, kpis, alerts, loading, error, refresh } =
        usePortfolioDashboard(electronApi, properties, currentYear);

    const top5 = useMemo(() => performances.slice(0, Math.min(5, performances.length)), [performances]);
    const bottom3 = useMemo(() => {
        // Only show bottom performers if we have more than 5 properties
        // to avoid duplicating the same properties in both lists
        if (performances.length <= 5) return [];
        return performances.slice(-3).reverse();
    }, [performances]);

    return (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900">{t("finances.portfolioDashboardTitle")}</h2>
                    <p className="text-sm text-slate-500">{t("finances.portfolioDashboardSubtitle")}</p>
                </div>
                <div className="ml-auto flex items-center gap-3">
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
                    <button
                        onClick={() => void refresh()}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        {t("finances.refresh")}
                    </button>
                </div>
            </div>

            {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            {loading && <div className="text-sm text-slate-500">{t("finances.portfolioLoading")}</div>}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <KpiCard label={t("finances.portfolioKpiRevenue")} value={kpis.totalIncome} accent="text-blue-600" />
                <KpiCard label={t("finances.portfolioKpiExpenses")} value={kpis.totalExpenses} accent="text-amber-600" />
                <KpiCard label={t("finances.portfolioKpiAnnualCredit")} value={kpis.totalCredit} accent="text-purple-600" />
                <KpiCard label={t("finances.portfolioKpiNetCashflow")} value={kpis.netCashflow} accent="text-emerald-600" />
                <KpiCard label={t("finances.portfolioKpiOccupancy")} value={kpis.occupancyRate * 100} accent="text-indigo-600" isPercent />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-inner space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-slate-800">{t("finances.portfolioMonthlyTrendTitle")}</div>
                        <div className="text-xs text-slate-500">{t("finances.portfolioMonthlyTrendSubtitle")}</div>
                    </div>
                    <PortfolioTrendChart data={monthlyAggregates} />
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-inner space-y-3">
                    <div className="text-sm font-semibold text-slate-800">{t("finances.portfolioExpenseDistributionTitle")}</div>
                    {expenseBreakdown.length === 0 ? (
                        <div className="text-sm text-slate-500">{t("finances.portfolioExpenseDistributionEmpty")}</div>
                    ) : (
                        <ExpenseDistributionChart data={expenseBreakdown} />
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-semibold text-slate-800">{t("finances.portfolioRankingTitle")}</div>
                        <div className="text-xs text-slate-500">{t("finances.portfolioRankingSubtitle")}</div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="text-left text-slate-500">
                                    <th className="py-2">{t("finances.portfolioRankingColumnProperty")}</th>
                                    <th className="py-2 text-right">{t("finances.portfolioRankingColumnRevenue")}</th>
                                    <th className="py-2 text-right">{t("finances.portfolioRankingColumnExpenses")}</th>
                                    <th className="py-2 text-right">{t("finances.portfolioRankingColumnCashflow")}</th>
                                    <th className="py-2 text-right">{t("finances.portfolioRankingColumnVacancy")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {top5.map((p) => (
                                    <tr key={p.propertyId} className="hover:bg-slate-50">
                                        <td className="py-2 font-medium text-slate-800">{p.propertyName}</td>
                                        <td className="py-2 text-slate-700 text-right">{formatCurrency(p.income)}</td>
                                        <td className="py-2 text-slate-700 text-right">{formatCurrency(p.expenses)}</td>
                                        <td className={`py-2 font-semibold text-right ${p.cashflow >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                            {formatCurrency(p.cashflow)}
                                        </td>
                                        <td className="py-2 text-slate-700 text-right">{formatPercentInteger(p.vacancyRate * 100)}</td>
                                    </tr>
                                ))}
                                {bottom3.map((p) => (
                                    <tr key={`low-${p.propertyId}`} className="hover:bg-amber-50">
                                        <td className="py-2 font-medium text-slate-800">{p.propertyName}</td>
                                        <td className="py-2 text-slate-700 text-right">{formatCurrency(p.income)}</td>
                                        <td className="py-2 text-slate-700 text-right">{formatCurrency(p.expenses)}</td>
                                        <td className={`py-2 font-semibold text-right ${p.cashflow >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                            {formatCurrency(p.cashflow)}
                                        </td>
                                        <td className="py-2 text-slate-700 text-right">{formatPercentInteger(p.vacancyRate * 100)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                    <div className="text-sm font-semibold text-slate-800">{t("finances.portfolioAlertsTitle")}</div>
                    {alerts.length === 0 ? (
                        <div className="text-sm text-slate-500">{t("finances.portfolioAlertsEmpty")}</div>
                    ) : (
                        <div className="space-y-2">
                            {alerts.map((alert, idx) => (
                                <div
                                    key={`${alert.type}-${idx}`}
                                    className={`rounded-lg px-3 py-2 text-sm border ${
                                        alert.type === "danger"
                                            ? "border-red-200 bg-red-50 text-red-700"
                                            : alert.type === "warning"
                                                ? "border-amber-200 bg-amber-50 text-amber-700"
                                                : "border-blue-200 bg-blue-50 text-blue-700"
                                    }`}
                                >
                                    {alert.message}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

function KpiCard({ label, value, accent, isPercent }: { label: string; value: number; accent: string; isPercent?: boolean }) {
    const formatted = isPercent ? formatPercentInteger(value) : formatCurrency(value);
    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-inner">
            <div className="text-xs font-semibold text-slate-600">{label}</div>
            <div className={`text-2xl font-semibold ${accent}`}>{formatted}</div>
        </div>
    );
}
