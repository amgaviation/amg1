"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import {
  motionDuration,
  motionEase,
  motionStagger,
  revealVariants,
} from "@/lib/motion";

export function Reveal({
  children,
  delay = 0,
  className,
  variants = revealVariants,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  variants?: Variants;
}) {
  return (
    <motion.div
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: motionDuration.slow, ease: motionEase, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function RevealGroup({
  children,
  className,
  stagger = 0.12,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      transition={{ staggerChildren: stagger ?? motionStagger.standard }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={revealVariants}
      transition={{ duration: motionDuration.slow, ease: motionEase }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
