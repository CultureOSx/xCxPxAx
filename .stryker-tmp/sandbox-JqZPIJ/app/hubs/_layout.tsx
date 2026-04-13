// @ts-nocheck
import { Slot } from 'expo-router';

/** Legacy /hubs/* redirect tree — Slot avoids empty nested Stack crashes. */
export default function HubsLegacyLayout() {
  return <Slot />;
}
