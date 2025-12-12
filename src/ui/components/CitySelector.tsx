/* eslint-disable jsdoc/require-jsdoc, jsdoc/require-param, jsdoc/require-param-type, jsdoc/require-returns, jsdoc/require-returns-type, jsdoc/check-tag-names */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { City } from "../types";

export type CitySelectorProps = {
    country_id: number | null;
    region_id: number | null;
    department_id: number | null;
    city_id: number | null;
    onCityChange: (cityId: number | null) => void;
};

/**
 * Cascading city selector that loads cities based on region/department and allows creation.
 */
export function CitySelector({
    country_id,
    region_id,
    department_id,
    city_id,
    onCityChange,
}: CitySelectorProps) {
    const { t } = useTranslation();
    const [cities, setCities] = useState<City[]>([]);
    const [showAddCity, setShowAddCity] = useState(false);
    const [newCityName, setNewCityName] = useState("");
    const [loadingCities, setLoadingCities] = useState(false);

    const electron = window.electron;

    // Load cities when region or department changes
    useEffect(() => {
        if (!electron) {
            setCities([]);
            setShowAddCity(false);
            onCityChange(null);
            return;
        }

        if (region_id) {
            const loadCities = async () => {
                setLoadingCities(true);
                try {
                    const data = await electron.listCities(region_id, department_id ?? undefined);
                    setCities(data);
                    const cityBelongs = data.some((c: City) => c.id === city_id);
                    if (!cityBelongs && city_id !== null) {
                        onCityChange(null);
                    }
                } catch (error) {
                    console.error("Failed to load cities:", error);
                } finally {
                    setLoadingCities(false);
                }
            };
            void loadCities();
        } else {
            setCities([]);
            setShowAddCity(false);
            if (city_id !== null) {
                onCityChange(null);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [region_id, department_id, electron, city_id]);

    // Guard: renderer opened outside Electron
    if (!electron) {
        return (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {t("common.electronUnavailable", "Electron bridge indisponible dans ce contexte.")}
            </div>
        );
    }

    const handleAddCity = async () => {
        if (!newCityName.trim() || !region_id || !country_id || !department_id) return;
        try {
            const newCity = await electron.createCity(region_id, country_id, department_id, newCityName);
            setCities([...cities, newCity]);
            onCityChange(newCity.id);
            setShowAddCity(false);
            setNewCityName("");
        } catch (error) {
            console.error("Failed to create city:", error);
        }
    };

    return (
        <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
                {t("propertyForm.city")}
            </label>
            {showAddCity ? (
                <div className="space-y-2">
                    <input
                        type="text"
                        value={newCityName}
                        onChange={(e) => setNewCityName(e.target.value)}
                        placeholder={t("propertyForm.cityName")}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={handleAddCity}
                            className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"
                        >
                            {t("common.save")}
                        </button>
                        <button
                            onClick={() => setShowAddCity(false)}
                            className="flex-1 rounded-lg bg-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-400"
                        >
                            {t("common.cancel")}
                        </button>
                    </div>
                </div>
            ) : (
                <select
                    value={city_id || ""}
                    onChange={(e) => {
                        const val = e.target.value;
                        if (val === "add_new") {
                            setShowAddCity(true);
                        } else {
                            onCityChange(val ? parseInt(val, 10) : null);
                        }
                    }}
                    disabled={!region_id || !department_id || loadingCities}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white disabled:bg-slate-100 disabled:text-slate-500"
                >
                    <option value="">
                        {!region_id
                            ? t("propertyForm.selectRegionFirst", "Sélectionnez une région")
                            : !department_id
                                ? t("propertyForm.selectDepartmentFirst", "Sélectionnez un département")
                                : loadingCities
                                    ? t("common.loading", "Chargement...")
                                    : t("propertyForm.selectCity")}
                    </option>
                    {cities.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                    {region_id && department_id && <option value="add_new">+ {t("common.add")}</option>}
                </select>
            )}
        </div>
    );
}
