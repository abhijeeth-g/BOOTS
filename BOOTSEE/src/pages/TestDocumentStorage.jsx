import { useState } from "react";
import SimpleStorageService from "../services/SimpleStorageService";
import { toast } from "react-toastify";

const TestDocumentStorage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);

    // Create preview for image files
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  // Upload file to Firebase Storage
  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError("");
    setSuccess("");
    setUploadedUrl("");

    try {
      // Use SimpleStorageService to upload file
      const downloadURL = await SimpleStorageService.uploadFile(
        selectedFile,
        `test/${Date.now()}_${selectedFile.name}`
      );

      setUploadedUrl(downloadURL);
      setSuccess("File uploaded successfully!");
      toast.success("File uploaded successfully!");
    } catch (error) {
      console.error("Error uploading file:", error);
      setError("Failed to upload file. Please try again.");
      toast.error("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary text-accent p-6">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-secondary mb-6">Test Document Storage</h1>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-900 bg-opacity-20 border border-red-800 text-red-200 px-4 py-3 mb-4 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-900 bg-opacity-20 border border-green-800 text-green-200 px-4 py-3 mb-4 rounded">
            {success}
          </div>
        )}

        {/* File Upload Section */}
        <div className="bg-dark-primary rounded-xl p-6 shadow-lg mb-6">
          <h2 className="text-xl font-semibold text-secondary mb-4">Upload Test File</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Select a file to upload
            </label>

            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-700 border-dashed rounded-lg hover:border-secondary transition-colors">
              <div className="space-y-1 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex text-sm text-gray-400">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-dark-primary rounded-md font-medium text-secondary hover:text-pink-400"
                  >
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      onChange={handleFileChange}
                      disabled={isUploading}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPG, PDF up to 5MB
                </p>
              </div>
            </div>
          </div>

          {/* Preview */}
          {previewUrl && (
            <div className="mb-4 rounded-lg overflow-hidden border border-gray-700">
              <img
                src={previewUrl}
                alt="File preview"
                className="max-w-full h-auto max-h-64"
              />
            </div>
          )}

          {/* Selected file name */}
          {selectedFile && (
            <div className="mb-4 text-gray-300">
              <p>Selected file: {selectedFile.name}</p>
            </div>
          )}

          {/* Upload button */}
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className={`w-full py-2 px-4 rounded-lg font-medium ${
              !selectedFile || isUploading
                ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                : "bg-secondary text-white hover:bg-pink-700 transition-colors"
            }`}
          >
            {isUploading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                Uploading...
              </div>
            ) : (
              "Upload File"
            )}
          </button>
        </div>

        {/* Uploaded File Result */}
        {uploadedUrl && (
          <div className="bg-dark-primary rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-secondary mb-4">Uploaded File</h2>
            
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-1">Download URL:</p>
              <div className="bg-gray-800 p-3 rounded-lg text-xs break-all">
                {uploadedUrl}
              </div>
            </div>
            
            {uploadedUrl.startsWith("http") && !uploadedUrl.includes("example.com") && (
              <a
                href={uploadedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-secondary text-white rounded-lg hover:bg-pink-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View File
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestDocumentStorage;
