import { app, BrowserWindow } from "electron"
import { ipcMainHandle, isDev } from "./util.js";
import type { UserRow, PropertyRow, ExpenseRow, IncomeRow, CategoryRow } from "./db/database.js";
import { getPreloadPath, getUIPath, getIconPath } from "./pathResolver.js";
import { getStaticData, pollResources } from "./test.js";
import dotenv from "dotenv";
import ExcelJS from "exceljs";
import path from "path";
import {
    createUser,
    listUsers,
    updateUser,
    deleteUser,
    verifyUserPassword,
    listProperties,
    createProperty,
    updateProperty,
    listCountries,
    listRegions,
    listCities,
    createCountry,
    createRegion,
    createCity,
    listDepartments,
    createDepartment,
    createExpense,
    updateExpense,
    deleteExpense,
    listExpensesByProperty,
    createIncome,
    updateIncome,
    deleteIncome,
    listIncomesByProperty,
    listCategories,
    upsertCategory,
    listAmortizationsByProperty,
    listCashflowByProperty,
    listMonthlyStats,
    getPropertyAnnualSummary,
    listVacancyMonths,
    getYearRangeForProperty,
    listCreditsByProperty,
    getCreditByProperty,
    saveCredit,
    deleteCredit,
} from "./db/database.js";
import fs from "fs";

/**
 * Electron main process entrypoint: wires IPC handlers, creates the BrowserWindow,
 * and bridges database operations to the renderer via typed channels.
 */

dotenv.config();

type ExpenseUpdatePayload = {
    date?: string;
    category?: string;
    description?: string | null;
    amount?: number;
    is_recurring?: boolean;
    frequency?: string | null;
};

type IncomeUpdatePayload = {
    date?: string;
    lease_id?: number | null;
    amount?: number;
    is_recurring?: boolean;
    frequency?: string | null;
    payment_method?: string | null;
    notes?: string | null;
};

type CreditPayloadInput = {
    id?: number;
    user_id: number;
    property_id: number;
    credit_type?: string | null;
    principal?: number | null;
    down_payment?: number | null;
    annual_rate?: number | null;
    duration_months?: number | null;
    start_date?: string | null;
    insurance_monthly?: number | null;
    notes?: string | null;
    is_active?: number | boolean;
    refinance_from_id?: number | null;
};

const PORT = process.env.PORT;
if (!PORT) throw new Error("PORT env variable is not set");

