import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Confetti particle component
const ConfettiParticle = ({ x, delay, color, size }) => {
  const shapes = ["square", "circle", "triangle"];
  const shape = shapes[Math.floor(Math.random() * shapes.length)];
  
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: `${x}%`,
        top: -20,
        width: size,
        height: size,
        backgroundColor: shape !== "triangle" ? color : "transparent",
        borderRadius: shape === "circle" ? "50%" : shape === "square" ? "2px" : "0",
        borderLeft: shape === "triangle" ? `${size/2}px solid transparent` : "none",
        borderRight: shape === "triangle" ? `${size/2}px solid transparent` : "none",
        borderBottom: shape === "triangle" ? `${size}px solid ${color}` : "none",
      }}
      initial={{ 
        y: -20, 
        opacity: 1, 
        rotate: 0,
        scale: 1
      }}
      animate={{ 
        y: "100vh",
        opacity: [1, 1, 0],
        rotate: Math.random() > 0.5 ? 720 : -720,
        x: [0, (Math.random() - 0.5) * 200, (Math.random() - 0.5) * 100],
        scale: [1, 1, 0.5]
      }}
      transition={{ 
        duration: 3 + Math.random() * 2,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
    />
  );
};

// Stars burst effect
const StarBurst = ({ x, y }) => {
  const stars = Array.from({ length: 8 }, (_, i) => ({
    angle: (i * 45) * (Math.PI / 180),
    distance: 60 + Math.random() * 40,
  }));

  return (
    <>
      {stars.map((star, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none"
          style={{ left: x, top: y }}
          initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
          animate={{ 
            scale: [0, 1.5, 0],
            x: Math.cos(star.angle) * star.distance,
            y: Math.sin(star.angle) * star.distance,
            opacity: [1, 1, 0]
          }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </motion.div>
      ))}
    </>
  );
};

// Main Confetti component
export default function Confetti({ 
  active = false, 
  particleCount = 50,
  duration = 3000,
  onComplete,
  type = "confetti" // "confetti" | "stars" | "celebration"
}) {
  const [particles, setParticles] = useState([]);
  const [starBursts, setStarBursts] = useState([]);

  const colors = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", 
    "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
    "#BB8FCE", "#85C1E9", "#F8B500", "#FF8C00"
  ];

  const generateParticles = useCallback(() => {
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 8 + Math.random() * 8,
    }));
    setParticles(newParticles);

    if (type === "celebration" || type === "stars") {
      const bursts = Array.from({ length: 5 }, (_, i) => ({
        id: Date.now() + i + 1000,
        x: `${20 + Math.random() * 60}%`,
        y: `${20 + Math.random() * 40}%`,
      }));
      setStarBursts(bursts);
    }

    // Clear after animation
    setTimeout(() => {
      setParticles([]);
      setStarBursts([]);
      onComplete?.();
    }, duration);
  }, [particleCount, duration, onComplete, type, colors]);

  useEffect(() => {
    if (active) {
      generateParticles();
    }
  }, [active, generateParticles]);

  if (!active && particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[300] overflow-hidden">
      <AnimatePresence>
        {particles.map((particle) => (
          <ConfettiParticle key={particle.id} {...particle} />
        ))}
        {starBursts.map((burst) => (
          <StarBurst key={burst.id} x={burst.x} y={burst.y} />
        ))}
      </AnimatePresence>

      {/* Central celebration text */}
      {type === "celebration" && active && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.5, times: [0, 0.3, 0.5, 1] }}
        >
          <div className="text-6xl">🎉</div>
        </motion.div>
      )}
    </div>
  );
}

// Hook for easy confetti triggering
export function useConfetti() {
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiType, setConfettiType] = useState("confetti");

  const trigger = useCallback((type = "confetti") => {
    setConfettiType(type);
    setShowConfetti(true);
  }, []);

  const reset = useCallback(() => {
    setShowConfetti(false);
  }, []);

  const ConfettiComponent = useCallback(() => (
    <Confetti 
      active={showConfetti} 
      type={confettiType}
      onComplete={reset}
    />
  ), [showConfetti, confettiType, reset]);

  return { trigger, reset, ConfettiComponent, isActive: showConfetti };
}
