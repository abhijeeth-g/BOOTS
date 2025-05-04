/**
 * Firebase Storage Service
 * Provides centralized methods for uploading and retrieving files from Firebase Storage
 */

import { storage } from "../firebase/config.jsx";
import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata,
  updateMetadata
} from "firebase/storage";

class StorageService {
  /**
   * Upload a file to Firebase Storage with progress tracking
   * @param {File} file - The file to upload
   * @param {string} path - The storage path (e.g., "users/userId/documents/aadhar")
   * @param {Object} metadata - Optional metadata for the file
   * @param {Function} progressCallback - Optional callback for upload progress
   * @returns {Promise<string>} - Download URL of the uploaded file
   */
  async uploadFile(file, path, metadata = {}, progressCallback = null) {
    try {
      if (!file) {
        throw new Error("No file provided");
      }

      // Create storage reference
      const storageRef = ref(storage, path);

      // Add content type to metadata if not provided
      if (!metadata.contentType && file.type) {
        metadata.contentType = file.type;
      }

      // Add custom metadata if not provided
      if (!metadata.customMetadata) {
        metadata.customMetadata = {};
      }

      // Add upload timestamp
      metadata.customMetadata.uploadedAt = new Date().toISOString();

      let uploadTask;
      let downloadURL;

      // If progress callback is provided, use resumable upload
      if (progressCallback) {
        uploadTask = uploadBytesResumable(storageRef, file, metadata);

        // Set up progress monitoring
        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            progressCallback(progress, snapshot);
          },
          (error) => {
            console.error("Upload error:", error);
            throw error;
          }
        );

        // Wait for upload to complete
        await uploadTask;

        // Get download URL
        downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
      } else {
        // Use simple upload without progress tracking
        const snapshot = await uploadBytes(storageRef, file, metadata);
        downloadURL = await getDownloadURL(snapshot.ref);
      }

      return downloadURL;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  }

  /**
   * Upload a data URL (base64) to Firebase Storage
   * @param {string} dataUrl - The data URL to upload
   * @param {string} path - The storage path
   * @param {string} contentType - The content type (e.g., "image/jpeg")
   * @param {Object} metadata - Optional metadata
   * @returns {Promise<string>} - Download URL of the uploaded file
   */
  async uploadDataUrl(dataUrl, path, contentType = "image/jpeg", metadata = {}) {
    try {
      if (!dataUrl) {
        throw new Error("No data URL provided");
      }

      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      // Create file from blob
      const file = new File([blob], "image.jpg", { type: contentType });

      // Upload file
      return await this.uploadFile(file, path, metadata);
    } catch (error) {
      console.error("Error uploading data URL:", error);
      throw error;
    }
  }

  /**
   * Get download URL for a file
   * @param {string} path - The storage path
   * @returns {Promise<string>} - Download URL
   */
  async getFileUrl(path) {
    try {
      const storageRef = ref(storage, path);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error("Error getting file URL:", error);
      throw error;
    }
  }

  /**
   * Delete a file from Firebase Storage
   * @param {string} path - The storage path
   * @returns {Promise<void>}
   */
  async deleteFile(path) {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error) {
      console.error("Error deleting file:", error);
      throw error;
    }
  }

  /**
   * Upload a document file for verification
   * @param {File} file - The document file
   * @param {string} userId - User ID
   * @param {string} documentType - Type of document (e.g., "aadhar", "drivingLicense")
   * @param {Function} progressCallback - Optional progress callback
   * @returns {Promise<string>} - Download URL
   */
  async uploadDocument(file, userId, documentType, progressCallback = null) {
    try {
      if (!file || !userId || !documentType) {
        throw new Error("Missing required parameters");
      }

      // Create path with timestamp to avoid overwriting
      const timestamp = Date.now();
      const path = `documents/${userId}/${documentType}_${timestamp}`;

      // Create metadata
      const metadata = {
        contentType: file.type,
        customMetadata: {
          userId,
          documentType,
          originalName: file.name,
          uploadedAt: new Date().toISOString()
        }
      };

      // Upload file
      return await this.uploadFile(file, path, metadata, progressCallback);
    } catch (error) {
      console.error("Error uploading document:", error);
      throw error;
    }
  }

  /**
   * Upload a face image for verification
   * @param {string} dataUrl - The face image data URL
   * @param {string} userId - User ID
   * @returns {Promise<string>} - Download URL
   */
  async uploadFaceImage(dataUrl, userId) {
    try {
      if (!dataUrl || !userId) {
        throw new Error("Missing required parameters");
      }

      // Create path with timestamp
      const timestamp = Date.now();
      const path = `faces/${userId}/face_${timestamp}.jpg`;

      // Create metadata
      const metadata = {
        contentType: "image/jpeg",
        customMetadata: {
          userId,
          uploadedAt: new Date().toISOString(),
          purpose: "verification"
        }
      };

      // Upload data URL
      return await this.uploadDataUrl(dataUrl, path, "image/jpeg", metadata);
    } catch (error) {
      console.error("Error uploading face image:", error);
      throw error;
    }
  }

  /**
   * Upload a profile picture
   * @param {File|string} fileOrDataUrl - The profile picture file or data URL
   * @param {string} userId - User ID
   * @param {string} userType - Type of user ("user" or "captain")
   * @param {Function} progressCallback - Optional progress callback
   * @returns {Promise<string>} - Download URL
   */
  async uploadProfilePicture(fileOrDataUrl, userId, userType = "user", progressCallback = null) {
    try {
      if (!fileOrDataUrl || !userId) {
        throw new Error("Missing required parameters");
      }

      // Create path
      const path = `profilePictures/${userType}/${userId}`;

      // Create metadata
      const metadata = {
        customMetadata: {
          userId,
          userType,
          uploadedAt: new Date().toISOString()
        }
      };

      // Check if input is a data URL or a file
      if (typeof fileOrDataUrl === "string" && fileOrDataUrl.startsWith("data:")) {
        // It's a data URL
        return await this.uploadDataUrl(fileOrDataUrl, path, "image/jpeg", metadata);
      } else {
        // It's a file
        metadata.contentType = fileOrDataUrl.type;
        return await this.uploadFile(fileOrDataUrl, path, metadata, progressCallback);
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      throw error;
    }
  }
}

// Create singleton instance
const storageService = new StorageService();
export default storageService;
