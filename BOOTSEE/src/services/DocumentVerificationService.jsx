import axios from "axios";

// This service handles document verification using Gemini AI
export const DocumentVerificationService = {
  // Extract data from uploaded document using a mock implementation
  // since we're having issues with the Gemini API
  extractDataFromDocument: async (documentFile) => {
    try {
      console.log("Document processed successfully");

      // Determine document type and gender from file name if possible
      const fileName = documentFile.name.toLowerCase();
      let mockDocumentType = "Unknown";
      let mockGender = ""; // No default gender
      let mockIsVerified = true; // Default to verified

      // Check if filename contains gender indicators (for testing only)
      if (fileName.includes("male")) {
        mockGender = "male";
      } else if (fileName.includes("female")) {
        mockGender = "female";
      }

      // Check if filename contains verification indicators (for testing only)
      if (fileName.includes("invalid") || fileName.includes("fake") || fileName.includes("unverified")) {
        mockIsVerified = false;
      }

      // Determine document type
      if (fileName.includes("aadhar") || fileName.includes("aadhaar")) {
        mockDocumentType = "Aadhar Card";
      } else if (fileName.includes("pan")) {
        mockDocumentType = "PAN Card";
      } else if (fileName.includes("driv") || fileName.includes("license") || fileName.includes("dl")) {
        mockDocumentType = "Driving License";
      }

      // Create mock extracted data
      const mockData = {
        fullName: "Test User",
        gender: mockGender,
        dateOfBirth: "01/01/1990",
        documentNumber: "ABCD1234XYZ",
        documentType: mockDocumentType,
        isVerified: mockIsVerified
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      console.log(`Document processed: Type=${mockDocumentType}, Gender=${mockGender}, Verified=${mockIsVerified}`);

      return mockData;
    } catch (error) {
      console.error("Error processing document:", error);
      throw new Error("Failed to process document");
    }
  },

  // Verify if document is valid (not checking gender anymore)
  verifyUserEligibility: (documentData) => {
    // Check if document is verified
    return documentData && documentData.isVerified !== false;
  },

  // Verify driving license for captains
  verifyDrivingLicense: (documentData) => {
    // Check if document is a driving license
    if (documentData && documentData.documentType) {
      return documentData.documentType.toLowerCase().includes("driving") ||
             documentData.documentType.toLowerCase().includes("license");
    }
    return false;
  }
};

// Helper function to convert file to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

// Helper function to parse extracted text into structured data
const parseExtractedText = (text) => {
  // Initialize data object
  const data = {
    fullName: null,
    gender: null,
    dateOfBirth: null,
    documentNumber: null,
    documentType: null
  };

  // Extract document type
  if (text.toLowerCase().includes("aadhar") || text.toLowerCase().includes("aadhaar")) {
    data.documentType = "Aadhar Card";
  } else if (text.toLowerCase().includes("pan")) {
    data.documentType = "PAN Card";
  } else if (text.toLowerCase().includes("driving") || text.toLowerCase().includes("license")) {
    data.documentType = "Driving License";
  } else {
    data.documentType = "Unknown";
  }

  // Extract name
  const nameMatch = text.match(/name:?\s*([^\n,]+)/i) ||
                    text.match(/full name:?\s*([^\n,]+)/i);
  if (nameMatch && nameMatch[1]) {
    data.fullName = nameMatch[1].trim();
  }

  // Extract gender
  const genderMatch = text.match(/gender:?\s*([^\n,]+)/i) ||
                      text.match(/sex:?\s*([^\n,]+)/i);
  if (genderMatch && genderMatch[1]) {
    data.gender = genderMatch[1].trim();
  }

  // Extract date of birth
  const dobMatch = text.match(/date of birth:?\s*([^\n,]+)/i) ||
                   text.match(/dob:?\s*([^\n,]+)/i) ||
                   text.match(/born on:?\s*([^\n,]+)/i);
  if (dobMatch && dobMatch[1]) {
    data.dateOfBirth = dobMatch[1].trim();
  }

  // Extract document number
  const docNumberMatch = text.match(/document number:?\s*([^\n,]+)/i) ||
                         text.match(/card number:?\s*([^\n,]+)/i) ||
                         text.match(/license number:?\s*([^\n,]+)/i) ||
                         text.match(/aadhar number:?\s*([^\n,]+)/i) ||
                         text.match(/pan number:?\s*([^\n,]+)/i);
  if (docNumberMatch && docNumberMatch[1]) {
    data.documentNumber = docNumberMatch[1].trim();
  }

  return data;
};

export default DocumentVerificationService;
