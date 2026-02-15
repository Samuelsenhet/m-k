import React from 'react';
import { cn } from '@/lib/utils';
import { Heart, X, Star, MapPin, ShieldCheck, Video } from 'lucide-react';
import { PremiumCard } from './premium-card';

interface MatchCardProps {
  name: string;
  age: number;
  location: string;
  distance?: number;
  bio: string;
  photos?: string[];
  compatibilityScore?: number;
  isVerified?: boolean;
  hasKemiCheck?: boolean;
  personality?: string;
  interests?: string[];
  onLike?: () => void;
  onPass?: () => void;
  onSuperLike?: () => void;
  className?: string;
}

export const MatchCard = React.forwardRef<HTMLDivElement, MatchCardProps>(
  ({ 
    name, 
    age, 
    location, 
    distance,
    bio, 
    photos = [],
    compatibilityScore,
    isVerified,
    hasKemiCheck,
    personality,
    interests = [],
    onLike,
    onPass,
    onSuperLike,
    className 
  }, ref) => {
    const mainPhoto = photos[0] || '';

    return (
      <PremiumCard
        ref={ref}
        glow="rose"
        interactive
        className={cn('relative overflow-hidden w-full max-w-sm mx-auto', className)}
      >
        {/* Photo Section */}
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl mb-4">
          {mainPhoto ? (
            <img 
              src={mainPhoto} 
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full gradient-primary flex items-center justify-center">
              <span className="text-6xl font-bold text-white">{name.charAt(0)}</span>
            </div>
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          {/* Badges */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isVerified && (
                <div className="glass-dark rounded-full p-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
              )}
              {hasKemiCheck && (
                <div className="glass-dark rounded-full p-1.5">
                  <Video className="w-4 h-4 text-violet-400" />
                </div>
              )}
            </div>
            {compatibilityScore && (
              <div className="glass-dark rounded-full px-3 py-1.5">
                <span className="text-white font-bold text-sm">{compatibilityScore}%</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPass?.();
              }}
              className="glass-dark rounded-full p-4 hover:bg-red-500/20 transition-premium active:scale-90"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSuperLike?.();
              }}
              className="glass-dark rounded-full p-4 hover:bg-yellow-500/20 transition-premium active:scale-90"
            >
              <Star className="w-6 h-6 text-white fill-yellow-400" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLike?.();
              }}
              className="glass-dark rounded-full p-4 hover:bg-primary/20 transition-premium active:scale-90"
            >
              <Heart className="w-6 h-6 text-white fill-primary" />
            </button>
          </div>
        </div>

        {/* Info Section */}
        <div className="px-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-2xl font-bold text-gray-900">
              {name}, {age}
            </h3>
            {personality && (
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-primary/15 text-primary">
                {personality}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1 text-muted-foreground mb-3">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{location}</span>
            {distance && (
              <span className="text-sm">• {distance} km</span>
            )}
          </div>

          <p className="text-gray-700 mb-4 line-clamp-2">{bio}</p>

          {/* Interests */}
          {interests.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {interests.slice(0, 4).map((interest, i) => (
                <span
                  key={i}
                  className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium"
                >
                  {interest}
                </span>
              ))}
              {interests.length > 4 && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
                  +{interests.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </PremiumCard>
    );
  }
);

MatchCard.displayName = 'MatchCard';
