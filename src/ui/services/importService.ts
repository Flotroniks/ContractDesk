/* eslint-disable jsdoc/require-jsdoc */
import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { ElectronApi } from "../types";

export type ParsedMovement = {
    kind: "revenue" | "expense";
    date: Date;
    amount: number;
    category: string;
    description?: string;
};

type RawRow = {
    date?: string;
    amount?: string | number;
    category?: string;
    description?: string;
};

function normalizeRow(row: Record<string, unknown>): RawRow {
    const normalized: RawRow = {};
    for (const key of Object.keys(row)) {
        const lowerKey = key.toLowerCase().trim();
        if (lowerKey === "date") normalized.date = String(row[key] ?? "");
        else if (lowerKey === "amount" || lowerKey === "montant") normalized.amount = row[key] as string | number;
        else if (lowerKey === "category" || lowerKey === "categorie" || lowerKey === "catégorie")
            normalized.category = String(row[key] ?? "");
        else if (lowerKey === "description") normalized.description = String(row[key] ?? "");
    }
    return normalized;
}

function parseDate(value: string): Date | null {
    if (!value) return null;
    const trimmed = value.trim();
    // Handle YYYY-MM-DD
    const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (iso) {
        const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
        return isNaN(d.getTime()) ? null : d;
    }
    // Handle DD/MM/YYYY or DD-MM-YYYY
    const dmy = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(trimmed);
    if (dmy) {
        const d = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
        return isNaN(d.getTime()) ? null : d;
    }
    // Fallback
    const fallback = new Date(trimmed);
    return isNaN(fallback.getTime()) ? null : fallback;
}

function transformRow(raw: RawRow): ParsedMovement | null {
    if (!raw.date || raw.amount === undefined || !raw.category) return null;

    const parsedDate = parseDate(raw.date);
    if (!parsedDate) return null;

    const amountNum = typeof raw.amount === "number" ? raw.amount : parseFloat(String(raw.amount).replace(",", "."));
    if (isNaN(amountNum)) return null;

    const categoryLower = raw.category.toLowerCase().trim();
    const kind: "revenue" | "expense" = categoryLower === "loyer" ? "revenue" : "expense";

    const desc = raw.description?.trim();
    const result: ParsedMovement = {
        kind,
        date: parsedDate,
        amount: Math.abs(amountNum),
        category: raw.category.trim(),
    };
    if (desc) {
        result.description = desc;
    }
    return result;
}

async function parseCSV(file: File): Promise<RawRow[]> {
    return new Promise((resolve, reject) => {
        Papa.parse<Record<string, unknown>>(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                resolve(results.data.map(normalizeRow));
            },
            error: (err) => reject(err),
        });
    });
}

async function parseExcel(file: File): Promise<RawRow[]> {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) return [];
    const sheet = workbook.Sheets[firstSheetName];
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    return data.map(normalizeRow);
}

export async function parseImportFile(file: File): Promise<ParsedMovement[]> {
    const ext = file.name.split(".").pop()?.toLowerCase();
    let rawRows: RawRow[];

    if (ext === "csv") {
        rawRows = await parseCSV(file);
    } else if (ext === "xlsx" || ext === "xls") {
        rawRows = await parseExcel(file);
    } else {
        throw new Error("Format de fichier non supporté. Utilisez CSV ou Excel (.xlsx, .xls).");
    }

    const movements: ParsedMovement[] = [];
    for (const row of rawRows) {
        const parsed = transformRow(row);
        if (parsed) movements.push(parsed);
    }

    return movements;
}

export async function importMovementsForProperty(
    electronApi: ElectronApi,
    propertyId: number,
    movements: ParsedMovement[]
): Promise<{ revenues: number; expenses: number }> {
    let revenues = 0;
    let expenses = 0;

    for (const m of movements) {
        const dateStr = m.date.toISOString().slice(0, 10);
        if (m.kind === "revenue") {
            await electronApi.createIncome({
                property_id: propertyId,
                lease_id: null,
                date: dateStr,
                amount: m.amount,
                payment_method: null,
                notes: m.description ?? null,
            });
            revenues++;
        } else {
            await electronApi.createExpense({
                property_id: propertyId,
                date: dateStr,
                category: m.category,
                description: m.description ?? null,
                amount: m.amount,
                is_recurring: false,
                frequency: null,
            });
            expenses++;
        }
    }

    return { revenues, expenses };
}
