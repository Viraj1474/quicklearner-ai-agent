import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const RippleEffect = ({ color = "rgba(255, 255, 255, 0.5)", duration = 0.7, onClick }) => {
  const [ripples, setRipples] = useState([]);

  const createRipple = (event) => {
    const button = event.currentTarget;
    const buttonRect = button.getBoundingClientRect();
    
    const diameter = Math.max(buttonRect.width, buttonRect.height);
    const radius = diameter / 2;
    
    const ripple = {
      id: Date.now(),
      x: event.clientX - buttonRect.left - radius,
      y: event.clientY - buttonRect.top - radius,
      size: diameter,
    };
    
    setRipples(prevRipples => [...prevRipples, ripple]);
    
    if (onClick) onClick(event);
  };
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (ripples.length > 0) {
        setRipples(ripples.slice(1));
      }
    }, duration * 1000);
    
    return () => clearTimeout(timer);
  }, [ripples, duration]);
  
  return {
    rippleProps: {
      onClick: createRipple,
      className: "overflow-hidden relative",
      style: { isolation: "isolate" }
    },
    ripples: (
      <AnimatePresence>
        {ripples.map(ripple => (
          <motion.span
            key={ripple.id}
            initial={{ opacity: 0.7, scale: 0 }}
            animate={{ opacity: 0, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration }}
            style={{
              position: 'absolute',
              top: ripple.y,
              left: ripple.x,
              width: ripple.size,
              height: ripple.size,
              borderRadius: '50%',
              backgroundColor: color,
              pointerEvents: 'none',
              transform: 'translate(-50%, -50%)',
              zIndex: 0
            }}
          />
        ))}
      </AnimatePresence>
    )
  };
};

export default RippleEffect;