app.on("ready", () => {
    const preloadPath = getPreloadPath();
    const preloadExists = fs.existsSync(preloadPath);

    if (!preloadExists) {
        console.error(`[main] Preload introuvable à ${preloadPath}`);
    }

    const mainWindow = new BrowserWindow({
        // Shouldn't add contextIsolate or nodeIntegration because of security vulnerabilities
        webPreferences: {
            preload: preloadPath,
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false
        }
        , icon: getIconPath()
    });

    if (isDev()) mainWindow.loadURL(`http://localhost:${PORT}`)
    else mainWindow.loadFile(getUIPath());

    pollResources(mainWindow);

    ipcMainHandle("getStaticData", () => {
        return getStaticData();
    })

    ipcMainHandle("listUsers", () => {
        const users: UserRow[] = listUsers();
        return users.map((user) => ({
            id: user.id,
            username: user.username,
            createdAt: user.created_at,
        }));
    });

    ipcMainHandle("createUser", (payload) => {
        const created = createUser(payload?.username ?? "", payload?.password ?? "1234");
        return {
            id: created.id,
            username: created.username,
            createdAt: created.created_at
        };
    });

    ipcMainHandle("updateUser", (payload) => {
        const updated = updateUser(payload?.id ?? -1, payload?.username ?? "");
        return {
            id: updated.id,
            username: updated.username,
            createdAt: updated.created_at
        };
    });

    ipcMainHandle("deleteUser", (payload) => {
        const userId = payload?.id ?? -1;
        const password = payload?.password ?? "";
        
        // Vérifier le mot de passe
        const users = listUsers();
        const user = users.find(u => u.id === userId);
        
        if (!user) throw new Error("user_not_found");
        
        const verified = verifyUserPassword(user.username, password);
        if (!verified) throw new Error("password_invalid");
        
        const result = deleteUser(userId);
        return result;
    });

    ipcMainHandle("listProperties", (payload) => {
        const props: PropertyRow[] = listProperties(payload?.userId ?? -1);
        return props.map((p) => ({
            id: p.id,
            user_id: p.user_id,
            name: p.name,
            address: p.address ?? null,
            city_id: p.city_id ?? null,
            region_id: p.region_id ?? null,
            country_id: p.country_id ?? null,
            department_id: p.department_id ?? null,
            type: p.type ?? null,
            surface: p.surface ?? null,
            base_rent: p.base_rent ?? null,
            base_charges: p.base_charges ?? null,
            purchase_price: p.purchase_price ?? null,
            status: p.status,
            created_at: p.created_at,
        }));
    });

    ipcMainHandle("createProperty", (payload) => {
        const propertyPayload: {
            userId: number;
            name: string;
            address?: string;
            city_id?: number | null;
            region_id?: number | null;
            country_id?: number | null;
            department_id?: number | null;
            type?: string;
            surface?: number | null;
            baseRent?: number | null;
            baseCharges?: number | null;
            purchase_price?: number | null;
        } = {
            userId: payload?.userId ?? -1,
            name: payload?.name ?? "",
        };

        if (typeof payload?.address === "string") propertyPayload.address = payload.address;
        if (payload?.city_id !== undefined) propertyPayload.city_id = payload.city_id;
        if (payload?.region_id !== undefined) propertyPayload.region_id = payload.region_id;
        if (payload?.country_id !== undefined) propertyPayload.country_id = payload.country_id;
        if (payload?.department_id !== undefined) propertyPayload.department_id = payload.department_id;
        if (typeof payload?.type === "string") propertyPayload.type = payload.type;
        if (payload?.surface !== undefined) propertyPayload.surface = payload.surface;
        if (payload?.baseRent !== undefined) propertyPayload.baseRent = payload.baseRent;
        if (payload?.baseCharges !== undefined) propertyPayload.baseCharges = payload.baseCharges;
        if (payload?.purchase_price !== undefined) propertyPayload.purchase_price = payload.purchase_price;

        const created = createProperty(propertyPayload);

        return {
            id: created.id,
            user_id: created.user_id,
            name: created.name,
            address: created.address ?? null,
            city_id: created.city_id ?? null,
            region_id: created.region_id ?? null,
            country_id: created.country_id ?? null,
            department_id: created.department_id ?? null,
            type: created.type ?? null,
            surface: created.surface ?? null,
            base_rent: created.base_rent ?? null,
            base_charges: created.base_charges ?? null,
            purchase_price: created.purchase_price ?? null,
            status: created.status,
            created_at: created.created_at,
        };
    });

    ipcMainHandle("updateProperty", (payload) => {
        const updatePayload: {
            id: number;
            userId: number;
            name?: string;
            address?: string;
            city_id?: number | null;
            region_id?: number | null;
            country_id?: number | null;
            department_id?: number | null;
            type?: string;
            surface?: number | null;
            baseRent?: number | null;
            baseCharges?: number | null;
            purchase_price?: number | null;
            status?: string;
        } = {
            id: payload?.id ?? -1,
            userId: payload?.userId ?? -1,
        };

        if (payload?.name !== undefined) updatePayload.name = payload.name;
        if (typeof payload?.address === "string") updatePayload.address = payload.address;
        if (payload?.city_id !== undefined) updatePayload.city_id = payload.city_id;
        if (payload?.region_id !== undefined) updatePayload.region_id = payload.region_id;
        if (payload?.country_id !== undefined) updatePayload.country_id = payload.country_id;
        if (payload?.department_id !== undefined) updatePayload.department_id = payload.department_id;
        if (typeof payload?.type === "string") updatePayload.type = payload.type;
        if (payload?.surface !== undefined) updatePayload.surface = payload.surface;
        if (payload?.baseRent !== undefined) updatePayload.baseRent = payload.baseRent;
        if (payload?.baseCharges !== undefined) updatePayload.baseCharges = payload.baseCharges;
        if (payload?.purchase_price !== undefined) updatePayload.purchase_price = payload.purchase_price;
        if (payload?.status !== undefined) updatePayload.status = payload.status;

        const updated = updateProperty(updatePayload);

        return {
            id: updated.id,
            user_id: updated.user_id,
            name: updated.name,
            address: updated.address ?? null,
            city_id: updated.city_id ?? null,
            region_id: updated.region_id ?? null,
            country_id: updated.country_id ?? null,
            department_id: updated.department_id ?? null,
            type: updated.type ?? null,
            surface: updated.surface ?? null,
            base_rent: updated.base_rent ?? null,
            base_charges: updated.base_charges ?? null,
            purchase_price: updated.purchase_price ?? null,
            status: updated.status,
            created_at: updated.created_at,
        };
    });

    ipcMainHandle("listCountries", () => {
        const countries = listCountries();
        return countries;
    });

    ipcMainHandle("listRegions", (payload) => {
        if (payload?.countryId == null) throw new Error("country_required");
        return listRegions(payload.countryId);
    });

    ipcMainHandle("listCities", (payload) => {
        const cities = listCities(payload?.regionId ?? -1, payload?.departmentId ?? null);
        return cities;
    });

    ipcMainHandle("createCountry", (payload) => {
        const created = createCountry(payload?.name ?? "", payload?.code ?? undefined);
        return created;
    });

    ipcMainHandle("createRegion", (payload) => {
        if (payload?.countryId == null) throw new Error("country_required");
        const created = createRegion(payload.countryId, payload?.name ?? "");
        return created;
    });

    ipcMainHandle("createCity", (payload) => {
        const created = createCity(
            payload?.regionId ?? -1,
            payload?.countryId ?? -1,
            payload?.departmentId ?? null,
            payload?.name ?? ""
        );
        return created;
    });

    ipcMainHandle("listDepartments", (payload) => {
        const departments = listDepartments(payload?.regionId ?? -1);
        return departments;
    });

    ipcMainHandle("createDepartment", (payload) => {
        const created = createDepartment(payload?.regionId ?? -1, payload?.name ?? "");
        return created;
    });

    // Finance: expenses
    ipcMainHandle<"listExpensesByProperty">("listExpensesByProperty", (payload) => {
        const list: ExpenseRow[] = listExpensesByProperty(payload?.propertyId ?? -1, payload?.year ?? undefined);
        return list;
    });

    ipcMainHandle<"createExpense">("createExpense", (payload) => {
        const created = createExpense({
            property_id: payload?.property_id ?? -1,
            date: payload?.date ?? "",
            category: payload?.category ?? "",
            description: payload?.description ?? null,
            amount: payload?.amount ?? 0,
            is_recurring: payload?.is_recurring ?? false,
            frequency: payload?.frequency ?? null,
        });
        return created;
    });

    ipcMainHandle<"updateExpense">("updateExpense", (payload) => {
        const updatePayload: ExpenseUpdatePayload = {};
        if (payload?.date !== undefined) updatePayload.date = payload.date;
        if (payload?.category !== undefined) updatePayload.category = payload.category;
        if (payload?.description !== undefined) updatePayload.description = payload.description ?? null;
        if (payload?.amount !== undefined) updatePayload.amount = payload.amount;
        if (payload?.is_recurring !== undefined) updatePayload.is_recurring = payload.is_recurring;
        if (payload?.frequency !== undefined) updatePayload.frequency = payload.frequency ?? null;

        const updated = updateExpense(payload?.id ?? -1, updatePayload);
        return updated;
    });

    ipcMainHandle<"deleteExpense">("deleteExpense", (payload) => {
        deleteExpense(payload?.id ?? -1);
        return { success: true };
    });

    // Finance: incomes
    ipcMainHandle<"listIncomesByProperty">("listIncomesByProperty", (payload) => {
        const list: IncomeRow[] = listIncomesByProperty(payload?.propertyId ?? -1, payload?.year ?? undefined);
        return list;
    });

    ipcMainHandle<"getYearRangeForProperty">("getYearRangeForProperty", (payload) => {
        const range = getYearRangeForProperty(payload?.propertyId ?? -1);
        return range;
    });

    ipcMainHandle<"createIncome">("createIncome", (payload) => {
        const created = createIncome({
            property_id: payload?.property_id ?? -1,
            lease_id: payload?.lease_id ?? null,
            date: payload?.date ?? "",
            amount: payload?.amount ?? 0,
            payment_method: payload?.payment_method ?? null,
            notes: payload?.notes ?? null,
        });
        return created;
    });

    ipcMainHandle<"updateIncome">("updateIncome", (payload) => {
        const updatePayload: IncomeUpdatePayload = {};
        if (payload?.lease_id !== undefined) updatePayload.lease_id = payload.lease_id ?? null;
        if (payload?.date !== undefined) updatePayload.date = payload.date;
        if (payload?.amount !== undefined) updatePayload.amount = payload.amount;
        if (payload?.payment_method !== undefined) updatePayload.payment_method = payload.payment_method ?? null;
        if (payload?.notes !== undefined) updatePayload.notes = payload.notes ?? null;

        const updated = updateIncome(payload?.id ?? -1, updatePayload);
        return updated;
    });

    ipcMainHandle<"deleteIncome">("deleteIncome", (payload) => {
        deleteIncome(payload?.id ?? -1);
        return { success: true };
    });

    // Finance: credits
    ipcMainHandle<"listCreditsByProperty">("listCreditsByProperty", (payload) => {
        return listCreditsByProperty(payload?.propertyId ?? -1);
    });
    ipcMainHandle<"getCreditByProperty">("getCreditByProperty", (payload) => {
        const credit = getCreditByProperty(payload?.propertyId ?? -1);
        return credit;
    });

    ipcMainHandle<"saveCredit">("saveCredit", (payload) => {
        const userId = payload?.user_id ?? -1;
        if (userId < 0) throw new Error("credit_user_required");

        const creditPayload: CreditPayloadInput = {
            user_id: userId,
            property_id: payload?.property_id ?? -1,
            credit_type: payload?.credit_type ?? null,
            principal: payload?.principal ?? null,
            down_payment: payload?.down_payment ?? null,
            annual_rate: payload?.annual_rate ?? null,
            start_date: payload?.start_date ?? null,
            duration_months: payload?.duration_months ?? null,
            insurance_monthly: payload?.insurance_monthly ?? null,
            notes: payload?.notes ?? null,
            is_active: payload?.is_active ?? 1,
            refinance_from_id: payload?.refinance_from_id ?? null,
        };

        if (payload?.id !== undefined) creditPayload.id = payload.id;

        const saved = saveCredit(creditPayload);
        return saved;
    });

    ipcMainHandle<"deleteCredit">("deleteCredit", (payload) => {
        return deleteCredit(payload?.id ?? -1);
    });

    // Finance: categories
    ipcMainHandle<"listCategories">("listCategories", (payload) => {
        const list: CategoryRow[] = listCategories(payload?.type ?? "expense");
        return list;
    });

    ipcMainHandle<"upsertCategory">("upsertCategory", (payload) => {
        const row = upsertCategory(payload?.type ?? "expense", payload?.name ?? "");
        return row;
    });

    // Finance: amortizations
    ipcMainHandle<"listAmortizationsByProperty">("listAmortizationsByProperty", (payload) => {
        return listAmortizationsByProperty(payload?.propertyId ?? -1);
    });

    // Finance: dashboards
    ipcMainHandle<"getMonthlyStats">("getMonthlyStats", (payload) => {
        return listMonthlyStats(payload?.propertyId ?? -1, payload?.year ?? new Date().getFullYear());
    });

    ipcMainHandle<"listCashflowByProperty">("listCashflowByProperty", (payload) => {
        return listCashflowByProperty(payload?.propertyId ?? -1, payload?.year ?? new Date().getFullYear());
    });

    ipcMainHandle<"getPropertyAnnualSummary">("getPropertyAnnualSummary", (payload) => {
        return getPropertyAnnualSummary(
            payload?.propertyId ?? -1,
            payload?.year ?? new Date().getFullYear(),
            payload?.purchase_price ?? null
        );
    });

    ipcMainHandle<"listVacancyMonths">("listVacancyMonths", (payload) => {
        return listVacancyMonths(payload?.propertyId ?? -1, payload?.year ?? new Date().getFullYear());
    });

    ipcMainHandle("exportFinanceExcel", async (payload) => {
        const propertyId = payload?.propertyId ?? -1;
        const year = payload?.year ?? new Date().getFullYear();
        const summary = getPropertyAnnualSummary(propertyId, year, payload?.purchase_price ?? null);
        const cashflow = listCashflowByProperty(propertyId, year);
        const vacancy = listVacancyMonths(propertyId, year);
        const filePath = await generateFinanceWorkbook({ propertyId, year, summary, cashflow, vacancy });
        return { path: filePath };
    });
})

