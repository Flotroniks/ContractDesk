import { ipcMain, WebContents, WebFrameMain } from "electron";
import { getUIPath } from "./pathResolver.js";
import { pathToFileURL } from "url";
import dotenv from "dotenv";
import type {
    CountryRow,
    RegionRow,
    CityRow,
    DepartmentRow,
    ExpenseRow,
    IncomeRow,
    CategoryRow,
    AmortizationRow,
    CreditRow,
} from "./db/database.js";

dotenv.config();
const PORT = process.env.PORT;
if (!PORT) throw new Error("PORT env variable is not set");

type EventPayloadArgs = {
    statistics: void;
    getStaticData: void;
    listUsers: void;
    createUser: { username: string; password?: string };
    updateUser: { id: number; username: string };
    deleteUser: { id: number; password: string };
    listProperties: { userId: number };
    createProperty: {
        userId: number;
        name: string;
        address?: string;
        city_id?: number | null;
        department_id?: number | null;
        region_id?: number | null;
        state?: string;
        country_id?: number | null;
        type?: string;
        surface?: number | null;
        baseRent?: number | null;
        baseCharges?: number | null;
        purchase_price?: number | null;
    };
    updateProperty: {
        id: number;
        userId: number;
        name?: string;
        address?: string;
        city_id?: number | null;
        department_id?: number | null;
        region_id?: number | null;
        state?: string;
        country_id?: number | null;
        type?: string;
        surface?: number | null;
        baseRent?: number | null;
        baseCharges?: number | null;
        purchase_price?: number | null;
        status?: string;
    };
    listCountries: void;
    listRegions: { countryId: number };
    listCities: { regionId?: number; departmentId?: number };
    listDepartments: { regionId?: number };
    createCountry: { name: string; code?: string | null };
    createRegion: { countryId: number; name: string };
    createCity: { regionId?: number; countryId?: number; departmentId?: number | null; name: string };
    createDepartment: { regionId?: number; name: string };
    listExpensesByProperty: { propertyId: number; year?: number };
    createExpense: {
        property_id: number;
        date: string;
        category: string;
        description?: string | null;
        amount: number;
        is_recurring?: boolean;
        frequency?: string | null;
    };
    updateExpense: {
        id: number;
        date?: string;
        category?: string;
        description?: string | null;
        amount?: number;
        is_recurring?: boolean;
        frequency?: string | null;
    };
    deleteExpense: { id: number };
    listIncomesByProperty: { propertyId: number; year?: number };
    createIncome: {
        property_id: number;
        lease_id?: number | null;
        date: string;
        amount: number;
        payment_method?: string | null;
        notes?: string | null;
    };
    updateIncome: {
        id: number;
        lease_id?: number | null;
        date?: string;
        amount?: number;
        payment_method?: string | null;
        notes?: string | null;
    };
    deleteIncome: { id: number };
    listCreditsByProperty: { propertyId: number };
    getCreditByProperty: { propertyId: number };
    saveCredit: {
        id?: number;
        user_id: number;
        property_id: number;
        credit_type?: string | null;
        down_payment?: number | null;
        principal?: number | null;
        annual_rate?: number | null;
        duration_months?: number | null;
        start_date?: string | null;
        insurance_monthly?: number | null;
        notes?: string | null;
        is_active?: number | boolean;
        refinance_from_id?: number | null;
    };
    deleteCredit: { id: number };
    listCategories: { type: "expense" | "income" };
    upsertCategory: { type: "expense" | "income"; name: string };
    listAmortizationsByProperty: { propertyId: number };
    listCashflowByProperty: { propertyId: number; year?: number };
    getMonthlyStats: { propertyId: number; year?: number };
    getPropertyAnnualSummary: { propertyId: number; year?: number; purchase_price?: number | null };
    listVacancyMonths: { propertyId: number; year?: number };
    exportFinanceExcel: { propertyId: number; year?: number; purchase_price?: number | null };
};

type EventPayloadMapping = {
    statistics: { cpuUsage: number; ramUsage: number; storageData: number };
    getStaticData: { totalStorage: number; cpuModel: string; totalMemoryGB: number };
    listUsers: Array<{ id: number; username: string; createdAt: string }>;
    createUser: { id: number; username: string; createdAt: string };
    updateUser: { id: number; username: string; createdAt: string };
    deleteUser: { propertiesDeleted: number };
    listProperties: Array<{
        id: number;
        user_id: number;
        name: string;
        address?: string;
        city_id?: number | null;
        department_id?: number | null;
        region_id?: number | null;
        state?: string;
        country_id?: number | null;
        type?: string;
        surface?: number;
        base_rent?: number;
        base_charges?: number;
        purchase_price?: number;
        status: string;
        created_at: string;
    }>;
    createProperty: {
        id: number;
        user_id: number;
        name: string;
        address?: string;
        city_id?: number | null;
        department_id?: number | null;
        region_id?: number | null;
        state?: string;
        country_id?: number | null;
        type?: string;
        surface?: number;
        base_rent?: number;
        base_charges?: number;
        purchase_price?: number;
        status: string;
        created_at: string;
    };
    updateProperty: {
        id: number;
        user_id: number;
        name: string;
        address?: string;
        city_id?: number | null;
        department_id?: number | null;
        region_id?: number | null;
        state?: string;
        country_id?: number | null;
        type?: string;
        surface?: number;
        base_rent?: number;
        base_charges?: number;
        purchase_price?: number;
        status: string;
        created_at: string;
    };
    listCountries: CountryRow[];
    listRegions: RegionRow[];
    listCities: CityRow[];
    listDepartments: DepartmentRow[];
    createCountry: CountryRow;
    createRegion: RegionRow;
    createCity: CityRow;
    createDepartment: DepartmentRow;
    listExpensesByProperty: ExpenseRow[];
    createExpense: ExpenseRow;
    updateExpense: ExpenseRow;
    deleteExpense: { success: boolean };
    listIncomesByProperty: IncomeRow[];
    createIncome: IncomeRow;
    updateIncome: IncomeRow;
    deleteIncome: { success: boolean };
    listCreditsByProperty: CreditRow[];
    getCreditByProperty: CreditRow | null;
    saveCredit: CreditRow;
    deleteCredit: { success: boolean };
    listCategories: CategoryRow[];
    upsertCategory: CategoryRow;
    listAmortizationsByProperty: AmortizationRow[];
    listCashflowByProperty: Array<{ month: number; income: number; expenses: number; credit: number; cashflow: number }>;
    getMonthlyStats: Array<{ month: number; income: number; expense: number; credit: number; cashflow: number; vacancy: number }>;
    getPropertyAnnualSummary: {
        total_rents_received: number;
        total_expenses: number;
        expense_breakdown: Array<{ category: string; total: number }>;
        gross_yield: number | null;
        net_yield: number | null;
        annual_credit: number;
        vacancy_cost: number;
    };
    listVacancyMonths: { vacantMonths: number[]; vacancyRate: number };
    exportFinanceExcel: { path: string };
};

// Checks if you are in development mode
export function isDev(): boolean {
    return process.env.NODE_ENV == "development";
}

// Making IPC Typesafe
export function ipcMainHandle<Key extends keyof EventPayloadMapping>(
    key: Key,
    handler: (payload: EventPayloadArgs[Key]) => EventPayloadMapping[Key] | Promise<EventPayloadMapping[Key]>
) {
    ipcMain.handle(key as string, (event, payload: EventPayloadArgs[Key]) => {
        if (event.senderFrame) validateEventFrame(event.senderFrame);

        return handler(payload);
    });
}

export function ipcWebContentsSend<Key extends keyof EventPayloadMapping>(key: Key, webContents: WebContents, payload: EventPayloadMapping[Key]) {
    webContents.send(key as string, payload);
}

export type { EventPayloadArgs, EventPayloadMapping };

export function validateEventFrame(frame: WebFrameMain) {
    if (isDev() && new URL(frame.url).host === `localhost:${PORT}`) return;

    if (frame.url !== pathToFileURL(getUIPath()).toString()) throw new Error("Malicious event");
}
