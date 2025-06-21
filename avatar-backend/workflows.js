// workflows.js - Sample workflows and trigger phrases

export const workflowTemplates = {
    onboarding: {
      name: 'Employee Onboarding Workflow',
      description: 'Complete onboarding process for new team members',
      tasks: [
        {
          type: 'email',
          title: 'Send welcome email',
          description: 'Welcome new employee with company info',
          priority: 'high',
          estimatedTime: '2 minutes',
          config: {
            recipient: 'new.employee@company.com',
            subject: 'Welcome to the team!',
            message: 'Welcome aboard! Here\'s everything you need to get started...'
          }
        },
        {
          type: 'slack',
          title: 'Notify HR team',
          description: 'Alert HR about new employee start date',
          priority: 'medium',
          estimatedTime: '30 seconds',
          config: {
            channel: '#hr-notifications',
            message: '🎉 New employee starting today! Please prepare onboarding materials.'
          }
        },
        {
          type: 'calendar',
          title: 'Schedule orientation meeting',
          description: 'Book 1-hour orientation session',
          priority: 'high',
          estimatedTime: '1 minute',
          config: {
            title: 'New Employee Orientation',
            duration: '60 minutes',
            attendees: ['hr@company.com', 'manager@company.com']
          }
        }
      ]
    },
  
    followup: {
      name: 'Client Follow-up Workflow',
      description: 'Systematic follow-up process for client communications',
      tasks: [
        {
          type: 'email',
          title: 'Send follow-up email',
          description: 'Check in with client about project status',
          priority: 'high',
          estimatedTime: '3 minutes',
          config: {
            recipient: 'client@example.com',
            subject: 'Project Update & Next Steps',
            message: 'Hi! Just following up on our recent discussion...'
          }
        },
        {
          type: 'calendar',
          title: 'Schedule check-in call',
          description: 'Book 30-minute status call',
          priority: 'medium',
          estimatedTime: '1 minute',
          config: {
            title: 'Client Check-in Call',
            duration: '30 minutes',
            attendees: ['client@example.com']
          }
        },
        {
          type: 'task',
          title: 'Update CRM',
          description: 'Log interaction in customer management system',
          priority: 'low',
          estimatedTime: '2 minutes',
          config: {
            system: 'CRM',
            action: 'log_interaction',
            notes: 'Follow-up communication sent'
          }
        }
      ]
    },
  
    meeting: {
      name: 'Meeting Preparation Workflow',
      description: 'Prepare and organize upcoming meetings',
      tasks: [
        {
          type: 'email',
          title: 'Send meeting agenda',
          description: 'Distribute agenda to all participants',
          priority: 'high',
          estimatedTime: '5 minutes',
          config: {
            recipients: ['team@company.com'],
            subject: 'Meeting Agenda - [Date]',
            message: 'Please find the agenda for our upcoming meeting...'
          }
        },
        {
          type: 'calendar',
          title: 'Book meeting room',
          description: 'Reserve conference room and equipment',
          priority: 'medium',
          estimatedTime: '2 minutes',
          config: {
            room: 'Conference Room A',
            equipment: ['projector', 'whiteboard'],
            duration: '60 minutes'
          }
        },
        {
          type: 'slack',
          title: 'Meeting reminder',
          description: 'Send reminder to team channel',
          priority: 'low',
          estimatedTime: '30 seconds',
          config: {
            channel: '#team-updates',
            message: '📅 Don\'t forget about our meeting tomorrow at 2 PM!'
          }
        }
      ]
    }
  };
  
  export const triggerPhrases = {
    onboarding: [
      'new employee',
      'onboarding',
      'start date',
      'new hire',
      'welcome new',
      'employee orientation',
      'first day'
    ],
    followup: [
      'follow up',
      'follow-up',
      'check in',
      'client update',
      'project status',
      'touch base',
      'reconnect'
    ],
    meeting: [
      'schedule meeting',
      'book meeting',
      'meeting prep',
      'prepare meeting',
      'agenda',
      'conference room',
      'team meeting'
    ]
  };
  
  export const workflowResponses = {
    onboarding: [
      {
        text: "Perfect! I'll help you set up an employee onboarding workflow.",
        facialExpression: "smile",
        animation: "Talking_1"
      },
      {
        text: "This includes welcome emails, HR notifications, and scheduling orientation meetings.",
        facialExpression: "default",
        animation: "Talking_0"
      },
      {
        text: "Your onboarding workflow is now ready to deploy!",
        facialExpression: "smile",
        animation: "Talking_2"
      }
    ],
    followup: [
      {
        text: "Great idea! I'm creating a client follow-up workflow for you.",
        facialExpression: "smile",
        animation: "Talking_1"
      },
      {
        text: "This will handle follow-up emails, schedule check-ins, and update your CRM automatically.",
        facialExpression: "default",
        animation: "Talking_0"
      },
      {
        text: "Your follow-up system is ready to keep your clients engaged!",
        facialExpression: "smile",
        animation: "Talking_2"
      }
    ],
    meeting: [
      {
        text: "Absolutely! Let me set up a meeting preparation workflow for you.",
        facialExpression: "smile",
        animation: "Talking_1"
      },
      {
        text: "I'll handle agenda distribution, room booking, and team reminders.",
        facialExpression: "default",
        animation: "Talking_0"
      },
      {
        text: "Your meeting workflow is configured and ready to use!",
        facialExpression: "smile",
        animation: "Talking_2"
      }
    ]
  };
  
  // Function to detect workflow type from user message
  export function detectWorkflowType(message) {
    const lowerMessage = message.toLowerCase();
    console.log(`🔍 Analyzing message: "${lowerMessage}"`);
    
    for (const [workflowType, phrases] of Object.entries(triggerPhrases)) {
      console.log(`🎯 Checking ${workflowType} phrases:`, phrases);
      
      const matchedPhrase = phrases.find(phrase => lowerMessage.includes(phrase));
      if (matchedPhrase) {
        console.log(`✅ MATCH FOUND: "${matchedPhrase}" in "${lowerMessage}"`);
        return workflowType;
      }
    }
    
    console.log('❌ No workflow triggers found');
    return null;
  }
  
  // Function to create workflow from template
  export function createWorkflowFromTemplate(workflowType, userMessage) {
    const template = workflowTemplates[workflowType];
    if (!template) return null;
  
    const workflowId = `workflow-${Date.now()}`;
    
    return {
      [workflowId]: {
        id: workflowId,
        name: template.name,
        description: `${template.description} - Generated from: "${userMessage}"`,
        generatedAt: new Date().toISOString(),
        status: 'active',
        notes: [
          {
            id: `note-${Date.now()}`,
            type: 'system',
            content: `🤖 ${template.name} created from: "${userMessage}"`,
            timestamp: new Date().toISOString()
          }
        ],
        tasks: template.tasks.map((task, index) => ({
          ...task,
          id: `task-${Date.now()}-${index + 1}`,
          status: 'pending',
          order: index + 1,
          position: { x: 100 + (index * 300), y: 100 }
        }))
      }
    };
  }