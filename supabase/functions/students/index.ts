import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const studentId = pathParts[pathParts.length - 1];

    // GET /students - List with filters
    if (req.method === 'GET' && !studentId) {
      const category = url.searchParams.get('category');
      const status = url.searchParams.get('status');
      const q = url.searchParams.get('q');

      let query = supabaseClient
        .from('students')
        .select(`
          *,
          payments (
            id,
            year,
            month,
            amount,
            status,
            reason,
            notes,
            paid_at,
            created_at
          )
        `);

      if (category) {
        query = query.eq('category', category);
      }

      if (q) {
        query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Filter by payment status if provided
      let filteredData = data;
      if (status) {
        filteredData = data.filter(student => {
          const hasStatus = student.payments?.some((p: any) => p.status === status);
          return hasStatus;
        });
      }

      // Sort by payment status priority: no_pago → pendiente → promesa_pago → al_dia
      const statusPriority: Record<string, number> = {
        'no_pago': 1,
        'pendiente': 2,
        'promesa_pago': 3,
        'al_dia': 4,
      };

      filteredData.sort((a, b) => {
        const aWorstStatus = Math.min(...(a.payments?.map((p: any) => statusPriority[p.status] || 5) || [5]));
        const bWorstStatus = Math.min(...(b.payments?.map((p: any) => statusPriority[p.status] || 5) || [5]));
        return aWorstStatus - bWorstStatus;
      });

      return new Response(JSON.stringify(filteredData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /students/:id - Get student detail
    if (req.method === 'GET' && studentId) {
      const { data, error } = await supabaseClient
        .from('students')
        .select(`
          *,
          payments (
            id,
            year,
            month,
            amount,
            status,
            reason,
            notes,
            paid_at,
            created_at,
            updated_at
          )
        `)
        .eq('id', studentId)
        .single();

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /students - Create student
    if (req.method === 'POST') {
      const body = await req.json();
      const { first_name, last_name, gender, category, phone_number, phone_label } = body;

      // Validation
      if (!first_name || !last_name || !gender || !category || !phone_number || !phone_label) {
        return new Response(
          JSON.stringify({ error: 'Todos los campos son obligatorios' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data, error } = await supabaseClient
        .from('students')
        .insert([{
          first_name,
          last_name,
          gender,
          category,
          phone_number,
          phone_label,
        }])
        .select()
        .single();

      if (error) throw error;

      console.log('Student created:', data.id);

      return new Response(JSON.stringify(data), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // PATCH /students/:id - Update student
    if (req.method === 'PATCH' && studentId) {
      const body = await req.json();
      const { first_name, last_name, gender, category, phone_number, phone_label } = body;

      const updateData: any = {};
      if (first_name !== undefined) updateData.first_name = first_name;
      if (last_name !== undefined) updateData.last_name = last_name;
      if (gender !== undefined) updateData.gender = gender;
      if (category !== undefined) updateData.category = category;
      if (phone_number !== undefined) updateData.phone_number = phone_number;
      if (phone_label !== undefined) updateData.phone_label = phone_label;

      const { data, error } = await supabaseClient
        .from('students')
        .update(updateData)
        .eq('id', studentId)
        .select()
        .single();

      if (error) throw error;

      console.log('Student updated:', studentId);

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // DELETE /students/:id - Delete student
    if (req.method === 'DELETE' && studentId) {
      const { error } = await supabaseClient
        .from('students')
        .delete()
        .eq('id', studentId);

      if (error) throw error;

      console.log('Student deleted:', studentId);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in students function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
