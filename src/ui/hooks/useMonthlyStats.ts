import { useCallback, useEffect, useState } from "react";
import type { ElectronApi, MonthlyStat, PropertyMonthlyStats } from "../types";

export async function getMonthlyStatsForProperties(
    electronApi: ElectronApi,
    propertyIds: number[],
    year: number,
    propertyNameMap: Map<number, string>
): Promise<PropertyMonthlyStats[]> {
    const results: PropertyMonthlyStats[] = [];
    for (const id of propertyIds) {
        try {
            const stats = (await electronApi.getMonthlyStats?.(id, year)) ?? [];
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
    const [year, setYear] = useState<number>(initialYear);
    const [statsByProperty, setStatsByProperty] = useState<PropertyMonthlyStats[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
            setError("Impossible de charger les statistiques mensuelles.");
        } finally {
            setLoading(false);
        }
    }, [electronApi, propertyIds, propertyNameMap, year]);

    useEffect(() => {
        setYear(initialYear);
    }, [initialYear]);

    useEffect(() => {
        void fetchData();
    }, [fetchData]);

    return { year, setYear, statsByProperty, loading, error, refresh: fetchData };
}
