import React, { useState, useCallback, useRef, useEffect } from 'react';
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
  HardDrive
} from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';

const TaskQueue = ({ activeWorkflow }) => {
  const [executing, setExecuting] = useState(false);
  const [localConfig, setLocalConfig] = useState({}); // Local state for form inputs
  const updateTimeoutRef = useRef(null);
  
  // Get data and actions from context - MOVED BEFORE EARLY RETURN
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
  
  // Get tasks data - MOVED BEFORE EARLY RETURN
  const completedTasks = workflowData ? getCompletedTasks(workflowData.id) : [];
  const failedTasks = workflowData ? getFailedTasks(workflowData.id) : [];
  const pendingTasks = workflowData ? getPendingTasks(workflowData.id) : [];
  const currentTask = pendingTasks[0];

  // Update local config when current task changes - MOVED BEFORE EARLY RETURN
  useEffect(() => {
    if (currentTask) {
      setLocalConfig(currentTask.config || {});
    }
  }, [currentTask?.id]);

// FIXED: Handle task update with debounced context update
const handleUpdate = useCallback((field, value) => {
    if (!currentTask) return;
    
    // Update local state immediately (no re-render from context)
    const newConfig = { ...localConfig, [field]: value };
    setLocalConfig(newConfig);
    
    // Clear existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    // Set new timeout to update context after user stops typing
    updateTimeoutRef.current = setTimeout(() => {
      // Use the newConfig we just created, not the stale localConfig from closure
      updateTaskConfig(workflowData.id, currentTask.id, newConfig);
    }, 500); // Wait 500ms after user stops typing
  }, [currentTask, localConfig, updateTaskConfig, workflowData]);
  
  // ALSO FIX: Handle blur to immediately save changes
  const handleBlur = useCallback((field, value) => {
    if (!currentTask) return;
    
    // Clear timeout and update immediately
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    // Use the current value passed to the function
    const updatedConfig = { ...localConfig, [field]: value };
    setLocalConfig(updatedConfig); // Update local state too
    updateTaskConfig(workflowData.id, currentTask.id, updatedConfig);
  }, [currentTask, localConfig, updateTaskConfig, workflowData]);
  // Handle task execution
  const handleExecute = useCallback(async (taskToExecute = currentTask) => {
    if (!taskToExecute) return;
    
    setExecuting(true);
    try {
      // Use the local config for execution
      await executeTask(workflowData.id, taskToExecute.id, taskToExecute.type, localConfig);
    } catch (error) {
      console.error('Task execution failed:', error);
    } finally {
      setExecuting(false);
    }
  }, [currentTask, executeTask, workflowData, localConfig]);

  // Handle task retry
  const handleRetry = useCallback((task) => {
    updateTaskStatus(workflowData.id, task.id, 'pending');
    setTimeout(() => handleExecute(task), 100);
  }, [updateTaskStatus, workflowData, handleExecute]);

  // NOW SAFE TO DO EARLY RETURN AFTER ALL HOOKS
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

  // Get icon for task type with proper icons - you can replace these with your images
  const getTaskIcon = (type, className = "w-5 h-5") => {
    switch (type) {
      case 'email': 
        // Replace with: <img src="/icons/email.png" className={className} alt="Email" />
        return <img src="/icons/gmail.png" className={className} alt="Email" />;
      case 'phone': 
        // Replace with: <img src="/icons/phone.png" className={className} alt="Phone" />
        return <Phone className={className} />;
      case 'calendar': 
        // Replace with: <img src="/icons/calendar.png" className={className} alt="Calendar" />
        return <img src="/icons/gcal.png" className={className} alt="Calendar" />;
      case 'slack': 
        // Replace with: <img src="/icons/slack.png" className={className} alt="Slack" />
        return <img src="/icons/slack.png" className={className} alt="Slack" />;
      case 'document': 
        // Replace with: <img src="/icons/document.png" className={className} alt="Document" />
        return <FileText className={className} />;
      case 'notification': 
        // Replace with: <img src="/icons/notification.png" className={className} alt="Notification" />
        return <Bell className={className} />;
      case 'api': 
        // Replace with: <img src="/icons/api.png" className={className} alt="API" />
        return <Cloud className={className} />;
      case 'automation': 
        // Replace with: <img src="/icons/automation.png" className={className} alt="Automation" />
        return <Settings className={className} />;
      case 'drive': 
        // Replace with: <img src="/icons/drive.png" className={className} alt="Drive" />
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
    const isPending = type === 'pending';

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

        {/* Show config for current task only - FIXED FORM INPUTS */}
        {isCurrent && (
          <>
            <div className="space-y-3 mb-4 border-t border-gray-300 pt-4">
              {Object.entries(localConfig || {}).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                  </label>
                  {key === 'message' || key === 'notes' ? (
                    <textarea
                      value={value || ''}
                      onChange={(e) => handleUpdate(key, e.target.value)}
                      onBlur={(e) => handleBlur(key, e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono"
                      rows={4}
                      placeholder={`Enter ${key}...`}
                    />
                  ) : (
                    <input
                      type="text"
                      value={value || ''}
                      onChange={(e) => handleUpdate(key, e.target.value)}
                      onBlur={(e) => handleBlur(key, e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono"
                      placeholder={`Enter ${key}...`}
                    />
                  )}
                </div>
              ))}
            </div>
            
            <button
              onClick={() => onExecute(task)}
              disabled={executing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Play className="w-4 h-4" />
              {executing ? 'executing...' : 'execute'}
            </button>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 font-mono">
      {/* Header - Solarized Style */}
      <div className="bg-gray-200 border-b border-gray-300 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-gray-600" />
            <h3 className="font-medium text-gray-800 text-base">task queue</h3>
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
              {pendingTasks.slice(1).map((task, index) => (
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