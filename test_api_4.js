import fetch from 'node-fetch';

async function test() {
  const trackingCode = 'SFR260309ST90A0448BD';
  
  const urls = [
    `https://steadfast.com.bd/t/${trackingCode}`,
    `https://steadfast.com.bd/api/v1/tracking/${trackingCode}`,
    `https://portal.packzy.com/tracking/${trackingCode}`,
    `https://packzy.com/tracking/${trackingCode}`,
    `https://steadfast.com.bd/api/tracking/${trackingCode}`
  ];

  for (const u of urls) {
    console.log(`\nTrying ${u}`);
    try {
      const res = await fetch(u);
      console.log('Status:', res.status);
      const text = await res.text();
      console.log('Response body prefix:', text.substring(0, 300));
      if (text.includes('warehouse') || text.includes('location')) {
        console.log('Found warehouse or location in response!');
      }
    } catch (e) {
      console.log('Error:', e.message);
    }
  }
}

test();
