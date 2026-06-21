export interface CountryConfig {
	code: string;
	name: string;
	addressFields: AddressFieldConfig[];
	consumptionTaxPrefix: string;
	consumptionTaxPattern: RegExp;
	consumptionTaxExample: string;
	postalCodePattern?: RegExp;
	postalCodeLabel?: string;
	stateLabel?: string;
	hasStates?: boolean;
	/** True when tax rates/rules vary by state or province (e.g. US sales tax, CA GST/HST/PST). */
	hasRegionalTax?: boolean;
}

export interface AddressFieldConfig {
	field: AddressFieldKey;
	label: string;
	required: boolean;
	placeholder?: string;
	/** When present, renders a <select> instead of <input>. */
	options?: ReadonlyArray<{ value: string; label: string }>;
}

export type AddressFieldKey =
	| "line1"
	| "line2"
	| "city"
	| "state"
	| "postalCode"
	| "country";

// ---------------------------------------------------------------------------
// State / province / region option lists
// ---------------------------------------------------------------------------

const US_STATES = [
	{ value: "AL", label: "Alabama" },
	{ value: "AK", label: "Alaska" },
	{ value: "AZ", label: "Arizona" },
	{ value: "AR", label: "Arkansas" },
	{ value: "CA", label: "California" },
	{ value: "CO", label: "Colorado" },
	{ value: "CT", label: "Connecticut" },
	{ value: "DE", label: "Delaware" },
	{ value: "DC", label: "District of Columbia" },
	{ value: "FL", label: "Florida" },
	{ value: "GA", label: "Georgia" },
	{ value: "HI", label: "Hawaii" },
	{ value: "ID", label: "Idaho" },
	{ value: "IL", label: "Illinois" },
	{ value: "IN", label: "Indiana" },
	{ value: "IA", label: "Iowa" },
	{ value: "KS", label: "Kansas" },
	{ value: "KY", label: "Kentucky" },
	{ value: "LA", label: "Louisiana" },
	{ value: "ME", label: "Maine" },
	{ value: "MD", label: "Maryland" },
	{ value: "MA", label: "Massachusetts" },
	{ value: "MI", label: "Michigan" },
	{ value: "MN", label: "Minnesota" },
	{ value: "MS", label: "Mississippi" },
	{ value: "MO", label: "Missouri" },
	{ value: "MT", label: "Montana" },
	{ value: "NE", label: "Nebraska" },
	{ value: "NV", label: "Nevada" },
	{ value: "NH", label: "New Hampshire" },
	{ value: "NJ", label: "New Jersey" },
	{ value: "NM", label: "New Mexico" },
	{ value: "NY", label: "New York" },
	{ value: "NC", label: "North Carolina" },
	{ value: "ND", label: "North Dakota" },
	{ value: "OH", label: "Ohio" },
	{ value: "OK", label: "Oklahoma" },
	{ value: "OR", label: "Oregon" },
	{ value: "PA", label: "Pennsylvania" },
	{ value: "RI", label: "Rhode Island" },
	{ value: "SC", label: "South Carolina" },
	{ value: "SD", label: "South Dakota" },
	{ value: "TN", label: "Tennessee" },
	{ value: "TX", label: "Texas" },
	{ value: "UT", label: "Utah" },
	{ value: "VT", label: "Vermont" },
	{ value: "VA", label: "Virginia" },
	{ value: "WA", label: "Washington" },
	{ value: "WV", label: "West Virginia" },
	{ value: "WI", label: "Wisconsin" },
	{ value: "WY", label: "Wyoming" },
] as const;

const CA_PROVINCES = [
	{ value: "AB", label: "Alberta" },
	{ value: "BC", label: "British Columbia" },
	{ value: "MB", label: "Manitoba" },
	{ value: "NB", label: "New Brunswick" },
	{ value: "NL", label: "Newfoundland and Labrador" },
	{ value: "NS", label: "Nova Scotia" },
	{ value: "NT", label: "Northwest Territories" },
	{ value: "NU", label: "Nunavut" },
	{ value: "ON", label: "Ontario" },
	{ value: "PE", label: "Prince Edward Island" },
	{ value: "QC", label: "Quebec" },
	{ value: "SK", label: "Saskatchewan" },
	{ value: "YT", label: "Yukon" },
] as const;

const AU_STATES = [
	{ value: "ACT", label: "Australian Capital Territory" },
	{ value: "NSW", label: "New South Wales" },
	{ value: "NT", label: "Northern Territory" },
	{ value: "QLD", label: "Queensland" },
	{ value: "SA", label: "South Australia" },
	{ value: "TAS", label: "Tasmania" },
	{ value: "VIC", label: "Victoria" },
	{ value: "WA", label: "Western Australia" },
] as const;

