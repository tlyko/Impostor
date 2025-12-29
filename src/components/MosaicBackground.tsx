'use client';

import React from 'react';

interface MosaicBackgroundProps {
  images: string[];
}

const MosaicBackground: React.FC<MosaicBackgroundProps> = ({ images }) => {
  // If no images provided, render nothing or a fallback
  if (!images || images.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-black">
      {/* Mosaic Grid - Mid-sized Tiles: 3 cols mobile, 4 tablet, 6 desktop */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-0 w-full h-full">
        {/* Render enough items to fill the screen. 6 cols * 8 rows = 48 items */}
        {Array.from({ length: 48 }).map((_, index) => (
          <div key={index} className="relative aspect-square w-full h-full group">
            <img
              src={images[index % images.length]}
              alt="mosaic"
              className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-700"
            />
          </div>
        ))}
      </div>

      {/* Dark Overlay for readability */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>
    </div>
  );
};

export default MosaicBackground;
