/* eslint-disable jsdoc/require-jsdoc */
import { useState } from "react";
import type { Property } from "../types";

type SelectPropertyDialogProps = {
    properties: Property[];
    open: boolean;
    onClose: () => void;
    onConfirm: (propertyId: number) => void;
};

export function SelectPropertyDialog({ properties, open, onClose, onConfirm }: SelectPropertyDialogProps) {
    const [selectedId, setSelectedId] = useState<number | null>(properties[0]?.id ?? null);

    if (!open) return null;

    const handleNext = () => {
        if (selectedId !== null) {
            onConfirm(selectedId);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Choisissez un bien</h2>
                <p className="text-sm text-slate-600 mb-4">
                    Sélectionnez le bien auquel les données importées seront associées.
                </p>

                <div className="mb-6">
                    <label className="block text-xs font-semibold text-slate-600 mb-2">Bien</label>
                    <select
                        value={selectedId ?? ""}
                        onChange={(e) => setSelectedId(e.target.value ? Number(e.target.value) : null)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                        {properties.length === 0 && (
                            <option value="" disabled>
                                Aucun bien disponible
                            </option>
                        )}
                        {properties.map((property) => (
                            <option key={property.id} value={property.id}>
                                {property.name}
                                {property.address ? ` · ${property.address}` : ""}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={selectedId === null}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Suivant
                    </button>
                </div>
            </div>
        </div>
    );
}
