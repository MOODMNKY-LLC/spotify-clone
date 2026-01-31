import { ProductWithPrice } from '@/types';
import { createClient } from '@/lib/supabase/server';

export const getActiveProductsWithPrices = async (): Promise<ProductWithPrice[]> => {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('products')
      .select('*, prices(*)')
      .eq('active', true)
      .eq('prices.active', true)
      .order('metadata->index')
      .order('unit_amount', { foreignTable: 'prices' });

    if (error) return [];
    return (data as ProductWithPrice[]) || [];
  } catch {
    // Supabase unreachable (e.g. ECONNREFUSED)
    return [];
  }
};
