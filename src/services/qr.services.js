// services/qrService.js
import { db } from "../firebase-config";
import { doc, setDoc, getDoc } from "firebase/firestore";

const imgbbApiKey = "d7478228aeaffe11bc627055c6e5b3c0"; // Replace with your actual API key

const uploadQrImage = async (file) => {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  const url = data?.data?.url;

  if (!url) throw new Error("Image upload failed");

  await setDoc(doc(db, "qr", "current"), { url });
  return url;
};

const fetchQrImage = async () => {
  const snapshot = await getDoc(doc(db, "qr", "current"));
  return snapshot.exists() ? snapshot.data().url : null;
};

const QrService = {
  uploadQrImage,
  fetchQrImage,
};

export default QrService;
