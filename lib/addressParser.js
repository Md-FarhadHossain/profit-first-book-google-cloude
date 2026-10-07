import fs from 'fs';
import path from 'path';

let hubsData = null;

// ─── Bengali helpers ─────────────────────────────────────────────────────────

function isBengali(str) {
  return /[\u0980-\u09FF]/.test(str);
}

function normalizeBengali(str) {
  if (!str) return '';
  return str
    .replace(/[^\u0980-\u09FF\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Sadar normalization ──────────────────────────────────────────────────────
// All English "Sadar" spelling variants → canonical token 'sadar'
// Ordered longest-first so multi-word variants match before shorter substrings
const SADAR_VARIANTS_EN = [
  'sadar upazila', 'sadar thana', 'sadar model',
  'district sadar', 'zilla sadar', 'zila sadar',
  'sodor upazila', 'sodor thana', 'sodor'
];

// All Bengali "Sadar" spelling variants → canonical token 'সদর'
const SADAR_VARIANTS_BN = [
  'সদর উপজেলা', 'সদর থানা', 'সদর মডেল',
  'জেলা সদর', 'সোদর উপজেলা', 'সোদর থানা', 'সোদর'
];

function normalizeSadarEn(str) {
  let result = str;
  for (const v of SADAR_VARIANTS_EN) {
    result = result.split(v).join('sadar');
  }
  // 'sdr' as a standalone word
  result = result.replace(/\bsdr\b/g, 'sadar');
  return result;
}

function normalizeSadarBn(str) {
  let result = str;
  for (const v of SADAR_VARIANTS_BN) {
    result = result.split(v).join('সদর');
  }
  return result;
}

// ─── System metadata stripping ───────────────────────────────────────────────
// Removes auto-injected metadata tags that some bots/systems prepend to addresses.
// Examples: (জেলা: Rajshahi) (থানা: Rajshahi Sadar) (পোস্ট কোড: 6000)
// These must be stripped BEFORE matching so they cannot pollute results.
function stripMetadata(str) {
  return str
    // Bengali metadata: (জেলা: ...), (থানা: ...), (পোস্ট কোড: ...)
    .replace(/\(জেলা\s*:\s*[^)]*\)/g, '')
    .replace(/\(থানা\s*:\s*[^)]*\)/g, '')
    .replace(/\(পোস্ট\s*কোড\s*:\s*[^)]*\)/g, '')
    // English metadata: (District: ...), (Thana: ...), (Postal Code: ...), (Post Code: ...)
    .replace(/\(district\s*:\s*[^)]*\)/gi, '')
    .replace(/\(thana\s*:\s*[^)]*\)/gi, '')
    .replace(/\(postal\s*code\s*:\s*[^)]*\)/gi, '')
    .replace(/\(post\s*code\s*:\s*[^)]*\)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Token-order-independent Sadar hub matching ───────────────────────────────
// Fixes: "Sadar Dinajpur" (address) matching "Dinajpur Sadar" (hub name)
// Logic: address must contain 'sadar' AND every non-sadar token of the hub name

function matchesSadarHubEn(normalizedAddress, normalizedHubName) {
  const tokens = normalizedHubName.split(/\s+/).filter(t => t.length > 2);
  if (!tokens.includes('sadar')) return false;
  if (!normalizedAddress.includes('sadar')) return false;
  const rest = tokens.filter(t => t !== 'sadar');
  if (rest.length === 0) return false; // bare "sadar" — NEVER auto-match
  return rest.every(t => normalizedAddress.includes(t));
}

function matchesSadarHubBn(normalizedAddress, normalizedHubBnName) {
  const tokens = normalizedHubBnName.split(/\s+/).filter(t => t.length > 0);
  if (!tokens.includes('সদর')) return false;
  if (!normalizedAddress.includes('সদর')) return false;
  const rest = tokens.filter(t => t !== 'সদর');
  if (rest.length === 0) return false;
  return rest.every(t => normalizedAddress.includes(t));
}

