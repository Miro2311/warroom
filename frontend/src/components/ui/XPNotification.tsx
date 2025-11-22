"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, TrendingUp, TrendingDown } from "lucide-react";

export interface XPNotificationData {
  amount: number;
  reason: string;
  category: string;
}

interface XPNotificationProps {
  notification: XPNotificationData | null;
  onComplete: () => void;
}

export const XPNotification: React.FC<XPNotificationProps> = ({
  notification,
  onComplete,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onComplete, 300);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [notification, onComplete]);

  if (!notification) return null;

  const isPositive = notification.amount > 0;
  const color = isPositive ? "holo-cyan" : "simp-red";
  const Icon = isPositive ? TrendingUp : TrendingDown;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed top-24 right-6 z-[300] pointer-events-none"
          initial={{ opacity: 0, x: 100, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div
            className={`bg-deep-void/95 backdrop-blur-sm border-2 border-${color} rounded-lg shadow-2xl shadow-${color}/50 p-4 min-w-[280px]`}
          >
            <div className="flex items-center gap-3">
              {/* Icon */}
              <motion.div
                className={`w-10 h-10 rounded-full bg-gradient-to-br from-${color} to-${
                  isPositive ? "lust-pink" : "toxic-green"
                } flex items-center justify-center`}
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <Zap className="w-5 h-5 text-white" />
              </motion.div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-lg font-bold font-display ${
                      isPositive ? "text-holo-cyan" : "text-simp-red"
                    }`}
                  >
                    {isPositive ? "+" : ""}
                    {notification.amount} XP
                  </span>
                  <Icon
                    className={`w-4 h-4 ${
                      isPositive ? "text-toxic-green" : "text-simp-red"
                    }`}
                  />
                </div>
                <p className="text-xs text-gray-400 font-mono">
                  {formatReason(notification.reason)}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <motion.div
              className="mt-3 h-1 bg-gray-800 rounded-full overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div
                className={`h-full bg-gradient-to-r from-${color} to-lust-pink`}
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 3, ease: "linear" }}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

function formatReason(reason: string): string {
  const formatted = reason
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return formatted;
}
