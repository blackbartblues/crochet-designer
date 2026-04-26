import type { CSSProperties } from 'react';

type IconSize = 'sm' | 'md' | 'lg';

interface IconProps {
  name: string;
  size?: IconSize;
  className?: string;
  style?: CSSProperties;
  title?: string;
}

const SIZE_PX: Record<IconSize, number> = {
  sm: 16,
  md: 18,
  lg: 20,
};

/**
 * Renders an icon from the global SVG sprite.
 * Sprite must be mounted via <SvgSprite /> at app root.
 */
export function Icon({ name, size = 'md', className, style, title }: IconProps) {
  const px = SIZE_PX[size];
  return (
    <svg
      width={px}
      height={px}
      className={className}
      style={style}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <use href={`#${name}`} />
    </svg>
  );
}
