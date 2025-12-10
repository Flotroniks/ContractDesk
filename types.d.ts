type Statistics = {
    cpuUsage: number;
    ramUsage: number;
    storageData: number;
}

type UserProfile = {
    id: number;
    username: string;
    createdAt: string;
}

type PropertyLegacy = {
        id: number;
        userId: number;
        name: string;
        address: string | null;
        city: string | null;
        department: string | null;
        region: string | null;
        type: string | null;
        surface: number | null;
        baseRent: number | null;
        baseCharges: number | null;
        status: string;
        createdAt: string;
}

export interface Property {
    id: number;
    user_id: number;
    name: string;
    address?: string | null;
    city_id?: number | null;
    region_id?: number | null;
    country_id?: number | null;
    department_id?: number | null;
    type?: string | null;
    surface?: number | null;
    base_rent?: number | null;
    base_charges?: number | null;
    status: string;
    purchase_price?: number | null;
}

    export interface Credit {
        id: number;
        user_id: number;
        property_id: number;
        credit_type: string | null;
        down_payment: number | null;
        principal: number | null;
        annual_rate: number | null;
        duration_months: number | null;
        start_date: string | null;
        monthly_payment: number | null;
        insurance_monthly: number | null;
        notes: string | null;
        is_active: number;
        created_at: string;
    }

export interface Country {
    id: number;
    name: string;
    code?: string;
    created_at: string;
}

export interface Region {
    id: number;
    country_id: number;
    name: string;
    created_at: string;
}

export interface City {
    id: number;
    region_id: number;
    country_id: number;
    department_id: number | null;
    name: string;
    created_at: string;
}

export interface Department {
    id: number;
    region_id: number;
    name: string;
    created_at: string;
}

export interface PropertySummary {
    id: number;
    name: string;
    address?: string;
    city_id?: number;
    region_id?: number;
    country_id?: number;
    department_id?: number;
    type?: string;
    surface?: number;
    activeLeaseCount: number;
    theoreticalMonthlyRent: number;
    currentMonthPlanned: number;
    currentMonthPaid: number;
    paymentStatus: 'ok' | 'partial' | 'late';
}

export type PaymentStatusFilter = 'ok' | 'partial' | 'late';

export interface PropertySummaryFilters {
    city_id?: number;
    region_id?: number;
    country_id?: number;
    department_id?: number;
    paymentStatus?: PaymentStatusFilter;
}

type EventPayloadArgs = {
    statistics: void;
    getStaticData: void;
    listUsers: void;
    createUser: { username: string; password?: string | undefined };
    updateUser: { id: number; username: string };
    deleteUser: { id: number; password: string };
    listProperties: { userId: number };
    listCountries: void;
    listRegions: { countryId: number };
    listCities: { regionId?: number; departmentId?: number };
    listDepartments: { regionId?: number };
    createCountry: { name: string; code?: string | null };
    createRegion: { countryId?: number; name: string };
    createCity: { regionId?: number; countryId?: number; departmentId?: number | null; name: string };
    createDepartment: { regionId?: number; name: string };
    createProperty: {
        userId: number;
        name: string;
        address?: string | null | undefined;
        city_id?: number | null | undefined;
        region_id?: number | null | undefined;
        country_id?: number | null | undefined;
        department_id?: number | null | undefined;
        state?: string | undefined;
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
        region_id?: number | null | undefined;
        country_id?: number | null | undefined;
        department_id?: number | null | undefined;
        state?: string | undefined;
        type?: string | undefined;
        surface?: number | null | undefined;
        baseRent?: number | null | undefined;
        baseCharges?: number | null | undefined;
        purchase_price?: number | null | undefined;
        status?: string | undefined;
    };
    listCreditsByProperty: { propertyId: number };
    getCreditByProperty: { propertyId: number };
    saveCredit: {
        id?: number | undefined;
        user_id: number;
        property_id: number;
        credit_type?: string | null | undefined;
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
}

type StaticData = {
    totalStorage: number;
    cpuModel: string;
    totalMemoryGB: number;
}

type UnsubscribeFunction = () => void;

type EventPayloadMapping = {
    statistics: Statistics;
    getStaticData: StaticData;
    listUsers: UserProfile[];
    createUser: UserProfile;
    updateUser: UserProfile;
    deleteUser: { propertiesDeleted: number };
    listProperties: Property[];
    createProperty: Property;
    updateProperty: Property;
    listCountries: Country[];
    listRegions: Region[];
    listCities: City[];
    listDepartments: Department[];
    createCountry: Country;
    createRegion: Region;
    createCity: City;
    createDepartment: Department;
    listCreditsByProperty: Credit[];
    getCreditByProperty: Credit | null;
    saveCredit: Credit;
    deleteCredit: { success: boolean };
    getMonthlyStats?: Array<{ month: number; income: number; expense: number; credit: number; cashflow: number; vacancy: number }>;
}

interface Window {
    electron: {
        subscribeStatistics: (callback: (statistics: Statistics) => void) => UnsubscribeFunction;
        getStaticData: () => Promise<StaticData>;
        listUsers: () => Promise<UserProfile[]>;
        createUser: (username: string, password?: string) => Promise<UserProfile>;
        updateUser: (id: number, username: string) => Promise<UserProfile>;
        deleteUser: (id: number, password: string) => Promise<{ propertiesDeleted: number }>;
        listProperties: (userId: number) => Promise<Property[]>;
        createProperty: (data: EventPayloadArgs['createProperty']) => Promise<Property>;
        updateProperty: (data: EventPayloadArgs['updateProperty']) => Promise<Property>;
        listCountries: () => Promise<Country[]>;
        listRegions: (countryId: number) => Promise<Region[]>;
        listCities: (regionId?: number, departmentId?: number) => Promise<City[]>;
        listDepartments: (regionId?: number) => Promise<Department[]>;
        createCountry: (name: string, code?: string | null) => Promise<Country>;
        createRegion: (countryId: number, name: string) => Promise<Region>;
        createCity: (regionId: number, countryId: number, departmentId: number | null, name: string) => Promise<City>;
        createDepartment: (regionId: number, name: string) => Promise<Department>;
        listCreditsByProperty: (propertyId: number) => Promise<Credit[]>;
        getCreditByProperty: (propertyId: number) => Promise<Credit | null>;
        saveCredit: (payload: Partial<Credit> & { property_id: number; refinance_from_id?: number | null }) => Promise<Credit>;
        deleteCredit: (id: number) => Promise<{ success: boolean }>;
        exportFinanceExcel?: (propertyId: number, year?: number, purchase_price?: number | null) => Promise<{ path: string }>;
        getMonthlyStats?: (propertyId: number, year?: number) => Promise<Array<{ month: number; income: number; expense: number; credit: number; cashflow: number; vacancy: number }>>;
    }
}
