// src/context/WorkflowContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Action types
const WORKFLOW_ACTIONS = {
  SET_WORKFLOWS: 'SET_WORKFLOWS',
  UPDATE_TASK_STATUS: 'UPDATE_TASK_STATUS',
  UPDATE_TASK_CONFIG: 'UPDATE_TASK_CONFIG',
  UPDATE_TASK_POSITION: 'UPDATE_TASK_POSITION',
  ADD_WORKFLOW: 'ADD_WORKFLOW',
  SET_ACTIVE_WORKFLOW: 'SET_ACTIVE_WORKFLOW',
  ADD_NOTE: 'ADD_NOTE',
  UPDATE_NOTE: 'UPDATE_NOTE',
  DELETE_NOTE: 'DELETE_NOTE',
  DELETE_WORKFLOW: 'DELETE_WORKFLOW',
  MARK_WORKFLOW_COMPLETED: 'MARK_WORKFLOW_COMPLETED',
  ADD_TASK: 'ADD_TASK',
  REMOVE_TASK: 'REMOVE_TASK',
};

// LocalStorage helpers
const STORAGE_KEY = 'workflow_app_data';

const saveToLocalStorage = (data) => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

const loadFromLocalStorage = () => {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : { workflows: {}, activeWorkflowId: null };
    }
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
  }
  return { workflows: {}, activeWorkflowId: null };
};

// Mock success messages for different task types
const getMockSuccessMessage = (taskType, config) => {
  const messages = {
    email: `✅ Email sent successfully to ${config.recipient}. Subject: "${config.subject}". Delivery confirmed with 98% open rate prediction.`,
    phone: `📞 Call completed to ${config.recipient}. Contact answered and showed interest in scheduling. Next steps identified.`,
    calendar: `📅 Meeting "${config.title}" scheduled successfully for ${config.date} at ${config.time}. Calendar invites sent to all attendees.`,
    slack: `💬 Message posted to ${config.channel} successfully. Team notified and 3 members reacted positively. Workflow visibility increased.`
  };
  return messages[taskType] || `✅ Task completed successfully.`;
};

