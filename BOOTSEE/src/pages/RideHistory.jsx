import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

const RideHistory = () => {
  const { user } = useAuth();
  const [rides, setRides] = useState([]);

  useEffect(() => {
    const fetchRides = async () => {
      const q = query(
        collection(db, "rides"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRides(data);
    };
    fetchRides();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-secondary mb-8">Your Ride History</h2>

        {rides.length === 0 ? (
          <div className="bg-black bg-opacity-70 p-6 rounded-xl border border-gray-800 text-center">
            <p className="text-white text-lg">You haven't taken any rides yet.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {rides.map(ride => (
              <li key={ride.id} className="bg-black bg-opacity-70 p-6 rounded-xl border border-gray-800">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 mb-1">Pickup Location</p>
                    <p className="text-white font-medium">{ride.pickup?.join(", ")}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Drop Location</p>
                    <p className="text-white font-medium">{ride.drop?.join(", ")}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Fare</p>
                    <p className="text-secondary font-medium">₹{ride.fare}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Date & Time</p>
                    <p className="text-white font-medium">{ride.createdAt?.toDate().toLocaleString()}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default RideHistory;