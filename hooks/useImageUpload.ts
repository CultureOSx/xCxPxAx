import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../lib/firebase'; // your config

interface UploadOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;           // 0.6–0.85 recommended
  folder?: string;            // e.g. 'events', 'perks', 'profiles'
  onProgress?: (progress: number) => void;
}

export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const compressAndUpload = async (
    pickerResult: ImagePicker.ImagePickerResult,
    options: UploadOptions = {}
  ): Promise<{ downloadURL: string; thumbhash?: string }> => {
    if (pickerResult.canceled || !pickerResult.assets?.[0]) throw new Error('No image selected');

    setUploading(true);
    setProgress(0);

    const asset = pickerResult.assets[0];
    const { maxWidth = 1200, maxHeight = 1200, quality = 0.82, folder = 'uploads' } = options;

    try {
      // Step 1: Client-side resize + compress (huge bandwidth & cost saver)
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: maxWidth } }], // preserve aspect ratio
        {
          compress: quality,
          format: ImageManipulator.SaveFormat.JPEG, // or WEBP if you enable it
        }
      );

      // Step 2: Convert to Blob for Firebase
      const response = await fetch(manipulated.uri);
      const blob = await response.blob();

      // Step 3: Upload with progress
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
      const storageRef = ref(storage, `${folder}/${fileName}`);

      const uploadTask = uploadBytes(storageRef, blob);

      /* Listen to progress if we swap uploadBytes for uploadBytesResumable
      uploadTask.on('state_changed',
        (snapshot) => {
          const prog = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(Math.round(prog));
          options.onProgress?.(prog);
        }
      );
      */

      await uploadTask;

      const downloadURL = await getDownloadURL(storageRef);

      // Optional: Trigger server-side ThumbHash generation (via Cloud Function or Storage trigger)
      // For now we return URL; ThumbHash will be added by server

      setUploading(false);
      setProgress(0);

      return { downloadURL };
    } catch (error) {
      setUploading(false);
      throw error;
    }
  };

  return { compressAndUpload, uploading, progress };
};
