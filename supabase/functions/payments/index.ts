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
    const paymentId = pathParts[pathParts.length - 1];

    // POST /payments - Create payment (add pending month for student)
    if (req.method === 'POST' && !paymentId) {
      const body = await req.json();
      const { student_id, year, month, amount = 12000, status = 'pendiente', reason, notes } = body;

      if (!student_id || !year || !month) {
        return new Response(
          JSON.stringify({ error: 'student_id, year y month son obligatorios' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data, error } = await supabaseClient
        .from('payments')
        .insert([{
          student_id,
          year,
          month,
          amount,
          status,
          reason,
          notes,
        }])
        .select()
        .single();

      if (error) {
        // Check if it's the max pending payments error
        if (error.message.includes('3 meses adeudados')) {
          return new Response(
            JSON.stringify({ error: 'El alumno ya tiene 3 meses adeudados. No se pueden agregar más.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        throw error;
      }

      console.log('Payment created:', data.id);

      return new Response(JSON.stringify(data), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // PATCH /payments/:id - Update payment (mark as paid, change status, etc)
    if (req.method === 'PATCH' && paymentId) {
      const body = await req.json();
      const { status, reason, notes, amount, paid_at } = body;

      const updateData: any = {};
      if (status !== undefined) {
        updateData.status = status;
        // If marking as paid, set paid_at to now
        if (status === 'al_dia' && !paid_at) {
          updateData.paid_at = new Date().toISOString();
        }
      }
      if (reason !== undefined) updateData.reason = reason;
      if (notes !== undefined) updateData.notes = notes;
      if (amount !== undefined) updateData.amount = amount;
      if (paid_at !== undefined) updateData.paid_at = paid_at;

      const { data, error } = await supabaseClient
        .from('payments')
        .update(updateData)
        .eq('id', paymentId)
        .select()
        .single();

      if (error) {
        if (error.message.includes('3 meses adeudados')) {
          return new Response(
            JSON.stringify({ error: 'El alumno ya tiene 3 meses adeudados. No se pueden agregar más.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        throw error;
      }

      console.log('Payment updated:', paymentId);

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /payments?student_id=xxx - Get payment history for student
    if (req.method === 'GET') {
      const studentId = url.searchParams.get('student_id');

      if (!studentId) {
        return new Response(
          JSON.stringify({ error: 'student_id parameter is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data, error } = await supabaseClient
        .from('payments')
        .select('*')
        .eq('student_id', studentId)
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // DELETE /payments/:id - Delete payment
    if (req.method === 'DELETE' && paymentId) {
      const { error } = await supabaseClient
        .from('payments')
        .delete()
        .eq('id', paymentId);

      if (error) throw error;

      console.log('Payment deleted:', paymentId);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in payments function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
