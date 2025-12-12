/* eslint-disable jsdoc/require-jsdoc, jsdoc/require-param, jsdoc/require-param-type, jsdoc/require-returns, jsdoc/require-returns-type, jsdoc/check-tag-names */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Department } from "../types";

type DepartmentSelectorProps = {
    region_id: number | null;
    department_id: number | null;
    onDepartmentChange: (departmentId: number | null) => void;
};

/**
 * Selector for departments tied to a region, with inline creation flow.
 */
export function DepartmentSelector({
    region_id,
    department_id,
    onDepartmentChange,
}: DepartmentSelectorProps) {
    const { t } = useTranslation();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [showAddDepartment, setShowAddDepartment] = useState(false);
    const [newDepartmentName, setNewDepartmentName] = useState("");
    const [loadingDepartments, setLoadingDepartments] = useState(false);

    const electron = window.electron;

    // Load departments when region changes
    useEffect(() => {
        if (!electron) {
            setDepartments([]);
            setShowAddDepartment(false);
            onDepartmentChange(null);
            return;
        }

        if (region_id) {
            const loadDepartments = async () => {
                setLoadingDepartments(true);
                try {
                    const data = await electron.listDepartments(region_id);
                    setDepartments(data);
                    const departmentBelongsToRegion = data.some(
                        (d: Department) => d.id === department_id
                    );
                    if (!departmentBelongsToRegion && department_id !== null) {
                        onDepartmentChange(null);
                    }
                } catch (error) {
                    console.error("Failed to load departments:", error);
                } finally {
                    setLoadingDepartments(false);
                }
            };
            void loadDepartments();
        } else {
            setDepartments([]);
            setShowAddDepartment(false);
            if (department_id !== null) {
                onDepartmentChange(null);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [region_id, electron, department_id]);

    // Guard: renderer opened outside Electron
    if (!electron) {
        return (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {t("common.electronUnavailable", "Electron bridge indisponible dans ce contexte.")}
            </div>
        );
    }

    const handleAddDepartment = async () => {
        if (!newDepartmentName.trim() || !region_id) return;
        try {
            const newDepartment = await electron.createDepartment(region_id, newDepartmentName);
            setDepartments([...departments, newDepartment]);
            onDepartmentChange(newDepartment.id);
            setShowAddDepartment(false);
            setNewDepartmentName("");
        } catch (error) {
            console.error("Failed to create department:", error);
        }
    };

    return (
        <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
                {t("propertyForm.department", "Département")}
            </label>
            {!region_id ? (
                <select
                    value=""
                    disabled
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500 bg-slate-100"
                >
                    <option value="">{t("propertyForm.selectRegionFirst", "Sélectionnez d'abord une région")}</option>
                </select>
            ) : showAddDepartment ? (
                <div className="space-y-2">
                    <input
                        type="text"
                        value={newDepartmentName}
                        onChange={(e) => setNewDepartmentName(e.target.value)}
                        placeholder={t("propertyForm.departmentName", "Nom du département")}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={handleAddDepartment}
                            className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"
                        >
                            {t("common.save")}
                        </button>
                        <button
                            onClick={() => setShowAddDepartment(false)}
                            className="flex-1 rounded-lg bg-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-400"
                        >
                            {t("common.cancel")}
                        </button>
                    </div>
                </div>
            ) : (
                <select
                    value={department_id ?? ""}
                    onChange={(e) => {
                        const val = e.target.value;
                        if (val === "add_new") {
                            setShowAddDepartment(true);
                        } else {
                            onDepartmentChange(val ? Number(val) : null);
                        }
                    }}
                    disabled={loadingDepartments}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white disabled:bg-slate-100 disabled:text-slate-500"
                >
                    <option value="">
                        {loadingDepartments
                            ? t("common.loading", "Chargement...")
                            : t("propertyForm.selectDepartment", "Sélectionner un département")}
                    </option>
                    {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                            {dept.name}
                        </option>
                    ))}
                    <option value="add_new">+ {t("propertyForm.addDepartment", "Ajouter un département")}</option>
                </select>
            )}
        </div>
    );
}
