import { useState } from "react";
import { db } from "../firebase/config";
import { doc, updateDoc, getDoc, increment } from "firebase/firestore";
import RatingStars from "./RatingStars";

const RateCaptain = ({ rideId, captainId, onRatingSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleRatingChange = (newRating) => {
    setRating(newRating);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Update the ride with the rating
      await updateDoc(doc(db, "rides", rideId), {
        captainRating: rating,
        captainFeedback: feedback,
        ratedAt: new Date()
      });
      
      // Get the captain's current rating data
      const captainDoc = await getDoc(doc(db, "captains", captainId));
      const captainData = captainDoc.data();
      
      // Calculate the new average rating
      const currentRating = captainData.rating || 0;
      const totalRatings = captainData.totalRatings || 0;
      
      // Calculate new average: ((oldAvg * oldCount) + newRating) / (oldCount + 1)
      const newTotalRatings = totalRatings + 1;
      const newRating = ((currentRating * totalRatings) + rating) / newTotalRatings;
      
      // Update the captain's rating
      await updateDoc(doc(db, "captains", captainId), {
        rating: newRating,
        totalRatings: increment(1)
      });
      
      setSuccess("Thank you for your feedback!");
      
      // Call the callback if provided
      if (onRatingSubmitted) {
        onRatingSubmitted();
      }
    } catch (err) {
      console.error("Error submitting rating:", err);
      setError("Failed to submit rating. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-dark-primary rounded-xl shadow-md p-6 border border-secondary">
      <h2 className="text-xl font-semibold text-secondary mb-4">Rate Your Captain</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col items-center">
          <p className="text-sm text-gray-400 mb-2">How was your ride experience?</p>
          <RatingStars 
            initialRating={rating} 
            onRatingChange={handleRatingChange} 
            size="lg" 
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Feedback (Optional)
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Share your experience..."
            className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary text-accent resize-none h-24"
          />
        </div>
        
        {error && (
          <div className="bg-red-900 bg-opacity-30 border border-red-500 text-red-300 p-3 rounded-lg">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-900 bg-opacity-30 border border-green-500 text-green-300 p-3 rounded-lg">
            {success}
          </div>
        )}
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-secondary text-white py-3 rounded-lg font-medium hover:bg-pink-700 transition duration-200 disabled:opacity-50"
        >
          {isSubmitting ? "Submitting..." : "Submit Rating"}
        </button>
      </form>
    </div>
  );
};

export default RateCaptain;
