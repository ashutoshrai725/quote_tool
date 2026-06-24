import XLSX from "xlsx";
import { writeFileSync, mkdirSync } from "node:fs";

const PATH = "C:/Users/ashut/Downloads/global_trade_locations_master.xlsx";
const wb = XLSX.readFile(PATH);
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

// UN/LOCODE layout in this dump (header row is misaligned vs data):
//   name        -> country ISO2     (e.g. "IN")
//   subdivision -> location code     (e.g. "NSA")  => UN/LOCODE = IN + NSA = INNSA
//   function    -> place name        (e.g. "Nhava Sheva (Jawaharlal Nehru)")
//   __EMPTY     -> 8-char function classifier (pos 1 = '1' => SEAPORT)
const ports = [];
const seen = new Set();

for (const r of rows) {
  const country = String(r["name"] ?? "").trim().toUpperCase();
  const loc = String(r["subdivision"] ?? "").trim().toUpperCase();
  const name = String(r["function"] ?? "").trim();
  const fn = String(r["__EMPTY"] ?? "").trim();

  if (country.length !== 2) continue;
  if (loc.length !== 3) continue;
  if (!name) continue;
  if (fn[0] !== "1") continue; // seaports only

  const code = country + loc;
  if (seen.has(code)) continue;
  seen.add(code);
  ports.push({ name, code });
}

ports.sort((a, b) => a.name.localeCompare(b.name, "en"));

console.log("Total seaports:", ports.length);
console.log(
  "\nIndia sample:",
  JSON.stringify(
    ports.filter((p) => p.code.startsWith("IN")).slice(0, 15),
    null,
    2
  )
);
console.log(
  "\nKnown-port spot check:",
  ["INNSA", "INMUN", "NLRTM", "SGSIN", "CNSHA", "AEJEA", "USLAX"].map((c) => {
    const hit = ports.find((p) => p.code === c);
    return hit ? `${c} -> ${hit.name}` : `${c} -> NOT FOUND`;
  })
);

mkdirSync("public", { recursive: true });
writeFileSync("public/ports.json", JSON.stringify(ports));
const kb = (JSON.stringify(ports).length / 1024).toFixed(0);
console.log(`\nWrote public/ports.json (${kb} KB)`);
