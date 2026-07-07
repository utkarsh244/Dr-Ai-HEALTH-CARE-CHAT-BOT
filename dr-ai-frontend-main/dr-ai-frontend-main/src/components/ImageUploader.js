import React from "react";
import axios from "axios";

function ImageUploader() {
  const handleUpload = async (event) => {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append("user_text", "Check this image");
    formData.append("image", file);

    try {
      const res = await axios.post("http://127.0.0.1:8000/analyze", formData);
      console.log("Doctor Response:", res.data);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  return <input type="file" accept="image/*" onChange={handleUpload} />;
}

export default ImageUploader;