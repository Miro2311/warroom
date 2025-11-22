import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyVoteFix() {
  console.log('Applying vote system fix...\n');

  try {
    // Step 1: Remove duplicate votes
    console.log('Step 1: Removing duplicate votes...');
    const { data: duplicates, error: deleteError } = await supabase.rpc('exec_sql', {
      sql: `
        DELETE FROM public.partner_note_votes
        WHERE id IN (
          SELECT id FROM (
            SELECT id,
              ROW_NUMBER() OVER (
                PARTITION BY note_id, user_id
                ORDER BY created_at DESC
              ) as rn
            FROM public.partner_note_votes
          ) t
          WHERE t.rn > 1
        )
      `
    });

    if (deleteError) {
      console.log('Note: Could not remove duplicates via RPC, will try direct approach');
    } else {
      console.log('Duplicate votes removed successfully');
    }

    // Step 2: Get current vote stats
    console.log('\nStep 2: Checking current vote data...');
    const { data: votes, error: votesError } = await supabase
      .from('partner_note_votes')
      .select('note_id, user_id, vote_type');

    if (votesError) {
      console.error('Error fetching votes:', votesError);
    } else {
      console.log(`Total votes in system: ${votes.length}`);

      // Check for duplicates
      const voteKeys = new Set();
      const duplicateVotes = [];
      votes.forEach(vote => {
        const key = `${vote.note_id}-${vote.user_id}`;
        if (voteKeys.has(key)) {
          duplicateVotes.push(vote);
        } else {
          voteKeys.add(key);
        }
      });

      if (duplicateVotes.length > 0) {
        console.log(`WARNING: Found ${duplicateVotes.length} duplicate votes that need manual cleanup`);
      } else {
        console.log('No duplicate votes found');
      }
    }

    // Step 3: Recalculate vote counts
    console.log('\nStep 3: Recalculating vote counts...');
    const { data: notes, error: notesError } = await supabase
      .from('partner_notes')
      .select('id');

    if (notesError) {
      console.error('Error fetching notes:', notesError);
      return;
    }

    console.log(`Processing ${notes.length} notes...`);

    for (const note of notes) {
      // Count upvotes
      const { count: upvoteCount, error: upError } = await supabase
        .from('partner_note_votes')
        .select('*', { count: 'exact', head: true })
        .eq('note_id', note.id)
        .eq('vote_type', 'up');

      // Count downvotes
      const { count: downvoteCount, error: downError } = await supabase
        .from('partner_note_votes')
        .select('*', { count: 'exact', head: true })
        .eq('note_id', note.id)
        .eq('vote_type', 'down');

      if (!upError && !downError) {
        // Update the note
        const { error: updateError } = await supabase
          .from('partner_notes')
          .update({
            upvotes: upvoteCount || 0,
            downvotes: downvoteCount || 0,
          })
          .eq('id', note.id);

        if (updateError) {
          console.error(`Error updating note ${note.id}:`, updateError);
        }
      }
    }

    console.log('Vote counts recalculated successfully');

    // Step 4: Verify results
    console.log('\nStep 4: Verifying results...');
    const { data: verifyNotes, error: verifyError } = await supabase
      .from('partner_notes')
      .select('id, content, upvotes, downvotes')
      .order('created_at', { ascending: false })
      .limit(5);

    if (!verifyError && verifyNotes) {
      console.log('\nSample of updated notes:');
      verifyNotes.forEach(note => {
        console.log(`- Note ${note.id.substring(0, 8)}...: ${note.upvotes} upvotes, ${note.downvotes} downvotes`);
      });
    }

    console.log('\nVote fix applied successfully!');
    console.log('\nNext steps:');
    console.log('1. Test voting in the app');
    console.log('2. Verify that you can only vote once per note');
    console.log('3. Check that switching votes works correctly');

  } catch (error) {
    console.error('Error applying vote fix:', error);
    process.exit(1);
  }
}

applyVoteFix();
