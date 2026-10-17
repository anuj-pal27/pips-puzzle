// The whole trip through India (ROUTE.md): every stop the Jalebi Express will visit, in order, and where it is
// on the map (a town in that state, by latitude and longitude). A stop with a `level` is built (levels.ts, in the
// same order); the rest show on the journey map as "coming soon" until their level is added.
// Plain data, so the logic tests and scripts/make-india-map.ts can read it.

export type RouteStop = {
  place: string;
  /** Where the pin goes: a town in that state. */
  lat: number;
  lon: number;
  /** The level's id (levels.ts), once the stop is built. */
  level?: number;
  /** An island reached by boat: a side trip off the line, not a stop on it. */
  boat?: boolean;
};

export const INDIA_ROUTE: RouteStop[] = [
  // Part 1: the north, from the top of India
  { place: 'Jammu & Kashmir', lat: 34.08, lon: 74.8, level: 1 }, // Srinagar
  { place: 'Ladakh', lat: 34.16, lon: 77.58 }, // Leh
  { place: 'Himachal Pradesh', lat: 31.96, lon: 77.11 }, // Kullu
  { place: 'Punjab', lat: 31.63, lon: 74.87, level: 2 }, // Amritsar
  { place: 'Chandigarh', lat: 30.73, lon: 76.78 },
  { place: 'Haryana', lat: 29.97, lon: 76.85 }, // Kurukshetra
  { place: 'Delhi', lat: 28.61, lon: 77.21 },
  { place: 'Uttarakhand', lat: 30.09, lon: 78.27 }, // Rishikesh
  { place: 'Uttar Pradesh', lat: 27.18, lon: 78.01 }, // Agra
  { place: 'Bihar', lat: 25.59, lon: 85.14 }, // Patna
  // Part 2: round the north-east and back out through the hills
  { place: 'Assam', lat: 26.58, lon: 93.17 }, // Kaziranga
  { place: 'Arunachal Pradesh', lat: 27.55, lon: 93.83 }, // Ziro
  { place: 'Nagaland', lat: 25.67, lon: 94.11 }, // Kohima
  { place: 'Manipur', lat: 24.82, lon: 93.94 }, // Imphal
  { place: 'Mizoram', lat: 23.73, lon: 92.72 }, // Aizawl
  { place: 'Tripura', lat: 23.83, lon: 91.28 }, // Agartala
  { place: 'Meghalaya', lat: 25.57, lon: 91.88 }, // Shillong
  { place: 'The Hills', lat: 27.33, lon: 88.61, level: 9 }, // Gangtok, Sikkim
  // Part 3: across the middle, east to west
  { place: 'Kolkata', lat: 22.57, lon: 88.36, level: 8 },
  { place: 'Jharkhand', lat: 23.34, lon: 85.31 }, // Ranchi
  { place: 'Odisha', lat: 19.81, lon: 85.83 }, // Puri
  { place: 'Chhattisgarh', lat: 21.25, lon: 81.63 }, // Raipur
  { place: 'Madhya Pradesh', lat: 23.26, lon: 77.41 }, // Bhopal
  { place: 'Rajasthan', lat: 26.49, lon: 74.55, level: 3 }, // Pushkar
  { place: 'Gujarat', lat: 23.02, lon: 72.57, level: 4 }, // Ahmedabad
  { place: 'Daman & Diu', lat: 20.41, lon: 72.83 }, // Daman
  { place: 'Mumbai', lat: 19.08, lon: 72.88, level: 5 },
  // Part 4: the south, down to the very tip
  { place: 'Goa', lat: 15.38, lon: 74.02 }, // Ponda (the pin has to be on land, a little in from the coast)
  { place: 'Karnataka', lat: 15.34, lon: 76.46 }, // Hampi
  { place: 'Telangana', lat: 17.39, lon: 78.49 }, // Hyderabad
  { place: 'Andhra Pradesh', lat: 16.51, lon: 80.65 }, // Vijayawada
  { place: 'Andaman & Nicobar', lat: 11.62, lon: 92.73, boat: true }, // Port Blair
  { place: 'Puducherry', lat: 11.94, lon: 79.81 },
  { place: 'Tamil Nadu', lat: 9.93, lon: 78.12, level: 7 }, // Madurai
  { place: 'Kerala', lat: 9.93, lon: 76.27, level: 6 }, // Kochi
  { place: 'Lakshadweep', lat: 10.57, lon: 72.64, boat: true }, // Kavaratti
  { place: 'Kanyakumari', lat: 8.12, lon: 77.5, level: 10 }, // just in from the very tip
];

/** The stops on the line itself, in order (the islands are side trips by boat). */
export const LINE_STOPS = INDIA_ROUTE.filter((s) => !s.boat);
