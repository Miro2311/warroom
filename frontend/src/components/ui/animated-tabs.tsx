"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, Transition } from "framer-motion";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface AnimatedTabsProps {
  tabs: Tab[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

const useTabsContext = () => {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs compound components must be used within AnimatedTabs");
  }
  return context;
};

export const AnimatedTabs: React.FC<AnimatedTabsProps> = ({
  tabs,
  defaultValue,
  value: controlledValue,
  onValueChange,
  children,
  className,
}) => {
  const [internalValue, setInternalValue] = useState(
    defaultValue || tabs[0]?.id || ""
  );

  const activeTab = controlledValue !== undefined ? controlledValue : internalValue;

  const handleTabChange = (newValue: string) => {
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider
      value={{ activeTab, setActiveTab: handleTabChange }}
    >
      <div className={cn("w-full", className)}>
        {/* Tab List */}
        <div className="border-b border-white/10 mb-4 md:mb-6">
          <div className="flex gap-1 relative overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "relative px-4 md:px-6 py-3 md:py-4 font-display font-bold text-xs md:text-sm uppercase tracking-wider transition-colors",
                    "flex items-center gap-2 whitespace-nowrap min-h-[44px]",
                    isActive
                      ? "text-holo-cyan"
                      : "text-white/50 hover:text-white/70"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {tab.icon && (
                    <motion.span
                      animate={{
                        rotate: isActive ? [0, -10, 10, 0] : 0,
                      }}
                      transition={{ duration: 0.5 }}
                    >
                      {tab.icon}
                    </motion.span>
                  )}
                  <span>{tab.label}</span>

                  {/* Active Tab Indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-holo-cyan"
                      style={{ boxShadow: "0 0 10px #00F0FF" }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="relative">{children}</div>
      </div>
    </TabsContext.Provider>
  );
};

interface TabContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  transition?: Transition;
}

export const TabContent: React.FC<TabContentProps> = ({
  value,
  children,
  className,
  transition,
}) => {
  const { activeTab } = useTabsContext();
  const isActive = activeTab === value;

  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          key={value}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={
            transition || {
              type: "spring",
              stiffness: 300,
              damping: 30,
            }
          }
          className={cn("w-full", className)}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
