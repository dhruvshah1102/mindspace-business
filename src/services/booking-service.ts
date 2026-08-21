import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export type SessionFormat = 'group' | '1:1';
export type BookingStatus = 'requested' | 'confirmed' | 'cancelled';

export interface EmployeeBooking {
  id: string;
  sessionFormat: SessionFormat;
  preferredSlot: string | null;
  status: BookingStatus;
  notes: string;
  createdAt: string;
}

/**
 * Therapy session booking — captures the request only. There is no payment
 * gateway wired up yet; a real confirmation happens off-platform (MindSpace's
 * clinical desk reaches out), which is why `status` starts at 'requested'.
 */
export async function listMyBookings(userId: string): Promise<EmployeeBooking[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from('therapy_bookings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[mindspace] listMyBookings failed:', error);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    sessionFormat: row.session_format,
    preferredSlot: row.preferred_slot,
    status: row.status,
    notes: row.notes ?? '',
    createdAt: row.created_at,
  }));
}

export async function requestBooking(
  userId: string,
  orgId: string,
  booking: { sessionFormat: SessionFormat; preferredSlot: string | null; notes?: string },
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Booking requests cannot be sent right now. Please try again in a moment.');
  }

  const { error } = await supabase.from('therapy_bookings').insert({
    user_id: userId,
    org_id: orgId,
    session_format: booking.sessionFormat,
    preferred_slot: booking.preferredSlot,
    notes: booking.notes ?? '',
  });

  if (error) throw error;
}
