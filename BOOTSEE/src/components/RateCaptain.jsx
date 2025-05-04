import { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { doc, updateDoc, getDoc, increment } from "firebase/firestore";
import RatingStars from "./RatingStars";
import { gsap } from "gsap";

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
      const rideDoc = await getDoc(doc(db, "rides", rideId));
      if (rideDoc.exists() && rideDoc.data().captainRating) {
        setError("You have already rated this ride.");
        setIsSubmitting(false);
        return;
      }

      await updateDoc(doc(db, "rides", rideId), {
        captainRating: rating,
        captainFeedback: feedback,
        ratedAt: new Date()
      });

      const captainDoc = await getDoc(doc(db, "captains", captainId));
      if (!captainDoc.exists()) throw new Error("Captain not found.");

      const captainData = captainDoc.data();
      const currentRating = captainData.rating || 0;
      const totalRatings = captainData.totalRatings || 0;

      const newTotalRatings = totalRatings + 1;
      const newRating = parseFloat((((currentRating * totalRatings) + rating) / newTotalRatings).toFixed(2));

      await updateDoc(doc(db, "captains", captainId), {
        rating: newRating,
        totalRatings: increment(1)
      });

      setSuccess("Thank you for your feedback!");
      setRating(0);
      setFeedback("");

      if (onRatingSubmitted) onRatingSubmitted();
    } catch (err) {
      console.error("Error submitting rating:", err);
      setError("Failed to submit rating. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    gsap.fromTo(".rating-form-element", { opacity: 0, y: 20 }, { opacity: 1, y: 0, stagger: 0.1, duration: 0.4, ease: "power2.out" });
    gsap.fromTo(".rating-stars", { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.5, delay: 0.3, ease: "back.out(1.7)" });
  }, []);

  return (
    <div className="bg-gradient-to-br from-zinc-900 to-black rounded-2xl shadow-xl p-8 border border-zinc-700">
      <h2 className="text-2xl font-semibold text-white mb-2 flex items-center rating-form-element">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
        Rate Your Captain
      </h2>
      <p className="text-gray-400 ml-8 mb-4 rating-form-element">Your feedback helps improve our service</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col items-center rating-form-element">
          <p className="text-sm text-gray-300 mb-3">How was your ride experience?</p>
          <div className="rating-stars">
            <RatingStars initialRating={rating} onRatingChange={handleRatingChange} size="lg" />
          </div>
        </div>

        <div className="rating-form-element">
          <label className="text-sm font-medium text-gray-300 mb-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            Feedback (Optional)
          </label>
          <textarea
            aria-label="Ride feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Share your experience..."
            className="w-full px-4 py-3 bg-zinc-800 text-white border border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none h-24 transition duration-300"
          />
        </div>

        {error && (
          <div className="bg-red-900 bg-opacity-30 border border-red-500 text-red-300 p-4 rounded-lg flex items-start rating-form-element">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-900 bg-opacity-30 border border-green-500 text-green-300 p-4 rounded-lg flex items-start rating-form-element">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 rounded-lg font-semibold text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-purple-600 hover:to-pink-500 shadow-lg transition-transform transform hover:-translate-y-1 disabled:opacity-50 flex items-center justify-center"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Submitting...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Submit Rating
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default RateCaptain;
