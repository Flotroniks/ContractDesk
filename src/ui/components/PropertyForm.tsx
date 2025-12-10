/* eslint-disable jsdoc/require-jsdoc, jsdoc/require-param, jsdoc/require-param-type, jsdoc/require-returns, jsdoc/require-returns-type, jsdoc/check-tag-names */
import { useTranslation } from "react-i18next";
import type { PropertyDraft } from "../types";
import { propertyTypes } from "../constants/propertyTypes";
import { LocationSelector } from "./LocationSelector";
import { DepartmentSelector } from "./DepartmentSelector";
import { CitySelector } from "./CitySelector";

type PropertyFormProps = {
    form: PropertyDraft;
    creating: boolean;
    onChange: (form: PropertyDraft) => void;
    onCreate: () => void;
};

/**
 * Form for creating a property, handling location selectors and basic price inputs.
 */
export function PropertyForm({ form, creating, onChange, onCreate }: PropertyFormProps) {
    const { t } = useTranslation();

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                    value={form.name}
                    onChange={(e) => onChange({ ...form, name: e.target.value })}
                    placeholder={t("propertyForm.name")}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <input
                    value={form.address}
                    onChange={(e) => onChange({ ...form, address: e.target.value })}
                    placeholder={t("propertyForm.address")}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <select
                    value={form.type}
                    onChange={(e) => onChange({ ...form, type: e.target.value })}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                >
                    {propertyTypes.map((option) => (
                        <option key={option.value} value={option.value}>
                            {t(`propertyTypes.${option.value}`)}
                        </option>
                    ))}
                </select>
                <input
                    value={form.surface}
                    onChange={(e) => onChange({ ...form, surface: e.target.value })}
                    placeholder={t("propertyForm.surface")}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <input
                    value={form.baseRent}
                    onChange={(e) => onChange({ ...form, baseRent: e.target.value })}
                    placeholder={t("propertyForm.baseRent")}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <input
                    value={form.baseCharges}
                    onChange={(e) => onChange({ ...form, baseCharges: e.target.value })}
                    placeholder={t("propertyForm.baseCharges")}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <input
                    value={form.purchasePrice ?? ""}
                    onChange={(e) => onChange({ ...form, purchasePrice: e.target.value })}
                    placeholder={t("propertyForm.purchasePrice", { defaultValue: "Prix d'achat" })}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
            </div>

            {/* Location Selector spanning full width */}
            <div className="md:col-span-2">
                <LocationSelector
                    country_id={form.country_id}
                    region_id={form.region_id}
                    onCountryChange={(countryId) =>
                        onChange({ ...form, country_id: countryId, region_id: null, department_id: null, city_id: null })
                    }
                    onRegionChange={(regionId) =>
                        onChange({ ...form, region_id: regionId, department_id: null, city_id: null })
                    }
                    onDepartmentChange={(departmentId) => onChange({ ...form, department_id: departmentId, city_id: null })}
                    onCityChange={(cityId) => onChange({ ...form, city_id: cityId })}
                />
            </div>

            {/* Department Selector - only visible when region is selected */}
            <div className="md:col-span-2">
                <DepartmentSelector
                    region_id={form.region_id}
                    department_id={form.department_id}
                    onDepartmentChange={(departmentId) => onChange({ ...form, department_id: departmentId, city_id: null })}
                />
            </div>

            {/* City Selector - below department */}
            <div className="md:col-span-2">
                <CitySelector
                    country_id={form.country_id}
                    region_id={form.region_id}
                    department_id={form.department_id}
                    city_id={form.city_id}
                    onCityChange={(cityId) => onChange({ ...form, city_id: cityId })}
                />
            </div>

            <div className="flex justify-end">
                <button
                    onClick={onCreate}
                    disabled={creating}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60"
                >
                    {creating ? t("propertyForm.creating") : t("propertyForm.create")}
                </button>
            </div>
        </div>
    );
}
