'use client';

import { useState, useMemo } from 'react';
import { 
  Plus,
  Search,
  MoreVertical,
  Play,
  Pause,
  Copy,
  Edit3,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  Database,
  Check,
  Terminal,
  Activity,
  Zap
} from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function SolarizedWorkflowSidebar({ activeWorkflow, setActiveWorkflow }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showActionMenu, setShowActionMenu] = useState(null);
  
  // Get workflows and actions from context - RESTORED FUNCTIONALITY
  const {
    getAllWorkflows,
    setActiveWorkflow: setContextActiveWorkflow,
    generateWorkflow,
    getCompletedTasks,
    getFailedTasks,
    getPendingTasks,
    activeWorkflowId,
    deleteWorkflow,
    markWorkflowAsCompleted,
    duplicateWorkflow
  } = useWorkflow();

  const workflows = getAllWorkflows();

  // Filter workflows based on search query - RESTORED
  const filteredWorkflows = useMemo(() => {
    if (!searchQuery.trim()) return workflows;
    
    return workflows.filter(workflow =>
      workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workflow.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [workflows, searchQuery]);

  // RESTORED ORIGINAL FUNCTIONS
  const handleNewWorkflow = async () => {
    const prompt = window.prompt('Describe the workflow you want to create:');
    if (prompt) {
      try {
        await generateWorkflow(prompt);
      } catch (error) {
        alert('Failed to generate workflow. Please try again.');
      }
    }
  };

  const handleWorkflowAction = async (action, workflow, event) => {
    event.stopPropagation();
    setShowActionMenu(null);
    
    switch (action) {
      case 'edit':
        alert(`Edit workflow: ${workflow.name} (Feature coming soon)`);
        break;
        
      case 'duplicate':
        try {
          const newWorkflow = await duplicateWorkflow(workflow.id);
          if (newWorkflow) {
            setContextActiveWorkflow(newWorkflow.id);
            if (setActiveWorkflow) {
              setActiveWorkflow(newWorkflow);
            }
          }
        } catch (error) {
          alert('Failed to duplicate workflow. Please try again.');
        }
        break;
        
      case 'complete':
        try {
          await markWorkflowAsCompleted(workflow.id);
        } catch (error) {
          alert('Failed to mark workflow as completed. Please try again.');
        }
        break;
        
      case 'delete':
        if (confirm(`Delete workflow "${workflow.name}"? This action cannot be undone.`)) {
          try {
            await deleteWorkflow(workflow.id);
            if (activeWorkflowId === workflow.id) {
              const allWorkflows = getAllWorkflows();
              const remainingWorkflows = allWorkflows.filter(w => w.id !== workflow.id);
              if (remainingWorkflows.length > 0) {
                setContextActiveWorkflow(remainingWorkflows[0].id);
                if (setActiveWorkflow) {
                  setActiveWorkflow(remainingWorkflows[0]);
                }
              } else {
                setContextActiveWorkflow(null);
                if (setActiveWorkflow) {
                  setActiveWorkflow(null);
                }
              }
            }
          } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete workflow. Please try again.');
          }
        }
        break;
        
      default:
        break;
    }
  };

  const handleWorkflowSelect = (workflow) => {
    setContextActiveWorkflow(workflow.id);
    if (setActiveWorkflow) {
      setActiveWorkflow(workflow);
    }
  };

  // RESTORED ORIGINAL STATS FUNCTION
  const getWorkflowStats = (workflow) => {
    const completedTasks = getCompletedTasks(workflow.id);
    const failedTasks = getFailedTasks(workflow.id);
    const pendingTasks = getPendingTasks(workflow.id);
    const totalTasks = workflow.tasks.length;

    return {
      total: totalTasks,
      completed: completedTasks.length,
      failed: failedTasks.length,
      pending: pendingTasks.length,
      isRunning: pendingTasks.length > 0 && workflow.status === 'active',
      allCompleted: completedTasks.length === totalTasks && totalTasks > 0,
      workflowCompleted: workflow.status === 'completed'
    };
  };

  const getStatusIcon = (workflow) => {
    const stats = getWorkflowStats(workflow);
    
    if (stats.workflowCompleted) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    } else if (stats.failed > 0) {
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    } else if (stats.allCompleted) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    } else if (stats.isRunning) {
      return <Activity className="w-4 h-4 text-blue-600 animate-pulse" />;
    } else if (workflow.status === 'active') {
      return <Zap className="w-4 h-4 text-cyan-600" />;
    } else {
      return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (workflow) => {
    const stats = getWorkflowStats(workflow);
    
    if (stats.workflowCompleted) return 'completed';
    if (stats.failed > 0) return 'failed';
    if (stats.allCompleted) return 'done';
    if (stats.isRunning) return 'running';
    return workflow.status === 'active' ? 'ready' : 'draft';
  };

  const getStatusColor = (workflow) => {
    const stats = getWorkflowStats(workflow);
    
    if (stats.workflowCompleted) return 'text-green-600';
    if (stats.failed > 0) return 'text-red-600';
    if (stats.allCompleted) return 'text-green-600';
    if (stats.isRunning) return 'text-blue-600';
    return workflow.status === 'active' ? 'text-cyan-600' : 'text-gray-500';
  };

  // RESTORED ORIGINAL DATE FORMATTING
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return '1d';
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 border-r border-gray-300 font-mono">
      {/* Terminal Header */}
      <div className="bg-gray-200 border-b border-gray-300 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-gray-600" />
            <span className="text-base font-medium text-gray-700">workflows</span>
          </div>
          <button
            onClick={handleNewWorkflow}
            className="inline-flex items-center gap-x-1.5 rounded bg-gray-700 px-3 py-2 text-sm font-medium text-gray-100 hover:bg-gray-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            new
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-gray-500" />
          </div>
          <input
            type="search"
            placeholder="search workflows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded bg-white text-sm placeholder-gray-500 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-colors font-mono"
          />
        </div>
      </div>

      {/* Workflow List */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {filteredWorkflows.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center h-64 px-4 text-center">
            <div className="w-12 h-12 bg-gray-200 border border-gray-300 rounded flex items-center justify-center mb-4">
              <Database className="w-6 h-6 text-gray-500" />
            </div>
            <div className="text-sm font-medium text-gray-700 mb-2">
              {searchQuery ? 'no workflows found' : 'no workflows'}
            </div>
            <div className="text-sm text-gray-500 mb-4">
              {searchQuery 
                ? 'try different search terms' 
                : 'create your first workflow'
              }
            </div>
            {!searchQuery && (
              <button
                onClick={handleNewWorkflow}
                className="inline-flex items-center gap-x-1.5 rounded bg-gray-700 px-3 py-2 text-sm font-medium text-gray-100 hover:bg-gray-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                create
              </button>
            )}
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {filteredWorkflows.map((workflow) => {
              const stats = getWorkflowStats(workflow);
              const isActive = activeWorkflowId === workflow.id;
              const isCompleted = workflow.status === 'completed';
              
              return (
                <div
                  key={workflow.id}
                  onClick={() => handleWorkflowSelect(workflow)}
                  className={classNames(
                    'group relative rounded border p-4 cursor-pointer transition-all text-sm',
                    isActive
                      ? 'bg-blue-50 border-blue-300 shadow-sm'
                      : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300',
                    isCompleted && 'opacity-80'
                  )}
                >
                  {/* Main Content */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 space-y-3">
                      {/* Header */}
                      <div className="flex items-center gap-x-2">
                        {getStatusIcon(workflow)}
                        <span className={classNames(
                          "font-medium truncate text-base",
                          isCompleted ? "text-gray-600 line-through" : "text-gray-800"
                        )}>
                          {workflow.name}
                        </span>
                        <span className={classNames(
                          'text-sm',
                          getStatusColor(workflow)
                        )}>
                          [{getStatusText(workflow)}]
                        </span>
                      </div>
                      
                      <div className="text-gray-600 leading-relaxed text-sm">
                        {workflow.description}
                      </div>
                      
                      {/* Progress */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-gray-500 text-sm">
                          <span>progress</span>
                          <span>{stats.completed}/{stats.total}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={classNames(
                              "h-2 rounded-full transition-all",
                              stats.failed > 0 ? "bg-red-500" : 
                              (stats.allCompleted || isCompleted) ? "bg-green-500" : "bg-blue-500"
                            )}
                            style={{ 
                              width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` 
                            }}
                          />
                        </div>
                      </div>
                      
                      {/* Meta Info */}
                      <div className="flex items-center justify-between text-gray-500 text-sm">
                        <span>{stats.total} tasks</span>
                        <span>{formatDate(workflow.generatedAt)}</span>
                      </div>

                      {/* Task Status - RESTORED ORIGINAL LOGIC */}
                      {(stats.completed > 0 || stats.failed > 0) && (
                        <div className="flex items-center gap-x-4">
                          {stats.completed > 0 && (
                            <span className="inline-flex items-center gap-x-1 text-green-600 text-sm">
                              <CheckCircle className="w-3.5 h-3.5" />
                              {stats.completed}
                            </span>
                          )}
                          {stats.failed > 0 && (
                            <span className="inline-flex items-center gap-x-1 text-red-600 text-sm">
                              <AlertCircle className="w-3.5 h-3.5" />
                              {stats.failed}
                            </span>
                          )}
                          {stats.pending > 0 && (
                            <span className="inline-flex items-center gap-x-1 text-blue-600 text-sm">
                              <Clock className="w-3.5 h-3.5" />
                              {stats.pending}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions Menu */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowActionMenu(showActionMenu === workflow.id ? null : workflow.id);
                        }}
                        className="flex items-center justify-center w-8 h-8 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {showActionMenu === workflow.id && (
                        <div className="absolute right-0 z-10 mt-1 w-40 origin-top-right rounded border border-gray-200 bg-white shadow-lg">
                          <div className="py-1 text-sm">
                            <button
                              onClick={(e) => handleWorkflowAction('edit', workflow, e)}
                              className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-50"
                            >
                              <Edit3 className="w-4 h-4 mr-3" />
                              edit
                            </button>
                            <button
                              onClick={(e) => handleWorkflowAction('duplicate', workflow, e)}
                              className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-50"
                            >
                              <Copy className="w-4 h-4 mr-3" />
                              duplicate
                            </button>
                            {workflow.status !== 'completed' && (
                              <button
                                onClick={(e) => handleWorkflowAction('complete', workflow, e)}
                                className="flex items-center w-full px-4 py-2 text-green-700 hover:bg-green-50"
                              >
                                <Check className="w-4 h-4 mr-3" />
                                complete
                              </button>
                            )}
                            <div className="border-t border-gray-100 my-1"></div>
                            <button
                              onClick={(e) => handleWorkflowAction('delete', workflow, e)}
                              className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-3" />
                              delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Active Indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-4 bottom-4 w-1 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Stats - RESTORED ORIGINAL STATS */}
      <div className="bg-gray-200 border-t border-gray-300 px-4 py-4">
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <div className="font-medium text-gray-800 text-lg">{workflows.length}</div>
            <div className="text-gray-600">total</div>
          </div>
          <div>
            <div className="font-medium text-cyan-600 text-lg">
              {workflows.filter(w => w.status === 'active').length}
            </div>
            <div className="text-gray-600">active</div>
          </div>
          <div>
            <div className="font-medium text-blue-600 text-lg">
              {workflows.filter(w => {
                const stats = getWorkflowStats(w);
                return stats.isRunning;
              }).length}
            </div>
            <div className="text-gray-600">running</div>
          </div>
        </div>
      </div>

      {/* Click outside to close menu */}
      {showActionMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowActionMenu(null)}
        />
      )}
    </div>
  );
}