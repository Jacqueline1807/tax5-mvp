import React from "react";
import tax5Logo from "../assets/tax5-logo.png";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  animate?: boolean;
  id?: string;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = "",
  size = "md",
  animate = false,
  id,
  showText,
}) => {
  const sizeClasses = {
    sm: "w-[90px]",
    md: "w-[130px]",
    lg: "w-[200px]",
    xl: "w-[185px] sm:w-[220px]",
  };

  const sizeStyles = size === "xl" ? { width: "clamp(185px, 48vh, 230px)", maxWidth: "100%" } : {};

  return (
    <img
      id={id || "tax5-logo"}
      src={tax5Logo}
      alt="Tax5"
      className={`block h-auto object-contain ${sizeClasses[size]} ${animate ? "animate-pulse" : ""} ${className}`}
      style={{ ...sizeStyles }}
    />
  );
};
