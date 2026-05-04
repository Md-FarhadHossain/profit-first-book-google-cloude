import dotenv from 'dotenv';
dotenv.config();

async function test() {
  const apiKey = process.env.STEADFAST_API_KEY;
  const secretKey = process.env.STEADFAST_SECRET_KEY;
  const url = 'https://portal.packzy.com/api/v1/status_by_cid/3294379M1'; // Just an example, need a real CID or just see if it's 404

  const res = await fetch(url, {
    headers: {
      'Api-Key': apiKey,
      'Secret-Key': secretKey,
    }
  });

  console.log('HTTP Status:', res.status);
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

test();
