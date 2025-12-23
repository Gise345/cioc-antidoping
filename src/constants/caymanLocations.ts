/**
 * Pre-populated Cayman Islands Sports Facilities
 * Common training locations for athletes in the Cayman Islands
 */

import { LocationType, AddressDocument } from '../types/firestore';
import { CreateLocationData } from '../api/locations';

export interface CaymanLocationTemplate {
  name: string;
  type: LocationType;
  address: AddressDocument;
  additionalInfo?: string;
}

/**
 * Common sports facilities in the Cayman Islands
 */
export const CAYMAN_SPORTS_FACILITIES: CaymanLocationTemplate[] = [
  // Training Facilities
  {
    name: 'Truman Bodden Sports Complex',
    type: 'training',
    address: {
      street: 'Olympic Way',
      city: 'George Town',
      country: 'Cayman Islands',
      postal_code: 'KY1-1601',
      latitude: 19.2934,
      longitude: -81.3806,
    },
    additionalInfo: 'Main national sports complex. Enter via main gate on Olympic Way.',
  },
  {
    name: 'Ed Bush Sports Complex',
    type: 'training',
    address: {
      street: 'Birch Tree Hill Road',
      city: 'West Bay',
      country: 'Cayman Islands',
      postal_code: 'KY1-1302',
      latitude: 19.3615,
      longitude: -81.4023,
    },
    additionalInfo: 'Sports complex in West Bay. Multiple playing fields available.',
  },
  {
    name: 'John Gray High School Sports Field',
    type: 'training',
    address: {
      street: 'Walkers Road',
      city: 'George Town',
      country: 'Cayman Islands',
      postal_code: 'KY1-1104',
    },
    additionalInfo: 'School sports facilities. Access through main school entrance.',
  },
  {
    name: 'Clifton Hunter High School Sports Complex',
    type: 'training',
    address: {
      street: 'Frank Sound Road',
      city: 'Frank Sound',
      country: 'Cayman Islands',
      postal_code: 'KY1-1701',
    },
    additionalInfo: 'Modern sports facilities including track and field.',
  },

  // Aquatic Facilities
  {
    name: 'Cayman Islands Aquatic Centre',
    type: 'training',
    address: {
      street: 'Truman Bodden Sports Complex',
      city: 'George Town',
      country: 'Cayman Islands',
      postal_code: 'KY1-1601',
      latitude: 19.2930,
      longitude: -81.3810,
    },
    additionalInfo: 'Olympic-size swimming pool. Part of Truman Bodden Complex.',
  },
  {
    name: 'Lions Pool (Lions Aquatic Club)',
    type: 'training',
    address: {
      street: 'South Sound Road',
      city: 'George Town',
      country: 'Cayman Islands',
      postal_code: 'KY1-1109',
    },
    additionalInfo: 'Community swimming pool. Training facility for swim teams.',
  },

  // Gyms
  {
    name: 'World Gym Cayman',
    type: 'gym',
    address: {
      street: '71 Eastern Avenue',
      city: 'George Town',
      country: 'Cayman Islands',
      postal_code: 'KY1-1106',
      latitude: 19.3020,
      longitude: -81.3829,
    },
    additionalInfo: 'Full-service gym. Parking available.',
  },
  {
    name: 'Fitness Connection',
    type: 'gym',
    address: {
      street: 'West Bay Road',
      city: 'George Town',
      country: 'Cayman Islands',
      postal_code: 'KY1-1203',
    },
    additionalInfo: 'Large gym with multiple locations.',
  },
  {
    name: 'F45 Training Camana Bay',
    type: 'gym',
    address: {
      street: 'Camana Bay',
      city: 'George Town',
      country: 'Cayman Islands',
      postal_code: 'KY1-9006',
    },
    additionalInfo: 'Group fitness training facility.',
  },
  {
    name: 'CrossFit Seven Mile',
    type: 'gym',
    address: {
      street: 'West Bay Road',
      city: 'George Town',
      country: 'Cayman Islands',
      postal_code: 'KY1-1203',
    },
    additionalInfo: 'CrossFit training facility.',
  },

  // Competition Venues
  {
    name: 'National Stadium',
    type: 'competition',
    address: {
      street: 'Truman Bodden Sports Complex',
      city: 'George Town',
      country: 'Cayman Islands',
      postal_code: 'KY1-1601',
    },
    additionalInfo: 'Main stadium for national competitions.',
  },
  {
    name: 'Camana Bay Tennis Courts',
    type: 'competition',
    address: {
      street: 'Forum Lane',
      city: 'Camana Bay',
      country: 'Cayman Islands',
      postal_code: 'KY1-9006',
    },
    additionalInfo: 'Tennis courts at Camana Bay. Booking required.',
  },

  // Other Locations
  {
    name: 'Camana Bay',
    type: 'other',
    address: {
      street: 'Camana Bay',
      city: 'George Town',
      country: 'Cayman Islands',
      postal_code: 'KY1-9006',
      latitude: 19.3290,
      longitude: -81.3810,
    },
    additionalInfo: 'Town center area. Various facilities available.',
  },
  {
    name: 'Seven Mile Beach Public Beach',
    type: 'other',
    address: {
      street: 'West Bay Road',
      city: 'George Town',
      country: 'Cayman Islands',
      postal_code: 'KY1-1203',
    },
    additionalInfo: 'Beach training location. Public access.',
  },
  {
    name: 'CIFA Football Centre',
    type: 'training',
    address: {
      street: 'Academy Way',
      city: 'Prospect',
      country: 'Cayman Islands',
      postal_code: 'KY1-1507',
    },
    additionalInfo: 'Cayman Islands Football Association training centre.',
  },
];