const JP_PREFECTURES = [
	{ value: "Aichi", label: "Aichi" },
	{ value: "Akita", label: "Akita" },
	{ value: "Aomori", label: "Aomori" },
	{ value: "Chiba", label: "Chiba" },
	{ value: "Ehime", label: "Ehime" },
	{ value: "Fukui", label: "Fukui" },
	{ value: "Fukuoka", label: "Fukuoka" },
	{ value: "Fukushima", label: "Fukushima" },
	{ value: "Gifu", label: "Gifu" },
	{ value: "Gunma", label: "Gunma" },
	{ value: "Hiroshima", label: "Hiroshima" },
	{ value: "Hokkaido", label: "Hokkaido" },
	{ value: "Hyogo", label: "Hyogo" },
	{ value: "Ibaraki", label: "Ibaraki" },
	{ value: "Ishikawa", label: "Ishikawa" },
	{ value: "Iwate", label: "Iwate" },
	{ value: "Kagawa", label: "Kagawa" },
	{ value: "Kagoshima", label: "Kagoshima" },
	{ value: "Kanagawa", label: "Kanagawa" },
	{ value: "Kochi", label: "Kochi" },
	{ value: "Kumamoto", label: "Kumamoto" },
	{ value: "Kyoto", label: "Kyoto" },
	{ value: "Mie", label: "Mie" },
	{ value: "Miyagi", label: "Miyagi" },
	{ value: "Miyazaki", label: "Miyazaki" },
	{ value: "Nagano", label: "Nagano" },
	{ value: "Nagasaki", label: "Nagasaki" },
	{ value: "Nara", label: "Nara" },
	{ value: "Niigata", label: "Niigata" },
	{ value: "Oita", label: "Oita" },
	{ value: "Okayama", label: "Okayama" },
	{ value: "Okinawa", label: "Okinawa" },
	{ value: "Osaka", label: "Osaka" },
	{ value: "Saga", label: "Saga" },
	{ value: "Saitama", label: "Saitama" },
	{ value: "Shiga", label: "Shiga" },
	{ value: "Shimane", label: "Shimane" },
	{ value: "Shizuoka", label: "Shizuoka" },
	{ value: "Tochigi", label: "Tochigi" },
	{ value: "Tokushima", label: "Tokushima" },
	{ value: "Tokyo", label: "Tokyo" },
	{ value: "Tottori", label: "Tottori" },
	{ value: "Toyama", label: "Toyama" },
	{ value: "Wakayama", label: "Wakayama" },
	{ value: "Yamagata", label: "Yamagata" },
	{ value: "Yamaguchi", label: "Yamaguchi" },
	{ value: "Yamanashi", label: "Yamanashi" },
] as const;

const ES_PROVINCES = [
	{ value: "VI", label: "Álava" },
	{ value: "AB", label: "Albacete" },
	{ value: "A", label: "Alicante" },
	{ value: "AL", label: "Almería" },
	{ value: "O", label: "Asturias" },
	{ value: "AV", label: "Ávila" },
	{ value: "BA", label: "Badajoz" },
	{ value: "PM", label: "Baleares" },
	{ value: "B", label: "Barcelona" },
	{ value: "BI", label: "Bizkaia" },
	{ value: "BU", label: "Burgos" },
	{ value: "CC", label: "Cáceres" },
	{ value: "CA", label: "Cádiz" },
	{ value: "S", label: "Cantabria" },
	{ value: "CS", label: "Castellón" },
	{ value: "CE", label: "Ceuta" },
	{ value: "CR", label: "Ciudad Real" },
	{ value: "CO", label: "Córdoba" },
	{ value: "C", label: "A Coruña" },
	{ value: "CU", label: "Cuenca" },
	{ value: "GI", label: "Girona" },
	{ value: "GR", label: "Granada" },
	{ value: "GU", label: "Guadalajara" },
	{ value: "SS", label: "Gipuzkoa" },
	{ value: "H", label: "Huelva" },
	{ value: "HU", label: "Huesca" },
	{ value: "J", label: "Jaén" },
	{ value: "LE", label: "León" },
	{ value: "L", label: "Lleida" },
	{ value: "LO", label: "La Rioja" },
	{ value: "LU", label: "Lugo" },
	{ value: "M", label: "Madrid" },
	{ value: "MA", label: "Málaga" },
	{ value: "ML", label: "Melilla" },
	{ value: "MU", label: "Murcia" },
	{ value: "NA", label: "Navarra" },
	{ value: "OR", label: "Ourense" },
	{ value: "P", label: "Palencia" },
	{ value: "GC", label: "Las Palmas" },
	{ value: "PO", label: "Pontevedra" },
	{ value: "SA", label: "Salamanca" },
	{ value: "TF", label: "Santa Cruz de Tenerife" },
	{ value: "SG", label: "Segovia" },
	{ value: "SE", label: "Sevilla" },
	{ value: "SO", label: "Soria" },
	{ value: "T", label: "Tarragona" },
	{ value: "TE", label: "Teruel" },
	{ value: "TO", label: "Toledo" },
	{ value: "V", label: "Valencia" },
	{ value: "VA", label: "Valladolid" },
	{ value: "ZA", label: "Zamora" },
	{ value: "Z", label: "Zaragoza" },
] as const;

