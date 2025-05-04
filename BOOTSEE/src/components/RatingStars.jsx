import { useState } from "react";

const RatingStars = ({ initialRating = 0, totalRatings = 0, onRatingChange, readOnly = false, size = "md" }) => {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (newRating) => {
    if (readOnly) return;

    setRating(newRating);
    if (onRatingChange) {
      onRatingChange(newRating);
    }
  };

  const handleMouseEnter = (newRating) => {
    if (readOnly) return;
    setHoverRating(newRating);
  };

  const handleMouseLeave = () => {
    if (readOnly) return;
    setHoverRating(0);
  };

  // Determine star size based on prop
  const starSizeClass = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
    xl: "text-4xl"
  }[size] || "text-2xl";

  return (
    <div className="flex flex-col items-center">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`${starSizeClass} ${readOnly ? "cursor-default" : "cursor-pointer"} ${
              (hoverRating || rating) >= star
                ? "text-yellow-400"
                : "text-gray-300"
            }`}
            onClick={() => handleClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            onMouseLeave={handleMouseLeave}
          >
            ★
          </span>
        ))}
      </div>
      {totalRatings > 0 && readOnly && (
        <span className="text-sm text-white mt-1">
          {initialRating.toFixed(1)} ({totalRatings} {totalRatings === 1 ? "rating" : "ratings"})
        </span>
      )}
    </div>
  );
};

export default RatingStars;
