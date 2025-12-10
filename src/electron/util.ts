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

/**
 * IPC request payloads keyed by channel. Keep in sync with renderer bridge and main handlers.
 */
type EventPayloadArgs = {
    statistics: void;
    getStaticData: void;
    listUsers: void;
    createUser: { username: string; password?: string | undefined };
    updateUser: { id: number; username: string };
    deleteUser: { id: number; password: string };
    listProperties: { userId: number };
    createProperty: {
        userId: number;
        name: string;
        address?: string | null | undefined;
        city_id?: number | null | undefined;
        department_id?: number | null | undefined;
        region_id?: number | null | undefined;
        state?: string | undefined;
        country_id?: number | null | undefined;
        type?: string | undefined;
        surface?: number | null | undefined;
        baseRent?: number | null | undefined;
        baseCharges?: number | null | undefined;
        purchase_price?: number | null | undefined;
    };
    updateProperty: {
        id: number;
        userId: number;
        name?: string | undefined;
        address?: string | null | undefined;
        city_id?: number | null | undefined;
        department_id?: number | null | undefined;
        region_id?: number | null | undefined;
        state?: string | undefined;
        country_id?: number | null | undefined;
        type?: string | undefined;
        surface?: number | null | undefined;
        baseRent?: number | null | undefined;
        baseCharges?: number | null | undefined;
        purchase_price?: number | null | undefined;
        status?: string | undefined;
    };
    listCountries: void;
    listRegions: { countryId: number };
    listCities: { regionId?: number | undefined; departmentId?: number | null | undefined };
    listDepartments: { regionId?: number | undefined };
    createCountry: { name: string; code?: string | null | undefined };
    createRegion: { countryId: number; name: string };
    createCity: { regionId?: number | undefined; countryId?: number | undefined; departmentId?: number | null | undefined; name: string };
    createDepartment: { regionId?: number | undefined; name: string };
    listExpensesByProperty: { propertyId: number; year?: number | undefined };
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
        date?: string | undefined;
        category?: string | undefined;
        description?: string | null | undefined;
        amount?: number | undefined;
        is_recurring?: boolean | undefined;
        frequency?: string | null | undefined;
    };
    deleteExpense: { id: number };
    listIncomesByProperty: { propertyId: number; year?: number | undefined };
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
        lease_id?: number | null | undefined;
        date?: string | undefined;
        amount?: number | undefined;
        payment_method?: string | null | undefined;
        notes?: string | null | undefined;
    };
    deleteIncome: { id: number };
    listCreditsByProperty: { propertyId: number };
    getCreditByProperty: { propertyId: number };
    saveCredit: {
        id?: number;
        user_id: number;
        property_id: number;
        credit_type?: string | null;
        down_payment?: number | null | undefined;
        principal?: number | null | undefined;
        annual_rate?: number | null | undefined;
        duration_months?: number | null | undefined;
        start_date?: string | null | undefined;
        insurance_monthly?: number | null | undefined;
        notes?: string | null | undefined;
        is_active?: number | boolean | undefined;
        refinance_from_id?: number | null | undefined;
    };
    deleteCredit: { id: number };
    listCategories: { type: "expense" | "income" };
    upsertCategory: { type: "expense" | "income"; name: string };
    listAmortizationsByProperty: { propertyId: number };
    listCashflowByProperty: { propertyId: number; year?: number | undefined };
    getMonthlyStats: { propertyId: number; year?: number | undefined };
    getPropertyAnnualSummary: { propertyId: number; year?: number | undefined; purchase_price?: number | null | undefined };
    listVacancyMonths: { propertyId: number; year?: number | undefined };
    exportFinanceExcel: { propertyId: number; year?: number | undefined; purchase_price?: number | null | undefined };
};

/**
 * IPC response payloads keyed by channel. Mirrors EventPayloadArgs channels to shape replies.
 */
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
        address?: string | null;
        city_id?: number | null;
        department_id?: number | null;
        region_id?: number | null;
        state?: string | null;
        country_id?: number | null;
        type?: string | null;
        surface?: number | null;
        base_rent?: number | null;
        base_charges?: number | null;
        purchase_price?: number | null;
        status: string;
        created_at: string;
    }>;
    createProperty: {
        id: number;
        user_id: number;
        name: string;
        address?: string | null;
        city_id?: number | null;
        department_id?: number | null;
        region_id?: number | null;
        state?: string | null;
        country_id?: number | null;
        type?: string | null;
        surface?: number | null;
        base_rent?: number | null;
        base_charges?: number | null;
        purchase_price?: number | null;
        status: string;
        created_at: string;
    };
    updateProperty: {
        id: number;
        user_id: number;
        name: string;
        address?: string | null;
        city_id?: number | null;
        department_id?: number | null;
        region_id?: number | null;
        state?: string | null;
        country_id?: number | null;
        type?: string | null;
        surface?: number | null;
        base_rent?: number | null;
        base_charges?: number | null;
        purchase_price?: number | null;
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

/**
 * Check whether the app is running in development mode.
 * @returns {boolean} True when NODE_ENV is set to development.
 */
export function isDev(): boolean {
    return process.env.NODE_ENV == "development";
}

/**
 * Strongly typed wrapper for ipcMain.handle that validates the sender frame and binds payload/response types per channel.
 * @template {keyof EventPayloadMapping} Key
 * @param {Key} key IPC channel key from EventPayloadMapping.
 * @param {(payload: EventPayloadArgs[Key]) => EventPayloadMapping[Key] | Promise<EventPayloadMapping[Key]>} handler Business handler returning a response (sync or async).
 */
export function ipcMainHandle<Key extends keyof EventPayloadMapping>(
    key: Key,
    handler: (payload: EventPayloadArgs[Key]) => EventPayloadMapping[Key] | Promise<EventPayloadMapping[Key]>
) {
    ipcMain.handle(key as string, (event, payload: EventPayloadArgs[Key]) => {
        if (event.senderFrame) validateEventFrame(event.senderFrame);

        return handler(payload);
    });
}

/**
 * Send a typed IPC event from the main process to renderer webContents.
 * @template {keyof EventPayloadMapping} Key
 * @param {Key} key IPC channel key.
 * @param {WebContents} webContents Target renderer webContents.
 * @param {EventPayloadMapping[Key]} payload Data to send, shaped by EventPayloadMapping.
 */
export function ipcWebContentsSend<Key extends keyof EventPayloadMapping>(key: Key, webContents: WebContents, payload: EventPayloadMapping[Key]) {
    webContents.send(key as string, payload);
}

export type { EventPayloadArgs, EventPayloadMapping };

/**
 * Validate that an IPC event originates from the trusted renderer URL (dev server or packaged UI).
 * @param {WebFrameMain} frame Sender frame metadata.
 * @throws Error when the frame URL does not match the expected UI path, blocking malicious events.
 */
export function validateEventFrame(frame: WebFrameMain) {
    if (isDev() && new URL(frame.url).host === `localhost:${PORT}`) return;

    if (frame.url !== pathToFileURL(getUIPath()).toString()) throw new Error("Malicious event");
}
