import { useEffect, useState } from "react";
/* eslint-disable jsdoc/require-jsdoc, jsdoc/require-param, jsdoc/require-param-type, jsdoc/require-returns, jsdoc/require-returns-type, jsdoc/check-tag-names */
import { useTranslation } from "react-i18next";
import type { Country, Region } from "../types";

type LocationSelectorProps = {
    country_id: number | null;
    region_id: number | null;
    onCountryChange: (countryId: number | null) => void;
    onRegionChange: (regionId: number | null) => void;
    onDepartmentChange?: (departmentId: number | null) => void;
    onCityChange?: (cityId: number | null) => void;
};

/**
 * Country/region picker with optional department and city cascading resets.
 */
export function LocationSelector({
    country_id,
    region_id,
    onCountryChange,
    onRegionChange,
    onDepartmentChange,
    onCityChange,
}: LocationSelectorProps) {
    const { t } = useTranslation();
    const [countries, setCountries] = useState<Country[]>([]);
    const [regions, setRegions] = useState<Region[]>([]);
    const [showAddCountry, setShowAddCountry] = useState(false);
    const [showAddRegion, setShowAddRegion] = useState(false);
    const [newCountryName, setNewCountryName] = useState("");
    const [newCountryCode, setNewCountryCode] = useState("");
    const [newRegionName, setNewRegionName] = useState("");
    const [loadingCountries, setLoadingCountries] = useState(false);
    const [loadingRegions, setLoadingRegions] = useState(false);

    const electron = window.electron;

    // Load countries on mount
    useEffect(() => {
        if (!electron) return;

        const loadCountries = async () => {
            setLoadingCountries(true);
            try {
                const data = await electron.listCountries();
                setCountries(data);
            } catch (error) {
                console.error("Failed to load countries:", error);
            } finally {
                setLoadingCountries(false);
            }
        };
        void loadCountries();
    }, [electron]);

    // Load regions when country changes
    useEffect(() => {
        if (!electron) {
            setCountries([]);
            setRegions([]);
            setShowAddRegion(false);
            onRegionChange(null);
            onDepartmentChange?.(null);
            onCityChange?.(null);
            return;
        }

        if (country_id) {
            const loadRegions = async () => {
                setLoadingRegions(true);
                try {
                    const data = await electron.listRegions(country_id);
                    setRegions(data);
                    const regionBelongsToCountry = data.some((r: Region) => r.id === region_id);
                    if (!regionBelongsToCountry && region_id !== null) {
                        onRegionChange(null);
                        onDepartmentChange?.(null);
                        onCityChange?.(null);
                    }
                } catch (error) {
                    console.error("Failed to load regions:", error);
                } finally {
                    setLoadingRegions(false);
                }
            };
            void loadRegions();
        } else {
            setRegions([]);
            setShowAddRegion(false);
            if (region_id !== null) {
                onRegionChange(null);
                onDepartmentChange?.(null);
                onCityChange?.(null);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [country_id, electron, region_id]);

    // Guard: renderer opened outside Electron
    if (!electron) {
        return (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {t("common.electronUnavailable", "Electron bridge indisponible dans ce contexte.")}
            </div>
        );
    }

    const handleAddCountry = async () => {
        if (!newCountryName.trim()) return;
        try {
            const newCountry = await electron.createCountry(newCountryName, newCountryCode || undefined);
            setCountries([...countries, newCountry]);
            onCountryChange(newCountry.id);
            setShowAddCountry(false);
            setNewCountryName("");
            setNewCountryCode("");
        } catch (error) {
            console.error("Failed to create country:", error);
        }
    };

    const handleAddRegion = async () => {
        if (!newRegionName.trim() || !country_id) return;
        try {
            const newRegion = await electron.createRegion(country_id, newRegionName);
            setRegions([...regions, newRegion]);
            onRegionChange(newRegion.id);
            setShowAddRegion(false);
            setNewRegionName("");
        } catch (error) {
            console.error("Failed to create region:", error);
        }
    };

    return (
        <div className="space-y-3">
            {/* Country Selector */}
            <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                    {t("propertyForm.country")}
                </label>
                {showAddCountry ? (
                    <div className="space-y-2">
                        <input
                            type="text"
                            value={newCountryName}
                            onChange={(e) => setNewCountryName(e.target.value)}
                            placeholder={t("propertyForm.countryName")}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                        <input
                            type="text"
                            value={newCountryCode}
                            onChange={(e) => setNewCountryCode(e.target.value.toUpperCase().slice(0, 2))}
                            placeholder={t("propertyForm.countryCode")}
                            maxLength={2}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleAddCountry}
                                className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"
                            >
                                {t("common.save")}
                            </button>
                            <button
                                onClick={() => setShowAddCountry(false)}
                                className="flex-1 rounded-lg bg-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-400"
                            >
                                {t("common.cancel")}
                            </button>
                        </div>
                    </div>
                ) : (
                    <select
                        value={country_id || ""}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val === "add_new") {
                                setShowAddCountry(true);
                            } else {
                                onCountryChange(val ? parseInt(val, 10) : null);
                            }
                        }}
                        disabled={loadingCountries}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white disabled:bg-slate-100 disabled:text-slate-500"
                    >
                        <option value="">{t("propertyForm.selectCountry")}</option>
                        {countries.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                        <option value="add_new">+ {t("common.add")}</option>
                    </select>
                )}
            </div>

            {/* Region Selector */}
            <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                    {t("propertyForm.region")}
                </label>
                {showAddRegion ? (
                    <div className="space-y-2">
                        <input
                            type="text"
                            value={newRegionName}
                            onChange={(e) => setNewRegionName(e.target.value)}
                            placeholder={t("propertyForm.regionName")}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleAddRegion}
                                className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"
                            >
                                {t("common.save")}
                            </button>
                            <button
                                onClick={() => setShowAddRegion(false)}
                                className="flex-1 rounded-lg bg-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-400"
                            >
                                {t("common.cancel")}
                            </button>
                        </div>
                    </div>
                ) : (
                    <select
                        value={region_id || ""}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val === "add_new") {
                                setShowAddRegion(true);
                            } else {
                                onRegionChange(val ? parseInt(val, 10) : null);
                            }
                        }}
                        disabled={!country_id || loadingRegions}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white disabled:bg-slate-100 disabled:text-slate-500"
                    >
                        <option value="">
                            {!country_id
                                ? t("propertyForm.selectCountryFirst", "Sélectionnez un pays")
                                : loadingRegions
                                    ? t("common.loading", "Chargement...")
                                    : t("propertyForm.selectRegion")}
                        </option>
                        {regions.map((r) => (
                            <option key={r.id} value={r.id}>
                                {r.name}
                            </option>
                        ))}
                        {country_id && <option value="add_new">+ {t("common.add")}</option>}
                    </select>
                )}
            </div>

        </div>
    );
}
