import { useRef } from 'react';
import { 
  DocumentArrowUpIcon,
  XMarkIcon,
  UserIcon,
  DocumentTextIcon,
  PhotoIcon,
  FilmIcon,
  MusicalNoteIcon,
  CodeBracketIcon,
  CalculatorIcon,
  BeakerIcon,
  LightBulbIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const getFileIcon = (type) => {
  if (type.startsWith('image/')) return PhotoIcon;
  if (type.startsWith('video/')) return FilmIcon;
  if (type.startsWith('audio/')) return MusicalNoteIcon;
  if (type.includes('pdf') || type.includes('document')) return DocumentTextIcon;
  if (type.includes('code') || type.includes('javascript') || type.includes('python')) return CodeBracketIcon;
  if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) return CalculatorIcon;
  return DocumentTextIcon;
};

const ChatHistory = ({ chatHistory }) => (
  <div className="p-4">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-medium text-gray-900">Recent</h3>
    </div>
    <div className="space-y-2 max-h-32 overflow-y-auto">
      {chatHistory.slice(-3).map((msg) => (
        <div key={msg.id} className="bg-white rounded-md p-2 border border-gray-200">
          <div className="flex items-start space-x-2">
            <div className={`w-4 h-4 rounded flex items-center justify-center text-xs ${
              msg.type === 'user' ? 'bg-gray-100' : 'bg-gray-900 text-white'
            }`}>
              {msg.type === 'user' ? <UserIcon className="h-2.5 w-2.5" /> : 'AI'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-900 leading-relaxed line-clamp-2">{msg.content}</p>
              <p className="text-xs text-gray-400 mt-0.5">{msg.timestamp}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const FileManager = ({ 
  uploadedFiles, 
  selectedFile, 
  setSelectedFile, 
  onFileUpload, 
  onFileRemove 
}) => {
  const fileInputRef = useRef(null);

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    onFileUpload(files);
  };

  return (
    <div className="flex-1 border-t border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">Documents</h3>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <DocumentArrowUpIcon className="h-4 w-4" />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileUpload}
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.md,.json,.csv,.xlsx,.jpg,.png,.gif,.mp4,.mp3"
      />

      <div className="space-y-2 h-full max-h-96 overflow-y-auto">
        {uploadedFiles.map((file) => {
          const IconComponent = getFileIcon(file.type);
          return (
            <div 
              key={file.id} 
              className={`group cursor-pointer rounded-md p-3 transition-colors border ${
                selectedFile?.id === file.id 
                  ? 'bg-gray-100 border-gray-300' 
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedFile(selectedFile?.id === file.id ? null : file)}
            >
              <div className="flex items-start space-x-3">
                {file.preview ? (
                  <img src={file.preview} alt={file.name} className="w-8 h-8 rounded object-cover flex-shrink-0" />
                ) : (
                  <IconComponent className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-xs text-gray-500">{file.size}</p>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <p className="text-xs text-gray-500">{file.uploadTime}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onFileRemove(file.id); 
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all flex-shrink-0"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
              
              {/* File Preview Expansion */}
              {selectedFile?.id === file.id && file.preview && (
                <div className="mt-3 border-t border-gray-200 pt-3">
                  <img src={file.preview} alt={file.name} className="w-full rounded" />
                </div>
              )}
            </div>
          );
        })}
        
        {uploadedFiles.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-md">
            <DocumentArrowUpIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 font-medium">Drop files here</p>
            <p className="text-xs text-gray-400 mt-1">or click to browse</p>
          </div>
        )}
      </div>
    </div>
  );
};

const SettingsPanel = ({ ragSettings, onSettingChange, setShowSettings }) => (
  <div className="border-b border-gray-200 p-4 bg-gray-50">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-medium text-gray-900 flex items-center space-x-2">
        <BeakerIcon className="h-4 w-4" />
        <span>AI Settings</span>
      </h3>
      <button
        onClick={() => setShowSettings(false)}
        className="p-1 text-gray-400 hover:text-gray-600"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
    
    <div className="grid grid-cols-1 gap-4">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Temperature: {ragSettings.temperature}
        </label>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={ragSettings.temperature}
          onChange={(e) => onSettingChange('temperature', parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Max Tokens: {ragSettings.maxTokens}
        </label>
        <input
          type="range"
          min="100"
          max="4000"
          step="100"
          value={ragSettings.maxTokens}
          onChange={(e) => onSettingChange('maxTokens', parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>
    </div>
  </div>
);

const Sidebar = ({ 
  chatHistory, 
  uploadedFiles, 
  selectedFile, 
  setSelectedFile, 
  onFileUpload, 
  onFileRemove,
  showSettings,
  ragSettings,
  onSettingChange,
  setShowSettings
}) => (
  <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50">
    {showSettings && (
      <SettingsPanel 
        ragSettings={ragSettings}
        onSettingChange={onSettingChange}
        setShowSettings={setShowSettings}
      />
    )}
    
    <ChatHistory chatHistory={chatHistory} />
    
    <FileManager
      uploadedFiles={uploadedFiles}
      selectedFile={selectedFile}
      setSelectedFile={setSelectedFile}
      onFileUpload={onFileUpload}
      onFileRemove={onFileRemove}
    />
  </div>
);

export default Sidebar;