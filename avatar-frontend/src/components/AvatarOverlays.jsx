import { 
    Zap,
    BarChart3,
    Camera,
    RotateCcw,
    Maximize2
  } from 'lucide-react';
  
  const RecordingStatus = ({ isRecording }) => {
    if (!isRecording) return null;
    
    return (
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto">
        <div className="flex items-center gap-2 bg-gray-200 border border-gray-300 px-4 py-2 rounded font-mono text-xs shadow-sm">
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-gray-800 font-medium">rec</span>
        </div>
      </div>
    );
  };
  
  const StatusPanel = ({ loading, systemStats }) => (
    <div className="absolute top-4 left-4 bg-gray-200 border border-gray-300 rounded p-3 shadow-sm z-10 pointer-events-auto font-mono text-xs">
      <div className="flex items-center space-x-2 mb-2">
        <div className={`h-1.5 w-1.5 rounded-full ${loading ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`}></div>
        <span className="text-gray-800 font-medium">
          {loading ? 'proc' : 'live'}
        </span>
      </div>
      <div className="space-y-1 text-gray-600">
        <div className="flex justify-between gap-3">
          <span>sessions:</span>
          <span className="text-gray-800 font-medium">{systemStats.responsesGenerated}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span>latency:</span>
          <span className="text-gray-800 font-medium">{systemStats.avgResponseTime}</span>
        </div>
      </div>
    </div>
  );
  
  const CameraControls = () => {
    const handleCameraAdjust = (action) => {
      const event = new CustomEvent('adjustCamera', { detail: { action } });
      window.dispatchEvent(event);
    };
  
    return (
      <div className="absolute top-4 right-4 bg-gray-200 border border-gray-300 rounded p-2 shadow-sm z-10 pointer-events-auto font-mono">
        <div className="flex flex-col space-y-1">
          <button
            onClick={() => handleCameraAdjust('showMore')}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-300 rounded transition-colors"
          >
            <Maximize2 className="w-3 h-3" />
            <span>full</span>
          </button>
          <button
            onClick={() => handleCameraAdjust('reset')}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-300 rounded transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>reset</span>
          </button>
        </div>
      </div>
    );
  };
  
  const AvatarOverlays = ({ isRecording, loading, systemStats }) => (
    <>
      <RecordingStatus isRecording={isRecording} />
      <StatusPanel loading={loading} systemStats={systemStats} />
      <CameraControls />
    </>
  );
  
  export default AvatarOverlays;