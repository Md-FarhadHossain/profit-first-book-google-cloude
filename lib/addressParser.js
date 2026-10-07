import fs from 'fs';
import path from 'path';

let hubsData = null;

// ─── Bengali helpers ─────────────────────────────────────────────────────────

// Detect if a string contains Bengali characters (Unicode block U+0980–U+09FF)
function isBengali(str) {
  return /[\u0980-\u09FF]/.test(str);
}

// Normalize a Bengali address string: keep only Bengali Unicode chars + whitespace,
// collapse multiple spaces, and trim.
function normalizeBengali(str) {
  if (!str) return '';
  return str
    .replace(/[^\u0980-\u09FF\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Exported parser ──────────────────────────────────────────────────────────

export function parseAddress(addressString) {
  if (!addressString || typeof addressString !== 'string') {
    return { district: null, thana: null, postal_code: null };
  }

  // Lazy load the JSON file
  if (!hubsData) {
    try {
      const filePath = path.join(process.cwd(), 'steadfast_hubs.json');
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      hubsData = JSON.parse(fileContent);
    } catch (error) {
      console.error("Error loading steadfast_hubs.json:", error);
      return { district: null, thana: null, postal_code: null };
    }
  }

  let bestDistrict = null;
  let bestThana = null;
  let bestPostalCode = null;

  if (isBengali(addressString)) {
    // ── Bengali address matching ────────────────────────────────────────────
    const normalizedAddress = normalizeBengali(addressString);

    for (const dist of hubsData.districts) {
      const distBnName = dist.bn_name ? normalizeBengali(dist.bn_name) : '';

      // Match district Bengali name in the address
      if (distBnName.length > 1 && normalizedAddress.includes(distBnName)) {
        bestDistrict = dist.name; // store canonical English name
      }

      for (const hub of dist.steadfast_hubs) {
        const hubBnName = hub.bn_name ? normalizeBengali(hub.bn_name) : '';

        // Strip common Bengali suffixes for looser matching
        const simpleHubBnName = hubBnName
          .replace(/উপজেলা|সদর|জেলা/g, '')
          .replace(/\s+/g, ' ')
          .trim();

        if (simpleHubBnName.length > 1 && normalizedAddress.includes(simpleHubBnName)) {
          bestDistrict = dist.name;       // canonical English district
          bestThana = hub.name;           // canonical English thana
          bestPostalCode = hub.postal_code || dist.postal_code; // ASCII postal code
        }
      }
    }

    // District-only fallback: no hub matched but district did
    if (bestDistrict && !bestThana) {
      const matchedDist = hubsData.districts.find(d => d.name === bestDistrict);
      if (matchedDist) {
        bestPostalCode = matchedDist.postal_code;
      }
    }

  } else {
    // ── English address matching (original logic) ───────────────────────────
    const normalizedAddress = addressString.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');

    for (const dist of hubsData.districts) {
      const distNameLow = dist.name.toLowerCase();

      // Check if district name is directly in address
      if (normalizedAddress.includes(distNameLow)) {
        bestDistrict = dist.name;
      }

      for (const hub of dist.steadfast_hubs) {
        const hubNameLow = hub.name.toLowerCase();

        // Some hub names have "(B Baria)" or similar, simplify for matching
        const simpleHubName = hubNameLow.replace(/\([^)]*\)/g, '').trim();

        if (simpleHubName.length > 3 && normalizedAddress.includes(simpleHubName)) {
          bestDistrict = dist.name;
          bestThana = hub.name;
          bestPostalCode = hub.postal_code || dist.postal_code;
        }
      }
    }

    // If we only found district but no hub, assign district defaults
    if (bestDistrict && !bestThana) {
      const matchedDist = hubsData.districts.find(d => d.name === bestDistrict);
      if (matchedDist) {
        bestPostalCode = matchedDist.postal_code;
      }
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PRIORITY 2: Postal code fallback
  // Runs only when text matching left no thana (result is incomplete).
  // Extracts 4-digit codes from the address — supports both Bengali & ASCII digits.
  // ════════════════════════════════════════════════════════════════════════════

  if (!bestThana) {
    // Convert Bengali digits (০-৯) to ASCII so the 4-digit regex works uniformly
    const BN_DIGIT = { '০':'0','১':'1','২':'2','৩':'3','৪':'4','৫':'5','৬':'6','৭':'7','৮':'8','৯':'9' };
    const asciiAddress = addressString.split('').map(c => BN_DIGIT[c] ?? c).join('');

    // Bangladesh postal codes are exactly 4 digits (1000–9999)
    const postalMatches = [...asciiAddress.matchAll(/\b([1-9]\d{3})\b/g)].map(m => m[1]);

    for (const code of postalMatches) {

      // ── Case A: Nothing resolved by text yet — try to find district + thana ──
      if (!bestDistrict) {
        const candidates = [];
        for (const dist of hubsData.districts) {
          for (const hub of dist.steadfast_hubs) {
            if (hub.postal_code === code) candidates.push({ dist, hub });
          }
          // District-level postal code (no hub owns this code individually)
          if (dist.postal_code === code && !dist.steadfast_hubs.some(h => h.postal_code === code)) {
            candidates.push({ dist, hub: null });
          }
        }

        if (candidates.length === 0) continue;

        const distinctDistricts = [...new Set(candidates.map(c => c.dist.name))];

        if (distinctDistricts.length === 1) {
          // All candidates are in the same district — unambiguous
          bestDistrict = distinctDistricts[0];
          bestPostalCode = code;
          const distinctThanas = [...new Set(candidates.filter(c => c.hub).map(c => c.hub.name))];
          if (distinctThanas.length === 1) bestThana = distinctThanas[0]; // unique thana too
          break;
        }
        // Multiple districts → ambiguous, try the next extracted code

      // ── Case B: District found by text but thana is still missing ────────
      } else {
        const distObj = hubsData.districts.find(d => d.name === bestDistrict);
        if (!distObj) continue;

        const hubMatches = distObj.steadfast_hubs.filter(h => h.postal_code === code);

        if (hubMatches.length === 1) {
          // Unique thana in this district for the code — perfect
          bestThana = hubMatches[0].name;
          bestPostalCode = code;
          break;
        } else if (hubMatches.length > 1) {
          // Multiple thanas share the code in this district — set postal at minimum
          bestPostalCode = code;
          break;
        } else if (distObj.postal_code === code) {
          bestPostalCode = code;
          break;
        }
      }
    }
  }

  return {
    district: bestDistrict,
    thana: bestThana,
    postal_code: bestPostalCode
  };
}
