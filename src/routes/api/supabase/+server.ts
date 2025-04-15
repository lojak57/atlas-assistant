import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { createClient } from '@supabase/supabase-js';

// Use dummy values during build time to prevent errors
const isDevelopment = process.env.NODE_ENV === 'development';
const dummySupabaseUrl = 'https://dummy-supabase-url.supabase.co';
const dummySupabaseKey = 'dummy-supabase-key';

// Only create the Supabase client if we're not in a build environment
let supabaseClient: ReturnType<typeof createClient>;

// This is a function to get or create the Supabase client
function getSupabaseClient() {
  // If we already have an instance, return it
  if (supabaseClient) return supabaseClient;

  // Otherwise create a new instance
  try {
    const supabaseUrl = env.SUPABASE_URL || dummySupabaseUrl;
    const supabaseKey = env.SUPABASE_KEY || dummySupabaseKey;

    supabaseClient = createClient(supabaseUrl, supabaseKey);
    return supabaseClient;
  } catch (error) {
    console.error('Error initializing Supabase client:', error);
    // Return a mock client for build time
    return {
      from: () => ({
        insert: () => ({ select: () => ({ single: () => ({ data: { id: 'dummy-id' }, error: null }) }) }),
        delete: () => ({ eq: () => ({ error: null }), neq: () => ({ error: null }) }),
        select: () => ({ data: [], error: null })
      }),
      rpc: () => ({ data: [], error: null })
    } as unknown as ReturnType<typeof createClient>;
  }
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { action, data } = await request.json();
    const tableName = 'documents';

    switch (action) {
      case 'insert_document':
        const { content, embedding, metadata, source } = data;
        const insertResult = await getSupabaseClient()
          .from(tableName)
          .insert({
            content,
            embedding,
            metadata: metadata || {},
            source: source || 'unknown'
          })
          .select('id')
          .single();

        if (insertResult.error) throw insertResult.error;
        return json({ id: insertResult.data.id });

      case 'insert_documents':
        const { documents } = data;
        const insertManyResult = await getSupabaseClient()
          .from(tableName)
          .insert(
            documents.map((doc: any) => ({
              content: doc.content,
              embedding: doc.embedding,
              metadata: doc.metadata || {},
              source: doc.source || 'unknown'
            }))
          )
          .select('id');

        if (insertManyResult.error) throw insertManyResult.error;
        return json({ ids: insertManyResult.data.map((item: any) => item.id) });

      case 'similarity_search':
        const { embedding: queryEmbedding, limit, threshold } = data;
        const searchResult = await getSupabaseClient().rpc('match_documents', {
          query_embedding: queryEmbedding,
          match_threshold: threshold || 0.7,
          match_count: limit || 5
        });

        if (searchResult.error) throw searchResult.error;
        return json(searchResult.data);

      case 'delete_document':
        const { id } = data;
        const deleteResult = await getSupabaseClient()
          .from(tableName)
          .delete()
          .eq('id', id);

        if (deleteResult.error) throw deleteResult.error;
        return json({ success: true });

      case 'delete_all_documents':
        const deleteAllResult = await getSupabaseClient()
          .from(tableName)
          .delete()
          .neq('id', '0');

        if (deleteAllResult.error) throw deleteAllResult.error;
        return json({ success: true });

      default:
        return json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in Supabase API:', error);
    return json({ error: 'Failed to process Supabase request' }, { status: 500 });
  }
};
