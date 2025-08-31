import { supabase } from '@/integrations/supabase/client';

export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('partners').select('count').limit(1);
    
    if (error) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`,
        data: null
      };
    }

    return {
      success: true,
      message: 'Connected to Supabase successfully',
      data
    };
  } catch (error) {
    return {
      success: false,
      message: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      data: null
    };
  }
};