export const mockDashboardStats = {
  eventName: "Odisha Flood 2026",
  lastUpdated: "12 Aug 2026, 21:00 IST",
  location: "Bhubaneswar Region",
  totalImages: 128,
  damagedBuildings: 37,
  blockedRoutes: 12,
  pendingVerification: 19
};

export const mockPriorities = [
  {
    id: "LOC-102",
    rank: 1,
    title: "Building #102",
    location: "Sector 4, Bhubaneswar",
    priorityScore: 91,
    damageScore: 95,
    vulnerabilityScore: 82,
    accessibilityScore: 61,
    confidence: 91,
    status: "Severe Damage",
    reasons: [
      "Severe structural damage detected",
      "High vulnerability area (Near Hospital)",
      "Blocked primary access route",
      "91% AI confidence"
    ]
  },
  {
    id: "LOC-017",
    rank: 2,
    title: "Road #17 - Arterial Bridge",
    location: "Zone 2, Cuttack Road",
    priorityScore: 87,
    damageScore: 88,
    vulnerabilityScore: 90,
    accessibilityScore: 30,
    confidence: 94,
    status: "Blocked Access",
    reasons: [
      "Critical supply line blocked",
      "Waterlogging level > 1.5m",
      "Alternative routes congested"
    ]
  }
];

export const mockMapFindings = [
  {
    id: "F-102",
    title: "Building #102",
    lat: 20.2961,
    lng: 85.8245,
    severity: "Severe",
    type: "Building Damage",
    confidence: 91,
    status: "Pending"
  },
  {
    id: "F-103",
    title: "Hospital Access Zone",
    lat: 20.3010,
    lng: 85.8320,
    severity: "Severe",
    type: "Blocked Route",
    confidence: 95,
    status: "Pending"
  },
  {
    id: "F-104",
    title: "Residential Block B",
    lat: 20.2890,
    lng: 85.8150,
    severity: "Moderate",
    type: "Waterlogging",
    confidence: 78,
    status: "Verified"
  }
];