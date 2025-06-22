import React, { useState, useCallback, useEffect } from 'react';
import { 
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  Play,
  X,
  Edit3,
  Check,
  AlertTriangle,
  RotateCcw,
  Terminal,
  Activity,
  FileText,
  Bell,
  Cloud,
  Settings,
  HardDrive,
  Save,
  BookOpen // For Notion icon
} from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';

const TaskQueue = ({ activeWorkflow }) => {
  const [executing, setExecuting] = useState(false);
  const [localConfig, setLocalConfig] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Get data and actions from context
  const {
    getActiveWorkflow,
    executeTask,
    updateTaskConfig,
    updateTaskStatus,
    getPendingTasks,
    getCompletedTasks,
    getFailedTasks
  } = useWorkflow();

  const workflowData = getActiveWorkflow();
  const completedTasks = workflowData ? getCompletedTasks(workflowData.id) : [];
  const failedTasks = workflowData ? getFailedTasks(workflowData.id) : [];
  const pendingTasks = workflowData ? getPendingTasks(workflowData.id) : [];
  const currentTask = pendingTasks[0];

  // Load config when task changes
  useEffect(() => {
    if (currentTask?.config) {
      setLocalConfig(currentTask.config);
      setHasUnsavedChanges(false);
    }
  }, [currentTask?.id]);

  // Handle input changes (local only)
  const handleInputChange = useCallback((field, value) => {
    setLocalConfig(prev => ({
      ...prev,
      [field]: value
    }));
    setHasUnsavedChanges(true);
  }, []);

  // Save changes to context
  const handleSave = useCallback(() => {
    if (!currentTask || !workflowData || !hasUnsavedChanges) return;
    
    updateTaskConfig(workflowData.id, currentTask.id, localConfig);
    setHasUnsavedChanges(false);
  }, [currentTask?.id, workflowData?.id, localConfig, hasUnsavedChanges, updateTaskConfig]);

  // Reset changes
  const handleReset = useCallback(() => {
    if (currentTask?.config) {
      setLocalConfig(currentTask.config);
      setHasUnsavedChanges(false);
    }
  }, [currentTask?.config]);

  // Auto-save on blur for better UX
  const handleBlur = useCallback(() => {
    if (hasUnsavedChanges) {
      handleSave();
    }
  }, [hasUnsavedChanges, handleSave]);

  // Execute task
  const handleExecute = useCallback(async (taskToExecute = currentTask) => {
    if (!taskToExecute || !workflowData) return;
    
    // Auto-save before execution
    if (hasUnsavedChanges && taskToExecute.id === currentTask?.id) {
      handleSave();
    }
    
    setExecuting(true);
    try {
      const configToUse = taskToExecute.id === currentTask?.id ? localConfig : taskToExecute.config;
      await executeTask(workflowData.id, taskToExecute.id, taskToExecute.type, configToUse);
    } catch (error) {
      console.error('Task execution failed:', error);
    } finally {
      setExecuting(false);
    }
  }, [currentTask?.id, executeTask, workflowData?.id, localConfig, hasUnsavedChanges, handleSave]);

  // Handle task retry
  const handleRetry = useCallback((task) => {
    if (!workflowData) return;
    updateTaskStatus(workflowData.id, task.id, 'pending');
    setTimeout(() => handleExecute(task), 100);
  }, [updateTaskStatus, workflowData?.id, handleExecute]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if (e.key === 'Escape') {
        handleReset();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, handleReset]);

  if (!workflowData) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 font-mono">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 border border-gray-300 rounded flex items-center justify-center mb-4 mx-auto">
            <Terminal className="w-8 h-8 text-gray-500" />
          </div>
          <p className="text-base text-gray-600">no workflow selected</p>
        </div>
      </div>
    );
  }

  // Get icon for task type
  const getTaskIcon = (type, className = "w-5 h-5") => {
    switch (type) {
      case 'email': 
        return <img src="/icons/gmail.png" className={className} alt="Email" />;
      case 'phone': 
        return <Phone className={className} />;
      case 'calendar': 
        return <img src="/icons/gcal.png" className={className} alt="Calendar" />;
      case 'slack': 
        return <img src="/icons/slack.png" className={className} alt="Slack" />;
      case 'notion':
        return <BookOpen className={className} />; // Using BookOpen as Notion icon
      case 'document': 
        return <FileText className={className} />;
      case 'notification': 
        return <Bell className={className} />;
      case 'api': 
        return <Cloud className={className} />;
      case 'automation': 
        return <Settings className={className} />;
      case 'drive': 
        return <HardDrive className={className} />;
      default: 
        return <div className={`${className} bg-gray-400 rounded`}></div>;
    }
  };

  // Task component
  const TaskCard = ({ task, type, onExecute, onRetry }) => {
    const isCompleted = type === 'completed';
    const isFailed = type === 'failed';
    const isCurrent = type === 'current';

    return (
      <div className={`p-4 rounded border font-mono text-sm ${
        isCompleted ? 'bg-green-50 border-green-300' :
        isFailed ? 'bg-red-50 border-red-300' :
        isCurrent ? 'bg-blue-50 border-blue-300' :
        'bg-gray-100 border-gray-300 opacity-70'
      }`}>
        <div className="flex items-start gap-3 mb-3">
          <div className={`p-2 rounded ${
            isCompleted ? 'bg-green-100 text-green-700' :
            isFailed ? 'bg-red-100 text-red-700' :
            isCurrent ? 'bg-blue-100 text-blue-700' :
            'bg-gray-200 text-gray-500'
          }`}>
            {isCompleted ? <Check className="w-4 h-4" /> :
             isFailed ? <AlertTriangle className="w-4 h-4" /> :
             getTaskIcon(task.type, "w-4 h-4")}
          </div>
          <div className="flex-1">
            <h4 className={`font-medium mb-1 text-base ${
              isCompleted ? 'text-green-800' :
              isFailed ? 'text-red-800' :
              isCurrent ? 'text-blue-800' :
              'text-gray-600'
            }`}>
              {task.title}
            </h4>
            <p className={`text-sm ${
              isCompleted ? 'text-green-600' :
              isFailed ? 'text-red-600' :
              isCurrent ? 'text-blue-600' :
              'text-gray-500'
            }`}>
              {task.description}
            </p>
            {isCompleted && task.completedAt && (
              <p className="text-sm text-green-600 mt-1">
                ✓ completed {new Date(task.completedAt).toLocaleTimeString()}
              </p>
            )}
            {isFailed && task.error && (
              <p className="text-sm text-red-700 mt-1 font-medium">
                ✗ {task.error}
              </p>
            )}
          </div>
          {isFailed && (
            <button
              onClick={() => onRetry(task)}
              className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              retry
            </button>
          )}
        </div>

        {/* Show config for current task only */}
        {isCurrent && (
          <>
            {/* Save/Reset Controls */}
            {hasUnsavedChanges && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-amber-50 border border-amber-200 rounded">
                <div className="flex-1 text-sm text-amber-700">
                  <span className="font-medium">Unsaved changes</span>
                  <span className="text-xs block">Cmd+S to save, Esc to reset</span>
                </div>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-3 h-3" />
                  Save
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1 px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
                >
                  <X className="w-3 h-3" />
                  Reset
                </button>
              </div>
            )}

            <div className="space-y-3 mb-4 border-t border-gray-300 pt-4">
              {Object.entries(localConfig || {}).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                  </label>
                  {key === 'message' || key === 'notes' || key === 'project' || key === 'content' ? (
                    <textarea
                      value={value || ''}
                      onChange={(e) => handleInputChange(key, e.target.value)}
                      onBlur={handleBlur}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono"
                      rows={key === 'project' ? 6 : 4}
                      placeholder={
                        key === 'project' ? 'Enter your project idea or description...' :
                        key === 'content' ? 'Enter page content...' :
                        `Enter ${key}...`
                      }
                    />
                  ) : (
                    <input
                      type="text"
                      value={value || ''}
                      onChange={(e) => handleInputChange(key, e.target.value)}
                      onBlur={handleBlur}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono"
                      placeholder={
                        key === 'title' ? 'Enter page title...' :
                        `Enter ${key}...`
                      }
                    />
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => onExecute(task)}
                disabled={executing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Play className="w-4 h-4" />
                {executing ? 'executing...' : 'execute'}
              </button>
              
              {hasUnsavedChanges && (
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  save
                </button>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 font-mono">
      {/* Header */}
      <div className="bg-gray-200 border-b border-gray-300 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-gray-600" />
            <h3 className="font-medium text-gray-800 text-base">task queue</h3>
            {hasUnsavedChanges && (
              <span className="px-2 py-1 bg-amber-100 border border-amber-200 text-amber-700 text-xs rounded">
                unsaved
              </span>
            )}
          </div>
          <div className="flex gap-2 text-sm">
            <span className="px-3 py-1 bg-green-100 border border-green-200 text-green-700 rounded">
              {completedTasks.length}✓
            </span>
            <span className="px-3 py-1 bg-blue-100 border border-blue-200 text-blue-700 rounded">
              {pendingTasks.length}⏳
            </span>
            {failedTasks.length > 0 && (
              <span className="px-3 py-1 bg-red-100 border border-red-200 text-red-700 rounded">
                {failedTasks.length}✗
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-green-700 uppercase tracking-wide mb-3 border-b border-gray-300 pb-2">
              completed ({completedTasks.length})
            </h4>
            <div className="space-y-3">
              {completedTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  type="completed"
                />
              ))}
            </div>
          </div>
        )}

        {/* Failed Tasks */}
        {failedTasks.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-red-700 uppercase tracking-wide mb-3 border-b border-gray-300 pb-2">
              failed ({failedTasks.length})
            </h4>
            <div className="space-y-3">
              {failedTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  type="failed"
                  onRetry={handleRetry}
                />
              ))}
            </div>
          </div>
        )}

        {/* Current Task */}
        {currentTask ? (
          <div>
            <h4 className="text-sm font-medium text-blue-700 uppercase tracking-wide mb-3 border-b border-gray-300 pb-2">
              current task
            </h4>
            <TaskCard
              task={currentTask}
              type="current"
              onExecute={handleExecute}
            />
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-green-50 border border-green-200 rounded flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="font-medium text-gray-800 mb-2 text-base">all tasks completed</h3>
            <p className="text-sm text-gray-600">workflow execution finished</p>
          </div>
        )}

        {/* Upcoming Tasks */}
        {pendingTasks.length > 1 && (
          <div>
            <h4 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-3 border-b border-gray-300 pb-2">
              up next ({pendingTasks.length - 1})
            </h4>
            <div className="space-y-3">
              {pendingTasks.slice(1).map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  type="pending"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskQueue;