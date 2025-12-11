/* eslint-disable jsdoc/require-jsdoc, jsdoc/require-param, jsdoc/require-param-type, jsdoc/require-returns, jsdoc/require-returns-type, jsdoc/check-tag-names */
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ElectronApi, Property } from "../types";
import { getMonthlyStatsForProperties } from "./useMonthlyStats";
import { formatCurrency, formatPercentInteger } from "../lib/formatters";
import { useTranslation } from "react-i18next";

export type MonthlyAggregate = {
    month: number;
    income: number;
    expenses: number;
    cashflow: number;
    credit: number;
    occupancy: number;
};

export type PropertyPerformance = {
    propertyId: number;
    propertyName: string;
    income: number;
    expenses: number;
    cashflow: number;
    credit: number;
    vacancyRate: number;
};

export type ExpenseSlice = { category: string; total: number };

export function usePortfolioDashboard(electronApi: ElectronApi | null, properties: Property[], initialYear: number) {
    const { t } = useTranslation();
    const [year, setYear] = useState(initialYear);
    const [monthlyAggregates, setMonthlyAggregates] = useState<MonthlyAggregate[]>([]);
    const [performances, setPerformances] = useState<PropertyPerformance[]>([]);
    const [expenseBreakdown, setExpenseBreakdown] = useState<ExpenseSlice[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const activeProperties = useMemo(() => properties.filter((p) => p.status !== "archived"), [properties]);

    const fetchData = useCallback(async () => {
        if (!electronApi) return;
        const propertyIds = activeProperties.map((p) => p.id);
        const propertyNameMap = new Map(activeProperties.map((p) => [p.id, p.name]));
        if (propertyIds.length === 0) {
            setMonthlyAggregates([]);
            setPerformances([]);
            setExpenseBreakdown([]);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const statsByProperty = await getMonthlyStatsForProperties(electronApi, propertyIds, year, propertyNameMap);
            const normalized = statsByProperty.map((entry) => {
                const map = new Map(entry.stats.map((s) => [s.month, s]));
                const filled = Array.from({ length: 12 }, (_, idx) => {
                    const month = idx + 1;
                    const existing = map.get(month);
                    return existing ?? { month, income: 0, expense: 0, credit: 0, cashflow: 0, vacancy: 0 };
                });
                return { ...entry, stats: filled };
            });

            const aggregates: MonthlyAggregate[] = Array.from({ length: 12 }, (_, idx) => {
                const month = idx + 1;
                const forMonth = normalized.map((p) => p.stats.find((s) => s.month === month) ?? { month, income: 0, expense: 0, credit: 0, cashflow: 0, vacancy: 0 });
                const income = forMonth.reduce((sum, s) => sum + s.income, 0);
                const expenses = forMonth.reduce((sum, s) => sum + s.expense, 0);
                const credit = forMonth.reduce((sum, s) => sum + s.credit, 0);
                const cashflow = forMonth.reduce((sum, s) => sum + s.cashflow, 0);
                const vacancyAvg = forMonth.length > 0 ? forMonth.reduce((sum, s) => sum + s.vacancy, 0) / forMonth.length : 0;
                return { month, income, expenses, cashflow, credit, occupancy: 1 - vacancyAvg };
            });

            const propertyPerf = normalized.map((entry) => {
                const totals = entry.stats.reduce(
                    (acc, s) => {
                        acc.income += s.income;
                        acc.expenses += s.expense;
                        acc.cashflow += s.cashflow;
                        acc.credit += s.credit;
                        acc.vacancy += s.vacancy;
                        return acc;
                    },
                    { income: 0, expenses: 0, cashflow: 0, credit: 0, vacancy: 0 }
                );
                const vacancyRate = entry.stats.length > 0 ? totals.vacancy / entry.stats.length : 0;
                return {
                    propertyId: entry.propertyId,
                    propertyName: entry.propertyName,
                    income: totals.income,
                    expenses: totals.expenses,
                    cashflow: totals.cashflow,
                    credit: totals.credit,
                    vacancyRate,
                };
            });

            const categoryTotals: Record<string, number> = {};
            await Promise.all(
                propertyIds.map(async (id) => {
                    try {
                        const expenses = (await electronApi.listExpensesByProperty(id, year)) ?? [];
                        expenses.forEach((exp) => {
                            const key = exp.category || "Autres";
                            categoryTotals[key] = (categoryTotals[key] ?? 0) + (exp.amount ?? 0);
                        });
                    } catch (err) {
                        console.error("Failed to load expenses for property", id, err);
                    }
                })
            );
            const expenseSlices = Object.entries(categoryTotals)
                .map(([category, total]) => ({ category, total }))
                .sort((a, b) => b.total - a.total);

            setMonthlyAggregates(aggregates);
            setPerformances(propertyPerf.sort((a, b) => b.cashflow - a.cashflow));
            setExpenseBreakdown(expenseSlices);
        } catch (err) {
            console.error(err);
            setError("Impossible de charger le tableau de bord.");
        } finally {
            setLoading(false);
        }
    }, [activeProperties, electronApi, year]);

    useEffect(() => {
        setYear(initialYear);
    }, [initialYear]);

    useEffect(() => {
        void fetchData();
    }, [fetchData]);

    const kpis = useMemo(() => {
        const totalIncome = performances.reduce((sum, p) => sum + p.income, 0);
        const totalExpenses = performances.reduce((sum, p) => sum + p.expenses, 0);
        const netCashflow = performances.reduce((sum, p) => sum + p.cashflow, 0);
        const totalCredit = performances.reduce((sum, p) => sum + p.credit, 0);
        const avgCashflow = monthlyAggregates.length > 0 ? netCashflow / monthlyAggregates.length : 0;
        const avgOccupancy = monthlyAggregates.length > 0
            ? monthlyAggregates.reduce((sum, m) => sum + m.occupancy, 0) / monthlyAggregates.length
            : 0;
        return { totalIncome, totalExpenses, netCashflow, totalCredit, avgCashflow, occupancyRate: avgOccupancy };
    }, [monthlyAggregates, performances]);

    const alerts = useMemo(() => {
        const list: Array<{ type: "warning" | "info" | "danger"; message: string }> = [];
        performances.forEach((p) => {
            if (p.cashflow < 0) {
                list.push({ 
                    type: "danger", 
                    message: t("finances.portfolioAlertNegativeCashflow", { 
                        property: p.propertyName, 
                        amount: formatCurrency(p.cashflow) 
                    })
                });
            }
            if (p.vacancyRate > 0.2) {
                list.push({ 
                    type: "warning", 
                    message: t("finances.portfolioAlertHighVacancy", { 
                        property: p.propertyName, 
                        rate: formatPercentInteger(p.vacancyRate * 100) 
                    })
                });
            }
            if (p.expenses > 0 && p.cashflow < p.expenses * 0.1) {
                const marginPercent = Math.round((p.cashflow / p.expenses) * 100);
                list.push({ 
                    type: "info", 
                    message: t("finances.portfolioAlertLowMargin", { 
                        property: p.propertyName, 
                        percentage: formatPercentInteger(marginPercent) 
                    })
                });
            }
        });
        if (kpis.occupancyRate < 0.85) {
            list.push({ 
                type: "warning", 
                message: t("finances.portfolioAlertLowOccupancy", { 
                    rate: formatPercentInteger(kpis.occupancyRate * 100) 
                })
            });
        }
        if (kpis.netCashflow < 0) {
            list.push({ 
                type: "danger", 
                message: t("finances.portfolioAlertGlobalNegativeCashflow")
            });
        }
        return list;
    }, [kpis.netCashflow, kpis.occupancyRate, performances, t]);

    return {
        year,
        setYear,
        monthlyAggregates,
        performances,
        expenseBreakdown,
        kpis,
        alerts,
        loading,
        error,
        refresh: fetchData,
    };
}
