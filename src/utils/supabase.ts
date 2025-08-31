import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const testConnection = async () => {
  try {
    // For demo purposes, we'll simulate a connection test
    if (supabaseUrl === 'https://placeholder.supabase.co') {
      return {
        success: false,
        message: 'Using placeholder configuration. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.',
        data: null
      };
    }

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