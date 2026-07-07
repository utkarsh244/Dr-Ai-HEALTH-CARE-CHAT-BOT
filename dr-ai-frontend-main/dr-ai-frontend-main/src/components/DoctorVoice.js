import React from "react";
import axios from "axios";

function DoctorVoice({ text, lang }) {
  const getVoice = async () => {
    const formData = new FormData();
    formData.append("input_text", text);
    formData.append("language", lang);

    try {
      const res = await axios.post("http://127.0.0.1:8000/tts", formData, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const audio = new Audio(url);
      audio.play();
    } catch (err) {
      console.error("Error:", err);
    }
  };

  return <button onClick={getVoice}>🔊 Hear Doctor's Voice</button>;
}

export default DoctorVoice;