const IT_REGIONS = [
	{ value: "ABR", label: "Abruzzo" },
	{ value: "BAS", label: "Basilicata" },
	{ value: "CAL", label: "Calabria" },
	{ value: "CAM", label: "Campania" },
	{ value: "EMR", label: "Emilia-Romagna" },
	{ value: "FVG", label: "Friuli-Venezia Giulia" },
	{ value: "LAZ", label: "Lazio" },
	{ value: "LIG", label: "Liguria" },
	{ value: "LOM", label: "Lombardy" },
	{ value: "MAR", label: "Marche" },
	{ value: "MOL", label: "Molise" },
	{ value: "PMN", label: "Piedmont" },
	{ value: "PUG", label: "Apulia" },
	{ value: "SAR", label: "Sardinia" },
	{ value: "SIC", label: "Sicily" },
	{ value: "TAA", label: "Trentino-South Tyrol" },
	{ value: "TOS", label: "Tuscany" },
	{ value: "UMB", label: "Umbria" },
	{ value: "VDA", label: "Aosta Valley" },
	{ value: "VEN", label: "Veneto" },
] as const;

const GB_NATIONS = [
	{ value: "ENG", label: "England" },
	{ value: "NIR", label: "Northern Ireland" },
	{ value: "SCT", label: "Scotland" },
	{ value: "WLS", label: "Wales" },
] as const;

// ---------------------------------------------------------------------------
// Country configs
// ---------------------------------------------------------------------------

