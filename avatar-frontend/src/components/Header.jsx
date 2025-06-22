import { 
    Cog6ToothIcon,
    ChatBubbleLeftRightIcon,
    CpuChipIcon,
    BoltIcon,
    ChartBarIcon
  } from '@heroicons/react/24/outline';
  
  const Header = ({ 
    showSettings, 
    setShowSettings, 
    cameraZoomed, 
    setCameraZoomed, 
    systemStats 
  }) => {
    return (
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0 pointer-events-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-3">
                <img 
                    src="/logo.png" 
                    alt="Conductor Logo" 
                    className="h-9 w-9 rounded-lg object-contain"
                />
                </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 leading-tight">Conductor AI</h1>
                <p className="text-sm text-gray-500 leading-tight">Business Assistant</p>
              </div>
            </div>
            
            {/* System Stats */}
            <div className="hidden lg:flex items-center space-x-6 pl-6 border-l border-gray-200">
              <div className="flex items-center space-x-2 text-sm">
                <CpuChipIcon className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600 font-medium">{systemStats.tokensUsed}</span>
                <span className="text-gray-400">tokens</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <BoltIcon className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600 font-medium">{systemStats.avgResponseTime}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <ChartBarIcon className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600 font-medium">{systemStats.contextUtilization}%</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-md text-sm font-medium transition-colors ${
                showSettings 
                  ? 'bg-gray-100 text-gray-900' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Cog6ToothIcon className="h-5 w-5" />
            </button>
            
            <button
              onClick={() => setCameraZoomed(!cameraZoomed)}
              className={`p-2 rounded-md text-sm font-medium transition-colors ${
                cameraZoomed 
                  ? 'bg-gray-100 text-gray-900' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <ChatBubbleLeftRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  export default Header;