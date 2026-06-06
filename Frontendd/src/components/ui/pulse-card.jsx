import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

const VARIANTS = {
  emerald: {
    accent: "emerald-500",
    iconBg: "bg-emerald-500/15",
    iconText: "text-emerald-500",
    gradient: "from-emerald-500/25 to-emerald-500/5",
    border: "border-emerald-500/25",
    color: "rgb(16 185 129)",
    glow: "group-hover:shadow-emerald-500/20",
  },
  blue: {
    accent: "blue-500",
    iconBg: "bg-blue-500/15",
    iconText: "text-blue-500",
    gradient: "from-blue-500/25 to-blue-500/5",
    border: "border-blue-500/25",
    color: "rgb(59 130 246)",
    glow: "group-hover:shadow-blue-500/20",
  },
  purple: {
    accent: "purple-500",
    iconBg: "bg-purple-500/15",
    iconText: "text-purple-500",
    gradient: "from-purple-500/25 to-purple-500/5",
    border: "border-purple-500/25",
    color: "rgb(168 85 247)",
    glow: "group-hover:shadow-purple-500/20",
  },
  amber: {
    accent: "amber-500",
    iconBg: "bg-amber-500/15",
    iconText: "text-amber-500",
    gradient: "from-amber-500/25 to-amber-500/5",
    border: "border-amber-500/25",
    color: "rgb(245 158 11)",
    glow: "group-hover:shadow-amber-500/20",
  },
  rose: {
    accent: "rose-500",
    iconBg: "bg-rose-500/15",
    iconText: "text-rose-500",
    gradient: "from-rose-500/25 to-rose-500/5",
    border: "border-rose-500/25",
    color: "rgb(244 63 94)",
    glow: "group-hover:shadow-rose-500/20",
  },
};

const SIZES = {
  sm: {
    padding: "p-6 pt-12",
    iconSize: "h-5 w-5",
    titleSize: "text-sm",
    descSize: "text-xs",
  },
  md: {
    padding: "p-8 pt-16",
    iconSize: "h-6 w-6",
    titleSize: "text-base",
    descSize: "text-[15px]",
  },
  lg: {
    padding: "p-6 pt-16",
    iconSize: "h-7 w-7",
    titleSize: "text-lg",
    descSize: "text-base",
  },
};

export function CardHoverEffect({
  icon,
  title,
  description,
  className,
  variant = "emerald",
  size = "md",
  glowEffect = false,
  hoverScale = 1.02,
  interactive = true,
}) {
  const variantConfig = VARIANTS[variant] ?? VARIANTS.emerald;
  const sizeConfig = SIZES[size];
  const Div = interactive ? motion.div : "div";
  const IconWrapper = interactive ? motion.span : "span";

  return (
    <Div
      whileHover={
        interactive
          ? { scale: hoverScale, y: -6 }
          : undefined
      }
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group relative z-30 w-full cursor-pointer overflow-hidden rounded-2xl border",
        sizeConfig.padding,
        "border-border/60 bg-card/90 backdrop-blur-md",
        "dark:border-border dark:bg-card/70",
        `bg-gradient-to-br ${variantConfig.gradient}`,
        variantConfig.border,
        glowEffect && variantConfig.glow,
        "shadow-lg transition-shadow duration-300",
        "hover:shadow-xl",
        "before:absolute before:inset-0 before:rounded-[inherit] before:content-['']",
        "before:bg-gradient-to-b before:from-white/10 before:to-transparent",
        "dark:before:from-white/5 dark:before:to-transparent",
        className,
      )}
      style={{ "--card-color": variantConfig.color }}
    >
      {/* Animated border glow on hover */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          maskComposite: "exclude",
          WebkitMaskComposite: "xor",
          padding: "1px",
        }}
      >
        <div
          className="absolute inset-[-200%] animate-spin"
          style={{
            background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 300deg, var(--card-color) 360deg)`,
            animationDuration: "4s",
          }}
        />
      </div>

      {/* Icon */}
      <IconWrapper
        className="relative z-50 mb-4 inline-flex rounded-xl"
        whileHover={interactive ? { scale: 1.12, rotate: 5 } : undefined}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <span
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300",
            variantConfig.iconBg,
            "group-hover:scale-105",
          )}
        >
          <span
            className={cn(
              "transition-colors duration-300",
              variantConfig.iconText,
              "group-hover:brightness-125",
              sizeConfig.iconSize,
            )}
          >
            {icon}
          </span>
        </span>
      </IconWrapper>

      {/* Content */}
      <div className="relative z-30">
        <h3
          className={cn(
            "font-semibold text-foreground transition-colors duration-300",
            "group-hover:text-[var(--card-color)]",
            sizeConfig.titleSize,
          )}
        >
          {title}
        </h3>
        <p
          className={cn(
            "mt-2 leading-relaxed text-muted-foreground transition-colors duration-300",
            "group-hover:text-foreground/80",
            sizeConfig.descSize,
          )}
        >
          {description}
        </p>
      </div>

      {/* Ambient shine pulse */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]">
        <motion.div
          className="absolute bottom-[45%] left-1/2 aspect-square w-[160%] -translate-x-1/2 rounded-[50%]"
          style={{
            background: `radial-gradient(circle, var(--card-color) 0%, transparent 70%)`,
            filter: "blur(40px)",
            opacity: 0.25,
          }}
          animate={{ opacity: [0.2, 0.45, 0.2], scale: [1, 1.08, 1] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </Div>
  );
}