async function generateFinanceWorkbook({
    propertyId,
    year,
    summary,
    cashflow,
    vacancy,
}: {
    propertyId: number;
    year: number;
    summary: ReturnType<typeof getPropertyAnnualSummary>;
    cashflow: ReturnType<typeof listCashflowByProperty>;
    vacancy: ReturnType<typeof listVacancyMonths>;
}) {
    const workbook = new ExcelJS.Workbook();
    const summarySheet = workbook.addWorksheet("Summary");

    summarySheet.addRow(["Property", propertyId]);
    summarySheet.addRow(["Year", year]);
    summarySheet.addRow([]);
    summarySheet.addRow(["Total income", summary.total_rents_received]);
    summarySheet.addRow(["Total expenses", summary.total_expenses]);
    summarySheet.addRow(["Annual credit", summary.annual_credit]);
    summarySheet.addRow(["Vacancy cost", summary.vacancy_cost]);
    summarySheet.addRow(["Gross yield", summary.gross_yield ?? "-"]);
    summarySheet.addRow(["Net yield", summary.net_yield ?? "-"]);
    summarySheet.addRow(["Vacancy rate", `${Math.round((vacancy.vacancyRate ?? 0) * 100)}%`]);

    summarySheet.columns?.forEach((col) => {
        const column = col as ExcelJS.Column;
        const lengths = ((column.values as unknown[]) ?? []).map((v) => `${v ?? ""}`.length);
        column.width = Math.max(14, ...lengths, 14);
    });

    const monthly = workbook.addWorksheet("Monthly");
    monthly.addRow(["Month", "Income", "Expenses", "Credit (incl. insurance)", "Cashflow"]);
    cashflow.forEach((row) => {
        monthly.addRow([row.month, row.income, row.expenses, row.credit, row.cashflow]);
    });
    monthly.columns?.forEach((col) => {
        const column = col as ExcelJS.Column;
        const lengths = ((column.values as unknown[]) ?? []).map((v) => `${v ?? ""}`.length);
        column.width = Math.max(10, ...lengths, 10);
    });

    const categories = workbook.addWorksheet("Categories");
    categories.addRow(["Category", "Total"]);
    (summary.expense_breakdown ?? []).forEach((item) => {
        categories.addRow([item.category, item.total]);
    });
    categories.columns?.forEach((col) => {
        const column = col as ExcelJS.Column;
        const lengths = ((column.values as unknown[]) ?? []).map((v) => `${v ?? ""}`.length);
        column.width = Math.max(12, ...lengths, 12);
    });

    const filePath = path.join(app.getPath("downloads"), `finances-${propertyId}-${year}.xlsx`);
    await workbook.xlsx.writeFile(filePath);
    return filePath;
}
