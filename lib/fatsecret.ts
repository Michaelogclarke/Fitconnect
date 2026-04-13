import { supabase } from './supabase';

export type FatSecretProduct = {
  name:    string;
  brand?:  string;
  per100g: { calories: number; protein_g: number; carbs_g: number; fat_g: number };
};

export async function searchFatSecret(query: string): Promise<FatSecretProduct[]> {
  try {
    const { data, error } = await supabase.functions.invoke('fatsecret', {
      body: { query },
    });
    if (error || !data?.results) return [];
    return data.results as FatSecretProduct[];
  } catch {
    return [];
  }
}

export async function lookupBarcodeFS(barcode: string): Promise<FatSecretProduct | null> {
  try {
    const { data, error } = await supabase.functions.invoke('fatsecret', {
      body: { barcode },
    });
    if (error) return null;
    return (data?.product as FatSecretProduct) ?? null;
  } catch {
    return null;
  }
}
