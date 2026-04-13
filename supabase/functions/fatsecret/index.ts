import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const TOKEN_URL = 'https://oauth.fatsecret.com/connect/token';
const API_URL   = 'https://platform.fatsecret.com/rest/server.api';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory token cache (lives for the lifetime of the function instance)
let cachedToken = '';
let tokenExpiry = 0;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const clientId     = Deno.env.get('FATSECRET_CLIENT_ID');
  const clientSecret = Deno.env.get('FATSECRET_CLIENT_SECRET');

  if (!clientId || !clientSecret) throw new Error('Missing FatSecret credentials');

  const credentials = btoa(`${clientId}:${clientSecret}`);

  const res  = await fetch(TOKEN_URL, {
    method:  'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type':  'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=basic',
  });

  const json = await res.json();
  cachedToken = json.access_token;
  tokenExpiry = Date.now() + (json.expires_in - 60) * 1000;
  return cachedToken;
}

// FatSecret food_description format:
// "Per 100g - Calories: 165kcal | Fat: 3.57g | Carbs: 0.00g | Protein: 31.02g"
function parseMacros(description: string) {
  const cal  = description.match(/Calories:\s*([\d.]+)/)?.[1];
  const fat  = description.match(/Fat:\s*([\d.]+)/)?.[1];
  const carb = description.match(/Carbs:\s*([\d.]+)/)?.[1];
  const prot = description.match(/Protein:\s*([\d.]+)/)?.[1];
  return {
    calories:  parseFloat(cal  ?? '0'),
    fat_g:     parseFloat(fat  ?? '0'),
    carbs_g:   parseFloat(carb ?? '0'),
    protein_g: parseFloat(prot ?? '0'),
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS });
  }

  try {
    const { query, barcode } = await req.json();
    const token = await getToken();

    // ── Barcode lookup ───────────────────────────────────────────────────────
    if (barcode) {
      // Step 1: barcode → food_id
      const barcodeRes  = await fetch(
        `${API_URL}?method=food.find_id_for_barcode&barcode=${encodeURIComponent(barcode)}&format=json`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const barcodeJson = await barcodeRes.json();
      const foodId      = barcodeJson?.food_id?.value;

      if (!foodId) {
        return new Response(JSON.stringify({ product: null }), {
          headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      }

      // Step 2: food_id → nutritional details
      const foodRes  = await fetch(
        `${API_URL}?method=food.get.v2&food_id=${foodId}&format=json`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const foodJson = await foodRes.json();
      const food     = foodJson?.food;
      const servings = food?.servings?.serving;
      const list     = Array.isArray(servings) ? servings : servings ? [servings] : [];

      // Prefer a 100g serving if available, otherwise first serving
      const serving =
        list.find((s: any) =>
          s.metric_serving_unit === 'g' && parseFloat(s.metric_serving_amount) === 100,
        ) ?? list[0];

      const product = serving
        ? {
            name:    food.food_name,
            brand:   food.brand_name ?? undefined,
            per100g: {
              calories:  parseFloat(serving.calories      ?? '0'),
              protein_g: parseFloat(serving.protein       ?? '0'),
              carbs_g:   parseFloat(serving.carbohydrate  ?? '0'),
              fat_g:     parseFloat(serving.fat           ?? '0'),
            },
          }
        : null;

      return new Response(JSON.stringify({ product }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // ── Food search ──────────────────────────────────────────────────────────
    if (query) {
      const searchRes  = await fetch(
        `${API_URL}?method=foods.search&search_expression=${encodeURIComponent(query)}&format=json&max_results=10`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const searchJson = await searchRes.json();

      // Return raw response so we can see what FatSecret is actually sending back
      return new Response(JSON.stringify({ debug: searchJson }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'query or barcode required' }), {
      status:  400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status:  500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
