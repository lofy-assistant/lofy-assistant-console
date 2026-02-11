/**
 * Timezone to Country/Region/Continent Mapping
 * Maps IANA timezone identifiers to countries with regional metadata
 */

export interface CountryData {
  code: string; // ISO 3166-1 alpha-3 code
  name: string;
  continent: string;
  region: string;
}

export const timezoneToCountry: Record<string, CountryData> = {
  // Asia - Southeast Asia
  'Asia/Singapore': { code: 'SGP', name: 'Singapore', continent: 'Asia', region: 'Southeast Asia' },
  'Asia/Bangkok': { code: 'THA', name: 'Thailand', continent: 'Asia', region: 'Southeast Asia' },
  'Asia/Jakarta': { code: 'IDN', name: 'Indonesia', continent: 'Asia', region: 'Southeast Asia' },
  'Asia/Manila': { code: 'PHL', name: 'Philippines', continent: 'Asia', region: 'Southeast Asia' },
  'Asia/Kuala_Lumpur': { code: 'MYS', name: 'Malaysia', continent: 'Asia', region: 'Southeast Asia' },
  'Asia/Ho_Chi_Minh': { code: 'VNM', name: 'Vietnam', continent: 'Asia', region: 'Southeast Asia' },
  'Asia/Yangon': { code: 'MMR', name: 'Myanmar', continent: 'Asia', region: 'Southeast Asia' },
  'Asia/Phnom_Penh': { code: 'KHM', name: 'Cambodia', continent: 'Asia', region: 'Southeast Asia' },
  'Asia/Vientiane': { code: 'LAO', name: 'Laos', continent: 'Asia', region: 'Southeast Asia' },
  'Asia/Brunei': { code: 'BRN', name: 'Brunei', continent: 'Asia', region: 'Southeast Asia' },
  
  // Asia - East Asia
  'Asia/Tokyo': { code: 'JPN', name: 'Japan', continent: 'Asia', region: 'East Asia' },
  'Asia/Seoul': { code: 'KOR', name: 'South Korea', continent: 'Asia', region: 'East Asia' },
  'Asia/Shanghai': { code: 'CHN', name: 'China', continent: 'Asia', region: 'East Asia' },
  'Asia/Hong_Kong': { code: 'HKG', name: 'Hong Kong', continent: 'Asia', region: 'East Asia' },
  'Asia/Taipei': { code: 'TWN', name: 'Taiwan', continent: 'Asia', region: 'East Asia' },
  'Asia/Macau': { code: 'MAC', name: 'Macau', continent: 'Asia', region: 'East Asia' },
  
  // Asia - South Asia
  'Asia/Kolkata': { code: 'IND', name: 'India', continent: 'Asia', region: 'South Asia' },
  'Asia/Karachi': { code: 'PAK', name: 'Pakistan', continent: 'Asia', region: 'South Asia' },
  'Asia/Dhaka': { code: 'BGD', name: 'Bangladesh', continent: 'Asia', region: 'South Asia' },
  'Asia/Colombo': { code: 'LKA', name: 'Sri Lanka', continent: 'Asia', region: 'South Asia' },
  'Asia/Kathmandu': { code: 'NPL', name: 'Nepal', continent: 'Asia', region: 'South Asia' },
  
  // Asia - Middle East
  'Asia/Dubai': { code: 'ARE', name: 'United Arab Emirates', continent: 'Asia', region: 'Middle East' },
  'Asia/Riyadh': { code: 'SAU', name: 'Saudi Arabia', continent: 'Asia', region: 'Middle East' },
  'Asia/Kuwait': { code: 'KWT', name: 'Kuwait', continent: 'Asia', region: 'Middle East' },
  'Asia/Qatar': { code: 'QAT', name: 'Qatar', continent: 'Asia', region: 'Middle East' },
  'Asia/Bahrain': { code: 'BHR', name: 'Bahrain', continent: 'Asia', region: 'Middle East' },
  'Asia/Tehran': { code: 'IRN', name: 'Iran', continent: 'Asia', region: 'Middle East' },
  'Asia/Baghdad': { code: 'IRQ', name: 'Iraq', continent: 'Asia', region: 'Middle East' },
  'Asia/Jerusalem': { code: 'ISR', name: 'Israel', continent: 'Asia', region: 'Middle East' },
  'Asia/Amman': { code: 'JOR', name: 'Jordan', continent: 'Asia', region: 'Middle East' },
  'Asia/Beirut': { code: 'LBN', name: 'Lebanon', continent: 'Asia', region: 'Middle East' },
  
  // Europe - Western Europe
  'Europe/London': { code: 'GBR', name: 'United Kingdom', continent: 'Europe', region: 'Western Europe' },
  'Europe/Paris': { code: 'FRA', name: 'France', continent: 'Europe', region: 'Western Europe' },
  'Europe/Berlin': { code: 'DEU', name: 'Germany', continent: 'Europe', region: 'Western Europe' },
  'Europe/Amsterdam': { code: 'NLD', name: 'Netherlands', continent: 'Europe', region: 'Western Europe' },
  'Europe/Brussels': { code: 'BEL', name: 'Belgium', continent: 'Europe', region: 'Western Europe' },
  'Europe/Madrid': { code: 'ESP', name: 'Spain', continent: 'Europe', region: 'Western Europe' },
  'Europe/Rome': { code: 'ITA', name: 'Italy', continent: 'Europe', region: 'Western Europe' },
  'Europe/Zurich': { code: 'CHE', name: 'Switzerland', continent: 'Europe', region: 'Western Europe' },
  'Europe/Vienna': { code: 'AUT', name: 'Austria', continent: 'Europe', region: 'Western Europe' },
  'Europe/Lisbon': { code: 'PRT', name: 'Portugal', continent: 'Europe', region: 'Western Europe' },
  
  // Europe - Northern Europe
  'Europe/Stockholm': { code: 'SWE', name: 'Sweden', continent: 'Europe', region: 'Northern Europe' },
  'Europe/Oslo': { code: 'NOR', name: 'Norway', continent: 'Europe', region: 'Northern Europe' },
  'Europe/Copenhagen': { code: 'DNK', name: 'Denmark', continent: 'Europe', region: 'Northern Europe' },
  'Europe/Helsinki': { code: 'FIN', name: 'Finland', continent: 'Europe', region: 'Northern Europe' },
  'Europe/Dublin': { code: 'IRL', name: 'Ireland', continent: 'Europe', region: 'Northern Europe' },
  
  // Europe - Eastern Europe
  'Europe/Moscow': { code: 'RUS', name: 'Russia', continent: 'Europe', region: 'Eastern Europe' },
  'Europe/Warsaw': { code: 'POL', name: 'Poland', continent: 'Europe', region: 'Eastern Europe' },
  'Europe/Prague': { code: 'CZE', name: 'Czech Republic', continent: 'Europe', region: 'Eastern Europe' },
  'Europe/Budapest': { code: 'HUN', name: 'Hungary', continent: 'Europe', region: 'Eastern Europe' },
  'Europe/Bucharest': { code: 'ROU', name: 'Romania', continent: 'Europe', region: 'Eastern Europe' },
  'Europe/Kiev': { code: 'UKR', name: 'Ukraine', continent: 'Europe', region: 'Eastern Europe' },
  
  // Americas - North America
  'America/New_York': { code: 'USA', name: 'United States', continent: 'Americas', region: 'North America' },
  'America/Los_Angeles': { code: 'USA', name: 'United States', continent: 'Americas', region: 'North America' },
  'America/Chicago': { code: 'USA', name: 'United States', continent: 'Americas', region: 'North America' },
  'America/Denver': { code: 'USA', name: 'United States', continent: 'Americas', region: 'North America' },
  'America/Toronto': { code: 'CAN', name: 'Canada', continent: 'Americas', region: 'North America' },
  'America/Vancouver': { code: 'CAN', name: 'Canada', continent: 'Americas', region: 'North America' },
  'America/Mexico_City': { code: 'MEX', name: 'Mexico', continent: 'Americas', region: 'North America' },
  
  // Americas - South America
  'America/Sao_Paulo': { code: 'BRA', name: 'Brazil', continent: 'Americas', region: 'South America' },
  'America/Buenos_Aires': { code: 'ARG', name: 'Argentina', continent: 'Americas', region: 'South America' },
  'America/Santiago': { code: 'CHL', name: 'Chile', continent: 'Americas', region: 'South America' },
  'America/Lima': { code: 'PER', name: 'Peru', continent: 'Americas', region: 'South America' },
  'America/Bogota': { code: 'COL', name: 'Colombia', continent: 'Americas', region: 'South America' },
  
  // Africa
  'Africa/Cairo': { code: 'EGY', name: 'Egypt', continent: 'Africa', region: 'Northern Africa' },
  'Africa/Johannesburg': { code: 'ZAF', name: 'South Africa', continent: 'Africa', region: 'Southern Africa' },
  'Africa/Lagos': { code: 'NGA', name: 'Nigeria', continent: 'Africa', region: 'Western Africa' },
  'Africa/Nairobi': { code: 'KEN', name: 'Kenya', continent: 'Africa', region: 'Eastern Africa' },
  'Africa/Casablanca': { code: 'MAR', name: 'Morocco', continent: 'Africa', region: 'Northern Africa' },
  
  // Oceania
  'Australia/Sydney': { code: 'AUS', name: 'Australia', continent: 'Oceania', region: 'Australia and New Zealand' },
  'Australia/Melbourne': { code: 'AUS', name: 'Australia', continent: 'Oceania', region: 'Australia and New Zealand' },
  'Pacific/Auckland': { code: 'NZL', name: 'New Zealand', continent: 'Oceania', region: 'Australia and New Zealand' },
};

/**
 * Get country data from timezone
 */
export function getCountryFromTimezone(timezone: string | undefined): CountryData | null {
  if (!timezone) return null;
  return timezoneToCountry[timezone] || null;
}

/**
 * Get all unique continents
 */
export function getAllContinents(): string[] {
  const continents = new Set<string>();
  Object.values(timezoneToCountry).forEach(country => {
    continents.add(country.continent);
  });
  return Array.from(continents).sort();
}

/**
 * Get all unique regions
 */
export function getAllRegions(): string[] {
  const regions = new Set<string>();
  Object.values(timezoneToCountry).forEach(country => {
    regions.add(country.region);
  });
  return Array.from(regions).sort();
}

/**
 * Get all unique countries
 */
export function getAllCountries(): CountryData[] {
  const countriesMap = new Map<string, CountryData>();
  Object.values(timezoneToCountry).forEach(country => {
    if (!countriesMap.has(country.code)) {
      countriesMap.set(country.code, country);
    }
  });
  return Array.from(countriesMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}
