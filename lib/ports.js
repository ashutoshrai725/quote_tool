// Seaports now live in /public/ports.json (17k+ entries from the UN/LOCODE
// master, classified to seaports only). The origin/destination Combobox fetches
// that file once. To regenerate it from an updated Excel:
//   npm i xlsx --no-save && node scripts/build-ports.mjs

// Common commodities for the cargo autocomplete (free text still allowed).
export const COMMODITIES = [
  "General merchandise",
  "Textiles / Garments",
  "Cotton",
  "Electronics",
  "Machinery",
  "Auto parts",
  "Furniture",
  "Pharmaceuticals",
  "Chemicals (non-hazardous)",
  "Food & beverages",
  "Frozen / Chilled food",
  "Plastics & polymers",
  "Steel & metals",
  "Rice / Grains",
  "Spices",
  "Tea / Coffee",
  "Marble / Granite",
  "Ceramics / Tiles",
  "Leather goods",
  "Paper & packaging",
];
