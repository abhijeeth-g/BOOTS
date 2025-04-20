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
    <div>
      <h2>Your Ride History</h2>
      <ul>
        {rides.map(ride => (
          <li key={ride.id}>
            Pickup: {ride.pickup?.join(", ")} <br />
            Drop: {ride.drop?.join(", ")} <br />
            Fare: ₹{ride.fare} <br />
            Date: {ride.createdAt?.toDate().toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RideHistory;