"use client";
import React from "react";
import { motion } from "framer-motion";
import { Construction } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, description }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center"
    >
      <div className="p-8 rounded-full bg-slate-100 mb-6">
        <Construction size={64} className="text-slate-400" />
      </div>
      <h1 className="text-3xl font-bold text-ink mb-2">{title}</h1>
      <p className="text-slate-600 max-w-md">
        {description || "This feature is coming soon. Stay tuned!"}
      </p>
    </motion.div>
  );
};

export default PlaceholderPage;