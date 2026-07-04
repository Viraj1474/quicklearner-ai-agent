/**
 * Avatar Component
 * 
 * Reusable avatar component with:
 * - Image display with fallback
 * - Initials fallback when image fails or is missing
 * - Multiple sizes
 * - Dark mode support
 * - Error handling for broken images
 */

import React, { useState, useMemo, memo } from 'react';

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-2xl',
  '2xl': 'w-20 h-20 text-3xl',
  '3xl': 'w-24 h-24 text-4xl',
};

// Generate a consistent background color based on the name
const getBackgroundColor = (name) => {
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
    'bg-rose-500',
  ];
  
  if (!name) return colors[0];
  
  // Simple hash function to get consistent color for same name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

// Extract initials from name/username/email
const getInitials = (name, email, maxInitials = 2) => {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  }
  
  if (email && email.includes('@')) {
    return email.charAt(0).toUpperCase();
  }
  
  return 'U';
};

// Check if URL is valid and not empty
const isValidImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  
  // Basic URL validation
  try {
    new URL(trimmed);
    return true;
  } catch {
    // Could be a relative path
    return trimmed.startsWith('/') || trimmed.startsWith('./');
  }
};

const Avatar = memo(function Avatar({
  src,
  alt,
  name,
  email,
  size = 'md',
  className = '',
  borderColor = 'border-white',
  showBorder = false,
  onClick,
}) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const hasValidImage = isValidImageUrl(src) && !imageError;
  
  const initials = useMemo(() => 
    getInitials(name, email), 
    [name, email]
  );
  
  const bgColor = useMemo(() => 
    getBackgroundColor(name || email), 
    [name, email]
  );
  
  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };
  
  const handleImageLoad = () => {
    setImageLoading(false);
  };
  
  const baseClasses = `
    ${sizeClass}
    rounded-full
    flex-shrink-0
    flex
    items-center
    justify-center
    overflow-hidden
    ${showBorder ? `border-2 ${borderColor}` : ''}
    ${onClick ? 'cursor-pointer' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  // Render image avatar
  if (hasValidImage) {
    return (
      <div 
        className={`${baseClasses} relative ${bgColor}`}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        {/* Fallback initials shown while loading */}
        {imageLoading && (
          <span className="absolute inset-0 flex items-center justify-center font-semibold text-white">
            {initials}
          </span>
        )}
        <img
          src={src}
          alt={alt || name || 'User avatar'}
          className={`w-full h-full object-cover transition-opacity duration-200 ${
            imageLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onError={handleImageError}
          onLoad={handleImageLoad}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Render initials fallback
  return (
    <div 
      className={`${baseClasses} ${bgColor} text-white font-semibold`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {initials}
    </div>
  );
});

// Named export for convenience
export { Avatar };

// Default export
export default Avatar;
