import React from 'react';

interface LiquidGlassSurfaceProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'panel' | 'elevated' | 'bubble';
  refract?: boolean;
  as?: 'div' | 'aside' | 'header' | 'section' | 'article';
}

export const LiquidGlassSurface: React.FC<LiquidGlassSurfaceProps> = ({
  children,
  className = '',
  variant = 'panel',
  refract = true,
  as: Tag = 'div',
}) => {
  const depthClass =
    variant === 'elevated'
      ? 'rounded-3xl'
      : variant === 'bubble'
        ? 'rounded-2xl'
        : 'rounded-2xl';

  return (
    <Tag
      className={`liquid-glass ${refract ? 'liquid-glass-refract' : ''} ${depthClass} ${className}`}
    >
      {refract && <span aria-hidden="true" className="liquid-lens-layer" />}
      {children}
    </Tag>
  );
};
