import { useRef, useEffect, useState } from "react";
import { useChat } from "../hooks/useChat";
import Header from "./Header";
import Sidebar from "./Sidebar";
import ChatInput from "./ChatInput";
import AvatarOverlays from "./AvatarOverlays";

export const UI = ({ hidden, ...props }) => {
  const input = useRef();
  const [isRecording, setIsRecording] = useState(false);
  const [audioStream, setAudioStream] = useState(null);
  const [recordedMessage, setRecordedMessage] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [chatHistory, setChatHistory] = useState([
    { id: 1, type: 'user', content: 'Can you help me analyze our Q4 sales data?', timestamp: '2 minutes ago' },
    { id: 2, type: 'ai', content: 'I\'d be happy to help analyze your Q4 sales data. Please upload the relevant files and I\'ll provide insights on performance metrics, trends, and recommendations.', timestamp: '2 minutes ago' },
    { id: 3, type: 'user', content: 'What\'s our current employee turnover rate?', timestamp: '1 minute ago' },
  ]);
  const [ragSettings, setRagSettings] = useState({
    temperature: 0.7,
    maxTokens: 1000,
    topK: 40,
    topP: 0.9,
    contextLength: 4000,
    similarity: 0.8
  });
  const [showSettings, setShowSettings] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [systemStats, setSystemStats] = useState({
    tokensUsed: 1247,
    responsesGenerated: 23,
    avgResponseTime: '1.2s',
    contextUtilization: 68
  });

  const { chat, loading, cameraZoomed, setCameraZoomed, message } = useChat();

  // Simulate real-time stats updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemStats(prev => ({
        ...prev,
        tokensUsed: prev.tokensUsed + Math.floor(Math.random() * 10),
        responsesGenerated: prev.responsesGenerated + (Math.random() > 0.8 ? 1 : 0),
        avgResponseTime: (Math.random() * 2 + 0.5).toFixed(1) + 's',
        contextUtilization: Math.min(95, prev.contextUtilization + (Math.random() - 0.5) * 5)
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleFileUpload = (files) => {
    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      type: file.type,
      file: file,
      uploadTime: new Date().toLocaleTimeString(),
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
    return newFiles; // Return for potential LLM processing
  };

  const removeFile = (fileId) => {
    const removedFile = uploadedFiles.find(f => f.id === fileId);
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
    if (selectedFile?.id === fileId) {
      setSelectedFile(null);
    }
    return removedFile; // Return for cleanup
  };

  const sendMessage = (messageText) => {
    const newMessage = {
      id: Date.now(),
      type: 'user',
      content: messageText,
      timestamp: 'now'
    };
    setChatHistory(prev => [...prev, newMessage]);
    chat(messageText);
    
    // Clear recorded message if it was voice input
    if (recordedMessage === messageText) {
      setRecordedMessage(null);
    }
    
    return newMessage; // Return for potential processing
  };

  const handleSettingChange = (key, value) => {
    setRagSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Voice recording functions
  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        const audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          const formData = new FormData();
          formData.append("file", audioBlob, "audio.webm");
          formData.append("model", "whisper-1");

          try {
            const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
              },
              body: formData
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.text) {
                setRecordedMessage(data.text);
              }
            }
          } catch (error) {
            console.error('Error transcribing audio:', error);
          }
        };

        setAudioStream({ stream, mediaRecorder });
        mediaRecorder.start();
      } catch (error) {
        console.error('Error accessing microphone:', error);
      }
    } else if (audioStream) {
      audioStream.mediaRecorder.stop();
      audioStream.stream.getTracks().forEach(track => track.stop());
    }
    setIsRecording(!isRecording);
  };

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === "speech-to-chatbot") {
        sendMessage(event.data.message);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  if (hidden) return null;

  return (
    <div className="fixed inset-0 z-10 flex flex-col pointer-events-none">
      <Header 
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        cameraZoomed={cameraZoomed}
        setCameraZoomed={setCameraZoomed}
        systemStats={systemStats}
      />

      <div className="flex-1 flex flex-col">
        {/* Avatar Section */}
        <div className="flex-1 relative">
          <AvatarOverlays 
            isRecording={isRecording}
            loading={loading}
            systemStats={systemStats}
          />
        </div>

        {/* Controls Section */}
        <div className="flex-1 flex bg-white pointer-events-auto">
          <Sidebar
            chatHistory={chatHistory}
            uploadedFiles={uploadedFiles}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            onFileUpload={handleFileUpload}
            onFileRemove={removeFile}
            showSettings={showSettings}
            ragSettings={ragSettings}
            onSettingChange={handleSettingChange}
            setShowSettings={setShowSettings}
          />

          <div className="flex-1 p-6">
            <ChatInput
              inputRef={input}
              recordedMessage={recordedMessage}
              loading={loading}
              message={message}
              isRecording={isRecording}
              onSendMessage={sendMessage}
              onToggleRecording={toggleRecording}
            />
          </div>
        </div>
      </div>
    </div>
  );
};