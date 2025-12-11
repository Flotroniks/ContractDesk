/* eslint-disable jsdoc/require-jsdoc, jsdoc/require-param, jsdoc/require-param-type, jsdoc/require-returns, jsdoc/require-returns-type, jsdoc/check-tag-names */
import { useCallback, useEffect, useState } from "react";
import type { AnnualSummary, CashflowRow, ElectronApi, YearFilter } from "../types";

export function useFinancialDashboard(electronApi: ElectronApi | null, propertyId: number | null, initialYear: YearFilter) {
    const [year, setYear] = useState<YearFilter>(initialYear);
    const [summary, setSummary] = useState<AnnualSummary | null>(null);
    const [cashflow, setCashflow] = useState<CashflowRow[]>([]);
    const [vacancy, setVacancy] = useState<{ vacantMonths: number[]; vacancyRate: number }>({ vacantMonths: [], vacancyRate: 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Load summary, cashflow, and vacancy metrics for the selected property/year.
     */
    const fetchData = useCallback(async () => {
        if (!electronApi || !propertyId) return;
        setLoading(true);
        setError(null);
        try {
            if (electronApi.getPropertyAnnualSummary) {
                const res = await electronApi.getPropertyAnnualSummary(propertyId, year);
                setSummary(res);
            }
            if (electronApi.listCashflowByProperty) {
                const rows = await electronApi.listCashflowByProperty(propertyId, year);
                setCashflow(rows ?? []);
            }
            if (electronApi.listVacancyMonths) {
                const v = await electronApi.listVacancyMonths(propertyId, year);
                setVacancy(v ?? { vacantMonths: [], vacancyRate: 0 });
            }
        } catch (err) {
            console.error(err);
            setError("Impossible de charger les donnees financieres.");
        } finally {
            setLoading(false);
        }
    }, [electronApi, propertyId, year]);

    useEffect(() => {
        setYear(initialYear);
    }, [initialYear]);

    useEffect(() => {
        void fetchData();
    }, [fetchData]);

    return { year, setYear, summary, cashflow, vacancy, loading, error, refresh: fetchData };
}
