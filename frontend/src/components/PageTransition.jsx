import React, { forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Page transition variants
export const pageTransitions = {
  // Fade transition
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 },
  },
  
  // Slide up transition
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3, ease: "easeOut" },
  },
  
  // Slide from right
  slideRight: {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
    transition: { duration: 0.3, ease: "easeOut" },
  },
  
  // Scale transition
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.2, ease: "easeOut" },
  },
  
  // Scale and slide
  scaleSlide: {
    initial: { opacity: 0, scale: 0.98, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.98, y: -10 },
    transition: { duration: 0.25, ease: "easeOut" },
  },
  
  // Spring pop
  springPop: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
    transition: { type: "spring", damping: 20, stiffness: 300 },
  },
  
  // Blur fade (for modals)
  blurFade: {
    initial: { opacity: 0, filter: "blur(10px)" },
    animate: { opacity: 1, filter: "blur(0px)" },
    exit: { opacity: 0, filter: "blur(10px)" },
    transition: { duration: 0.2 },
  },
  
  // Slide from bottom (mobile-friendly)
  slideBottom: {
    initial: { opacity: 0, y: "100%" },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: "100%" },
    transition: { type: "spring", damping: 25, stiffness: 300 },
  },
  
  // Flip transition
  flip: {
    initial: { opacity: 0, rotateY: 90 },
    animate: { opacity: 1, rotateY: 0 },
    exit: { opacity: 0, rotateY: -90 },
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

// Page transition wrapper component
const PageTransition = forwardRef(({
  children,
  variant = "slideUp",
  className = "",
  mode = "wait",
  ...props
}, ref) => {
  const transition = pageTransitions[variant] || pageTransitions.slideUp;
  
  return (
    <motion.div
      ref={ref}
      initial={transition.initial}
      animate={transition.animate}
      exit={transition.exit}
      transition={transition.transition}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
});

PageTransition.displayName = "PageTransition";

// Animated container for switching between content
export const AnimatedSwitch = ({ 
  children, 
  activeKey, 
  variant = "slideUp",
  className = "" 
}) => {
  const transition = pageTransitions[variant] || pageTransitions.slideUp;
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeKey}
        initial={transition.initial}
        animate={transition.animate}
        exit={transition.exit}
        transition={transition.transition}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Staggered children animation
export const StaggerContainer = forwardRef(({
  children,
  staggerDelay = 0.05,
  className = "",
  ...props
}, ref) => {
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
        hidden: {},
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
});

StaggerContainer.displayName = "StaggerContainer";

// Stagger child item
export const StaggerItem = forwardRef(({
  children,
  className = "",
  ...props
}, ref) => {
  return (
    <motion.div
      ref={ref}
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: { duration: 0.3, ease: "easeOut" }
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
});

StaggerItem.displayName = "StaggerItem";

// List animation with stagger
export const AnimatedList = ({ 
  items, 
  renderItem, 
  keyExtractor,
  staggerDelay = 0.03,
  className = "",
  itemClassName = "",
}) => {
  return (
    <StaggerContainer staggerDelay={staggerDelay} className={className}>
      {items.map((item, index) => (
        <StaggerItem key={keyExtractor ? keyExtractor(item, index) : index} className={itemClassName}>
          {renderItem(item, index)}
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
};

// Animated card entrance
export const AnimatedCard = forwardRef(({
  children,
  delay = 0,
  className = "",
  hover = true,
  ...props
}, ref) => {
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3, delay, ease: "easeOut" }}
      whileHover={hover ? { y: -2, transition: { duration: 0.2 } } : undefined}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
});

AnimatedCard.displayName = "AnimatedCard";

// Fade in on scroll (intersection observer based)
export const FadeInOnScroll = ({ 
  children, 
  threshold = 0.1,
  className = "",
  once = true,
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once && ref.current) {
            observer.unobserve(ref.current);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold, once]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Skeleton to content transition
export const SkeletonTransition = ({
  loading,
  skeleton,
  children,
  className = "",
}) => {
  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.div
          key="skeleton"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={className}
        >
          {skeleton}
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Modal transition wrapper
export const ModalTransition = ({ 
  isOpen, 
  onClose, 
  children,
  variant = "scale",
  backdropBlur = true,
}) => {
  const transition = pageTransitions[variant] || pageTransitions.scale;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className={`fixed inset-0 bg-black/50 z-50 ${backdropBlur ? 'backdrop-blur-sm' : ''}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            initial={transition.initial}
            animate={transition.animate}
            exit={transition.exit}
            transition={transition.transition}
          >
            <div className="pointer-events-auto">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PageTransition;
