import {
  CameraControls,
  ContactShadows,
  Environment,
  Text,
} from "@react-three/drei";
import { Suspense, useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useChat } from "../hooks/useChat";
import { Avatar } from "./Avatar";

// Option 1: Pulsing Text Effect
const PulsingLoader = (props) => {
  const { loading } = useChat();
  const textRef = useRef();
  const [opacity, setOpacity] = useState(1);

  useFrame((state) => {
    if (loading && textRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.3 + 0.7;
      textRef.current.material.opacity = pulse;
    }
  });

  if (!loading) return null;
  return (
    <group {...props}>
      <Text ref={textRef} fontSize={0.12} anchorX={"center"} anchorY={"bottom"}>
        Thinking...
        <meshBasicMaterial attach="material" color="#4A90E2" transparent />
      </Text>
    </group>
  );
};

// Option 2: Rotating Circles
const SpinnerLoader = (props) => {
  const { loading } = useChat();
  const groupRef = useRef();

  useFrame(() => {
    if (loading && groupRef.current) {
      groupRef.current.rotation.z += 0.05;
    }
  });

  if (!loading) return null;
  return (
    <group {...props} ref={groupRef}>
      <mesh position={[0.3, 0, 0]}>
        <circleGeometry args={[0.05, 8]} />
        <meshBasicMaterial color="#4A90E2" />
      </mesh>
      <mesh position={[0.15, 0.26, 0]}>
        <circleGeometry args={[0.04, 8]} />
        <meshBasicMaterial color="#6BB6FF" />
      </mesh>
      <mesh position={[-0.15, 0.26, 0]}>
        <circleGeometry args={[0.03, 8]} />
        <meshBasicMaterial color="#89C4FF" />
      </mesh>
      <mesh position={[-0.3, 0, 0]}>
        <circleGeometry args={[0.04, 8]} />
        <meshBasicMaterial color="#6BB6FF" />
      </mesh>
      <mesh position={[-0.15, -0.26, 0]}>
        <circleGeometry args={[0.03, 8]} />
        <meshBasicMaterial color="#89C4FF" />
      </mesh>
      <mesh position={[0.15, -0.26, 0]}>
        <circleGeometry args={[0.04, 8]} />
        <meshBasicMaterial color="#6BB6FF" />
      </mesh>
    </group>
  );
};

// Option 3: Floating Spheres
const FloatingSpheresLoader = (props) => {
  const { loading } = useChat();
  const sphere1Ref = useRef();
  const sphere2Ref = useRef();
  const sphere3Ref = useRef();

  useFrame((state) => {
    if (loading) {
      const time = state.clock.elapsedTime;
      if (sphere1Ref.current) {
        sphere1Ref.current.position.y = Math.sin(time) * 0.1;
      }
      if (sphere2Ref.current) {
        sphere2Ref.current.position.y = Math.sin(time + 0.5) * 0.1;
      }
      if (sphere3Ref.current) {
        sphere3Ref.current.position.y = Math.sin(time + 1) * 0.1;
      }
    }
  });

  if (!loading) return null;
  return (
    <group {...props}>
      <mesh ref={sphere1Ref} position={[-0.15, 0, 0]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color="#4A90E2" />
      </mesh>
      <mesh ref={sphere2Ref} position={[0, 0, 0]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color="#6BB6FF" />
      </mesh>
      <mesh ref={sphere3Ref} position={[0.15, 0, 0]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color="#89C4FF" />
      </mesh>
    </group>
  );
};

// Option 4: Wave Text Effect
const WaveLoader = (props) => {
  const { loading } = useChat();
  const [waveText, setWaveText] = useState("Processing");

  useEffect(() => {
    if (loading) {
      const words = ["Processing", "Thinking", "Analyzing", "Computing"];
      let index = 0;
      const interval = setInterval(() => {
        setWaveText(words[index % words.length]);
        index++;
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  if (!loading) return null;
  return (
    <group {...props}>
      <Text fontSize={0.1} anchorX={"center"} anchorY={"bottom"}>
        {waveText}
        <meshBasicMaterial attach="material" color="#4A90E2" />
      </Text>
    </group>
  );
};

// Option 5: Ultra Minimal Pulse
const MinimalLoader = (props) => {
  const { loading } = useChat();
  const dotRef = useRef();

  useFrame((state) => {
    if (loading && dotRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.2 + 0.8;
      dotRef.current.material.opacity = pulse;
    }
  });

  if (!loading) return null;
  return (
    <group {...props}>
      <mesh ref={dotRef}>
        <circleGeometry args={[0.015, 8]} />
        <meshBasicMaterial color="#333" transparent />
      </mesh>
    </group>
  );
};

export const Experience = () => {
  const cameraControls = useRef();
  const { cameraZoomed } = useChat();

  useEffect(() => {
    cameraControls.current.setLookAt(0, 2, 5, 0, 1.5, 0);
  }, []);

  useEffect(() => {
    if (cameraZoomed) {
      cameraControls.current.setLookAt(0, 1.5, 1.5, 0, 1.5, 0, true);
    } else {
      cameraControls.current.setLookAt(0, 2.2, 5, 0, 1.0, 0, true);
    }
  }, [cameraZoomed]);

  useEffect(() => {
    const handleCameraAdjust = (event) => {
      if (!cameraControls.current) return;
      
      const { action } = event.detail;
      
      if (action === 'showMore') {
        cameraControls.current.setLookAt(0, 1.5, 7, 0, 0.5, 0, true);
      } else if (action === 'reset') {
        cameraControls.current.setLookAt(0, 2, 5, 0, 1.5, 0, true);
      }
    };

    window.addEventListener('adjustCamera', handleCameraAdjust);
    return () => window.removeEventListener('adjustCamera', handleCameraAdjust);
  }, []);

  useEffect(() => {
    if (cameraControls.current) {
      cameraControls.current.setLookAt(0, 1.5, 6, 0, 0.8, 0);
    }
  }, []);

  useEffect(() => {
    if (cameraControls.current) {
      if (cameraZoomed) {
        cameraControls.current.setLookAt(0, 1.2, 2.5, 0, 1.0, 0, true);
      } else {
        cameraControls.current.setLookAt(0, 1.5, 6, 0, 0.8, 0, true);
      }
    }
  }, [cameraZoomed]);

  return (
    <>
      <CameraControls ref={cameraControls} />
      <Environment preset="sunset" />
      
      {/* Choose one of these loading effects: */}
      <Suspense>
        {/* Replace with your preferred loader */}
        <FloatingSpheresLoader position-y={1.75} position-x={-0.02} />
        
        {/* Other options: */}
        {/* <PulsingLoader position-y={1.75} position-x={-0.02} /> */}
        {/* <SpinnerLoader position-y={1.75} position-x={-0.02} /> */}
        {/* <WaveLoader position-y={1.75} position-x={-0.02} /> */}
        {/* <MorphingLoader position-y={1.75} position-x={-0.02} /> */}
      </Suspense>
      
      <Avatar />
      <ContactShadows opacity={0.7} />
    </>
  );
};