import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config.jsx";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import SimpleStorageService from "../../services/SimpleStorageService";
import DocumentUpload from "../../components/DocumentUpload";
import ImprovedFaceCapture from "../../components/ImprovedFaceCapture";
import { toast } from "react-toastify";

const UserProfile = () => {
  const { user, userProfile, updateUserEmail, updateUserPassword } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showDocumentVerification, setShowDocumentVerification] = useState(false);
  const [showFaceVerification, setShowFaceVerification] = useState(false);
  const [documentVerified, setDocumentVerified] = useState(false);
  const [documentData, setDocumentData] = useState(null);
  const [documentUrl, setDocumentUrl] = useState("");
  const [faceVerified, setFaceVerified] = useState(false);
  const [faceImageUrl, setFaceImageUrl] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form data states
  const [formData, setFormData] = useState({
    username: "",
    phone: "",
    email: ""
  });

  // Password change states
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Profile picture states
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [uploadingPicture, setUploadingPicture] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          setFormData({
            username: data.username || "",
            phone: data.phone || "",
            email: user.email || ""
          });
          setProfilePictureUrl(data.profilePictureUrl || "");
          setDocumentVerified(data.documentVerified || false);
          setFaceVerified(data.faceVerified || false);
          setDocumentUrl(data.documentUrl || "");
          setFaceImageUrl(data.faceImageUrl || "");
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError("Failed to load profile data. Please try again.");
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfilePictureChange = (e) => {
    if (e.target.files[0]) {
      setProfilePicture(e.target.files[0]);
      // Create a preview URL
      setProfilePictureUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  const uploadProfilePicture = async () => {
    if (!profilePicture || !user) return null;

    setUploadingPicture(true);

    try {
      // Use SimpleStorageService to upload profile picture
      const downloadURL = await SimpleStorageService.uploadProfilePicture(
        profilePicture,
        user.uid,
        "user"
      );

      // Update user document with profile picture URL
      await updateDoc(doc(db, "users", user.uid), {
        profilePictureUrl: downloadURL
      });

      setUploadingPicture(false);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      setError("Failed to upload profile picture. Please try again.");
      setUploadingPicture(false);

      // Return a mock URL for testing if upload fails
      return "https://example.com/mock-profile-picture.jpg";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!user) return;

    try {
      // Upload profile picture if changed
      let pictureUrl = profilePictureUrl;
      if (profilePicture) {
        pictureUrl = await uploadProfilePicture();
        if (!pictureUrl) {
          setError("Failed to upload profile picture. Other changes were saved.");
        }
      }

      // Update user document
      const updates = {
        username: formData.username,
        phone: formData.phone
      };

      if (pictureUrl) {
        updates.profilePictureUrl = pictureUrl;
      }

      await updateDoc(doc(db, "users", user.uid), updates);

      // Update email if changed
      if (formData.email !== user.email) {
        // This would typically require re-authentication
        // For now, we'll just show an error message
        setError("Email changes require re-authentication. Please contact support.");
      }

      setUserData(prev => ({
        ...prev,
        ...updates
      }));

      setIsEditing(false);
      setSuccess("Profile updated successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Failed to update profile. Please try again.");
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    try {
      await updateUserPassword(passwordData.currentPassword, passwordData.newPassword);

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });

      setShowPasswordChange(false);
      setSuccess("Password updated successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (error) {
      console.error("Error updating password:", error);

      if (error.code === "auth/wrong-password") {
        setError("Current password is incorrect.");
      } else if (error.code === "auth/requires-recent-login") {
        setError("This operation requires recent authentication. Please log in again.");
      } else {
        setError("Failed to update password. Please try again.");
      }
    }
  };

  // Handle document verification
  const handleDocumentVerification = (isVerified, data, url) => {
    setDocumentVerified(isVerified);
    if (isVerified && data) {
      setDocumentData(data);
      setDocumentUrl(url);

      // Update user document with verification data
      updateDoc(doc(db, "users", user.uid), {
        documentVerified: true,
        documentUrl: url,
        documentType: data.documentType || "Unknown",
        documentNumber: data.documentNumber || "",
        gender: data.gender || "female",
        lastVerified: new Date().toISOString()
      }).then(() => {
        setSuccess("Document verified successfully!");
        setShowDocumentVerification(false);

        // Update local state
        setUserData(prev => ({
          ...prev,
          documentVerified: true,
          documentUrl: url,
          documentType: data.documentType || "Unknown",
          documentNumber: data.documentNumber || "",
          gender: data.gender || "female",
          lastVerified: new Date().toISOString()
        }));
      }).catch(error => {
        console.error("Error updating document verification:", error);
        setError("Failed to update document verification. Please try again.");
      });
    }
  };

  // Handle face verification
  const handleFaceCapture = (imageUrl) => {
    setFaceVerified(true);
    setFaceImageUrl(imageUrl);

    // Update user document with face verification data
    updateDoc(doc(db, "users", user.uid), {
      faceVerified: true,
      faceImageUrl: imageUrl,
      lastFaceVerified: new Date().toISOString()
    }).then(() => {
      setSuccess("Face verified successfully!");
      setShowFaceVerification(false);

      // Update local state
      setUserData(prev => ({
        ...prev,
        faceVerified: true,
        faceImageUrl: imageUrl,
        lastFaceVerified: new Date().toISOString()
      }));
    }).catch(error => {
      console.error("Error updating face verification:", error);
      setError("Failed to update face verification. Please try again.");
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary text-accent flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
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
              <div className="relative group">
                {profilePictureUrl ? (
                  <img
                    src={profilePictureUrl}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-2 border-white"
                  />
                ) : (
                  <div className="w-24 h-24 bg-dark-primary rounded-full flex items-center justify-center text-4xl font-bold text-secondary">
                    {userData?.username?.charAt(0) || "U"}
                  </div>
                )}

                {isEditing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <label htmlFor="profile-picture" className="cursor-pointer text-white text-xs font-medium">
                      Change Photo
                    </label>
                    <input
                      type="file"
                      id="profile-picture"
                      className="hidden"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                    />
                  </div>
                )}
              </div>

              <div className="text-center md:text-left">
                <h1 className="text-2xl font-bold text-white">{userData?.username}</h1>
                <p className="text-white text-opacity-80">{user?.email}</p>
                {userData?.documentVerified && (
                  <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Success/Error Messages */}
          {error && (
            <div className="bg-red-900 bg-opacity-20 border border-red-800 text-red-200 px-4 py-3 mx-6 mt-4 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-900 bg-opacity-20 border border-green-800 text-green-200 px-4 py-3 mx-6 mt-4 rounded">
              {success}
            </div>
          )}

          {/* Profile Content */}
          <div className="p-6">
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-dark-primary border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary text-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-dark-primary border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary text-accent"
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">Email changes require re-authentication</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                    className="w-full px-4 py-2 bg-dark-primary border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary text-accent"
                  />
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
                        <p>{userData?.username}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Email</p>
                        <p>{user?.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Phone</p>
                        <p>{userData?.phone || "Not provided"}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold text-secondary mb-4">Verification Status</h2>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-400">Document Verification</p>
                        <div className="flex items-center">
                          {userData?.documentVerified ? (
                            <>
                              <span className="text-green-400 mr-2">Verified</span>
                              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </>
                          ) : (
                            <span className="text-red-400">Not verified</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {userData?.documentType || "No document uploaded"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-400">Face Verification</p>
                        <div className="flex items-center">
                          {userData?.faceVerified ? (
                            <>
                              <span className="text-green-400 mr-2">Verified</span>
                              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </>
                          ) : (
                            <span className="text-red-400">Not verified</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-gray-400">Account Type</p>
                        <p>User (Female Only)</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-4">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-2 bg-secondary text-white rounded-lg hover:bg-pink-700 transition duration-200"
                  >
                    Edit Profile
                  </button>

                  <button
                    onClick={() => setShowPasswordChange(true)}
                    className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition duration-200"
                  >
                    Change Password
                  </button>

                  <button
                    onClick={() => setShowDocumentVerification(true)}
                    className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition duration-200"
                  >
                    Re-verify Document
                  </button>

                  <button
                    onClick={() => setShowFaceVerification(true)}
                    className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition duration-200"
                  >
                    Re-verify Face
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordChange && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-primary rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-secondary mb-4">Change Password</h2>

            {error && (
              <div className="bg-red-900 bg-opacity-20 border border-red-800 text-red-200 px-4 py-3 mb-4 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-2 bg-dark-primary border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary text-accent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-2 bg-dark-primary border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary text-accent"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-2 bg-dark-primary border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary text-accent"
                  required
                  minLength={6}
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-secondary text-white rounded-lg hover:bg-pink-700 transition duration-200"
                >
                  Update Password
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordChange(false)}
                  className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Verification Modal */}
      {showDocumentVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-primary rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-secondary">Document Verification</h2>
              <button
                onClick={() => setShowDocumentVerification(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-gray-300 mb-4">
              Please upload a valid government ID document for verification. We only accept female users.
            </p>

            <DocumentUpload
              onUpload={(url) => setDocumentUrl(url)}
              onVerification={handleDocumentVerification}
              userId={user.uid}
              documentType="identity"
              verifyGender={true}
            />
          </div>
        </div>
      )}

      {/* Face Verification Modal */}
      {showFaceVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-primary rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-secondary">Face Verification</h2>
              <button
                onClick={() => setShowFaceVerification(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-gray-300 mb-4">
              Please take a clear photo of your face for verification.
            </p>

            <ImprovedFaceCapture
              onCapture={handleFaceCapture}
              userId={user.uid}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
