import fetch from 'node-fetch';

async function test() {
  const cid = '228538074';
  const trackingCode = 'SFR260309ST90A0448BD';
  const apiKey = process.env.STEADFAST_API_KEY || '1m9mwrrwsjbrg0w';
  const secretKey = process.env.STEADFAST_SECRET_KEY || 'y196ftazvk9s3';

  const endpoints = [
    `/track_by_cid/${cid}`,
    `/track_by_trackingcode/${trackingCode}`,
    `/consignment/${cid}`,
    `/tracking/${trackingCode}`
  ];

  for (const ep of endpoints) {
    console.log('\n--- Trying', ep, '---');
    try {
      const response = await fetch(`https://portal.packzy.com/api/v1${ep}`, {
        method: 'GET',
        headers: { 'Api-Key': apiKey, 'Secret-Key': secretKey, 'Content-Type': 'application/json' }
      });
      console.log('Status:', response.status);
      const text = await response.text();
      console.log('Response:', text.substring(0, 200));
    } catch (e) {
      console.log('Error:', e.message);
    }
  }
}

test();
