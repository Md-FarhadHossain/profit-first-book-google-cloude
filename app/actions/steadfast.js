'use server';

const STEADFAST_API_URL = 'https://portal.packzy.com/api/v1';

export async function getSteadfastPayments() {
  try {
    const apiKey = process.env.STEADFAST_API_KEY;
    const secretKey = process.env.STEADFAST_SECRET_KEY;

    if (!apiKey || !secretKey) {
      return { success: false, message: 'Steadfast API keys missing in environment.' };
    }

    let allPayments = [];
    let page = 1;
    let hasMore = true;

    // Fetch all pages of payments. Steadfast API default sort is Oldest to Newest.
    while (hasMore) {
      const response = await fetch(`${STEADFAST_API_URL}/payments?page=${page}`, {
        method: 'GET',
        headers: {
          'Api-Key': apiKey,
          'Secret-Key': secretKey,
          'Content-Type': 'application/json'
        },
        cache: 'no-store' // We need fresh data if new payments cleared
      });

      if (response.status !== 200) {
         if (page === 1) {
            const result = await response.json();
            return { success: false, message: result.message || 'Error communicating with Steadfast API.' };
         }
         break; // Stop fetching on error for subsequent pages
      }

      const result = await response.json();
      
      if (result && result.payments && result.payments.length > 0) {
        allPayments = [...allPayments, ...result.payments];
        
        // If the page returned less than 10 items (or 0), we've reached the end
        if (result.payments.length < 10) {
           hasMore = false;
        } else {
           page++;
        }
      } else {
        hasMore = false;
      }
    }

    // Sort the combined array from newest to oldest based on created_at or paid_at
    allPayments.sort((a, b) => {
       const dateA = new Date(a.paid_at || a.created_at || 0).getTime();
       const dateB = new Date(b.paid_at || b.created_at || 0).getTime();
       return dateB - dateA; // Descending
    });

    return { success: true, data: { payments: allPayments } };

  } catch (error) {
    console.error('Steadfast Payments Fetch Error:', error);
    return { success: false, message: 'Internal Server Error while fetching payments.' };
  }
}
