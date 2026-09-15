import React from 'react';
import { AvatarStyle, OutfitColor, BagStyle, AccessoryStyle } from '../../types';
import {
  User,
  GraduationCap,
  BookOpen,
  Sprout,
  Briefcase,
  Folder,
  Glasses,
  UserCheck
} from 'lucide-react';

interface AvatarDisplayProps {
  avatarStyle?: AvatarStyle;
  outfitColor?: OutfitColor;
  bagStyle?: BagStyle;
  accessoryStyle?: AccessoryStyle;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  className?: string;
}

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({
  avatarStyle = 'hafiz',
  outfitColor = 'green',
  bagStyle = 'satchel',
  accessoryStyle = 'quran',
  size = 'md',
  animated = false,
  className = '',
}) => {
  // Map dimensions based on size
  const sizeClasses = {
    xs: 'w-7 h-7 text-xs',
    sm: 'w-10 h-10 text-sm',
    md: 'w-14 h-14 text-base',
    lg: 'w-20 h-20 text-xl',
    xl: 'w-28 h-28 text-3xl',
  };

  const iconSizes = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
    xl: 'w-14 h-14',
  };

  // Color mappings
  const colorHexMap = {
    green: { primary: '#006304', secondary: '#F0F9F0', border: '#006304', badge: '#006304', iconColor: '#006304' },
    gold: { primary: '#C79545', secondary: '#FFF8E7', border: '#F9BF3B', badge: '#C79545', iconColor: '#C79545' },
    navy: { primary: '#1E293B', secondary: '#F1F5F9', border: '#334155', badge: '#1E293B', iconColor: '#1E293B' },
  };

  const colors = colorHexMap[outfitColor] || colorHexMap.green;

  // Render character icon based on avatar style
  const renderAvatarIcon = () => {
    const iconClass = `${iconSizes[size]} transition-transform hover:scale-110`;
    switch (avatarStyle) {
      case 'hafiza':
        return <UserCheck className={iconClass} style={{ color: colors.iconColor }} />;
      case 'scholar':
        return <User className={iconClass} style={{ color: colors.iconColor }} />;
      case 'hafiz':
      default:
        return <GraduationCap className={iconClass} style={{ color: colors.iconColor }} />;
    }
  };

  // Render bag icon
  const renderBagIcon = () => {
    const badgeSize = size === 'xl' || size === 'lg' ? 'w-3.5 h-3.5 text-slate-700' : 'w-2.5 h-2.5 text-slate-700';
    if (bagStyle === 'satchel') return <Briefcase className={badgeSize} />;
    if (bagStyle === 'backpack') return <Folder className={badgeSize} />;
    return null;
  };

  // Render accessory icon
  const renderAccessoryIcon = () => {
    const badgeSize = size === 'xl' || size === 'lg' ? 'w-3.5 h-3.5 text-emerald-700' : 'w-2.5 h-2.5 text-emerald-700';
    if (accessoryStyle === 'quran') return <BookOpen className={badgeSize} />;
    if (accessoryStyle === 'seedling') return <Sprout className={badgeSize} />;
    if (accessoryStyle === 'glasses') return <Glasses className={badgeSize} />;
    return null;
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full select-none transition-transform ${
        sizeClasses[size]
      } ${animated ? 'animate-float' : ''} ${className}`}
      style={{
        backgroundColor: colors.secondary,
        borderColor: colors.border,
        borderWidth: size === 'xs' || size === 'sm' ? '2px' : '3px',
      }}
    >
      {/* Base Avatar Face / Role Icon */}
      {renderAvatarIcon()}

      {/* Bag Badge Indicator */}
      {bagStyle !== 'none' && renderBagIcon() && (
        <span
          className={`absolute -bottom-1 -left-1 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-2xs ${
            size === 'xl' || size === 'lg' ? 'w-6 h-6 p-1' : 'w-4 h-4 p-0.5'
          }`}
        >
          {renderBagIcon()}
        </span>
      )}

      {/* Accessory Badge Indicator */}
      {renderAccessoryIcon() && (
        <span
          className={`absolute -bottom-1 -right-1 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-2xs ${
            size === 'xl' || size === 'lg' ? 'w-6 h-6 p-1' : 'w-4 h-4 p-0.5'
          }`}
        >
          {renderAccessoryIcon()}
        </span>
      )}

      {/* Style color accent ring */}
      <span
        className="absolute inset-0 rounded-full pointer-events-none opacity-20"
        style={{ boxShadow: `inset 0 0 0 2px ${colors.primary}` }}
      />
    </div>
  );
};
