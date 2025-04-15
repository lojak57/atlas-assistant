import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { OpenAIService } from '$lib/services/openai';
import { SupabaseVectorService } from '$lib/services/supabase';

export const POST: RequestHandler = async () => {
  try {
    const results = {
      openai: { success: false, message: '' },
      supabase: { success: false, message: '' }
    };
    
    // Test OpenAI connection
    try {
      const openaiService = new OpenAIService();
      const response = await openaiService.generateChatCompletion([
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say hello!' }
      ]);
      
      results.openai = {
        success: true,
        message: `OpenAI connection successful. Response: "${response.substring(0, 50)}${response.length > 50 ? '...' : ''}"`
      };
    } catch (error) {
      results.openai = {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
    
    // Test Supabase connection
    try {
      const supabaseService = new SupabaseVectorService();
      await supabaseService.initializeVectorStore();
      
      results.supabase = {
        success: true,
        message: 'Supabase connection successful'
      };
    } catch (error) {
      results.supabase = {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
    
    return json(results);
  } catch (error) {
    console.error('Error testing connections:', error);
    return json({ error: 'Failed to test connections' }, { status: 500 });
  }
};
