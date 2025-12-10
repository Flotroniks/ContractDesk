import { useTranslation } from "react-i18next";
import type { Property, PropertyDraft } from "../types";
import { propertyTypes } from "../constants/propertyTypes";
import { LocationSelector } from "./LocationSelector";
import { DepartmentSelector } from "./DepartmentSelector";
import { CitySelector } from "./CitySelector";

type PropertyCardProps = {
    property: Property;
    isEditing: boolean;
    editDraft: PropertyDraft & { status: string };
    onEditStart: () => void;
    onEditCancel: () => void;
    onEditSave: () => void;
    onEditChange: (draft: PropertyDraft & { status: string }) => void;
    onToggleArchive: () => void;
};

export function PropertyCard({
    property,
    isEditing,
    editDraft,
    onEditStart,
    onEditCancel,
    onEditSave,
    onEditChange,
    onToggleArchive,
}: PropertyCardProps) {
    const { t } = useTranslation();

    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 shadow-inner space-y-3">
            <div className="flex items-start justify-between">
                <div>
                    <div className="text-sm text-slate-500">{t("propertyCard.label")}</div>
                    {isEditing ? (
                        <input
                            value={editDraft.name}
                            onChange={(e) => onEditChange({ ...editDraft, name: e.target.value })}
                            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                    ) : (
                        <div className="text-lg font-semibold text-slate-900">{property.name}</div>
                    )}
                </div>
                <div
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        property.status === "archived"
                            ? "bg-slate-200 text-slate-600"
                            : "bg-emerald-100 text-emerald-700"
                    }`}
                >
                    {property.status === "archived" ? t("propertyCard.archived") : t("propertyCard.active")}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 text-sm text-slate-600">
                <div>
                    <div className="text-xs text-slate-500">{t("propertyCard.address")}</div>
                    {isEditing ? (
                        <input
                            value={editDraft.address}
                            onChange={(e) => onEditChange({ ...editDraft, address: e.target.value })}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                    ) : (
                        <div>{property.address || "—"}</div>
                    )}
                </div>
                <div>
                    <div className="text-xs text-slate-500">{t("propertyForm.department")}</div>
                    {isEditing ? (
                        // Don't show a simple input, it will be handled by DepartmentSelector below
                        <div className="text-slate-500 italic">—</div>
                    ) : (
                        <div>—</div>
                    )}
                </div>
                <div>
                    <div className="text-xs text-slate-500">{t("propertyCard.type")}</div>
                    {isEditing ? (
                        <select
                            value={editDraft.type}
                            onChange={(e) => onEditChange({ ...editDraft, type: e.target.value })}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                        >
                            {propertyTypes.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {t(`propertyTypes.${option.value}`)}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <div>{property.type ? t(`propertyTypes.${property.type}`, { defaultValue: property.type }) : "—"}</div>
                    )}
                </div>
                <div>
                    <div className="text-xs text-slate-500">{t("propertyCard.surface")}</div>
                    {isEditing ? (
                        <input
                            value={editDraft.surface}
                            onChange={(e) => onEditChange({ ...editDraft, surface: e.target.value })}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                    ) : (
                        <div>{property.surface ?? "—"}</div>
                    )}
                </div>
                <div>
                    <div className="text-xs text-slate-500">{t("propertyCard.baseRent")}</div>
                    {isEditing ? (
                        <input
                            value={editDraft.baseRent}
                            onChange={(e) => onEditChange({ ...editDraft, baseRent: e.target.value })}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                    ) : (
                        <div>{property.base_rent ?? "—"}</div>
                    )}
                </div>
                <div>
                    <div className="text-xs text-slate-500">{t("propertyCard.baseCharges")}</div>
                    {isEditing ? (
                        <input
                            value={editDraft.baseCharges}
                            onChange={(e) => onEditChange({ ...editDraft, baseCharges: e.target.value })}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                    ) : (
                        <div>{property.base_charges ?? "—"}</div>
                    )}
                </div>
                <div>
                    <div className="text-xs text-slate-500">{t("propertyCard.status")}</div>
                    {isEditing ? (
                        <select
                            value={editDraft.status}
                            onChange={(e) => onEditChange({ ...editDraft, status: e.target.value })}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                        >
                            <option value="active">{t("propertyCard.active")}</option>
                            <option value="archived">{t("propertyCard.archived")}</option>
                        </select>
                    ) : (
                        <div>
                            {property.status === "archived"
                                ? t("propertyCard.archived")
                                : t("propertyCard.active")}
                        </div>
                    )}
                </div>

                {/* Location Selector - spans full width when editing */}
                {isEditing && (
                    <div className="md:col-span-2 xl:col-span-3">
                        <LocationSelector
                            country_id={editDraft.country_id}
                            region_id={editDraft.region_id}
                            onCountryChange={(countryId) =>
                                onEditChange({
                                    ...editDraft,
                                    country_id: countryId,
                                    region_id: null,
                                    department_id: null,
                                    city_id: null,
                                })
                            }
                            onRegionChange={(regionId) =>
                                onEditChange({ ...editDraft, region_id: regionId, department_id: null, city_id: null })
                            }
                            onDepartmentChange={(departmentId) =>
                                onEditChange({ ...editDraft, department_id: departmentId, city_id: null })
                            }
                            onCityChange={(cityId) => onEditChange({ ...editDraft, city_id: cityId })}
                        />
                    </div>
                )}

                {/* Department Selector - only visible when editing and region selected */}
                {isEditing && (
                    <div className="md:col-span-2 xl:col-span-3">
                        <DepartmentSelector
                            region_id={editDraft.region_id}
                            department_id={editDraft.department_id}
                            onDepartmentChange={(departmentId) =>
                                onEditChange({ ...editDraft, department_id: departmentId, city_id: null })
                            }
                        />
                    </div>
                )}

                {/* City Selector - below department when editing */}
                {isEditing && (
                    <div className="md:col-span-2 xl:col-span-3">
                        <CitySelector
                            country_id={editDraft.country_id}
                            region_id={editDraft.region_id}
                            department_id={editDraft.department_id}
                            city_id={editDraft.city_id}
                            onCityChange={(cityId) => onEditChange({ ...editDraft, city_id: cityId })}
                        />
                    </div>
                )}
            </div>

            <div className="flex flex-wrap gap-2 justify-end">
                {isEditing ? (
                    <>
                        <button
                            onClick={onEditSave}
                            className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                        >
                            {t("common.save")}
                        </button>
                        <button
                            onClick={onEditCancel}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            {t("common.cancel")}
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={onEditStart}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            {t("common.edit")}
                        </button>
                        <button
                            onClick={onToggleArchive}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            {property.status === "archived" ? t("common.unarchive") : t("common.archive")}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
