"use client";

import React, { useState, useEffect } from "react";
import { PartnerNode } from "@/types";
import { AnimatedBadge } from "@/components/ui/animated-badge";
import { StatCard } from "@/components/ui/stat-card";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Star,
  Flag,
  Users,
  Plus,
  Shield,
  X,
  Send,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface IntelTabProps {
  partner: PartnerNode;
}

interface GroupNote {
  id: string;
  partner_id: string;
  author_id: string;
  author_name: string;
  content: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
  user_vote: 'up' | 'down' | null;
}

interface RedFlag {
  id: string;
  partner_id: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  reported_by_id: string;
  reported_by_name: string;
  created_at: string;
}

interface PeerRating {
  id: string;
  partner_id: string;
  rater_id: string;
  rater_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export const IntelTab: React.FC<IntelTabProps> = ({ partner }) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<GroupNote[]>([]);
  const [redFlags, setRedFlags] = useState<RedFlag[]>([]);
  const [ratings, setRatings] = useState<PeerRating[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [showAddNote, setShowAddNote] = useState(false);
  const [showAddFlag, setShowAddFlag] = useState(false);
  const [showAddRating, setShowAddRating] = useState(false);

  // Form state
  const [newNote, setNewNote] = useState("");
  const [newFlag, setNewFlag] = useState({ description: "", severity: "medium" as const });
  const [newRating, setNewRating] = useState({ rating: 5, comment: "" });

  useEffect(() => {
    if (partner?.id) {
      loadIntelData();
    }
  }, [partner?.id]);

  const loadIntelData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadNotes(), loadRedFlags(), loadRatings()]);
    } catch (error) {
      console.error('Error loading intel data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotes = async () => {
    try {
      const { data: notesData, error: notesError } = await supabase
        .from('partner_notes')
        .select('*')
        .eq('partner_id', partner.id)
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;

      if (!notesData || notesData.length === 0) {
        setNotes([]);
        return;
      }

      // Get unique author IDs
      const authorIds = [...new Set(notesData.map(note => note.author_id))];

      // Fetch usernames
      const { data: usersData } = await supabase
        .from('users')
        .select('id, username')
        .in('id', authorIds);

      const usersMap = new Map(usersData?.map(u => [u.id, u.username]) || []);

      // Get user's votes for these notes
      const noteIds = notesData.map(n => n.id);
      const { data: votesData } = await supabase
        .from('partner_note_votes')
        .select('note_id, vote_type')
        .in('note_id', noteIds)
        .eq('user_id', user?.id || '');

      const votesMap = new Map(votesData?.map(v => [v.note_id, v.vote_type]) || []);

      setNotes(notesData.map(note => ({
        ...note,
        author_name: usersMap.get(note.author_id) || 'Anonymous',
        user_vote: votesMap.get(note.id) || null,
      })));
    } catch (error) {
      // Silently fail if table doesn't exist yet
      setNotes([]);
    }
  };

  const loadRedFlags = async () => {
    try {
      const { data: flagsData, error: flagsError } = await supabase
        .from('partner_red_flags')
        .select('*')
        .eq('partner_id', partner.id)
        .order('created_at', { ascending: false });

      if (flagsError) throw flagsError;

      if (!flagsData || flagsData.length === 0) {
        setRedFlags([]);
        return;
      }

      // Get unique reporter IDs
      const reporterIds = [...new Set(flagsData.map(flag => flag.reported_by_id))];

      // Fetch usernames
      const { data: usersData } = await supabase
        .from('users')
        .select('id, username')
        .in('id', reporterIds);

      const usersMap = new Map(usersData?.map(u => [u.id, u.username]) || []);

      setRedFlags(flagsData.map(flag => ({
        ...flag,
        reported_by_name: usersMap.get(flag.reported_by_id) || 'Anonymous',
      })));
    } catch (error) {
      // Silently fail if table doesn't exist yet
      setRedFlags([]);
    }
  };

  const handleDeleteRedFlag = async (flagId: string, reportedById: string) => {
    // Only the partner owner can delete red flags (even if reported by others)
    const isOwner = user?.id === partner.user_id;

    if (!isOwner) {
      console.error('Not authorized to delete red flags - only partner owner can delete');
      return;
    }

    try {
      const { error } = await supabase
        .from('partner_red_flags')
        .delete()
        .eq('id', flagId);

      if (error) throw error;

      setRedFlags(redFlags.filter(f => f.id !== flagId));
    } catch (error) {
      console.error('Error deleting red flag:', error);
    }
  };

  const handleDeleteNote = async (noteId: string, authorId: string) => {
    // Only the partner owner can delete notes (even if written by others)
    const isOwner = user?.id === partner.user_id;

    if (!isOwner) {
      console.error('Not authorized to delete notes - only partner owner can delete');
      return;
    }

    try {
      const { error } = await supabase
        .from('partner_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      setNotes(notes.filter(n => n.id !== noteId));
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const loadRatings = async () => {
    try {
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('partner_ratings')
        .select('*')
        .eq('partner_id', partner.id)
        .order('created_at', { ascending: false });

      if (ratingsError) throw ratingsError;

      if (!ratingsData || ratingsData.length === 0) {
        setRatings([]);
        return;
      }

      // Get unique rater IDs
      const raterIds = [...new Set(ratingsData.map(rating => rating.rater_id))];

      // Fetch usernames
      const { data: usersData } = await supabase
        .from('users')
        .select('id, username')
        .in('id', raterIds);

      const usersMap = new Map(usersData?.map(u => [u.id, u.username]) || []);

      setRatings(ratingsData.map(rating => ({
        ...rating,
        rater_name: usersMap.get(rating.rater_id) || 'Anonymous',
      })));
    } catch (error) {
      // Silently fail if table doesn't exist yet
      setRatings([]);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !user) return;

    const { error } = await supabase.from('partner_notes').insert({
      partner_id: partner.id,
      author_id: user.id,
      content: newNote.trim(),
      upvotes: 0,
      downvotes: 0,
    });

    if (error) {
      console.error('Error adding note:', error);
      return;
    }

    setNewNote("");
    setShowAddNote(false);
    await loadNotes();
  };

  const handleAddFlag = async () => {
    if (!newFlag.description.trim() || !user) return;

    const { error } = await supabase.from('partner_red_flags').insert({
      partner_id: partner.id,
      reported_by_id: user.id,
      description: newFlag.description.trim(),
      severity: newFlag.severity,
    });

    if (error) {
      console.error('Error adding red flag:', error);
      return;
    }

    setNewFlag({ description: "", severity: "medium" });
    setShowAddFlag(false);
    await loadRedFlags();
  };

  const handleAddRating = async () => {
    if (!user) return;

    // Check if user already rated
    const existingRating = ratings.find(r => r.rater_id === user.id);

    if (existingRating) {
      // Update existing rating
      const { error } = await supabase
        .from('partner_ratings')
        .update({
          rating: newRating.rating,
          comment: newRating.comment.trim(),
        })
        .eq('id', existingRating.id);

      if (error) {
        console.error('Error updating rating:', error);
        return;
      }
    } else {
      // Insert new rating
      const { error } = await supabase.from('partner_ratings').insert({
        partner_id: partner.id,
        rater_id: user.id,
        rating: newRating.rating,
        comment: newRating.comment.trim(),
      });

      if (error) {
        console.error('Error adding rating:', error);
        return;
      }
    }

    setNewRating({ rating: 5, comment: "" });
    setShowAddRating(false);
    await loadRatings();
  };

  const handleVote = async (noteId: string, voteType: 'up' | 'down') => {
    if (!user) return;

    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    try {
      // Check if user already voted (using maybeSingle to avoid error when no vote exists)
      const { data: existingVote, error: voteError } = await supabase
        .from('partner_note_votes')
        .select('*')
        .eq('note_id', noteId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (voteError) {
        console.error('Error checking existing vote:', voteError);
        return;
      }

      if (existingVote) {
        // User already voted
        if (existingVote.vote_type === voteType) {
          // Clicking the same vote - remove it (toggle off)
          const { error: deleteError } = await supabase
            .from('partner_note_votes')
            .delete()
            .eq('note_id', noteId)
            .eq('user_id', user.id);

          if (deleteError) {
            console.error('Error removing vote:', deleteError);
            return;
          }
        } else {
          // Switching vote (up to down or down to up)
          const { error: updateError } = await supabase
            .from('partner_note_votes')
            .update({ vote_type: voteType })
            .eq('note_id', noteId)
            .eq('user_id', user.id);

          if (updateError) {
            console.error('Error switching vote:', updateError);
            return;
          }
        }
      } else {
        // New vote - insert with error handling for unique constraint
        const { error: insertError } = await supabase
          .from('partner_note_votes')
          .insert({
            note_id: noteId,
            user_id: user.id,
            vote_type: voteType,
          });

        if (insertError) {
          // If unique constraint violation, it means another request already inserted
          // Just reload to get the latest state
          console.error('Error inserting vote:', insertError);
          await loadNotes();
          return;
        }
      }

      // Recalculate vote counts from the votes table to ensure accuracy
      const { count: upvoteCount } = await supabase
        .from('partner_note_votes')
        .select('*', { count: 'exact', head: true })
        .eq('note_id', noteId)
        .eq('vote_type', 'up');

      const { count: downvoteCount } = await supabase
        .from('partner_note_votes')
        .select('*', { count: 'exact', head: true })
        .eq('note_id', noteId)
        .eq('vote_type', 'down');

      // Update the note's vote counts with accurate values
      await supabase
        .from('partner_notes')
        .update({
          upvotes: upvoteCount || 0,
          downvotes: downvoteCount || 0,
        })
        .eq('id', noteId);

      // Reload notes to reflect changes
      await loadNotes();
    } catch (error) {
      console.error('Error voting:', error);
      // Reload to ensure UI is in sync with database
      await loadNotes();
    }
  };

  const averageRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
    : 0;

  const userRating = ratings.find(r => r.rater_id === user?.id);

  const severityVariant = {
    low: "default" as const,
    medium: "warning" as const,
    high: "danger" as const,
  };

  const getRelativeTime = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white/50 font-mono">Loading intelligence data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-display font-bold text-white uppercase">
          Intelligence Report
        </h3>
        <p className="text-sm text-white/50 font-mono">
          Group insights, ratings, and red flag analysis
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          title="Peer Rating"
          value={averageRating > 0 ? averageRating.toFixed(1) : "N/A"}
          subtitle={`${ratings.length} friends rated`}
          icon={<Star className="w-5 h-5" />}
          variant={averageRating >= 7 ? "success" : averageRating >= 5 ? "default" : "warning"}
        />
        <StatCard
          title="Red Flags"
          value={redFlags.length}
          subtitle={`${redFlags.filter((f) => f.severity === "high").length} high severity`}
          icon={<AlertTriangle className="w-5 h-5" />}
          variant={redFlags.some((f) => f.severity === "high") ? "danger" : "default"}
        />
        <StatCard
          title="Group Notes"
          value={notes.length}
          subtitle="friend insights"
          icon={<MessageCircle className="w-5 h-5" />}
          variant="default"
        />
      </div>

      {/* Peer Ratings Section */}
      <motion.div
        className="p-6 rounded-lg bg-white/5 border border-white/10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-holo-cyan" />
            <h4 className="text-sm font-mono text-white/50 uppercase tracking-wider">
              Friend Ratings
            </h4>
          </div>
          <div className="flex items-center gap-4">
            {averageRating > 0 && (
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <span className="text-2xl font-mono font-bold text-white">
                  {averageRating.toFixed(1)}
                </span>
                <span className="text-sm text-white/50">/10</span>
              </div>
            )}
            <motion.button
              className="flex items-center gap-2 px-3 py-1.5 bg-holo-cyan/20 hover:bg-holo-cyan/30 border border-holo-cyan/50 text-holo-cyan font-mono text-xs uppercase tracking-wider rounded transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (userRating) {
                  setNewRating({ rating: userRating.rating, comment: userRating.comment });
                }
                setShowAddRating(!showAddRating);
              }}
            >
              <Star className="w-3 h-3" />
              {userRating ? "Edit Rating" : "Add Rating"}
            </motion.button>
          </div>
        </div>

        {/* Add Rating Form */}
        <AnimatePresence>
          {showAddRating && (
            <motion.div
              className="mb-4 p-4 rounded-lg bg-white/5 border border-holo-cyan/30"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-mono text-white/50 uppercase mb-2 block">
                    Your Rating (1-10)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={newRating.rating}
                    onChange={(e) => setNewRating({ ...newRating, rating: parseInt(e.target.value) })}
                    className="w-full accent-holo-cyan"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs font-mono text-white/50">Poor</span>
                    <span className="text-2xl font-mono font-bold text-holo-cyan">
                      {newRating.rating}/10
                    </span>
                    <span className="text-xs font-mono text-white/50">Excellent</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-mono text-white/50 uppercase mb-2 block">
                    Comment (Optional)
                  </label>
                  <textarea
                    value={newRating.comment}
                    onChange={(e) => setNewRating({ ...newRating, comment: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 px-3 py-2 rounded text-white text-sm focus:outline-none focus:border-holo-cyan resize-none"
                    rows={2}
                    placeholder="Share your thoughts..."
                  />
                </div>
                <div className="flex gap-2">
                  <motion.button
                    onClick={handleAddRating}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-holo-cyan/20 hover:bg-holo-cyan/30 border border-holo-cyan text-holo-cyan font-mono text-sm uppercase rounded transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Send className="w-4 h-4" />
                    {userRating ? "Update" : "Submit"}
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      setShowAddRating(false);
                      setNewRating({ rating: 5, comment: "" });
                    }}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-mono text-sm uppercase rounded transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ratings List */}
        <div className="space-y-3">
          {ratings.length === 0 ? (
            <div className="text-center py-8 text-white/50 font-mono text-sm">
              No ratings yet. Be the first to rate!
            </div>
          ) : (
            ratings.map((rating, index) => (
              <motion.div
                key={rating.id}
                className="flex items-start gap-4 p-3 rounded bg-white/5"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-holo-cyan to-lust-pink flex items-center justify-center text-sm font-bold text-white">
                  {rating.rater_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-display font-bold text-white">
                      {rating.rater_name}
                      {rating.rater_id === user?.id && (
                        <span className="text-xs text-holo-cyan ml-2">(You)</span>
                      )}
                    </span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm font-mono text-yellow-400">
                        {rating.rating}/10
                      </span>
                    </div>
                  </div>
                  {rating.comment && (
                    <p className="text-xs text-white/70">{rating.comment}</p>
                  )}
                  <span className="text-xs text-white/50 font-mono mt-1 block">
                    {getRelativeTime(rating.created_at)}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* Red Flags Section */}
      <motion.div
        className="p-6 rounded-lg bg-white/5 border border-white/10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Flag className="w-5 h-5 text-simp-red" />
            <h4 className="text-sm font-mono text-white/50 uppercase tracking-wider">
              Red Flags
            </h4>
          </div>
          <motion.button
            className="flex items-center gap-2 px-3 py-1.5 bg-simp-red/20 hover:bg-simp-red/30 border border-simp-red/50 text-simp-red font-mono text-xs uppercase tracking-wider rounded transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddFlag(!showAddFlag)}
          >
            <Plus className="w-3 h-3" />
            Report
          </motion.button>
        </div>

        {/* Add Flag Form */}
        <AnimatePresence>
          {showAddFlag && (
            <motion.div
              className="mb-4 p-4 rounded-lg bg-white/5 border border-simp-red/30"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-mono text-white/50 uppercase mb-2 block">
                    Severity
                  </label>
                  <div className="flex gap-2">
                    {(['low', 'medium', 'high'] as const).map((severity) => (
                      <motion.button
                        key={severity}
                        onClick={() => setNewFlag({ ...newFlag, severity })}
                        className={`flex-1 px-3 py-2 rounded font-mono text-xs uppercase transition-colors ${
                          newFlag.severity === severity
                            ? severity === 'high'
                              ? 'bg-simp-red/30 border-2 border-simp-red text-simp-red'
                              : severity === 'medium'
                              ? 'bg-yellow-400/30 border-2 border-yellow-400 text-yellow-400'
                              : 'bg-white/30 border-2 border-white text-white'
                            : 'bg-white/10 border border-white/20 text-white/50'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {severity}
                      </motion.button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-mono text-white/50 uppercase mb-2 block">
                    Description
                  </label>
                  <textarea
                    value={newFlag.description}
                    onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 px-3 py-2 rounded text-white text-sm focus:outline-none focus:border-simp-red resize-none"
                    rows={3}
                    placeholder="Describe the red flag..."
                  />
                </div>
                <div className="flex gap-2">
                  <motion.button
                    onClick={handleAddFlag}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-simp-red/20 hover:bg-simp-red/30 border border-simp-red text-simp-red font-mono text-sm uppercase rounded transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Send className="w-4 h-4" />
                    Report
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      setShowAddFlag(false);
                      setNewFlag({ description: "", severity: "medium" });
                    }}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-mono text-sm uppercase rounded transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Flags List */}
        <div className="space-y-3">
          {redFlags.length === 0 ? (
            <div className="text-center py-8 text-white/50 font-mono text-sm">
              No red flags reported yet.
            </div>
          ) : (
            redFlags.map((flag, index) => {
              // Only partner owner can delete red flags
              const canDelete = user?.id === partner.user_id;

              return (
                <motion.div
                  key={flag.id}
                  className="p-4 rounded bg-white/5 border border-white/10 group relative"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle
                        className={`w-4 h-4 ${
                          flag.severity === "high"
                            ? "text-simp-red"
                            : flag.severity === "medium"
                            ? "text-yellow-400"
                            : "text-white/50"
                        }`}
                      />
                      <AnimatedBadge variant={severityVariant[flag.severity]} size="sm">
                        {flag.severity}
                      </AnimatedBadge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-white/50">
                        {getRelativeTime(flag.created_at)}
                      </span>
                      {canDelete && (
                        <motion.button
                          onClick={() => handleDeleteRedFlag(flag.id, flag.reported_by_id)}
                          className="w-6 h-6 rounded bg-simp-red/20 text-simp-red opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-simp-red/30"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title="Delete red flag"
                        >
                          <Trash2 className="w-3 h-3" />
                        </motion.button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-white mb-2">{flag.description}</p>
                  <div className="text-xs text-white/50 font-mono">
                    Reported by {flag.reported_by_name}
                    {flag.reported_by_id === user?.id && " (You)"}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>

      {/* Friend Notes/Roasts Section */}
      <motion.div
        className="p-6 rounded-lg bg-white/5 border border-white/10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5 text-toxic-green" />
            <h4 className="text-sm font-mono text-white/50 uppercase tracking-wider">
              Group Notes & Roasts
            </h4>
          </div>
          <motion.button
            className="flex items-center gap-2 px-3 py-1.5 bg-toxic-green/20 hover:bg-toxic-green/30 border border-toxic-green/50 text-toxic-green font-mono text-xs uppercase tracking-wider rounded transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddNote(!showAddNote)}
          >
            <Plus className="w-3 h-3" />
            Add Note
          </motion.button>
        </div>

        {/* Add Note Form */}
        <AnimatePresence>
          {showAddNote && (
            <motion.div
              className="mb-4 p-4 rounded-lg bg-white/5 border border-toxic-green/30"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="space-y-3">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 px-3 py-2 rounded text-white text-sm focus:outline-none focus:border-toxic-green resize-none"
                  rows={3}
                  placeholder="Share your thoughts, advice, or roasts..."
                />
                <div className="flex gap-2">
                  <motion.button
                    onClick={handleAddNote}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-toxic-green/20 hover:bg-toxic-green/30 border border-toxic-green text-toxic-green font-mono text-sm uppercase rounded transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Send className="w-4 h-4" />
                    Post
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      setShowAddNote(false);
                      setNewNote("");
                    }}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-mono text-sm uppercase rounded transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notes List */}
        <div className="space-y-4">
          {notes.length === 0 ? (
            <div className="text-center py-8 text-white/50 font-mono text-sm">
              No notes yet. Share the first insight!
            </div>
          ) : (
            notes.map((note, index) => {
              // Only the partner owner can delete notes
              const canDelete = user?.id === partner.user_id;

              return (
                <motion.div
                  key={note.id}
                  className="p-4 rounded bg-white/5 border border-white/10 group relative"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-toxic-green to-holo-cyan flex items-center justify-center text-xs font-bold text-black">
                        {note.author_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-sm font-display font-bold text-white">
                          {note.author_name}
                          {note.author_id === user?.id && (
                            <span className="text-xs text-toxic-green ml-2">(You)</span>
                          )}
                        </span>
                        <span className="text-xs text-white/50 ml-2">
                          {getRelativeTime(note.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.button
                        className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                          note.user_vote === 'up'
                            ? 'bg-toxic-green/40 border border-toxic-green'
                            : 'bg-toxic-green/20 hover:bg-toxic-green/30'
                        }`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleVote(note.id, 'up')}
                      >
                        <ThumbsUp
                          className={`w-3 h-3 ${
                            note.user_vote === 'up' ? 'text-toxic-green fill-toxic-green' : 'text-toxic-green'
                          }`}
                        />
                        <span className="text-xs font-mono text-toxic-green">
                          {note.upvotes}
                        </span>
                      </motion.button>
                      <motion.button
                        className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                          note.user_vote === 'down'
                            ? 'bg-simp-red/40 border border-simp-red'
                            : 'bg-simp-red/20 hover:bg-simp-red/30'
                        }`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleVote(note.id, 'down')}
                      >
                        <ThumbsDown
                          className={`w-3 h-3 ${
                            note.user_vote === 'down' ? 'text-simp-red fill-simp-red' : 'text-simp-red'
                          }`}
                        />
                        <span className="text-xs font-mono text-simp-red">
                          {note.downvotes}
                        </span>
                      </motion.button>
                      {canDelete && (
                        <motion.button
                          onClick={() => handleDeleteNote(note.id, note.author_id)}
                          className="w-6 h-6 rounded bg-simp-red/20 text-simp-red opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-simp-red/30"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title="Delete note"
                        >
                          <Trash2 className="w-3 h-3" />
                        </motion.button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-white/90">{note.content}</p>
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>

      {/* Trust Score */}
      <motion.div
        className="p-6 rounded-lg bg-gradient-to-br from-holo-cyan/10 to-transparent border border-holo-cyan/30"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="flex items-center gap-4">
          <Shield className="w-12 h-12 text-holo-cyan" />
          <div>
            <h5 className="text-lg font-display font-bold text-holo-cyan uppercase">
              Trust Score: {averageRating >= 7 ? "High" : averageRating >= 5 ? "Medium" : averageRating > 0 ? "Low" : "Unrated"}
            </h5>
            <p className="text-sm text-white/70">
              Based on {ratings.length} peer ratings and {redFlags.length} red flags
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
