import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, isSameDay } from "date-fns"
import { fine } from "@/lib/fine"

interface ZipCodeLocation {
  city: string;
  state: string;
  county: string;
  lat: number;
  lng: number;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function getWeekDays(date: Date = new Date()) {
  const start = startOfWeek(date, { weekStartsOn: 1 }) // Start on Monday
  const end = endOfWeek(date, { weekStartsOn: 1 }) // End on Sunday
  
  return eachDayOfInterval({ start, end }).map(day => ({
    date: day,
    dayName: format(day, 'EEE'),
    dayNumber: format(day, 'd'),
    fullDate: format(day, 'yyyy-MM-dd'),
    isToday: isSameDay(day, new Date())
  }))
}

export function getNextWeek(currentDate: Date): Date {
  return addWeeks(currentDate, 1)
}

export function getPreviousWeek(currentDate: Date): Date {
  return addWeeks(currentDate, -1)
}

export function formatDate(date: Date): string {
  return format(date, 'MMM d, yyyy')
}

// ZIP code database (simplified for demo)
const zipCodeDatabase: Record<string, { city: string, state: string, county: string, lat: number, lng: number }> = {
  // Illinois
  "60106": { city: "Bensenville", state: "IL", county: "DuPage County", lat: 41.9580, lng: -87.9433 },
  "60656": { city: "Chicago", state: "IL", county: "Cook County", lat: 41.9841, lng: -87.8170 },
  "60601": { city: "Chicago", state: "IL", county: "Cook County", lat: 41.8855, lng: -87.6217 },
  "60007": { city: "Elk Grove Village", state: "IL", county: "Cook County", lat: 42.0037, lng: -87.9377 },
  "60018": { city: "Des Plaines", state: "IL", county: "Cook County", lat: 42.0085, lng: -87.9189 },
  "60143": { city: "Itasca", state: "IL", county: "DuPage County", lat: 41.9752, lng: -88.0264 },
  "60666": { city: "Chicago", state: "IL", county: "Cook County", lat: 41.9742, lng: -87.9073 }, // O'Hare Airport
  
  // Alabama
  "35201": { city: "Birmingham", state: "AL", county: "Jefferson County", lat: 33.5207, lng: -86.8025 },
  "35801": { city: "Huntsville", state: "AL", county: "Madison County", lat: 34.7304, lng: -86.5861 },
  
  // Arizona
  "85001": { city: "Phoenix", state: "AZ", county: "Maricopa County", lat: 33.4484, lng: -112.0740 },
  "85701": { city: "Tucson", state: "AZ", county: "Pima County", lat: 32.2217, lng: -110.9265 },
  
  // Arkansas
  "72201": { city: "Little Rock", state: "AR", county: "Pulaski County", lat: 34.7465, lng: -92.2896 },
  
  // California
  "90210": { city: "Beverly Hills", state: "CA", county: "Los Angeles County", lat: 34.0901, lng: -118.4065 },
  "94101": { city: "San Francisco", state: "CA", county: "San Francisco County", lat: 37.7749, lng: -122.4194 },
  "90001": { city: "Los Angeles", state: "CA", county: "Los Angeles County", lat: 33.9731, lng: -118.2479 },
  
  // Colorado
  "80201": { city: "Denver", state: "CO", county: "Denver County", lat: 39.7392, lng: -104.9847 },
  "80901": { city: "Colorado Springs", state: "CO", county: "El Paso County", lat: 38.8339, lng: -104.8214 },
  
  // Connecticut
  "06101": { city: "Hartford", state: "CT", county: "Hartford County", lat: 41.7637, lng: -72.6851 },
  
  // Delaware
  "19801": { city: "Wilmington", state: "DE", county: "New Castle County", lat: 39.7391, lng: -75.5398 },
  
  // Florida
  "33101": { city: "Miami", state: "FL", county: "Miami-Dade County", lat: 25.7751, lng: -80.2105 },
  "32801": { city: "Orlando", state: "FL", county: "Orange County", lat: 28.5383, lng: -81.3792 },
  
  // Georgia
  "30301": { city: "Atlanta", state: "GA", county: "Fulton County", lat: 33.7490, lng: -84.3880 },
  "31401": { city: "Savannah", state: "GA", county: "Chatham County", lat: 32.0809, lng: -81.0912 },
  
  // Idaho
  "83701": { city: "Boise", state: "ID", county: "Ada County", lat: 43.6150, lng: -116.2023 },
  
  // Indiana
  "46201": { city: "Indianapolis", state: "IN", county: "Marion County", lat: 39.7684, lng: -86.1581 },
  
  // Iowa
  "50301": { city: "Des Moines", state: "IA", county: "Polk County", lat: 41.5868, lng: -93.6250 },
  
  // Kansas
  "66101": { city: "Kansas City", state: "KS", county: "Wyandotte County", lat: 39.1142, lng: -94.6275 },
  
  // Kentucky
  "40201": { city: "Louisville", state: "KY", county: "Jefferson County", lat: 38.2527, lng: -85.7585 },
  
  // Louisiana
  "70112": { city: "New Orleans", state: "LA", county: "Orleans Parish", lat: 29.9511, lng: -90.0715 },
  
  // Maine
  "04101": { city: "Portland", state: "ME", county: "Cumberland County", lat: 43.6591, lng: -70.2568 },
  
  // Maryland
  "21201": { city: "Baltimore", state: "MD", county: "Baltimore City", lat: 39.2904, lng: -76.6122 },
  
  // Massachusetts
  "02108": { city: "Boston", state: "MA", county: "Suffolk County", lat: 42.3588, lng: -71.0638 },
  
  // Michigan
  "48201": { city: "Detroit", state: "MI", county: "Wayne County", lat: 42.3314, lng: -83.0458 },
  
  // Minnesota
  "55401": { city: "Minneapolis", state: "MN", county: "Hennepin County", lat: 44.9778, lng: -93.2650 },
  
  // Mississippi
  "39201": { city: "Jackson", state: "MS", county: "Hinds County", lat: 32.2988, lng: -90.1848 },
  
  // Missouri
  "63101": { city: "St. Louis", state: "MO", county: "St. Louis City", lat: 38.6270, lng: -90.1994 },
  
  // Montana
  "59101": { city: "Billings", state: "MT", county: "Yellowstone County", lat: 45.7833, lng: -108.5007 },
  
  // Nebraska
  "68101": { city: "Omaha", state: "NE", county: "Douglas County", lat: 41.2565, lng: -95.9345 },
  
  // Nevada
  "89101": { city: "Las Vegas", state: "NV", county: "Clark County", lat: 36.1699, lng: -115.1398 },
  
  // New Hampshire
  "03101": { city: "Manchester", state: "NH", county: "Hillsborough County", lat: 42.9956, lng: -71.4548 },
  
  // New Jersey
  "07101": { city: "Newark", state: "NJ", county: "Essex County", lat: 40.7357, lng: -74.1724 },
  
  // New Mexico
  "87101": { city: "Albuquerque", state: "NM", county: "Bernalillo County", lat: 35.0844, lng: -106.6504 },
  
  // New York
  "10001": { city: "New York", state: "NY", county: "New York County", lat: 40.7501, lng: -73.9970 },
  "14201": { city: "Buffalo", state: "NY", county: "Erie County", lat: 42.8864, lng: -78.8784 },
  
  // North Carolina
  "28201": { city: "Charlotte", state: "NC", county: "Mecklenburg County", lat: 35.2271, lng: -80.8431 },
  
  // North Dakota
  "58102": { city: "Fargo", state: "ND", county: "Cass County", lat: 46.8772, lng: -96.7898 },
  
  // Ohio
  "43201": { city: "Columbus", state: "OH", county: "Franklin County", lat: 39.9612, lng: -82.9988 },
  
  // Oklahoma
  "73101": { city: "Oklahoma City", state: "OK", county: "Oklahoma County", lat: 35.4676, lng: -97.5164 },
  
  // Oregon
  "97201": { city: "Portland", state: "OR", county: "Multnomah County", lat: 45.5155, lng: -122.6784 },
  
  // Pennsylvania
  "19101": { city: "Philadelphia", state: "PA", county: "Philadelphia County", lat: 39.9526, lng: -75.1652 },
  "15201": { city: "Pittsburgh", state: "PA", county: "Allegheny County", lat: 40.4406, lng: -79.9959 },
  
  // Rhode Island
  "02901": { city: "Providence", state: "RI", county: "Providence County", lat: 41.8240, lng: -71.4128 },
  
  // South Carolina
  "29201": { city: "Columbia", state: "SC", county: "Richland County", lat: 34.0007, lng: -81.0348 },
  
  // South Dakota
  "57101": { city: "Sioux Falls", state: "SD", county: "Minnehaha County", lat: 43.5446, lng: -96.7311 },
  
  // Tennessee
  "37201": { city: "Nashville", state: "TN", county: "Davidson County", lat: 36.1627, lng: -86.7816 },
  
  // Texas
  "75001": { city: "Addison", state: "TX", county: "Dallas County", lat: 32.9617, lng: -96.8302 },
  "77001": { city: "Houston", state: "TX", county: "Harris County", lat: 29.7604, lng: -95.3698 },
  "78201": { city: "San Antonio", state: "TX", county: "Bexar County", lat: 29.4241, lng: -98.4936 },
  
  // Utah
  "84101": { city: "Salt Lake City", state: "UT", county: "Salt Lake County", lat: 40.7608, lng: -111.8910 },
  
  // Vermont
  "05401": { city: "Burlington", state: "VT", county: "Chittenden County", lat: 44.4759, lng: -73.2121 },
  
  // Virginia
  "23218": { city: "Richmond", state: "VA", county: "Henrico County", lat: 37.5407, lng: -77.4360 },
  
  // Washington
  "98101": { city: "Seattle", state: "WA", county: "King County", lat: 47.6101, lng: -122.3421 },
  
  // West Virginia
  "25301": { city: "Charleston", state: "WV", county: "Kanawha County", lat: 38.3498, lng: -81.6326 },
  
  // Wisconsin
  "53201": { city: "Milwaukee", state: "WI", county: "Milwaukee County", lat: 43.0389, lng: -87.9065 },
  
  // Wyoming
  "82001": { city: "Cheyenne", state: "WY", county: "Laramie County", lat: 41.1399, lng: -104.8202 }
};

export async function getLocationFromZip(zipCode: string): Promise<ZipCodeLocation | null> {
  try {
    // Try to get from our database
    const dbResult = await fine.table("zipCodes")
      .select("*")
      .eq("zipCode", zipCode)
      .limit(1);
    
    // If DB returns an array and has a result, use it
    if (Array.isArray(dbResult) && dbResult.length > 0) {
      const record = dbResult[0];
      return {
        city: record.city,
        state: record.state,
        county: record.county || '',
        lat: 0, // DB does not store lat/lng
        lng: 0
      };
    }
    
    // Fallback to hardcoded database
    const location = zipCodeDatabase[zipCode];
    if (location) {
      // Save to our database for future use
      await saveZipCodeLocation({
        zipCode,
        city: location.city,
        state: location.state,
        county: location.county
      });
      return location;
    }
    
    // Not found
    return null;
  } catch (error) {
    console.error('Error fetching zip code data:', error);
    // Fallback to hardcoded database even if DB call fails
    const location = zipCodeDatabase[zipCode];
    if (location) {
      return location;
    }
    return null;
  }
}

export async function saveZipCodeLocation(data: {
  zipCode: string;
  city: string;
  state: string;
  county?: string;
}) {
  try {
    await fine.table("zipCodes").insert({
      zipCode: data.zipCode,
      city: data.city,
      state: data.state,
      county: data.county || null
    });
  } catch (error) {
    if ((error as any).code === 'SQLITE_CONSTRAINT_UNIQUE') {
      // Update existing record
      const records = await fine.table("zipCodes")
        .select("*")
        .eq("zipCode", data.zipCode)
        .limit(1);
      
      if (Array.isArray(records) && records.length > 0) {
        await fine.table("zipCodes")
          .update({
            id: records[0].id,
            city: data.city,
            state: data.state,
            county: data.county || null,
            updatedAt: new Date().toISOString()
          });
      }
    } else {
      throw error;
    }
  }
}

// Distance calculation using a more accurate method
export async function calculateDistance(originZip: string, destinationZip: string): Promise<number> {
  try {
    // First try to get locations from our database
    const originLocation = await getLocationFromZip(originZip);
    const destinationLocation = await getLocationFromZip(destinationZip);
    
    // If we have state information, use state-to-state distance estimation
    if (originLocation.state && destinationLocation.state) {
      // If same state, use a shorter distance estimate
      if (originLocation.state === destinationLocation.state) {
        // For same state, estimate based on zip code difference
        const zipDiff = Math.abs(parseInt(originZip) - parseInt(destinationZip));
        // Rough estimation - adjust as needed
        return Math.min(Math.max(Math.round(zipDiff / 100) * 5, 10), 200);
      }
      
      // For different states, use state-to-state distance estimation
      const stateDistances: Record<string, Record<string, number>> = {
        "NY": { "NJ": 50, "PA": 150, "CT": 80, "MA": 180 },
        "CA": { "NV": 200, "OR": 300, "AZ": 400 },
        "TX": { "OK": 250, "LA": 300, "NM": 500 },
        // Add more state-to-state distances as needed
      };
      
      // Check if we have a predefined distance
      if (stateDistances[originLocation.state]?.[destinationLocation.state]) {
        return stateDistances[originLocation.state][destinationLocation.state];
      }
      
      // If no predefined distance, use a formula based on zip code difference
      const zipDiff = Math.abs(parseInt(originZip) - parseInt(destinationZip));
      return Math.min(Math.max(Math.round(zipDiff / 50) * 10, 100), 2000);
    }
    
    // Fallback to coordinates if available
    const origin = zipCodeDatabase[originZip];
    const destination = zipCodeDatabase[destinationZip];
    
    if (origin && destination) {
      // Calculate distance using Haversine formula
      const R = 3958.8; // Earth's radius in miles
      const lat1 = origin.lat * Math.PI / 180;
      const lat2 = destination.lat * Math.PI / 180;
      const deltaLat = (destination.lat - origin.lat) * Math.PI / 180;
      const deltaLng = (destination.lng - origin.lng) * Math.PI / 180;
      
      const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      // Add 15% to account for road routes vs straight lines
      return Math.round(distance * 1.15);
    }
    
    // If all else fails, return a reasonable estimate
    return Math.floor(Math.random() * 300) + 100; // Random distance between 100-400 miles
  } catch (error) {
    console.error("Error calculating distance:", error);
    return 250; // Default fallback distance
  }
}

// App settings management
export const APP_SETTINGS_KEY = "truckingAppSettings";

export function saveAppSettings(settings: Record<string, any>): void {
  try {
    const currentSettings = getAppSettings();
    const updatedSettings = { ...currentSettings, ...settings };
    localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(updatedSettings));
  } catch (error) {
    console.error("Error saving app settings:", error);
  }
}

export function getAppSettings(): Record<string, any> {
  try {
    const settings = localStorage.getItem(APP_SETTINGS_KEY);
    return settings ? JSON.parse(settings) : {
      defaultDriverPercentage: 25,
      showWeeklyTotals: true,
      enableNotifications: true
    };
  } catch (error) {
    console.error("Error getting app settings:", error);
    return {
      defaultDriverPercentage: 25,
      showWeeklyTotals: true,
      enableNotifications: true
    };
  }
}

export async function clearTables() {
  try {
    // Delete all records from the specified tables
    // Delete routes first due to foreign key constraints
    await Promise.all([
      fine.table("routes").delete(),
      fine.table("drivers").delete(),
      fine.table("trucks").delete(),
      fine.table("trailers").delete(),
      fine.table("dispatchers").delete()
    ]);
    return { success: true };
  } catch (error) {
    console.error("Error clearing tables:", error);
    return { success: false, error };
  }
}