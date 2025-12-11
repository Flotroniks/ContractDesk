/* eslint-disable jsdoc/require-jsdoc */
import { useRef, useState } from "react";
import type { ElectronApi } from "../types";
import { parseImportFile, importMovementsForProperty, type ParsedMovement } from "../services/importService";

type ImportMovementsDialogProps = {
    electronApi: ElectronApi;
    propertyId: number;
    propertyName: string;
    open: boolean;
    onClose: () => void;
    onImportComplete: () => void;
};

export function ImportMovementsDialog({
    electronApi,
    propertyId,
    propertyName,
    open,
    onClose,
    onImportComplete,
}: ImportMovementsDialogProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [movements, setMovements] = useState<ParsedMovement[]>([]);
    const [fileName, setFileName] = useState<string | null>(null);
    const [parsing, setParsing] = useState(false);
    const [parseError, setParseError] = useState<string | null>(null);
    const [importing, setImporting] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);

    if (!open) return null;

    const revenueCount = movements.filter((m) => m.kind === "revenue").length;
    const expenseCount = movements.filter((m) => m.kind === "expense").length;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setParsing(true);
        setParseError(null);
        setMovements([]);

        try {
            const parsed = await parseImportFile(file);
            setMovements(parsed);
            if (parsed.length === 0) {
                setParseError("Aucune ligne valide trouvée dans le fichier.");
            }
        } catch (err) {
            console.error(err);
            setParseError(err instanceof Error ? err.message : "Erreur lors de l'analyse du fichier.");
        } finally {
            setParsing(false);
        }
    };

    const handleImport = async () => {
        if (movements.length === 0) return;

        setImporting(true);
        setImportError(null);

        try {
            await importMovementsForProperty(electronApi, propertyId, movements);
            onImportComplete();
            onClose();
        } catch (err) {
            console.error(err);
            setImportError(err instanceof Error ? err.message : "Erreur lors de l'import.");
        } finally {
            setImporting(false);
        }
    };

    const handleClose = () => {
        setMovements([]);
        setFileName(null);
        setParseError(null);
        setImportError(null);
        onClose();
    };

    const formatDate = (d: Date) => d.toLocaleDateString("fr-FR");

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-xl flex flex-col">
                <div className="p-6 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-900">Importer des mouvements</h2>
                    <p className="text-sm text-slate-600 mt-1">
                        Bien sélectionné : <span className="font-medium text-slate-800">{propertyName}</span>
                    </p>
                </div>

                <div className="p-6 flex-1 overflow-auto space-y-4">
                    {/* File input */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">Fichier CSV ou Excel</label>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                Choisir un fichier
                            </button>
                            <span className="text-sm text-slate-500">{fileName ?? "Aucun fichier sélectionné"}</span>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>

                    {parsing && <p className="text-sm text-slate-500">Analyse du fichier en cours...</p>}

                    {parseError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {parseError}
                        </div>
                    )}

                    {/* Preview */}
                    {movements.length > 0 && (
                        <>
                            <div className="flex items-center gap-4 text-sm">
                                <span className="text-slate-600">
                                    <strong>{movements.length}</strong> ligne(s) détectée(s)
                                </span>
                                <span className="text-emerald-600">
                                    <strong>{revenueCount}</strong> revenu(s)
                                </span>
                                <span className="text-amber-600">
                                    <strong>{expenseCount}</strong> dépense(s)
                                </span>
                            </div>

                            <div className="overflow-auto rounded-lg border border-slate-200 max-h-80">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-slate-100 text-slate-600 sticky top-0">
                                        <tr>
                                            <th className="px-3 py-2 text-left">Type</th>
                                            <th className="px-3 py-2 text-left">Date</th>
                                            <th className="px-3 py-2 text-left">Montant</th>
                                            <th className="px-3 py-2 text-left">Catégorie</th>
                                            <th className="px-3 py-2 text-left">Description</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {movements.map((m, idx) => (
                                            <tr key={idx} className="border-t border-slate-100">
                                                <td className="px-3 py-2">
                                                    <span
                                                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                                                            m.kind === "revenue"
                                                                ? "bg-emerald-100 text-emerald-700"
                                                                : "bg-amber-100 text-amber-700"
                                                        }`}
                                                    >
                                                        {m.kind === "revenue" ? "Revenu" : "Dépense"}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2">{formatDate(m.date)}</td>
                                                <td className="px-3 py-2">{m.amount.toFixed(2)} €</td>
                                                <td className="px-3 py-2">{m.category}</td>
                                                <td className="px-3 py-2 text-slate-500">{m.description ?? "-"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {importError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {importError}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
                    <button
                        onClick={handleClose}
                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        disabled={importing}
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={movements.length === 0 || importing}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {importing ? "Import en cours..." : "Importer"}
                    </button>
                </div>
            </div>
        </div>
    );
}
