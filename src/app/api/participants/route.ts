import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/integrations/supabase/client'

// GET /api/participants - Fetch participants
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('event_id')
    const ticketNumber = searchParams.get('ticket_number')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('participants')
      .select('*, form_submissions(*)', { count: 'exact' })
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })

    // Filter by ticket number
    if (ticketNumber) {
      query = query.eq('ticket_number', ticketNumber)
    }

    // Filter by status
    if (status) {
      query = query.eq('status', status)
    }

    // Search
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    // Pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ 
      data,
      total: count,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/participants - Create participant(s)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Single participant
    if (!Array.isArray(body)) {
      const ticketNumber = body.ticket_number || 
        `TKT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

      const { data, error } = await supabase
        .from('participants')
        .insert({
          ...body,
          ticket_number: ticketNumber
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({ data })
    }

    // Bulk insert
    const participants = body.map(p => ({
      ...p,
      ticket_number: p.ticket_number || 
        `TKT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
    }))

    const { data, error } = await supabase
      .from('participants')
      .insert(participants)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data, count: data?.length })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/participants - Update participant (check-in)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Participant ID is required' },
        { status: 400 }
      )
    }

    // Handle check-in
    if (updates.checkIn && updates.checked_in_by) {
      updates.status = 'checked_in'
      updates.checked_in_at = new Date().toISOString()
      delete updates.checkIn
    }

    const { data, error } = await supabase
      .from('participants')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/participants - Delete participant
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Participant ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('participants')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
