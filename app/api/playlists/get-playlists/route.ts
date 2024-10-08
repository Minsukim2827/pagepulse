import { currentUser } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  // Get the current user from Clerk
  const user = await currentUser();

  if (!user) {
    return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
  }

  // Extract the Clerk ID from the user object
  const clerkId = user.id;

  // Fetch the user from Supabase using their Clerk ID
  const { data: existingUser, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_id', clerkId)
    .single();

  if (userError || !existingUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Fetch playlists and reviews for the user
  const { data: playlists, error: playlistError } = await supabase
    .from('playlists')
    .select('*')
    .eq('user_id', existingUser.id);

  if (playlistError) {
    return NextResponse.json({ error: playlistError.message }, { status: 500 });
  }

  const playlistIds = playlists.map((playlist) => playlist.id);

  const { data: reviews, error: reviewError } = await supabase
    .from('reviews')
    .select('*')
    .in('playlist_id', playlistIds);

  if (reviewError) {
    return NextResponse.json({ error: reviewError.message }, { status: 500 });
  }

  return NextResponse.json({ playlists, reviews });
}
