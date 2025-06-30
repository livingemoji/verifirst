import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Submit scam report function called')
    
    const { title, description, category, location, contact } = await req.json()
    console.log('Received data:', { title, description, category, location, contact })
    
    if (!title || !description || !category) {
      console.log('Missing required fields')
      return new Response(
        JSON.stringify({ error: 'Title, description, and category are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')
    
    console.log('Supabase URL exists:', !!supabaseUrl)
    console.log('Supabase Key exists:', !!supabaseKey)
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get the user if authenticated (optional for submissions)
    let userId = null
    const authHeader = req.headers.get('Authorization')
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '')
        const { data: { user } } = await supabase.auth.getUser(token)
        userId = user?.id
        console.log('Authenticated user:', userId)
      } catch (error) {
        console.log('No authenticated user, proceeding with anonymous submission')
      }
    }

    // Get category ID
    console.log('Looking up category:', category)
    const { data: categoryData, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('name', category)
      .single()

    if (categoryError) {
      console.error('Category lookup error:', categoryError)
      return new Response(
        JSON.stringify({ error: 'Invalid category', details: categoryError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Category found:', categoryData)

    // Insert the scam report submission
    const insertData = {
      title,
      description,
      category_id: categoryData.id,
      location,
      contact_info: contact,
      user_id: userId,
      status: 'pending'
    }
    
    console.log('Inserting data:', insertData)
    
    const { data, error } = await supabase
      .from('user_submitted_scams')
      .insert(insertData)
      .select()

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to submit report', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Report submitted successfully:', data[0].id)

    return new Response(
      JSON.stringify({ 
        success: true,
        reportId: data[0].id,
        message: 'Report submitted successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
