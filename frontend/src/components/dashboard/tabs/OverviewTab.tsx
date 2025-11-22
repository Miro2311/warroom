"use client";

import React, { useState } from "react";
import { PartnerNode } from "@/types";
import { StatCard } from "@/components/ui/stat-card";
import { AnimatedProgress, MetricDisplay } from "@/components/ui/metric-display";
import { AnimatedBadge } from "@/components/ui/animated-badge";
import { ParticleEffect } from "@/components/ui/particle-effect";
import { Carousel, CarouselSlide } from "@/components/ui/carousel";
import { usePartnerImages } from "@/hooks/usePartnerImages";
import {
  DollarSign,
  Clock,
  Heart,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Zap,
  Upload,
  Image as ImageIcon,
  X as XIcon,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";

interface OverviewTabProps {
  partner: PartnerNode;
  isEditing: boolean;
  editedPartner: PartnerNode;
  onUpdate: (updates: Partial<PartnerNode>) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  partner,
  isEditing,
  editedPartner,
  onUpdate,
}) => {
  const [imageBlurred, setImageBlurred] = useState(true);
  const {
    images: profileImages,
    loading: imagesLoading,
    uploading,
    uploadImage,
    deleteImage,
    deleteAllImages,
  } = usePartnerImages(editedPartner.id);

  // Calculate metrics
  const simpIndex =
    (editedPartner.financial_total + editedPartner.time_total * 20) /
    (editedPartner.intimacy_score || 1);
  const roi =
    editedPartner.financial_total / Math.max(editedPartner.intimacy_score, 1);
  const daysSinceUpdate = Math.floor(
    (Date.now() - new Date(editedPartner.last_updated_at).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  // Determine Simp Index variant
  const simpVariant =
    simpIndex > 500 ? "danger" : simpIndex > 200 ? "warning" : "success";

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const success = await uploadImage(file);
      if (!success) {
        alert("Failed to upload image. Please try again.");
      }
    }
  };

  // Handle removing all images
  const handleRemoveAllImages = async () => {
    const success = await deleteAllImages();
    if (!success) {
      alert("Failed to delete images. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <motion.div
        className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-white/5 to-transparent border border-white/10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-holo-cyan to-lust-pink flex items-center justify-center text-2xl">
            {editedPartner.nickname.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-white">
              {editedPartner.nickname}
            </h2>
            <AnimatedBadge
              variant={
                editedPartner.status === "Exclusive"
                  ? "success"
                  : editedPartner.status === "It's Complicated"
                  ? "warning"
                  : "info"
              }
              pulse
            >
              {editedPartner.status}
            </AnimatedBadge>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-mono text-white/50 uppercase">
            Active for
          </div>
          <div className="text-xl font-display font-bold text-white">
            {Math.floor(
              (Date.now() - new Date(editedPartner.created_at).getTime()) /
                (1000 * 60 * 60 * 24)
            )}{" "}
            days
          </div>
        </div>
      </motion.div>

      {/* Critical Simp Index Warning */}
      {simpIndex > 500 && (
        <motion.div
          className="relative p-6 rounded-lg bg-simp-red/10 border-2 border-simp-red overflow-hidden"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <ParticleEffect
            count={30}
            color="#FF2A2A"
            className="absolute inset-0 opacity-30"
          />
          <div className="relative z-10 flex items-center gap-4">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, -10, 10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            >
              <AlertTriangle className="w-12 h-12 text-simp-red" />
            </motion.div>
            <div>
              <h3 className="text-xl font-display font-bold text-simp-red uppercase">
                Critical Simp Alert
              </h3>
              <p className="text-sm text-white/70">
                Investment significantly exceeds intimacy returns. Tactical
                reassessment recommended.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Layout: Image Left, Stats Right */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left: Profile Image (1/3 width) */}
        <motion.div
          className="col-span-1"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="p-4 rounded-lg bg-white/5 border border-white/10 h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <ImageIcon className="w-4 h-4 text-holo-cyan" />
                <h3 className="text-xs font-mono text-white/50 uppercase tracking-wider">
                  Profile Images
                </h3>
              </div>
              {profileImages.length > 0 && (
                <span className="text-xs font-mono text-white/30">
                  {profileImages.length} {profileImages.length === 1 ? "photo" : "photos"}
                </span>
              )}
            </div>

            {imagesLoading ? (
              <div className="aspect-[3/4] rounded-lg bg-white/5 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-holo-cyan animate-spin" />
              </div>
            ) : profileImages.length > 0 ? (
              <div className="space-y-3">
                <Carousel
                  slides={profileImages}
                  blurred={imageBlurred}
                  aspectRatio="portrait"
                  showControls={true}
                  showIndicators={true}
                  autoPlay={false}
                />
                {isEditing && (
                  <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <label className="block cursor-pointer">
                      <motion.div
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-mono text-xs uppercase tracking-wider rounded transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-3 h-3" />
                            Add Image
                          </>
                        )}
                      </motion.div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                    <motion.button
                      onClick={handleRemoveAllImages}
                      className="w-full px-3 py-2 bg-simp-red/20 hover:bg-simp-red/30 border border-simp-red/50 text-simp-red font-mono text-xs uppercase tracking-wider rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={uploading}
                    >
                      Remove All
                    </motion.button>
                  </motion.div>
                )}
              </div>
            ) : (
              <label className={`cursor-pointer block ${!isEditing || uploading ? 'pointer-events-none' : ''}`}>
                <motion.div
                  className="relative aspect-[3/4] rounded-lg border-2 border-dashed border-white/20 hover:border-holo-cyan/50 bg-white/5 hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-2"
                  whileHover={{ scale: isEditing && !uploading ? 1.01 : 1 }}
                  whileTap={{ scale: isEditing && !uploading ? 0.99 : 1 }}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-8 h-8 text-holo-cyan animate-spin" />
                      <div className="text-center px-2">
                        <p className="text-xs font-display text-holo-cyan">
                          Uploading...
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-white/30" />
                      <div className="text-center px-2">
                        <p className="text-xs font-display text-white/70">
                          {isEditing ? "Upload Images" : "No images"}
                        </p>
                        {isEditing && (
                          <p className="text-[10px] font-mono text-white/50 mt-1">
                            Fog of War Enabled
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </motion.div>
                {isEditing && (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                )}
              </label>
            )}
          </div>
        </motion.div>

        {/* Right: Stats Grid (2/3 width) */}
        <motion.div
          className="col-span-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="grid grid-cols-2 gap-4">
            {/* Row 1 - Two cards */}
            <StatCard
              title="Simp Index"
              value={<MetricDisplay value={simpIndex} decimals={0} />}
              subtitle={
                simpIndex > 500
                  ? "CRITICAL"
                  : simpIndex > 200
                  ? "CAUTION"
                  : "SAFE"
              }
              icon={<TrendingUp className="w-5 h-5" />}
              variant={simpVariant}
              glowOnHover
            />
            <StatCard
              title="Cost Per Intimacy"
              value={<MetricDisplay value={roi} prefix="$" decimals={2} />}
              subtitle="ROI Metric"
              icon={<DollarSign className="w-5 h-5" />}
              variant="default"
            />

            {/* Row 2 - Two cards */}
            <StatCard
              title="Money Spent"
              value={<MetricDisplay value={editedPartner.financial_total} prefix="$" decimals={2} />}
              subtitle="Total Cost"
              icon={<DollarSign className="w-5 h-5" />}
              variant="default"
            />
            <StatCard
              title="Time Invested"
              value={`${editedPartner.time_total}h`}
              subtitle="Hours Spent"
              icon={<Clock className="w-5 h-5" />}
              variant="default"
            />

            {/* Row 3 - Single card spanning full width */}
            <div className="col-span-2">
              <StatCard
                title="Last Update"
                value={`${daysSinceUpdate}d ago`}
                subtitle={
                  daysSinceUpdate > 14 ? "Decaying..." : "Active"
                }
                icon={<Calendar className="w-5 h-5" />}
                variant={daysSinceUpdate > 14 ? "warning" : "default"}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Intimacy Score Section */}
      <motion.div
        className="p-6 rounded-lg bg-white/5 border border-white/10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <Heart className="w-5 h-5 text-lust-pink" />
          <h3 className="text-sm font-mono text-white/50 uppercase tracking-wider">
            Intimacy Score
          </h3>
        </div>
        {isEditing ? (
          <div className="space-y-4">
            <input
              type="range"
              min="1"
              max="10"
              value={editedPartner.intimacy_score}
              onChange={(e) =>
                onUpdate({ intimacy_score: parseInt(e.target.value) })
              }
              className="w-full accent-holo-cyan"
            />
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono text-white/50">Low</span>
              <motion.div
                className="text-4xl font-mono font-bold text-holo-cyan"
                key={editedPartner.intimacy_score}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {editedPartner.intimacy_score}
              </motion.div>
              <span className="text-xs font-mono text-white/50">High</span>
            </div>
          </div>
        ) : (
          <AnimatedProgress
            value={partner.intimacy_score}
            max={10}
            showLabel
            variant="gradient"
            height="lg"
          />
        )}
      </motion.div>

      {/* Time Input - Only editable field */}
      {isEditing && (
        <motion.div
          className="p-6 rounded-lg bg-white/5 border border-white/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <label className="text-xs font-mono text-white/50 uppercase tracking-wider flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4" />
            Time Invested (Hours)
          </label>
          <input
            type="number"
            value={editedPartner.time_total}
            onChange={(e) =>
              onUpdate({ time_total: parseFloat(e.target.value) || 0 })
            }
            className="w-full bg-white/10 border border-white/20 px-4 py-3 rounded text-white font-mono focus:outline-none focus:border-holo-cyan transition-colors"
            placeholder="0"
          />
          <p className="text-xs text-white/50 mt-2 font-mono">
            Money spent is auto-calculated from Financial Tab transactions
          </p>
        </motion.div>
      )}

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          className="p-4 rounded bg-white/5 border border-white/10"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center gap-2 text-xs font-mono text-white/50 uppercase mb-2">
            <Calendar className="w-4 h-4" />
            Created
          </div>
          <div className="text-sm font-mono text-white">
            {new Date(partner.created_at).toLocaleDateString()}
          </div>
        </motion.div>
        <motion.div
          className="p-4 rounded bg-white/5 border border-white/10"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center gap-2 text-xs font-mono text-white/50 uppercase mb-2">
            <Calendar className="w-4 h-4" />
            Last Updated
          </div>
          <div className="text-sm font-mono text-white">
            {new Date(partner.last_updated_at).toLocaleDateString()}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
