import React from 'react';

// You can increase this number based on how many images you have or want to repeat
const ACTUAL_IMAGES = [
  '/images/img1.jpg',
  '/images/img2.jpg',
  '/images/img3.jpg',
  '/images/img4.jpg',
  '/images/img5.jpg',
  '/images/img6.jpg',
  '/images/img7.png',
  '/images/img8.png',
  '/images/img9.jpeg',
  '/images/img10.jpeg',
  '/images/img11.jpg',
  '/images/img12.jpg',
  '/images/img13.jpg',
  '/images/img14.jpg',
  '/images/img15.jpg',
  '/images/img16.jpg',
  '/images/img17.jpg',
  '/images/img18.jpeg'
];
const IMAGES = ACTUAL_IMAGES;

const MosaicBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden">
      {/* Mosaic Grid */}
      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-0 w-full h-full">
        {Array.from({ length: 48 }).map((_, index) => (
          <div key={index} className="relative aspect-square">
            <img
              src={IMAGES[index % IMAGES.length]}
              alt="mosaic"
              className="w-full h-full object-cover transition-opacity duration-700"
            />
          </div>
        ))}
      </div>

      {/* Dark Overlay for readability */}
      <div className="absolute inset-0 bg-black/40"></div>
    </div>
  );
};

export default MosaicBackground;
