import fs from 'fs';
import path from 'path';

let hubsData = null;

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

  const normalizedAddress = addressString.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');

  let bestDistrict = null;
  let bestThana = null;
  let bestPostalCode = null;

  // First check if any hub matches
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

  return {
    district: bestDistrict,
    thana: bestThana,
    postal_code: bestPostalCode
  };
}
