import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
    MicrophoneIcon,
    StopIcon,
    BriefcaseIcon,
    CalculatorIcon,
    PresentationChartLineIcon,
    CalendarDaysIcon
  } from '@heroicons/react/24/outline';
  
const QuickActions = ({ onActionClick }) => {
  const actions = [
    { label: 'Analyze Data', prompt: 'Help me analyze business data from uploaded files', icon: CalculatorIcon },
    { label: 'Meeting Summary', prompt: 'Create a summary of our meeting notes', icon: CalendarDaysIcon },
    { label: 'Report Review', prompt: 'Review and provide insights on the uploaded reports', icon: PresentationChartLineIcon },
    { label: 'HR Query', prompt: 'Help me with HR-related questions and policies', icon: BriefcaseIcon },
  ];

  return (
    <div className="flex items-center space-x-2 mb-4">
      <span className="text-xs text-gray-500">Quick actions:</span>
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={() => onActionClick(action.prompt)}
          className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <action.icon className="h-3 w-3" />
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );
};

const ChatInput = ({ 
  inputRef, 
  loading, 
  onSendMessage 
}) => {
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [error, setError] = useState('');
  
  // Recording refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const recordingTimerRef = useRef(null);

  // Get API key from environment - use your actual key here
  const WHISPER_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || 'your-openai-api-key-here';
  const WHISPER_API_URL = 'https://api.openai.com/v1/audio/transcriptions';

  // Start recording timer
  const startTimer = useCallback(() => {
    setRecordingDuration(0);
    recordingTimerRef.current = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);
  }, []);

  // Stop recording timer
  const stopTimer = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, []);

  // Format duration for display
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Start voice recording
  const startRecording = async () => {
    try {
      setError('');
      
      // Check if browser supports required APIs
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support audio recording');
      }

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      streamRef.current = stream;
      audioChunksRef.current = [];
      
      // Check MediaRecorder support
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : MediaRecorder.isTypeSupported('audio/mp4') 
        ? 'audio/mp4' 
        : 'audio/webm';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      
      // Collect audio data
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // Handle recording stop
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        await transcribeAudio(audioBlob);
        
        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };
      
      // Handle errors
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
        setError('Recording failed: ' + event.error.message);
        setIsRecording(false);
        stopTimer();
      };
      
      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      startTimer();
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Could not access microphone: ' + error.message);
    }
  };

  // Stop voice recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopTimer();
    }
  };

  // Transcribe audio using Whisper API
  const transcribeAudio = async (audioBlob) => {
    setIsTranscribing(true);
    setError('');
    
    try {
      // Validate API key
      if (!WHISPER_API_KEY || WHISPER_API_KEY === 'your-openai-api-key-here') {
        throw new Error('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your .env file');
      }

      // Validate audio blob
      if (!audioBlob || audioBlob.size === 0) {
        throw new Error('No audio data recorded');
      }

      console.log('Audio blob size:', audioBlob.size, 'type:', audioBlob.type);
      
      // Prepare form data for Whisper API
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');
      formData.append('response_format', 'json');
      
      // Call Whisper API
      const response = await fetch(WHISPER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHISPER_API_KEY}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Whisper API error:', response.status, errorText);
        throw new Error(`Whisper API error: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Whisper result:', result);
      
      const transcription = result.text?.trim();
      
      if (transcription) {
        setTranscribedText(transcription);
        // Auto-populate the input field
        if (inputRef.current) {
          inputRef.current.value = transcription;
          inputRef.current.focus();
        }
      } else {
        setError('No speech detected. Please try speaking more clearly.');
      }
      
    } catch (error) {
      console.error('Transcription error:', error);
      setError('Transcription failed: ' + error.message);
    } finally {
      setIsTranscribing(false);
    }
  };

  // Toggle recording
  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Clear transcribed text
  const clearTranscription = () => {
    setTranscribedText('');
    setError('');
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.focus();
    }
  };

  const handleSend = () => {
    const text = inputRef.current?.value || transcribedText;
    if (text.trim()) {
      onSendMessage(text);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      setTranscribedText('');
      setError('');
    }
  };

  const handleQuickAction = (prompt) => {
    if (inputRef.current) {
      inputRef.current.value = prompt;
      inputRef.current.focus();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [stopTimer]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-end">
        <div className="w-full">
          <QuickActions onActionClick={handleQuickAction} />
          
          {/* Error Display */}
          {error && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-red-900">{error}</span>
                </div>
                <button
                  onClick={() => setError('')}
                  className="text-red-600 hover:text-red-800 text-xs"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
          
          {/* Recording Status */}
          {(isRecording || isTranscribing) && (
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                {isRecording && (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-blue-900">
                      Recording... {formatDuration(recordingDuration)}
                    </span>
                  </div>
                )}
                {isTranscribing && (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-medium text-blue-900">
                      Transcribing audio...
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Transcribed Text Preview */}
          {transcribedText && !isTranscribing && (
            <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-xs font-medium text-green-800 mb-1">Transcribed:</div>
                  <div className="text-sm text-green-900">{transcribedText}</div>
                </div>
                <button
                  onClick={clearTranscription}
                  className="ml-2 text-green-600 hover:text-green-800 text-xs"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
          
          <div className="relative">
            <textarea
              ref={inputRef}
              className="w-full h-20 pl-6 pr-32 py-4 border-2 border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-500 text-base focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent bg-white resize-none"
              placeholder={transcribedText || "Ask me about business processes, analyze documents, or get help with workflows..."}
              disabled={loading || isRecording || isTranscribing}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            
            {/* Input Controls */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center space-x-2">
              {/* Voice Recording Button */}
              <button
                onClick={handleToggleRecording}
                disabled={isTranscribing || loading}
                className={`p-3 rounded-lg transition-all duration-200 border disabled:opacity-50 disabled:cursor-not-allowed ${
                  isRecording 
                    ? 'bg-red-50 border-red-200 text-red-600 shadow-lg' 
                    : isTranscribing
                    ? 'bg-blue-50 border-blue-200 text-blue-600'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
                title={isRecording ? "Stop Recording" : isTranscribing ? "Transcribing..." : "Start Voice Recording"}
              >
                {isRecording ? (
                  <StopIcon className="w-5 h-5" />
                ) : isTranscribing ? (
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <MicrophoneIcon className="w-5 h-5" />
                )}
              </button>

              {/* Send Button */}
              <button
                disabled={loading || isRecording || isTranscribing}
                onClick={handleSend}
                className="p-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-gray-900 hover:bg-gray-800 text-white"
                title="Send Message"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Help Text */}
          <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
            <span>Press Enter to send • Shift+Enter for new line</span>
            {transcribedText && (
              <span className="text-green-600 font-medium">Voice message transcribed</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;