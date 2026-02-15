import Image from 'next/image';
import { StarRating } from '../ui/StarRating';
import type { Venue } from '@/data/venues';

interface VenueCardProps {
  venue: Venue;
}

export function VenueCard({ venue }: VenueCardProps) {
  return (
    <div className="group cursor-pointer transition-transform duration-300 hover:scale-105">
      {/* Image Container */}
      <div className="relative w-full aspect-[3/2] rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-800 mb-3">
        <Image
          src={venue.image}
          alt={venue.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>

      {/* Card Content */}
      <div className="space-y-2">
        {/* Name and Rating Row */}
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-semibold text-base flex-1 line-clamp-2">
            {venue.name}
          </h3>
          <div className="flex-shrink-0">
            <StarRating rating={venue.rating} reviewCount={venue.reviewCount} />
          </div>
        </div>

        {/* Address */}
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
          {venue.address}
        </p>

        {/* Category Tag */}
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {venue.category}
        </p>
      </div>
    </div>
  );
}
