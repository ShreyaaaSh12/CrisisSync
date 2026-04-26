export interface Incident {
  id: string;
  category: "Flood" | "Fire" | "Medical" | "Earthquake" | "Other";
  urgency: number;
  affected_people: number;
  summary: string;
  location_context: string;
  timestamp: string;
}

export const MOCK_INCIDENTS: Incident[] = [
  {
    id: "1",
    category: "Flood",
    urgency: 9,
    affected_people: 15,
    summary: "Flash flood reported near the main bridge, 3 cars submerged.",
    location_context: "Riverside Drive, Central Bridge",
    timestamp: "2 mins ago"
  },
  {
    id: "2",
    category: "Medical",
    urgency: 7,
    affected_people: 2,
    summary: "Injuries reported due to a partial structural collapse.",
    location_context: "Old Town Market",
    timestamp: "10 mins ago"
  },
  {
    id: "3",
    category: "Fire",
    urgency: 10,
    affected_people: 50,
    summary: "Electrical fire spreading in high-rise residential complex.",
    location_context: "Skyline Apartments, Block C",
    timestamp: "Just now"
  }
];