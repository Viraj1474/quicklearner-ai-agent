import React, { forwardRef } from "react";
import { motion } from "framer-motion";
import { useTheme } from "./theme";

// Glassmorphism Card Component
export const GlassCard = forwardRef(({ 
  children, 
  className = "", 
  blur = "md",
  opacity = 80,
  hover = false,
  glow = false,
  ...props 
}, ref) => {
  const { darkMode } = useTheme();
  
  const blurLevels = {
    sm: "backdrop-blur-sm",
    md: "backdrop-blur-md",
    lg: "backdrop-blur-lg",
    xl: "backdrop-blur-xl"
  };

  return (
    <motion.div
      ref={ref}
      className={`
        rounded-2xl border 
        ${blurLevels[blur]}
        ${darkMode 
          ? `bg-white/${opacity/10} border-white/10` 
          : `bg-white/${opacity} border-gray-200/50`
        }
        ${hover ? 'transition-all duration-300 hover:shadow-xl hover:scale-[1.02]' : ''}
        ${glow && darkMode ? 'shadow-lg shadow-white/5' : ''}
        ${className}
      `}
      whileHover={hover ? { y: -2 } : {}}
      {...props}
    >
      {children}
    </motion.div>
  );
});

GlassCard.displayName = "GlassCard";

// Ripple Effect Button
export const RippleButton = forwardRef(({ 
  children, 
  className = "", 
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  onClick,
  ...props 
}, ref) => {
  const { darkMode } = useTheme();
  const [ripples, setRipples] = React.useState([]);

  const handleClick = (e) => {
    if (disabled || loading) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 2;
    
    const newRipple = { x, y, size, id: Date.now() };
    setRipples(prev => [...prev, newRipple]);
    
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 600);

    onClick?.(e);
  };

  const variants = {
    primary: darkMode 
      ? 'bg-white text-black hover:bg-gray-200' 
      : 'bg-black text-white hover:bg-gray-800',
    secondary: darkMode 
      ? 'bg-[#2a2a2a] text-gray-200 hover:bg-[#333]' 
      : 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    ghost: darkMode 
      ? 'bg-transparent text-gray-300 hover:bg-[#2a2a2a]' 
      : 'bg-transparent text-gray-700 hover:bg-gray-100',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    success: 'bg-emerald-500 text-white hover:bg-emerald-600',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg',
  };

  return (
    <button
      ref={ref}
      onClick={handleClick}
      disabled={disabled || loading}
      className={`
        relative overflow-hidden rounded-xl font-medium 
        transition-all duration-200
        ${variants[variant]}
        ${sizes[size]}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      {...props}
    >
      {/* Ripple effects */}
      {ripples.map(ripple => (
        <motion.span
          key={ripple.id}
          className="absolute rounded-full bg-current opacity-20 pointer-events-none"
          style={{
            left: ripple.x - ripple.size / 2,
            top: ripple.y - ripple.size / 2,
            width: ripple.size,
            height: ripple.size,
          }}
          initial={{ scale: 0, opacity: 0.3 }}
          animate={{ scale: 1, opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      ))}
      
      {/* Loading spinner */}
      {loading && (
        <motion.span
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </motion.span>
      )}
      
      {/* Button content */}
      <span className={loading ? 'invisible' : ''}>
        {children}
      </span>
    </button>
  );
});

RippleButton.displayName = "RippleButton";

// Hover Card with 3D tilt effect
export const TiltCard = forwardRef(({ 
  children, 
  className = "",
  intensity = 10,
  ...props 
}, ref) => {
  const { darkMode } = useTheme();
  const [rotateX, setRotateX] = React.useState(0);
  const [rotateY, setRotateY] = React.useState(0);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    setRotateX((-mouseY / rect.height) * intensity);
    setRotateY((mouseX / rect.width) * intensity);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div
      ref={ref}
      className={`rounded-2xl border ${
        darkMode ? 'bg-[#1f1f1f] border-[#2a2a2a]' : 'bg-white border-gray-200'
      } ${className}`}
      style={{ transformStyle: "preserve-3d", perspective: 1000 }}
      animate={{ rotateX, rotateY }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </motion.div>
  );
});

TiltCard.displayName = "TiltCard";

// Animated gradient border
export const GradientBorder = ({ children, className = "", animate = true }) => {
  return (
    <div className={`relative p-[2px] rounded-2xl overflow-hidden ${className}`}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500"
        animate={animate ? { rotate: 360 } : {}}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "center" }}
      />
      <div className="relative rounded-2xl overflow-hidden">
        {children}
      </div>
    </div>
  );
};

// Pulse animation wrapper
export const PulseWrapper = ({ children, active = false, color = "blue" }) => {
  const colors = {
    blue: "shadow-blue-500/50",
    green: "shadow-emerald-500/50",
    purple: "shadow-purple-500/50",
    orange: "shadow-orange-500/50",
  };

  return (
    <div className="relative">
      {active && (
        <motion.div
          className={`absolute inset-0 rounded-full ${colors[color]}`}
          animate={{ 
            boxShadow: [
              `0 0 0 0px currentColor`,
              `0 0 0 10px transparent`
            ]
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
      {children}
    </div>
  );
};

// Shine effect for cards/buttons
export const ShineEffect = ({ children, className = "" }) => {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {children}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)",
        }}
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
      />
    </div>
  );
};

// Magnetic button effect
export const MagneticButton = forwardRef(({ children, className = "", strength = 0.3, ...props }, ref) => {
  const [position, setPosition] = React.useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    setPosition({
      x: (e.clientX - centerX) * strength,
      y: (e.clientY - centerY) * strength,
    });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.button
      ref={ref}
      className={className}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </motion.button>
  );
});

MagneticButton.displayName = "MagneticButton";

export default {
  GlassCard,
  RippleButton,
  TiltCard,
  GradientBorder,
  PulseWrapper,
  ShineEffect,
  MagneticButton,
};