export const COUNTRIES: Record<string, CountryConfig> = {
	AT: {
		code: "AT",
		name: "Austria",
		consumptionTaxPrefix: "ATU",
		consumptionTaxPattern: /^ATU\d{8}$/,
		consumptionTaxExample: "ATU12345678",
		postalCodePattern: /^\d{4}$/,
		addressFields: [
			{ field: "line1", label: "Street and number", required: true },
			{ field: "line2", label: "Additional address", required: false },
			{
				field: "postalCode",
				label: "Postal code",
				required: true,
				placeholder: "1010",
			},
			{ field: "city", label: "City", required: true },
		],
	},
	BE: {
		code: "BE",
		name: "Belgium",
		consumptionTaxPrefix: "BE",
		consumptionTaxPattern: /^BE0\d{9}$/,
		consumptionTaxExample: "BE0123456789",
		postalCodePattern: /^\d{4}$/,
		addressFields: [
			{ field: "line1", label: "Street and number", required: true },
			{ field: "line2", label: "Additional address", required: false },
			{
				field: "postalCode",
				label: "Postal code",
				required: true,
				placeholder: "1000",
			},
			{ field: "city", label: "City/Municipality", required: true },
		],
	},
	CH: {
		code: "CH",
		name: "Switzerland",
		consumptionTaxPrefix: "CHE",
		consumptionTaxPattern: /^CHE-\d{3}\.\d{3}\.\d{3}(MWST|TVA|IVA)?$/,
		consumptionTaxExample: "CHE-123.456.789MWST",
		postalCodePattern: /^\d{4}$/,
		addressFields: [
			{ field: "line1", label: "Street and number", required: true },
			{ field: "line2", label: "Additional address", required: false },
			{
				field: "postalCode",
				label: "Postal code (PLZ)",
				required: true,
				placeholder: "8001",
			},
			{ field: "city", label: "City", required: true },
		],
	},
	DE: {
		code: "DE",
		name: "Germany",
		consumptionTaxPrefix: "DE",
		consumptionTaxPattern: /^DE\d{9}$/,
		consumptionTaxExample: "DE123456789",
		postalCodePattern: /^\d{5}$/,
		addressFields: [
			{ field: "line1", label: "Street and house number", required: true },
			{ field: "line2", label: "Additional address", required: false },
			{
				field: "postalCode",
				label: "Postal code (PLZ)",
				required: true,
				placeholder: "10115",
			},
			{ field: "city", label: "City", required: true },
		],
	},
	ES: {
		code: "ES",
		name: "Spain",
		consumptionTaxPrefix: "ES",
		consumptionTaxPattern: /^ES[A-Z0-9]\d{7}[A-Z0-9]$/,
		consumptionTaxExample: "ESA12345678",
		postalCodePattern: /^\d{5}$/,
		hasStates: true,
		stateLabel: "Province",
		addressFields: [
			{ field: "line1", label: "Street and number", required: true },
			{ field: "line2", label: "Additional address", required: false },
			{
				field: "postalCode",
				label: "Postal code",
				required: true,
				placeholder: "28001",
			},
			{ field: "city", label: "City", required: true },
			{
				field: "state",
				label: "Province",
				required: false,
				options: ES_PROVINCES,
			},
		],
	},
	FR: {
		code: "FR",
		name: "France",
		consumptionTaxPrefix: "FR",
		consumptionTaxPattern: /^FR[A-Z0-9]{2}\d{9}$/,
		consumptionTaxExample: "FRXX123456789",
		postalCodePattern: /^\d{5}$/,
		addressFields: [
			{ field: "line1", label: "Number and street name", required: true },
			{ field: "line2", label: "Apartment, suite, etc.", required: false },
			{
				field: "postalCode",
				label: "Postal code",
				required: true,
				placeholder: "75001",
			},
			{ field: "city", label: "City", required: true },
		],
	},
	GB: {
		code: "GB",
		name: "United Kingdom",
		consumptionTaxPrefix: "GB",
		consumptionTaxPattern: /^GB(\d{9}|\d{12}|(GD|HA)\d{3})$/,
		consumptionTaxExample: "GB123456789",
		postalCodePattern: /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i,
		postalCodeLabel: "Postcode",
		hasStates: true,
		stateLabel: "Country",
		addressFields: [
			{ field: "line1", label: "Address line 1", required: true },
			{ field: "line2", label: "Address line 2", required: false },
			{ field: "city", label: "Town/City", required: true },
			{
				field: "state",
				label: "Country",
				required: false,
				options: GB_NATIONS,
			},
			{
				field: "postalCode",
				label: "Postcode",
				required: true,
				placeholder: "SW1A 1AA",
			},
		],
	},
	IT: {
		code: "IT",
		name: "Italy",
		consumptionTaxPrefix: "IT",
		consumptionTaxPattern: /^IT\d{11}$/,
		consumptionTaxExample: "IT12345678901",
		postalCodePattern: /^\d{5}$/,
		hasStates: true,
		stateLabel: "Region",
		addressFields: [
			{ field: "line1", label: "Street and number", required: true },
			{ field: "line2", label: "Additional address", required: false },
			{
				field: "postalCode",
				label: "Postal code (CAP)",
				required: true,
				placeholder: "00100",
			},
			{ field: "city", label: "City", required: true },
			{ field: "state", label: "Region", required: true, options: IT_REGIONS },
		],
	},
	NL: {
		code: "NL",
		name: "Netherlands",
		consumptionTaxPrefix: "NL",
		consumptionTaxPattern: /^NL\d{9}B\d{2}$/,
		consumptionTaxExample: "NL123456789B01",
		postalCodePattern: /^\d{4}\s?[A-Z]{2}$/i,
		addressFields: [
			{ field: "line1", label: "Street and house number", required: true },
			{ field: "line2", label: "Additional address", required: false },
			{
				field: "postalCode",
				label: "Postal code",
				required: true,
				placeholder: "1234 AB",
			},
			{ field: "city", label: "City", required: true },
		],
	},
	PL: {
		code: "PL",
		name: "Poland",
		consumptionTaxPrefix: "PL",
		consumptionTaxPattern: /^PL\d{10}$/,
		consumptionTaxExample: "PL1234567890",
		postalCodePattern: /^\d{2}-\d{3}$/,
		addressFields: [
			{ field: "line1", label: "Street and number", required: true },
			{ field: "line2", label: "Additional address", required: false },
			{
				field: "postalCode",
				label: "Postal code",
				required: true,
				placeholder: "00-001",
			},
			{ field: "city", label: "City", required: true },
		],
	},
	US: {
		code: "US",
		name: "United States",
		consumptionTaxPrefix: "",
		consumptionTaxPattern: /^\d{2}-\d{7}$/,
		consumptionTaxExample: "12-3456789",
		postalCodePattern: /^\d{5}(-\d{4})?$/,
		postalCodeLabel: "ZIP code",
		hasStates: true,
		stateLabel: "State",
		hasRegionalTax: true,
		addressFields: [
			{ field: "line1", label: "Address line 1", required: true },
			{
				field: "line2",
				label: "Address line 2 (Apt, suite, etc.)",
				required: false,
			},
			{ field: "city", label: "City", required: true },
			{ field: "state", label: "State", required: true, options: US_STATES },
			{
				field: "postalCode",
				label: "ZIP code",
				required: true,
				placeholder: "10001",
			},
		],
	},
	CA: {
		code: "CA",
		name: "Canada",
		consumptionTaxPrefix: "",
		consumptionTaxPattern: /^\d{9}RT\d{4}$/,
		consumptionTaxExample: "123456789RT0001",
		postalCodePattern: /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i,
		postalCodeLabel: "Postal code",
		hasStates: true,
		stateLabel: "Province/Territory",
		hasRegionalTax: true,
		addressFields: [
			{ field: "line1", label: "Address line 1", required: true },
			{ field: "line2", label: "Address line 2", required: false },
			{ field: "city", label: "City", required: true },
			{
				field: "state",
				label: "Province/Territory",
				required: true,
				options: CA_PROVINCES,
			},
			{
				field: "postalCode",
				label: "Postal code",
				required: true,
				placeholder: "K1A 0B1",
			},
		],
	},
	AU: {
		code: "AU",
		name: "Australia",
		consumptionTaxPrefix: "",
		consumptionTaxPattern: /^\d{11}$/,
		consumptionTaxExample: "12345678901",
		postalCodePattern: /^\d{4}$/,
		postalCodeLabel: "Postcode",
		hasStates: true,
		stateLabel: "State/Territory",
		addressFields: [
			{ field: "line1", label: "Street address", required: true },
			{ field: "line2", label: "Suburb/Apartment", required: false },
			{ field: "city", label: "City", required: true },
			{
				field: "state",
				label: "State/Territory",
				required: true,
				options: AU_STATES,
			},
			{
				field: "postalCode",
				label: "Postcode",
				required: true,
				placeholder: "2000",
			},
		],
	},
	JP: {
		code: "JP",
		name: "Japan",
		consumptionTaxPrefix: "T",
		consumptionTaxPattern: /^T\d{13}$/,
		consumptionTaxExample: "T1234567890123",
		postalCodePattern: /^\d{3}-\d{4}$/,
		postalCodeLabel: "Postal code",
		hasStates: true,
		stateLabel: "Prefecture",
		addressFields: [
			{
				field: "postalCode",
				label: "Postal code",
				required: true,
				placeholder: "100-0001",
			},
			{
				field: "state",
				label: "Prefecture",
				required: true,
				options: JP_PREFECTURES,
			},
			{ field: "city", label: "City/Ward/Town", required: true },
			{ field: "line1", label: "Street address", required: true },
			{ field: "line2", label: "Building/Apartment", required: false },
		],
	},
};

export const COUNTRY_LIST = Object.values(COUNTRIES).sort((a, b) =>
	a.name.localeCompare(b.name),
);

export function getCountryConfig(code: string): CountryConfig | undefined {
	return COUNTRIES[code.toUpperCase()];
}

// All 27 EU member states as of 2024.
const EU_COUNTRY_CODES = new Set([
	"AT",
	"BE",
	"BG",
	"CY",
	"CZ",
	"DE",
	"DK",
	"EE",
	"ES",
	"FI",
	"FR",
	"GR",
	"HR",
	"HU",
	"IE",
	"IT",
	"LT",
	"LU",
	"LV",
	"MT",
	"NL",
	"PL",
	"PT",
	"RO",
	"SE",
	"SI",
	"SK",
]);

export function isEUCountry(code: string): boolean {
	return EU_COUNTRY_CODES.has(code.toUpperCase());
}

export function getConsumptionTaxLabel(countryCode: string): string {
	const labels: Record<string, string> = {
		AU: "ABN",
		CA: "GST/HST Number",
		GB: "VAT Number",
		JP: "Qualified Invoice Issuer Number",
		US: "EIN (Employer Identification Number)",
	};
	return labels[countryCode] ?? "VAT Number";
}