// Reducer function
function workflowReducer(state, action) {
  let newState;
  
  switch (action.type) {
    case WORKFLOW_ACTIONS.SET_WORKFLOWS:
      newState = {
        ...state,
        workflows: action.payload.workflows,
        activeWorkflowId: action.payload.activeWorkflowId
      };
      break;

    case WORKFLOW_ACTIONS.UPDATE_TASK_STATUS:
      const { workflowId, taskId, status, error, result } = action.payload;
      newState = {
        ...state,
        workflows: {
          ...state.workflows,
          [workflowId]: {
            ...state.workflows[workflowId],
            tasks: state.workflows[workflowId].tasks.map(task =>
              task.id === taskId
                ? {
                    ...task,
                    status,
                    error: error || undefined,
                    result: result || undefined,
                    completedAt: status === 'completed' ? new Date().toISOString() : undefined
                  }
                : task
            )
          }
        }
      };
      break;

    case WORKFLOW_ACTIONS.UPDATE_TASK_CONFIG:
      const { workflowId: wId, taskId: tId, config } = action.payload;
      newState = {
        ...state,
        workflows: {
          ...state.workflows,
          [wId]: {
            ...state.workflows[wId],
            tasks: state.workflows[wId].tasks.map(task =>
              task.id === tId
                ? { ...task, config: { ...task.config, ...config } }
                : task
            )
          }
        }
      };
      break;

    case WORKFLOW_ACTIONS.UPDATE_TASK_POSITION:
      const { workflowId: wId2, taskId: tId2, position } = action.payload;
      newState = {
        ...state,
        workflows: {
          ...state.workflows,
          [wId2]: {
            ...state.workflows[wId2],
            tasks: state.workflows[wId2].tasks.map(task =>
              task.id === tId2
                ? { ...task, position }
                : task
            )
          }
        }
      };
      break;

    case WORKFLOW_ACTIONS.ADD_WORKFLOW:
      const newWorkflow = action.payload;
      const updatedWorkflows = Object.fromEntries(
        Object.entries(state.workflows).map(([id, workflow]) => [
          id,
          { ...workflow, status: workflow.status === 'active' ? 'draft' : workflow.status }
        ])
      );
      
      newState = {
        ...state,
        workflows: {
          ...updatedWorkflows,
          [newWorkflow.id]: newWorkflow
        },
        activeWorkflowId: newWorkflow.id
      };
      break;

    case WORKFLOW_ACTIONS.SET_ACTIVE_WORKFLOW:
      newState = {
        ...state,
        activeWorkflowId: action.payload
      };
      break;

    case WORKFLOW_ACTIONS.DELETE_WORKFLOW:
      const { [action.payload]: deletedWorkflow, ...remainingWorkflows } = state.workflows;
      newState = {
        ...state,
        workflows: remainingWorkflows,
        activeWorkflowId: state.activeWorkflowId === action.payload ? null : state.activeWorkflowId
      };
      break;

    case WORKFLOW_ACTIONS.MARK_WORKFLOW_COMPLETED:
      newState = {
        ...state,
        workflows: {
          ...state.workflows,
          [action.payload]: {
            ...state.workflows[action.payload],
            status: 'completed',
            completedAt: new Date().toISOString()
          }
        }
      };
      break;

    case WORKFLOW_ACTIONS.ADD_NOTE:
      const { workflowId: noteWId, note } = action.payload;
      newState = {
        ...state,
        workflows: {
          ...state.workflows,
          [noteWId]: {
            ...state.workflows[noteWId],
            notes: [...(state.workflows[noteWId].notes || []), note]
          }
        }
      };
      break;

    case WORKFLOW_ACTIONS.UPDATE_NOTE:
      const { workflowId: updateWId, noteId, content } = action.payload;
      newState = {
        ...state,
        workflows: {
          ...state.workflows,
          [updateWId]: {
            ...state.workflows[updateWId],
            notes: state.workflows[updateWId].notes.map(note =>
              note.id === noteId ? { ...note, content, updatedAt: new Date().toISOString() } : note
            )
          }
        }
      };
      break;

    case WORKFLOW_ACTIONS.DELETE_NOTE:
      const { workflowId: deleteWId, noteId: deleteNoteId } = action.payload;
      newState = {
        ...state,
        workflows: {
          ...state.workflows,
          [deleteWId]: {
            ...state.workflows[deleteWId],
            notes: state.workflows[deleteWId].notes.filter(note => note.id !== deleteNoteId)
          }
        }
      };
      break;

      case WORKFLOW_ACTIONS.ADD_TASK:
        const { workflowId: addWId, task: newTask } = action.payload;
        newState = {
            ...state,
            workflows: {
            ...state.workflows,
            [addWId]: {
                ...state.workflows[addWId],
                tasks: [...state.workflows[addWId].tasks, newTask]
            }
            }
        };
        break;

        case WORKFLOW_ACTIONS.REMOVE_TASK:
        const { workflowId: removeWId, taskId: removeTaskId } = action.payload;
        newState = {
            ...state,
            workflows: {
            ...state.workflows,
            [removeWId]: {
                ...state.workflows[removeWId],
                tasks: state.workflows[removeWId].tasks.filter(task => task.id !== removeTaskId)
            }
            }
        };
        break;

    default:
      return state;
  }
  
  // Save to localStorage after every state change
  saveToLocalStorage(newState);
  return newState;
}

// Initial state
const initialState = {
  workflows: {},
  activeWorkflowId: null
};

// Create context
const WorkflowContext = createContext();

