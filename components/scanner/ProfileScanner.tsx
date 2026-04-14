import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Modal, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { CultureTokens } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

interface ProfileScannerProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (userId: string) => void;
}

export function ProfileScanner({ visible, onClose, onSuccess }: ProfileScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);


  useEffect(() => {
    if (visible && !permission?.granted) {
      requestPermission();
    }
  }, [visible, permission, requestPermission]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || processing) return;
    
    // Check if it's a CulturePass profile link
    const match = data.match(/culturepass:\/\/profile\/([a-zA-Z0-9_\-]+)/);
    if (!match) return;

    setScanned(true);
    setProcessing(true);
    if (process.env.EXPO_OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const targetId = match[1];
    
    try {
      // Automatic follow on scan
      await api.social.follow('user', targetId);
      if (onSuccess) onSuccess(targetId);
      onClose();
    } catch (err) {
      if (__DEV__) console.error('Failed to follow user:', err);
      // Reset after 2 seconds to allow another scan
      setTimeout(() => {
        setScanned(false);
        setProcessing(false);
      }, 2000);
    }
  };

  if (!permission) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.container}>
        <CameraView
          style={StyleSheet.absoluteFill}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        />

        {/* Overlay */}
        <View style={styles.overlay}>
          <View style={[styles.header, { backgroundColor: 'rgba(0,0,0,0.72)' }]}>
            <View style={styles.headerContent}>
              <Text style={styles.title}>Scan Identity</Text>
              <Pressable style={styles.closeBtn} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close scanner">
                <Ionicons name="close" size={24} color="#fff" />
              </Pressable>
            </View>
          </View>

          <View style={styles.finderContainer}>
            <View style={styles.finder}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            <Text style={styles.hint}>Align QR code within the frame</Text>
          </View>

          {processing && (
            <View style={[styles.loadingOverlay, { backgroundColor: 'rgba(0,0,0,0.82)' }]}>
              <ActivityIndicator size="large" color={CultureTokens.teal} />
              <Text style={styles.loadingText}>Saving contact...</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  finderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
  finder: {
    width: 240,
    height: 240,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: CultureTokens.teal,
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 16,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 16,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 16,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 16,
  },
  hint: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    marginTop: 24,
    opacity: 0.8,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
});