// ─── Bengali digit → ASCII (for postal code extraction) ──────────────────────
const BN_DIGIT = {
  '০':'0','১':'1','২':'2','৩':'3','৪':'4',
  '৫':'5','৬':'6','৭':'7','৮':'8','৯':'9'
};
function toAsciiDigits(str) {
  return str.split('').map(c => BN_DIGIT[c] ?? c).join('');
}

// ─── Sadar signal detection ───────────────────────────────────────────────────
// Returns true if the address string contains any known 'Sadar' variant
// in English or Bengali — used for the Sadar Thana Fallback below.
const SADAR_SIGNALS_EN = ['sadar', 'sodor', 'sdr'];
const SADAR_SIGNALS_BN = ['\u09B8\u09A6\u09B0', '\u09B8\u09CB\u09A6\u09B0']; // সদর, সোদর

function hasSadarVariant(str) {
  const lower = str.toLowerCase();
  return (
    SADAR_SIGNALS_EN.some(v => lower.includes(v)) ||
    SADAR_SIGNALS_BN.some(v => str.includes(v))
  );
}

// ─── Exported parser ──────────────────────────────────────────────────────────

export function parseAddress(addressString) {
  if (!addressString || typeof addressString !== 'string') {
    return { district: null, thana: null, postal_code: null };
  }

  // Strip system-generated metadata FIRST before any matching.
  // e.g. "(জেলা: Rajshahi) (থানা: Rajshahi Sadar)" gets removed so it cannot corrupt results.
  const cleanAddress = stripMetadata(addressString);
  if (!cleanAddress) return { district: null, thana: null, postal_code: null };

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
  let bestThana    = null;
  let bestPostalCode = null;

  // ════════════════════════════════════════════════════════════════════════════
  // PRIORITY 1: Text-based matching (English or Bengali)
  // ════════════════════════════════════════════════════════════════════════════

  if (isBengali(cleanAddress)) {
    // ── Bengali address matching ──────────────────────────────────────────────────────────────
    // Use cleanAddress (metadata already stripped). Normalize Bengali chars, then Sadar variants.
    const rawNorm = normalizeBengali(cleanAddress);
    const normalizedAddress = normalizeSadarBn(rawNorm);

    for (const dist of hubsData.districts) {
      const distBnName = dist.bn_name ? normalizeBengali(dist.bn_name) : '';

      if (distBnName.length > 1 && normalizedAddress.includes(distBnName)) {
        bestDistrict = dist.name;
      }

      for (const hub of dist.steadfast_hubs) {
        const hubBnRaw = hub.bn_name ? normalizeBengali(hub.bn_name) : '';

        // Normalize Sadar variants in hub name, strip generic location suffixes
        const hubBnNorm = normalizeSadarBn(hubBnRaw)
          .replace(/উপজেলা|জেলা/g, '')
          .replace(/\s+/g, ' ')
          .trim();

        if (hubBnNorm.length > 1) {
          const isMatch =
            normalizedAddress.includes(hubBnNorm) ||           // same-order match
            matchesSadarHubBn(normalizedAddress, hubBnNorm);   // reversed-order sadar match

          if (isMatch) {
            bestDistrict   = dist.name;
            bestThana      = hub.name;
            bestPostalCode = hub.postal_code || dist.postal_code;
          }
        }
      }
    }

    if (bestDistrict && !bestThana) {
      const matchedDist = hubsData.districts.find(d => d.name === bestDistrict);
      if (matchedDist) bestPostalCode = matchedDist.postal_code;
    }

  } else {
    // ── English address matching ──────────────────────────────────────────
    // Use cleanAddress (metadata already stripped). Lowercase + strip punctuation, normalize Sadar.
    const rawNorm = cleanAddress.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
    const normalizedAddress = normalizeSadarEn(rawNorm);

    for (const dist of hubsData.districts) {
      const distNameLow = dist.name.toLowerCase();
      if (normalizedAddress.includes(distNameLow)) {
        bestDistrict = dist.name;
      }

      for (const hub of dist.steadfast_hubs) {
        // Normalize Sadar variants in hub name too, strip parenthetical noise
        const hubNameNorm = normalizeSadarEn(
          hub.name.toLowerCase().replace(/\([^)]*\)/g, '').trim()
        );

        if (hubNameNorm.length > 3) {
          const isMatch =
            normalizedAddress.includes(hubNameNorm) ||           // same-order match
            matchesSadarHubEn(normalizedAddress, hubNameNorm);   // reversed-order sadar match

          if (isMatch) {
            bestDistrict   = dist.name;
            bestThana      = hub.name;
            bestPostalCode = hub.postal_code || dist.postal_code;
          }
        }
      }
    }

    if (bestDistrict && !bestThana) {
      const matchedDist = hubsData.districts.find(d => d.name === bestDistrict);
      if (matchedDist) bestPostalCode = matchedDist.postal_code;
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PRIORITY 1.5: Sadar Thana Fallback
  // If a district was identified AND the address contains any "Sadar" variant,
  // automatically select that district's "[District] Sadar" thana.
  // Every district in steadfast_hubs.json has exactly one Sadar hub.
  // ════════════════════════════════════════════════════════════════════════════

  // Use cleanAddress for Sadar detection — metadata like "(থানা: Rajshahi Sadar)" must not trigger this.
  if (bestDistrict && !bestThana && hasSadarVariant(cleanAddress)) {
    const distObj = hubsData.districts.find(d => d.name === bestDistrict);
    if (distObj) {
      const sadarHub = distObj.steadfast_hubs.find(h =>
        h.name.toLowerCase().includes('sadar')
      );
      if (sadarHub) {
        bestThana      = sadarHub.name;
        bestPostalCode = sadarHub.postal_code || distObj.postal_code;
      }
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PRIORITY 2: Postal code fallback
  // Runs only when text matching left no thana (incomplete result).
  // Extracts 4-digit codes — supports both Bengali & ASCII digits.
  // ════════════════════════════════════════════════════════════════════════════

  if (!bestThana) {
    // Use original addressString (not cleanAddress) for postal codes — metadata strips digits too.
    const asciiAddress = toAsciiDigits(addressString);
    const postalMatches = [...asciiAddress.matchAll(/\b([1-9]\d{3})\b/g)].map(m => m[1]);

    for (const code of postalMatches) {

      // ── Case A: Nothing resolved by text yet ──────────────────────────
      if (!bestDistrict) {
        const candidates = [];
        for (const dist of hubsData.districts) {
          for (const hub of dist.steadfast_hubs) {
            if (hub.postal_code === code) candidates.push({ dist, hub });
          }
          if (dist.postal_code === code && !dist.steadfast_hubs.some(h => h.postal_code === code)) {
            candidates.push({ dist, hub: null });
          }
        }
        if (candidates.length === 0) continue;

        const distinctDistricts = [...new Set(candidates.map(c => c.dist.name))];
        if (distinctDistricts.length === 1) {
          bestDistrict   = distinctDistricts[0];
          bestPostalCode = code;
          const distinctThanas = [...new Set(candidates.filter(c => c.hub).map(c => c.hub.name))];
          if (distinctThanas.length === 1) bestThana = distinctThanas[0];
          break;
        }

      // ── Case B: District known, thana missing ─────────────────────────
      } else {
        const distObj = hubsData.districts.find(d => d.name === bestDistrict);
        if (!distObj) continue;
        const hubMatches = distObj.steadfast_hubs.filter(h => h.postal_code === code);
        if (hubMatches.length === 1) {
          bestThana      = hubMatches[0].name;
          bestPostalCode = code;
          break;
        } else if (hubMatches.length > 1) {
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
    district:    bestDistrict,
    thana:       bestThana,
    postal_code: bestPostalCode
  };
}
