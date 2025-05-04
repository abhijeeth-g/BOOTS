import React from 'react';

// Simplified background component that doesn't use WebGL
const SimpleHeroBackground = () => {
  return (
    <div className="absolute inset-0 z-0 bg-gradient-to-b from-gray-900 to-black">
      <div className="absolute inset-0 opacity-20">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 animate-gradient-x"></div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-20 left-1/4 w-32 h-32 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
      <div className="absolute top-40 right-1/3 w-32 h-32 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-40 left-1/3 w-32 h-32 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
    </div>
  );
};

export default SimpleHeroBackground;