// Provider component
export function WorkflowProvider({ children }) {
  const [state, dispatch] = useReducer(workflowReducer, initialState);

  // Load from localStorage on mount
  useEffect(() => {
    const savedData = loadFromLocalStorage();
    if (savedData.workflows && Object.keys(savedData.workflows).length > 0) {
      dispatch({
        type: WORKFLOW_ACTIONS.SET_WORKFLOWS,
        payload: savedData
      });
    }
  }, []);

  // Poll for new workflows from API
  useEffect(() => {
    const pollForWorkflows = async () => {
      try {
        const response = await fetch('/api/workflows');
        if (response.ok) {
          const data = await response.json();
          if (data.workflows && data.workflows.length > 0) {
            console.log('🎉 Found new workflows from API:', data.workflows.length);
            data.workflows.forEach(({ data: workflowData }) => {
              console.log('📥 Adding workflow to context:', workflowData.id);
              dispatch({
                type: WORKFLOW_ACTIONS.ADD_WORKFLOW,
                payload: workflowData
              });
            });
          }
        }
      } catch (error) {
        console.error('❌ Error polling for workflows:', error);
      }
    };

    // Poll every 2 seconds
    const interval = setInterval(pollForWorkflows, 2000);
    return () => clearInterval(interval);
  }, []);

  // Actions
  const actions = {
    // Add task to workflow
    addTaskToWorkflow: (workflowId, task) => {
        dispatch({
        type: WORKFLOW_ACTIONS.ADD_TASK,
        payload: { workflowId, task }
        });
    },
    
    // Remove task from workflow
    removeTaskFromWorkflow: (workflowId, taskId) => {
        dispatch({
        type: WORKFLOW_ACTIONS.REMOVE_TASK,
        payload: { workflowId, taskId }
        });
    },
    
    // Update task status
    updateTaskStatus: (workflowId, taskId, status, error = null, result = null) => {
      dispatch({
        type: WORKFLOW_ACTIONS.UPDATE_TASK_STATUS,
        payload: { workflowId, taskId, status, error, result }
      });
    },

    // Update task configuration
    updateTaskConfig: (workflowId, taskId, config) => {
      dispatch({
        type: WORKFLOW_ACTIONS.UPDATE_TASK_CONFIG,
        payload: { workflowId, taskId, config }
      });
    },

    // Update task position (for flowchart)
    updateTaskPosition: (workflowId, taskId, position) => {
      dispatch({
        type: WORKFLOW_ACTIONS.UPDATE_TASK_POSITION,
        payload: { workflowId, taskId, position }
      });
    },

    // Add workflow from external source (like API)
    addWorkflowFromAPI: (workflowData) => {
      console.log('🔄 Adding workflow from API:', workflowData.id);
      dispatch({
        type: WORKFLOW_ACTIONS.ADD_WORKFLOW,
        payload: workflowData
      });
    },

    // Set active workflow
    setActiveWorkflow: (workflowId) => {
      dispatch({
        type: WORKFLOW_ACTIONS.SET_ACTIVE_WORKFLOW,
        payload: workflowId
      });
    },

    // Delete workflow
    deleteWorkflow: async (workflowId) => {
      try {
        // Mock API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        dispatch({
          type: WORKFLOW_ACTIONS.DELETE_WORKFLOW,
          payload: workflowId
        });
        
        return { success: true };
      } catch (error) {
        throw new Error('Failed to delete workflow');
      }
    },

    // Mark workflow as completed
    markWorkflowAsCompleted: async (workflowId) => {
      try {
        // Mock API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Add completion note first
        const note = {
          id: `note-${Date.now()}`,
          type: 'system',
          content: '✅ Workflow marked as completed',
          timestamp: new Date().toISOString()
        };
        
        dispatch({
          type: WORKFLOW_ACTIONS.ADD_NOTE,
          payload: { workflowId, note }
        });
        
        // Then mark as completed
        dispatch({
          type: WORKFLOW_ACTIONS.MARK_WORKFLOW_COMPLETED,
          payload: workflowId
        });
        
        return { success: true };
      } catch (error) {
        throw new Error('Failed to mark workflow as completed');
      }
    },

    // Duplicate workflow
    duplicateWorkflow: async (workflowId) => {
      try {
        // Mock API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const originalWorkflow = state.workflows[workflowId];
        if (!originalWorkflow) {
          throw new Error('Workflow not found');
        }

        const newWorkflowId = `workflow-${Date.now()}`;
        const duplicatedWorkflow = {
          ...originalWorkflow,
          id: newWorkflowId,
          name: `${originalWorkflow.name} (Copy)`,
          description: `${originalWorkflow.description} - Duplicated`,
          generatedAt: new Date().toISOString(),
          status: 'draft',
          completedAt: undefined,
          notes: [
            {
              id: `note-${Date.now()}`,
              type: 'system',
              content: `🔄 Workflow duplicated from "${originalWorkflow.name}"`,
              timestamp: new Date().toISOString()
            }
          ],
          tasks: originalWorkflow.tasks.map((task, index) => ({
            ...task,
            id: `${newWorkflowId}-task-${index + 1}`,
            status: 'pending',
            error: undefined,
            result: undefined,
            completedAt: undefined
          }))
        };

        dispatch({
          type: WORKFLOW_ACTIONS.ADD_WORKFLOW,
          payload: duplicatedWorkflow
        });

        return duplicatedWorkflow;
      } catch (error) {
        throw new Error('Failed to duplicate workflow');
      }
    },

    // Notes actions
    addNote: (workflowId, content, type = 'user') => {
      const note = {
        id: `note-${Date.now()}`,
        type,
        content,
        timestamp: new Date().toISOString()
      };
      dispatch({
        type: WORKFLOW_ACTIONS.ADD_NOTE,
        payload: { workflowId, note }
      });
    },

    updateNote: (workflowId, noteId, content) => {
      dispatch({
        type: WORKFLOW_ACTIONS.UPDATE_NOTE,
        payload: { workflowId, noteId, content }
      });
    },

    deleteNote: (workflowId, noteId) => {
      dispatch({
        type: WORKFLOW_ACTIONS.DELETE_NOTE,
        payload: { workflowId, noteId }
      });
    },

    // Execute task (simplified with success message)
    executeTask: async (workflowId, taskId, taskType, config) => {
      try {
        // Update to executing state
        actions.updateTaskStatus(workflowId, taskId, 'executing');

        // Mock API call delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

        // Mock success/failure (90% success rate)
        const isSuccess = Math.random() > 0.1;

        if (isSuccess) {
          const successMessage = getMockSuccessMessage(taskType, config);
          
          // Mark as completed
          actions.updateTaskStatus(workflowId, taskId, 'completed', null, { success: true });
          
          // Add success note
          actions.addNote(workflowId, successMessage, 'system');
          
          return { success: true };
        } else {
          const errorMessage = `❌ Task failed: Unable to complete ${taskType} task. Please check configuration and try again.`;
          
          // Mark as failed
          actions.updateTaskStatus(workflowId, taskId, 'failed', errorMessage);
          
          // Add failure note
          actions.addNote(workflowId, errorMessage, 'system');
          
          throw new Error(errorMessage);
        }
      } catch (error) {
        // Mark as failed
        actions.updateTaskStatus(workflowId, taskId, 'failed', error.message);
        
        // Add error note if not already added
        if (!error.message.includes('❌')) {
          actions.addNote(workflowId, `❌ Unexpected error: ${error.message}`, 'system');
        }
        
        throw error;
      }
    },

    // Generate new workflow (mock AI)
    generateWorkflow: async (prompt) => {
      const workflowId = `workflow-${Date.now()}`;
      
      // Simple keyword-based generation for demo
      let tasks = [];
      
      if (prompt.toLowerCase().includes('onboarding')) {
        tasks = [
          {
            id: `task-${Date.now()}-1`,
            type: 'email',
            title: 'Send welcome email',
            description: 'Welcome new client with getting started information',
            priority: 'high',
            estimatedTime: '30 seconds',
            status: 'pending',
            order: 1,
            position: { x: 100, y: 100 },
            config: {
              recipient: 'newclient@example.com',
              subject: 'Welcome! Let\'s get you started',
              message: 'Hi there!\n\nWelcome to our platform! We\'re excited to have you on board.\n\nBest regards,\nThe Team'
            }
          },
          {
            id: `task-${Date.now()}-2`,
            type: 'slack',
            title: 'Notify team',
            description: 'Alert the team about new client',
            priority: 'low',
            estimatedTime: '5 seconds',
            status: 'pending',
            order: 2,
            position: { x: 400, y: 100 },
            config: {
              channel: '#client-updates',
              message: '🎉 New client just signed up! Onboarding workflow initiated.'
            }
          }
        ];
      } else {
        tasks = [
          {
            id: `task-${Date.now()}-1`,
            type: 'email',
            title: 'Send outreach email',
            description: 'Initial outreach based on your prompt',
            priority: 'medium',
            estimatedTime: '30 seconds',
            status: 'pending',
            order: 1,
            position: { x: 100, y: 100 },
            config: {
              recipient: 'contact@example.com',
              subject: 'Reaching out',
              message: `Hi there!\n\nI wanted to reach out regarding: ${prompt}\n\nWould you be interested in learning more?\n\nBest regards`
            }
          }
        ];
      }

      const newWorkflow = {
        id: workflowId,
        name: prompt.length > 30 ? `${prompt.substring(0, 30)}...` : prompt,
        description: `AI-generated workflow from: "${prompt}"`,
        generatedAt: new Date().toISOString(),
        status: 'active',
        notes: [
          {
            id: `note-${Date.now()}`,
            type: 'system',
            content: `🤖 Workflow generated from prompt: "${prompt}"`,
            timestamp: new Date().toISOString()
          }
        ],
        tasks
      };

      actions.addWorkflow(newWorkflow);
      return newWorkflow;
    },

    // Clear all data (useful for debugging)
    clearAllData: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
        dispatch({
          type: WORKFLOW_ACTIONS.SET_WORKFLOWS,
          payload: { workflows: {}, activeWorkflowId: null }
        });
      }
    }
  };

  // Helper selectors
  const selectors = {
    getActiveWorkflow: () => {
      return state.workflows[state.activeWorkflowId] || null;
    },
    
    getAllWorkflows: () => {
      return Object.values(state.workflows);
    },
    
    getWorkflow: (workflowId) => {
      return state.workflows[workflowId] || null;
    },
    
    // Get tasks in order
    getOrderedTasks: (workflowId) => {
      const workflow = state.workflows[workflowId];
      return workflow ? workflow.tasks.sort((a, b) => a.order - b.order) : [];
    },
    
    getPendingTasks: (workflowId) => {
      const workflow = state.workflows[workflowId];
      return workflow ? workflow.tasks.filter(task => task.status === 'pending').sort((a, b) => a.order - b.order) : [];
    },
    
    getCompletedTasks: (workflowId) => {
      const workflow = state.workflows[workflowId];
      return workflow ? workflow.tasks.filter(task => task.status === 'completed').sort((a, b) => a.order - b.order) : [];
    },
    
    getFailedTasks: (workflowId) => {
      const workflow = state.workflows[workflowId];
      return workflow ? workflow.tasks.filter(task => task.status === 'failed').sort((a, b) => a.order - b.order) : [];
    },

    // Get next task to execute (first pending task in order)
    getNextTask: (workflowId) => {
      const workflow = state.workflows[workflowId];
      if (!workflow) return null;

      const pendingTasks = workflow.tasks
        .filter(task => task.status === 'pending')
        .sort((a, b) => a.order - b.order);
      
      return pendingTasks.length > 0 ? pendingTasks[0] : null;
    },

    // Get notes for workflow
    getNotes: (workflowId) => {
      const workflow = state.workflows[workflowId];
      return workflow ? workflow.notes || [] : [];
    }
  };

  const value = {
    ...state,
    ...actions,
    ...selectors
  };

  return (
    <WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>
  );
}

// Custom hook to use the context
export function useWorkflow() {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
}

export default WorkflowContext;