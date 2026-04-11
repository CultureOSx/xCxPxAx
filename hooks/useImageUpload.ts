import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc, deleteField } from 'firebase/firestore';
import { db, storage } from '../lib/firebase';

export interface UploadResult {
  downloadURL: string;
  thumbhash?: string; // Automatically populated via Cloud Functions post-upload
}

/**
 * 🚀 CulturePass Optimized Image Upload Hook
 * - Implements Client-Side compression (Fast & Cost Save)
 * - Firebase Storage upload stream parsing for progress UI
 * - Automatic atomic CRUD matching exactly to Firestore docs
 * - Cache-busting URL architecture via timestamps
 */
export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFromUri = async (
    rawUri: string,
    collectionName: string,
    docId: string,
    fieldName: string = 'coverUrl',
    skipDbUpdate: boolean = false
  ): Promise<UploadResult> => {
    if (!rawUri) throw new Error('No image provided');

    setUploading(true);
    setProgress(0);

    try {
      let uploadUri = rawUri;
      try {
        const manipulated = await ImageManipulator.manipulateAsync(
          rawUri,
          [{ resize: { width: 1200 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );
        uploadUri = manipulated.uri;
      } catch {
        // Some web URI schemes are not compatible with the manipulator.
      }

      const blob = await new Promise<Blob>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.responseType = 'blob';
        xhr.onload = () => resolve(xhr.response as Blob);
        xhr.onerror = () => reject(new Error('Failed to load image file'));
        xhr.open('GET', uploadUri);
        xhr.send();
      });

      const timestamp = Date.now();
      const fileName = `${timestamp}-${Math.random().toString(36).substring(2)}.jpg`;
      const storageRef = ref(storage, `${collectionName}/${docId}/${fileName}`);
      const uploadTask = uploadBytesResumable(storageRef, blob);

      await new Promise<void>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const currentProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setProgress(currentProgress);
          },
          (error) => reject(error),
          () => resolve()
        );
      });

      const downloadURL = await getDownloadURL(storageRef);

      if (!skipDbUpdate) {
        const { setDoc } = await import('firebase/firestore');
        const docRef = doc(db, collectionName, docId);
        await setDoc(
          docRef,
          {
            [fieldName]: downloadURL,
            updatedAt: new Date(),
          },
          { merge: true }
        );
      }

      return { downloadURL };
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  /**
   * Automatically compresses the selected image, uploads it securely into Firebase Storage,
   * inside the specific {collection}/{docId} directory, and immediately writes the returned
   * URL back to the Firestore document field.
   */
  const uploadImage = async (
    pickerResult: ImagePicker.ImagePickerResult,
    collectionName: string,
    docId: string,
    fieldName: string = 'coverUrl',
    skipDbUpdate: boolean = false
  ): Promise<UploadResult> => {
    if (pickerResult.canceled || !pickerResult.assets?.[0]) {
      throw new Error('No image provided');
    }
    const asset = pickerResult.assets[0];
    return uploadFromUri(asset.uri, collectionName, docId, fieldName, skipDbUpdate);
  };

  /**
   * Destroys an existing remote file accurately and cleanly removes its pointer from Firestore.
   */
  const deleteImage = async (
    collectionName: string,
    docId: string,
    oldUrl: string,
    fieldName: string = 'coverUrl'
  ) => {
    if (!oldUrl) return;
    try {
      // Firebase standardly resolves full bucket urls to refs internally
      const storageRef = ref(storage, oldUrl);
      await deleteObject(storageRef);

      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, { [fieldName]: deleteField(), updatedAt: new Date() });
    } catch (e) {
      console.warn('[CulturePass] Delete image failed. It might have been manually deleted or is missing.', e);
    }
  };

  return { uploadImage, uploadFromUri, deleteImage, uploading, progress };
};
