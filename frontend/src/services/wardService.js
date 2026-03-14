const WARD_MAP = [
  { ward: "Koramangala", wardNo: 151, lat: 12.9352, lng: 77.6245 },
  { ward: "Silk Board", wardNo: 177, lat: 12.9172, lng: 77.6101 },
  { ward: "Marathahalli", wardNo: 84, lat: 12.9698, lng: 77.7499 },
  { ward: "Hebbal", wardNo: 3, lat: 13.0358, lng: 77.5970 },
  { ward: "Whitefield", wardNo: 82, lat: 12.9782, lng: 77.7408 },
  { ward: "KR Puram", wardNo: 23, lat: 12.9592, lng: 77.6974 },
  { ward: "Jayanagar", wardNo: 155, lat: 12.9299, lng: 77.5826 },
  { ward: "HSR Layout", wardNo: 174, lat: 12.9116, lng: 77.6389 },
];

export function getWard(lat, lng) {
  let closest = WARD_MAP[0];
  let minDist = Infinity;
  for (const w of WARD_MAP) {
    const dist = Math.sqrt(Math.pow(lat - w.lat, 2) + Math.pow(lng - w.lng, 2));
    if (dist < minDist) { minDist = dist; closest = w; }
  }
  return closest;
}