"use client";

import { motion } from "motion/react";
import { useState, type ChangeEvent } from "react";
import { cn } from "@/lib/utils";

const digitAppearTransition = {
  type: "tween",
  duration: 0.13,
  ease: [0.22, 1, 0.36, 1],
} as const;

type AnimatedAmountInputProps = {
  id: string;
  name: string;
  value: string;
  placeholder?: string;
  className?: string;
  isEmpty: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export function AnimatedAmountInput({
  id,
  name,
  value,
  placeholder = "0",
  className,
  isEmpty,
  onChange,
}: AnimatedAmountInputProps) {
  const [animateFrom, setAnimateFrom] = useState(value.length);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextLength = event.target.value.length;
    setAnimateFrom(nextLength > value.length ? value.length : nextLength);
    onChange(event);
  };

  const chars = value.split("");

  return (
    <span className="inline-grid [grid-template-areas:'stack'] items-baseline">
      <span aria-hidden className="[grid-area:stack] invisible whitespace-pre">
        {value || placeholder}
      </span>

      {!isEmpty ? (
        <span
          aria-hidden
          className="[grid-area:stack] inline-flex items-baseline justify-center"
        >
          {chars.map((char, index) => (
            <motion.span
              key={index}
              className="inline-block"
              initial={
                index >= animateFrom ? { opacity: 0, y: "0.1em" } : false
              }
              animate={{ opacity: 1, y: 0 }}
              transition={digitAppearTransition}
            >
              {char}
            </motion.span>
          ))}
        </span>
      ) : null}

      <input
        id={id}
        name={name}
        aria-label="Payment amount"
        placeholder={placeholder}
        className={cn(
          "[grid-area:stack] w-full min-w-0 bg-transparent text-center outline-none field-sizing-content",
          isEmpty
            ? "text-mbp-placeholder placeholder:text-mbp-placeholder"
            : "text-transparent caret-mbp-fg selection:bg-mbp-fg/15",
          isEmpty && "min-w-[1ch]",
          className,
        )}
        inputMode="decimal"
        value={value}
        onChange={handleChange}
      />
    </span>
  );
}
