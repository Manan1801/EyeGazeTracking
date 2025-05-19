import React, { useState, useEffect, useRef } from 'react';
import { View, Button, StyleSheet, Dimensions } from 'react-native';
import { Camera } from 'expo-camera';
import axios from 'axios';

const { width, height } = Dimensions.get('window');

// 3x3 Grid Positions
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
  const [hasPermission, setHasPermission] = useState(null);
  const [currentTarget, setCurrentTarget] = useState(0);
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePictureAndSend = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ base64: true });
      const label = gridPositions[currentTarget].label;

      try {
        await axios.post('http://10.240.10.99:2000/upload', {
          image: photo.base64,
          label,
        });
        console.log('Sent:', label);
      } catch (error) {
        console.error('Upload failed', error);
      }
    }
  };

  const nextTarget = () => {
    const next = (currentTarget + 1) % gridPositions.length;
    setCurrentTarget(next);
    setTimeout(() => takePictureAndSend(), 1500);  // Wait 1.5 seconds
  };

  if (hasPermission === null) return <View />;
  if (hasPermission === false) return <Text>No camera access</Text>;

  const target = gridPositions[currentTarget];

  return (
    <View style={styles.container}>
      <Camera style={styles.camera} type="front" ref={cameraRef} />
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
});
