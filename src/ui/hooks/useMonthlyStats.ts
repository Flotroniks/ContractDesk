/* eslint-disable jsdoc/require-jsdoc, jsdoc/require-param, jsdoc/require-param-type, jsdoc/require-returns, jsdoc/require-returns-type, jsdoc/check-tag-names */
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ElectronApi, PropertyMonthlyStats } from "../types";

export async function getMonthlyStatsForProperties(
    electronApi: ElectronApi,
    propertyIds: number[],
    year: number,
    propertyNameMap: Map<number, string>
): Promise<PropertyMonthlyStats[]> {
    const results: PropertyMonthlyStats[] = [];
    for (const id of propertyIds) {
        try {
            const stats = (await electronApi.getMonthlyStats(id, year)) ?? [];
            results.push({ propertyId: id, propertyName: propertyNameMap.get(id) ?? `Bien ${id}`, stats });
        } catch (err) {
            console.error("Failed to load stats for property", id, err);
        }
    }
    return results;
}

export function useMonthlyStats(
    electronApi: ElectronApi,
    propertyIds: number[],
    propertyNameMap: Map<number, string>,
    initialYear: number
) {
    const { t } = useTranslation();
    const [year, setYear] = useState<number>(initialYear);
    const [statsByProperty, setStatsByProperty] = useState<PropertyMonthlyStats[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Load monthly stats for all selected properties in the given year.
     */
    const fetchData = useCallback(async () => {
        if (!electronApi || propertyIds.length === 0) {
            setStatsByProperty([]);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await getMonthlyStatsForProperties(electronApi, propertyIds, year, propertyNameMap);
            setStatsByProperty(res);
        } catch (err) {
            console.error(err);
            setError(t("errors.monthlyStatsLoad"));
        } finally {
            setLoading(false);
        }
    }, [electronApi, propertyIds, propertyNameMap, t, year]);

    useEffect(() => {
        setYear(initialYear);
    }, [initialYear]);

    useEffect(() => {
        void fetchData();
    }, [fetchData]);

    return { year, setYear, statsByProperty, loading, error, refresh: fetchData };
}
