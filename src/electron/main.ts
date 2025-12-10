import { app, BrowserWindow } from "electron"
import { ipcMainHandle, isDev, type EventPayloadArgs, type EventPayloadMapping } from "./util.js";
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
    listCreditsByProperty,
    getCreditByProperty,
    saveCredit,
    deleteCredit,
    type UserRow,
    type PropertyRow,
    type CountryRow,
    type RegionRow,
    type CityRow,
    type DepartmentRow,
    type ExpenseRow,
    type IncomeRow,
    type CategoryRow,
} from "./db/database.js";
import fs from "fs";

dotenv.config();

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
            address: p.address ?? undefined,
            city_id: p.city_id ?? undefined,
            region_id: p.region_id ?? undefined,
            country_id: p.country_id ?? undefined,
            department_id: p.department_id ?? undefined,
            type: p.type ?? undefined,
            surface: p.surface ?? undefined,
            base_rent: p.base_rent ?? undefined,
            base_charges: p.base_charges ?? undefined,
            purchase_price: p.purchase_price ?? undefined,
            status: p.status,
            created_at: p.created_at,
        }));
    });

    ipcMainHandle("createProperty", (payload) => {
        const created = createProperty({
            userId: payload?.userId ?? -1,
            name: payload?.name ?? "",
            address: payload?.address,
            city_id: payload?.city_id,
            region_id: payload?.region_id,
            country_id: payload?.country_id,
            department_id: payload?.department_id,
            type: payload?.type,
            surface: payload?.surface,
            baseRent: payload?.baseRent,
            baseCharges: payload?.baseCharges,
            purchase_price: payload?.purchase_price,
        });

        return {
            id: created.id,
            user_id: created.user_id,
            name: created.name,
            address: created.address ?? undefined,
            city_id: created.city_id ?? undefined,
            region_id: created.region_id ?? undefined,
            country_id: created.country_id ?? undefined,
            department_id: created.department_id ?? undefined,
            type: created.type ?? undefined,
            surface: created.surface ?? undefined,
            base_rent: created.base_rent ?? undefined,
            base_charges: created.base_charges ?? undefined,
            purchase_price: created.purchase_price ?? undefined,
            status: created.status,
            created_at: created.created_at,
        };
    });

    ipcMainHandle("updateProperty", (payload) => {
        const updated = updateProperty({
            id: payload?.id ?? -1,
            userId: payload?.userId ?? -1,
            name: payload?.name,
            address: payload?.address,
            city_id: payload?.city_id,
            region_id: payload?.region_id,
            country_id: payload?.country_id,
            department_id: payload?.department_id,
            type: payload?.type,
            surface: payload?.surface,
            baseRent: payload?.baseRent,
            baseCharges: payload?.baseCharges,
            purchase_price: payload?.purchase_price,
            status: payload?.status,
        });

        return {
            id: updated.id,
            user_id: updated.user_id,
            name: updated.name,
            address: updated.address ?? undefined,
            city_id: updated.city_id ?? undefined,
            region_id: updated.region_id ?? undefined,
            country_id: updated.country_id ?? undefined,
            department_id: updated.department_id ?? undefined,
            type: updated.type ?? undefined,
            surface: updated.surface ?? undefined,
            base_rent: updated.base_rent ?? undefined,
            base_charges: updated.base_charges ?? undefined,
            purchase_price: updated.purchase_price ?? undefined,
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
        const updated = updateExpense(payload?.id ?? -1, {
            date: payload?.date,
            category: payload?.category,
            description: payload?.description,
            amount: payload?.amount,
            is_recurring: payload?.is_recurring,
            frequency: payload?.frequency,
        });
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
        const updated = updateIncome(payload?.id ?? -1, {
            lease_id: payload?.lease_id,
            date: payload?.date,
            amount: payload?.amount,
            payment_method: payload?.payment_method,
            notes: payload?.notes,
        });
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
        const saved = saveCredit({
            id: payload?.id,
            user_id: userId,
            property_id: payload?.property_id ?? -1,
            credit_type: payload?.credit_type ?? null,
            down_payment: payload?.down_payment ?? null,
            principal: payload?.principal ?? null,
            annual_rate: payload?.annual_rate ?? null,
            duration_months: payload?.duration_months ?? null,
            start_date: payload?.start_date ?? null,
            insurance_monthly: payload?.insurance_monthly ?? null,
            notes: payload?.notes ?? null,
            is_active: payload?.is_active ?? 1,
            refinance_from_id: payload?.refinance_from_id ?? null,
        });
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
