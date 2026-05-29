"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { motionTransition } from "./constants";
import type { ModernStep } from "./types";

const stepMotionConfig: Record<
  ModernStep,
  { initial: { x: number }; exit: { x: number } }
> = {
  amount: { initial: { x: -14 }, exit: { x: -14 } },
  manageRecipients: { initial: { x: 14 }, exit: { x: 14 } },
  addRecipient: { initial: { x: 14 }, exit: { x: 14 } },
  confirm: { initial: { x: 18 }, exit: { x: 18 } },
};

export function StepMotion({
  step,
  children,
  className,
}: {
  step: ModernStep;
  children: ReactNode;
  className?: string;
}) {
  const { initial, exit } = stepMotionConfig[step];
  return (
    <motion.div
      className={className ?? "will-change-[transform,opacity,filter]"}
      key={step}
      initial={{ opacity: 0, ...initial, filter: "blur(2px)" }}
      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, ...exit, filter: "blur(2px)" }}
      transition={motionTransition}
    >
      {children}
    </motion.div>
  );
}
