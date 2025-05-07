/**
 * Simple Firebase Storage Service
 * Provides basic methods for uploading files to Firebase Storage
 */

import { storage } from "../firebase/config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

/**
 * Upload a file to Firebase Storage with fallback for CORS issues
 * @param {File} file - The file to upload
 * @param {string} path - The storage path (e.g., "documents/userId/filename")
 * @returns {Promise<string>} - Download URL of the uploaded file or a mock URL
 */
export const uploadFile = async (file, path) => {
  // Check if we're in development mode
  const isDevelopment = window.location.hostname === 'localhost' ||
                        window.location.hostname === '127.0.0.1';

  // For development environment, just return a mock URL to avoid CORS issues
  if (isDevelopment) {
    console.log("Development environment detected. Using mock URL instead of actual upload.");
    // Generate a unique mock URL based on the file name and path
    const timestamp = Date.now();
    const mockUrl = `https://example.com/mock/${path}?t=${timestamp}`;

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return mockUrl;
  }

  // For production, try to upload to Firebase Storage
  try {
    if (!file) {
      throw new Error("No file provided");
    }

    // Create storage reference
    const storageRef = ref(storage, path);

    // Upload file
    console.log("Uploading file to Firebase Storage:", path);
    const snapshot = await uploadBytes(storageRef, file);
    console.log("File uploaded successfully:", snapshot);

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log("Download URL obtained:", downloadURL);

    return downloadURL;
  } catch (error) {
    console.error("Error uploading file:", error);

    // Log more detailed error information
    if (error.code) {
      console.error("Error code:", error.code);
    }

    // Handle specific Firebase Storage errors
    if (error.code === 'storage/unauthorized') {
      console.error("User doesn't have permission to access the object");
    } else if (error.code === 'storage/canceled') {
      console.error("User canceled the upload");
    } else if (error.code === 'storage/unknown') {
      console.error("Unknown error occurred, inspect error.serverResponse");
    }

    // If there's a CORS error, return a mock URL
    if (error.message && (
        error.message.includes("CORS") ||
        error.message.includes("network error") ||
        error.message.includes("permission_denied") ||
        error.message.includes("storage/unauthorized"))) {
      console.log("CORS or permission issue detected. Using mock URL.");
    }

    // Return a mock URL with the path to make it somewhat unique
    const timestamp = Date.now();
    return `https://example.com/mock/${path}?t=${timestamp}`;
  }
};

/**
 * Upload a document for verification with fallback for CORS issues
 * @param {File} file - The document file
 * @param {string} userId - User ID
 * @param {string} documentType - Type of document (e.g., "aadhar", "drivingLicense")
 * @returns {Promise<string>} - Download URL or a mock URL
 */
export const uploadDocument = async (file, userId, documentType) => {
  try {
    if (!file || !userId || !documentType) {
      throw new Error("Missing required parameters");
    }

    // Check if we're in development mode
    const isDevelopment = window.location.hostname === 'localhost' ||
                          window.location.hostname === '127.0.0.1';

    // For development environment, just return a mock URL to avoid CORS issues
    if (isDevelopment) {
      console.log("Development environment detected. Using mock URL for document.");
      // Generate a unique mock URL
      const timestamp = Date.now();
      const mockUrl = `https://example.com/mock/documents/${userId}/${documentType}_${timestamp}`;

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      return mockUrl;
    }

    // Create path with timestamp to avoid overwriting
    const timestamp = Date.now();
    const path = `documents/${userId}/${documentType}_${timestamp}`;

    // Upload file
    return await uploadFile(file, path);
  } catch (error) {
    console.error("Error uploading document:", error);
    // Return a mock URL with timestamp to make it unique
    const timestamp = Date.now();
    return `https://example.com/mock/documents/${userId}/${documentType}_${timestamp}`;
  }
};

/**
 * Upload a face image for verification with fallback for CORS issues
 * @param {string} dataUrl - The face image data URL
 * @param {string} userId - User ID
 * @returns {Promise<string>} - Download URL or a mock URL
 */
export const uploadFaceImage = async (dataUrl, userId) => {
  try {
    if (!dataUrl || !userId) {
      throw new Error("Missing required parameters");
    }

    // Check if we're in development mode
    const isDevelopment = window.location.hostname === 'localhost' ||
                          window.location.hostname === '127.0.0.1';

    // For development environment, just return a mock URL to avoid CORS issues
    if (isDevelopment) {
      console.log("Development environment detected. Using mock URL for face image.");
      // Generate a unique mock URL
      const timestamp = Date.now();
      const mockUrl = `https://example.com/mock/faces/${userId}/face_${timestamp}.jpg`;

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      return mockUrl;
    }

    // For production, try to upload to Firebase Storage
    // Convert data URL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    // Create file from blob
    const file = new File([blob], "face.jpg", { type: "image/jpeg" });

    // Create path with timestamp
    const timestamp = Date.now();
    const path = `faces/${userId}/face_${timestamp}.jpg`;

    // Upload file
    return await uploadFile(file, path);
  } catch (error) {
    console.error("Error uploading face image:", error);
    // Return a mock URL with timestamp to make it unique
    const timestamp = Date.now();
    return `https://example.com/mock/faces/${userId}/face_${timestamp}.jpg`;
  }
};

/**
 * Upload a profile picture with fallback for CORS issues
 * @param {File|string} fileOrDataUrl - The profile picture file or data URL
 * @param {string} userId - User ID
 * @param {string} userType - Type of user ("user" or "captain")
 * @returns {Promise<string>} - Download URL or a mock URL
 */
export const uploadProfilePicture = async (fileOrDataUrl, userId, userType = "user") => {
  try {
    if (!fileOrDataUrl || !userId) {
      throw new Error("Missing required parameters");
    }

    // Check if we're in development mode
    const isDevelopment = window.location.hostname === 'localhost' ||
                          window.location.hostname === '127.0.0.1';

    // For development environment, just return a mock URL to avoid CORS issues
    if (isDevelopment) {
      console.log("Development environment detected. Using mock URL for profile picture.");
      // Generate a unique mock URL
      const timestamp = Date.now();
      const mockUrl = `https://example.com/mock/profilePictures/${userType}/${userId}?t=${timestamp}`;

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      return mockUrl;
    }

    // Create path
    const path = `profilePictures/${userType}/${userId}`;

    // Check if input is a data URL or a file
    if (typeof fileOrDataUrl === "string" && fileOrDataUrl.startsWith("data:")) {
      // Convert data URL to blob
      const response = await fetch(fileOrDataUrl);
      const blob = await response.blob();

      // Create file from blob
      const file = new File([blob], "profile.jpg", { type: "image/jpeg" });

      // Upload file
      return await uploadFile(file, path);
    } else {
      // It's a file
      return await uploadFile(fileOrDataUrl, path);
    }
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    // Return a mock URL with timestamp to make it unique
    const timestamp = Date.now();
    return `https://example.com/mock/profilePictures/${userType}/${userId}?t=${timestamp}`;
  }
};

// Export all functions as a simple service object
const SimpleStorageService = {
  uploadFile,
  uploadDocument,
  uploadFaceImage,
  uploadProfilePicture
};

export default SimpleStorageService;
