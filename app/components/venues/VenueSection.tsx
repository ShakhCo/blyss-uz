'use client';

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Venue } from '@/data/venues';
import { VenueCard } from './VenueCard';
import { VenueCarousel, type VenueCarouselHandle } from './VenueCarousel';

interface VenueSectionProps {
  title: string;
  venues: Venue[];
}

export function VenueSection({ title, venues }: VenueSectionProps) {
  const carouselRef = useRef<VenueCarouselHandle>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  return (
    <section className="w-full max-w-7xl mx-auto px-6 pb-10">
      {/* Section Heading + Nav Buttons */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => carouselRef.current?.scrollLeft()}
            disabled={!showLeft}
            className="p-2 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Scroll left"
          >
            <ChevronLeft size={20} className="text-gray-800 dark:text-gray-200" />
          </button>
          <button
            onClick={() => carouselRef.current?.scrollRight()}
            disabled={!showRight}
            className="p-2 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Scroll right"
          >
            <ChevronRight size={20} className="text-gray-800 dark:text-gray-200" />
          </button>
        </div>
      </div>

      {/* Venue Carousel */}
      <VenueCarousel
        ref={carouselRef}
        onScrollChange={({ showLeft: l, showRight: r }) => {
          setShowLeft(l);
          setShowRight(r);
        }}
      >
        {venues.map((venue) => (
          <div
            key={venue.id}
            className="min-w-[280px] w-[280px] flex-shrink-0"
          >
            <VenueCard venue={venue} />
          </div>
        ))}
      </VenueCarousel>
    </section>
  );
}
