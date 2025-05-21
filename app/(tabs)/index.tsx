import React, { useEffect, useRef, useState } from 'react';
import { Button, Dimensions, StyleSheet, Text, View } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import type { CameraViewRef } from 'expo-camera';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';

const { width, height } = Dimensions.get('screen');

const gridPositions = [
  { x: 0.1, y: 0.1, label: 'top-left' },
  { x: 0.5, y: 0.1, label: 'top-center' },
  { x: 0.9, y: 0.1, label: 'top-right' },
  { x: 0.1, y: 0.5, label: 'middle-left' },
  { x: 0.5, y: 0.5, label: 'center' },
  { x: 0.9, y: 0.5, label: 'middle-right' },
  { x: 0.1, y: 0.9, label: 'bottom-left' },
  { x: 0.5, y: 0.9, label: 'bottom-center' },
  { x: 0.9, y: 0.9, label: 'bottom-right' },
];

const IMAGES_PER_TARGET = 1;
const CAPTURE_INTERVAL_MS = 200;

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [currentTarget, setCurrentTarget] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraViewRef>(null);
  const captureCountRef = useRef(0);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, []);

  const takePictureAndSend = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.4, skipProcessing: false });
        const base64 = 'uri' in photo && photo.uri
          ? await FileSystem.readAsStringAsync(photo.uri, { encoding: FileSystem.EncodingType.Base64 })
          : '';

        const label = gridPositions[currentTarget].label;
        const payload = {
          image: base64,
          label: label,
        };

        await axios.post('https://5815-14-139-98-164.ngrok-free.app/upload', payload);
        console.log(`Uploaded image ${captureCountRef.current + 1}/${IMAGES_PER_TARGET} for label: ${label}`);
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }
  };

  const captureMultipleImages = async () => {
    if (captureCountRef.current >= IMAGES_PER_TARGET) {
      captureCountRef.current = 0;
      setIsCapturing(false);
      const next = (currentTarget + 1) % gridPositions.length;
      setCurrentTarget(next);
      return;
    }

    await takePictureAndSend();
    captureCountRef.current += 1;
    setTimeout(captureMultipleImages, CAPTURE_INTERVAL_MS);
  };

  const nextTarget = () => {
    if (!isCapturing) {
      setIsCapturing(true);
      captureCountRef.current = 0;
      setTimeout(captureMultipleImages, 500); // slight delay before starting capture
    }
  };

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  const target = gridPositions[currentTarget];

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="front"
        enableZoomGesture
      />
      <View
        style={[
          styles.dot,
          {
            left: target.x * width - 10,
            top: target.y * height - 10,
          },
        ]}
      />
      <View style={styles.controls}>
        <Button title={isCapturing ? "Capturing..." : "Start Capture"} onPress={nextTarget} disabled={isCapturing} />
        <Text style={styles.status}>
          Target: {gridPositions[currentTarget].label} | {captureCountRef.current}/{IMAGES_PER_TARGET}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  controls: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    alignItems: 'center',
  },
  dot: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'red',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  status: {
    marginTop: 10,
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
});