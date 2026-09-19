"use client";

import React, { useRef, useState, useEffect } from "react";

interface MagneticButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  strength?: number; // Distance multiplier
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  onClick,
  className = "",
  strength = 0.35,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const btn = buttonRef.current;
    if (!btn) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = btn.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dist = Math.hypot(e.clientX - centerX, e.clientY - centerY);
      const threshold = 90; // Activation distance

      if (dist < threshold) {
        const x = (e.clientX - centerX) * strength;
        const y = (e.clientY - centerY) * strength;
        setPosition({ x, y });
      } else {
        setPosition({ x: 0, y: 0 });
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [strength]);

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        transition:
          position.x === 0 && position.y === 0
            ? "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
            : "transform 0.1s ease-out",
      }}
      className={`cursor-pointer select-none ${className}`}
    >
      {children}
    </button>
  );
};
