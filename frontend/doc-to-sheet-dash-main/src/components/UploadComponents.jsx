import React, { useState } from "react";
import { uploadPDF } from "../api/upload";

export default function UploadComponent() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  const handleUpload = async () => {
    if (!file) return alert("Please choose a file first!");

    try {
      setMessage("Uploading...");
      const result = await uploadPDF(file);
      setMessage("Success: " + JSON.stringify(result));
    } catch (error) {
      setMessage("Upload failed: " + error.message);
    }
  };

  return (
    <div className="p-6 bg-gray-100 rounded-xl">
      <h2 className="text-xl font-semibold mb-4">Upload PDF</h2>

      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
        className="mb-4"
      />

      <button
        onClick={handleUpload}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg"
      >
        Upload
      </button>

      <p className="mt-4">{message}</p>
    </div>
  );
}