/**
 * Common hotel locations for traveling athletes
 */
export const CAYMAN_HOTELS: CaymanLocationTemplate[] = [
  {
    name: 'Ritz-Carlton Grand Cayman',
    type: 'hotel',
    address: {
      street: 'West Bay Road',
      city: 'Seven Mile Beach',
      country: 'Cayman Islands',
      postal_code: 'KY1-1209',
      latitude: 19.3430,
      longitude: -81.3880,
    },
  },
  {
    name: 'Westin Grand Cayman',
    type: 'hotel',
    address: {
      street: 'West Bay Road',
      city: 'Seven Mile Beach',
      country: 'Cayman Islands',
      postal_code: 'KY1-1202',
    },
  },
  {
    name: 'Grand Cayman Marriott Resort',
    type: 'hotel',
    address: {
      street: 'West Bay Road',
      city: 'Seven Mile Beach',
      country: 'Cayman Islands',
      postal_code: 'KY1-1202',
    },
  },
  {
    name: 'Kimpton Seafire Resort',
    type: 'hotel',
    address: {
      street: '60 Tanager Way',
      city: 'Seven Mile Beach',
      country: 'Cayman Islands',
      postal_code: 'KY1-1209',
    },
  },
];

/**
 * Convert template to CreateLocationData format for a specific athlete
 */
export const templateToLocationData = (
  template: CaymanLocationTemplate,
  athleteId: string,
  isDefault: boolean = false
): CreateLocationData => ({
  athleteId,
  name: template.name,
  type: template.type,
  address: template.address,
  additionalInfo: template.additionalInfo,
  isDefault,
});

/**
 * Get all common Cayman locations for seeding
 */
export const getAllCaymanLocations = (athleteId: string): CreateLocationData[] => {
  const allTemplates = [...CAYMAN_SPORTS_FACILITIES, ...CAYMAN_HOTELS];
  return allTemplates.map((template) => templateToLocationData(template, athleteId));
};

/**
 * Get sports facilities only
 */
export const getSportsFacilities = (athleteId: string): CreateLocationData[] => {
  return CAYMAN_SPORTS_FACILITIES.map((template) =>
    templateToLocationData(template, athleteId)
  );
};

/**
 * Get locations by type
 */
export const getCaymanLocationsByType = (
  athleteId: string,
  type: LocationType
): CreateLocationData[] => {
  const allTemplates = [...CAYMAN_SPORTS_FACILITIES, ...CAYMAN_HOTELS];
  return allTemplates
    .filter((template) => template.type === type)
    .map((template) => templateToLocationData(template, athleteId));
};

/**
 * Location type labels for display
 */
export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  home: 'Home',
  training: 'Training Facility',
  gym: 'Gym',
  competition: 'Competition Venue',
  work: 'Work',
  school: 'School',
  hotel: 'Hotel',
  other: 'Other',
};

/**
 * Location type icons (Ionicons names)
 */
export const LOCATION_TYPE_ICONS: Record<LocationType, string> = {
  home: 'home',
  training: 'fitness',
  gym: 'barbell',
  competition: 'trophy',
  work: 'briefcase',
  school: 'school',
  hotel: 'bed',
  other: 'location',
};

/**
 * Validate Cayman Islands postal code format
 * Format: KY#-#### where # is a digit
 */
export const isValidCaymanPostalCode = (postalCode: string): boolean => {
  const caymanPostalRegex = /^KY\d-\d{4}$/;
  return caymanPostalRegex.test(postalCode);
};

/**
 * Format address for display
 */
export const formatAddress = (address: AddressDocument): string => {
  const parts = [address.street, address.city, address.country];
  if (address.postal_code) {
    parts.push(address.postal_code);
  }
  return parts.filter(Boolean).join(', ');
};

/**
 * Get abbreviated address (street, city only)
 */
export const getShortAddress = (address: AddressDocument): string => {
  return `${address.street}, ${address.city}`;
};
