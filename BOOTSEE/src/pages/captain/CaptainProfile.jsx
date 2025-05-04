import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { db, storage } from "../../firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import RatingStars from "../../components/RatingStars";
import DocumentUpload from "../../components/DocumentUpload";
import ImprovedFaceCapture from "../../components/ImprovedFaceCapture";
import { toast } from "react-toastify";

const CaptainProfile = () => {
  const { user, updateUserPassword } = useAuth();
  const [captainData, setCaptainData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showLicenseVerification, setShowLicenseVerification] = useState(false);
  const [showAadharVerification, setShowAadharVerification] = useState(false);
  const [licenseVerified, setLicenseVerified] = useState(false);
  const [licenseData, setLicenseData] = useState(null);
  const [licenseUrl, setLicenseUrl] = useState("");
  const [aadharVerified, setAadharVerified] = useState(false);
  const [aadharData, setAadharData] = useState(null);
  const [aadharUrl, setAadharUrl] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [uploadingPicture, setUploadingPicture] = useState(false);

  // Password change states
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    vehicleNumber: "",
    vehicleModel: "",
    upiId: ""
  });

  useEffect(() => {
    const fetchCaptainData = async () => {
      if (!user) return;

      try {
        const captainDoc = await getDoc(doc(db, "captains", user.uid));
        if (captainDoc.exists()) {
          const data = captainDoc.data();
          setCaptainData(data);
          setFormData({
            name: data.name || "",
            phone: data.phone || "",
            vehicleNumber: data.vehicleNumber || "",
            vehicleModel: data.vehicleModel || "",
            upiId: data.upiId || ""
          });
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching captain data:", error);
        setLoading(false);
      }
    };

    fetchCaptainData();
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) return;

    try {
      await updateDoc(doc(db, "captains", user.uid), formData);
      setCaptainData(prev => ({
        ...prev,
        ...formData
      }));
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary text-accent flex items-center justify-center">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary text-accent">
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-dark-primary rounded-xl shadow-md overflow-hidden">
          {/* Profile Header */}
          <div className="bg-secondary bg-opacity-90 p-6">
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
              <div className="w-24 h-24 bg-dark-primary rounded-full flex items-center justify-center text-4xl font-bold text-secondary">
                {captainData?.name?.charAt(0) || "C"}
              </div>
              <div className="text-center md:text-left">
                <h1 className="text-2xl font-bold text-white">{captainData?.name}</h1>
                <div className="mt-2">
                  <RatingStars
                    initialRating={captainData?.rating || 0}
                    totalRatings={captainData?.totalRatings || 0}
                    readOnly={true}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-6">
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-dark-primary border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary text-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-dark-primary border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary text-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Vehicle Number</label>
                  <input
                    type="text"
                    name="vehicleNumber"
                    value={formData.vehicleNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-dark-primary border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary text-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Vehicle Model</label>
                  <input
                    type="text"
                    name="vehicleModel"
                    value={formData.vehicleModel}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-dark-primary border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary text-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">UPI ID (for payments)</label>
                  <input
                    type="text"
                    name="upiId"
                    value={formData.upiId}
                    onChange={handleInputChange}
                    placeholder="yourname@upi"
                    className="w-full px-4 py-2 bg-dark-primary border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary text-accent"
                  />
                  <p className="text-xs text-gray-500 mt-1">This will be used for receiving payments from riders</p>
                  <div className="mt-2 text-xs">
                    <p className="text-secondary">Supported UPI Apps:</p>
                    <div className="flex space-x-2 mt-1">
                      <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs">Google Pay</span>
                      <span className="bg-purple-600 text-white px-2 py-1 rounded-full text-xs">PhonePe</span>
                      <span className="bg-blue-400 text-white px-2 py-1 rounded-full text-xs">Paytm</span>
                    </div>
                  </div>
                </div>



                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-secondary text-white rounded-lg hover:bg-pink-700 transition duration-200"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h2 className="text-xl font-semibold text-secondary mb-4">Personal Information</h2>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-400">Full Name</p>
                        <p>{captainData?.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Email</p>
                        <p>{captainData?.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Phone</p>
                        <p>{captainData?.phone}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold text-secondary mb-4">Vehicle Information</h2>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-400">Vehicle Model</p>
                        <p>{captainData?.vehicleModel}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">UPI ID</p>
                        <p className="flex items-center">
                          {captainData?.upiId || "Not set"}
                          {!captainData?.upiId && (
                            <span className="ml-2 text-xs text-red-400">(Required for payments)</span>
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-400">Vehicle Number</p>
                        <p>{captainData?.vehicleNumber}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <h2 className="text-xl font-semibold text-secondary mb-4">Statistics</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-black bg-opacity-30 p-4 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Total Rides</p>
                      <p className="text-2xl font-semibold">{captainData?.totalRides?.toLocaleString() || 0}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {captainData?.completedRides || 0} completed
                      </p>
                    </div>
                    <div className="bg-black bg-opacity-30 p-4 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Total Earnings</p>
                      <p className="text-2xl font-semibold text-green-500">
                        ₹{(captainData?.totalEarnings || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Avg ₹{captainData?.totalRides ? Math.round((captainData?.totalEarnings || 0) / captainData?.totalRides).toLocaleString('en-IN') : 0}/ride
                      </p>
                    </div>
                    <div className="bg-black bg-opacity-30 p-4 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Rating</p>
                      <div className="flex items-center">
                        <span className="text-2xl font-semibold mr-2">
                          {captainData?.rating?.toFixed(1) || "N/A"}
                        </span>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`text-xl ${star <= Math.round(captainData?.rating || 0) ? 'text-yellow-400' : 'text-gray-600'}`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {captainData?.totalRatings || 0} {captainData?.totalRatings === 1 ? 'rating' : 'ratings'}
                      </p>
                    </div>
                    <div className="bg-black bg-opacity-30 p-4 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Member Since</p>
                      <p className="text-2xl font-semibold">
                        {captainData?.createdAt?.toDate().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) || "N/A"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {captainData?.createdAt ? Math.floor((new Date() - captainData.createdAt.toDate()) / (1000 * 60 * 60 * 24)) : 0} days
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-2 bg-secondary text-white rounded-lg hover:bg-pink-700 transition duration-200"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaptainProfile;
