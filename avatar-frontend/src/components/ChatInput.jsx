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
    recordedMessage, 
    loading, 
    message, 
    isRecording, 
    onSendMessage, 
    onToggleRecording 
  }) => {
    const handleSend = () => {
      if (recordedMessage) {
        onSendMessage(recordedMessage);
      } else {
        const text = inputRef.current.value;
        if (text.trim()) {
          onSendMessage(text);
          inputRef.current.value = "";
        }
      }
    };
  
    const handleQuickAction = (prompt) => {
      inputRef.current.value = prompt;
      inputRef.current.focus();
    };
  
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-end">
          <div className="w-full">
            <QuickActions onActionClick={handleQuickAction} />
            
            <div className="relative">
              <textarea
                ref={inputRef}
                className="w-full h-20 pl-6 pr-32 py-4 border-2 border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-500 text-base focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent bg-white resize-none"
                placeholder={recordedMessage || "Ask me about business processes, analyze documents, or get help with workflows..."}
                disabled={recordedMessage !== null || loading}
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
                  onClick={onToggleRecording}
                  className={`p-3 rounded-lg transition-all duration-200 border ${
                    isRecording 
                      ? 'bg-red-50 border-red-200 text-red-600' 
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                  title={isRecording ? "Stop Recording" : "Start Voice Recording"}
                >
                  {isRecording ? (
                    <StopIcon className="w-5 h-5" />
                  ) : (
                    <MicrophoneIcon className="w-5 h-5" />
                  )}
                </button>
  
                {/* Send Button */}
                <button
                  disabled={loading || (message && !recordedMessage)}
                  onClick={handleSend}
                  className={`p-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                    recordedMessage 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-gray-900 hover:bg-gray-800 text-white'
                  }`}
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
              {recordedMessage && (
                <span className="text-green-600 font-medium">Voice message ready</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  export default ChatInput;