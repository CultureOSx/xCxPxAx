// @ts-nocheck
import { Slot } from 'expo-router';

/**
 * Pass-through layout for /hub/* — avoids nested Stack + file-tree mismatch that
 * can trigger "Cannot read properties of undefined (reading 'filter')" in Expo Router.
 */
export default function HubLayout() {
  return <Slot />;
}
