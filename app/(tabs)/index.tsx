import React, { useEffect, useRef, useState } from 'react';
import { Button, Dimensions, StyleSheet, Text, View } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import type { CameraViewRef } from 'expo-camera';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';

const { width, height } = Dimensions.get('screen');
console.log('Width:', width, 'Height:', height);



// 3x3 Grid Positions for gaze labels
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

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [currentTarget, setCurrentTarget] = useState(0);
  const cameraRef = useRef<CameraViewRef>(null);

  useEffect(() => {
    if (!permission) {
      requestPermission(); // ask if not already asked
    }
  }, []);

  const takePictureAndSend = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.4, skipProcessing: false });
        const base64 = 'uri' in photo && photo.uri ? await FileSystem.readAsStringAsync(photo.uri, { encoding: FileSystem.EncodingType.Base64 }) : ''; // Convert to base64
        const label = gridPositions[currentTarget].label;
        console.log('Image captured:', photo.uri);
        const payload = {
          image: base64,
          label: label,
        };
        await axios.post('https://ac8d-14-139-98-164.ngrok-free.app/upload', payload);
        console.log('Image uploaded:', photo.uri);


        console.log('Image sent for label:', label);
        console.log("Image width:", photo.width);
        console.log("Image height:", photo.height);
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }
  };

  const nextTarget = async () => {
    await takePictureAndSend(); // 1. Take photo first
    setTimeout(() => {
      const next = (currentTarget + 1) % gridPositions.length;
      setCurrentTarget(next);   // 2. Move to next after 500ms
    }, 200); // 3. Wait 500ms after picture before moving
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
        <Button title="Next" onPress={nextTarget} />
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
});