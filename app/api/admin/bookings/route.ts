import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Verify admin token
async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { valid: false, user: null, error: 'Unauthorized' };
  }

  const token = authHeader.slice(7);

  try {
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return { valid: false, user: null, error: 'Invalid token' };
    }

    return { valid: true, user };
  } catch {
    return { valid: false, user: null, error: 'Token verification failed' };
  }
}

// GET all bookings
export async function GET(request: NextRequest) {
  try {
    const { valid, error } = await verifyAdmin(request);

    if (!valid) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const bookings = await prisma.booking.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Get bookings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

// UPDATE booking status
export async function PUT(request: NextRequest) {
  try {
    const { valid, error } = await verifyAdmin(request);

    if (!valid) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const data = await request.json();
    const { id, status } = data;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing id or status' },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Update booking error:', error);
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    );
  }
}

// DELETE booking
export async function DELETE(request: NextRequest) {
  try {
    const { valid, error } = await verifyAdmin(request);

    if (!valid) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing booking id' },
        { status: 400 }
      );
    }

    // Get the booking to find date and time
    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Delete the booking
    await prisma.booking.delete({
      where: { id },
    });

    // Also delete the associated reserved slot if it exists
    await prisma.reservedSlot.deleteMany({
      where: {
        date: booking.date,
        time: booking.time,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete booking error:', error);
    return NextResponse.json(
      { error: 'Failed to delete booking' },
      { status: 500 }
    );
  }
}
