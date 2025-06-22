// workflows.js - Sample workflows and trigger phrases

export const workflowTemplates = {
    onboarding: {
      name: 'Co-op Student Onboarding - Daniel',
      description: 'Complete onboarding process for new co-op student Daniel',
      tasks: [
        {
          type: 'email',
          title: 'Send co-op offer email',
          description: 'Send official co-op offer letter to Daniel',
          priority: 'high',
          estimatedTime: '2 minutes',
          config: {
            recipient: 'dz.daniel47@gmail.com',
            subject: 'Congratulations! Your Co-op Offer at [Company Name]',
            message: `Hi Daniel,

Congratulations! We're thrilled to offer you a co-op position at our company for the upcoming term.

Offer Details:
- Position: Software Development Co-op
- Start Date: [Start Date]
- Duration: 4 months
- Location: [Office Location/Remote]

We were impressed by your skills and enthusiasm during the interview process. You'll be working with our development team on exciting projects that will give you real-world experience.

Next Steps:
1. Please confirm your acceptance by replying to this email
2. Complete the attached paperwork
3. Await your onboarding package with first-day details

We're excited to welcome you to the team!

Best regards,
[Your Name]
[Title]
[Company Name]`
          }
        },
        {
          type: 'phone',
          title: 'Follow-up call to Daniel',
          description: 'Call Daniel to confirm he received the offer email and answer any questions',
          priority: 'high',
          estimatedTime: '10 minutes',
          config: {
            recipient: '+16478235759', // You can update this with Daniel's actual number
            message: `Hi Daniel! This is [Your Name] from [Company]. I wanted to follow up on the co-op offer email we sent you today. Did you have a chance to review it? I'm calling to see if you have any questions about the position, start date, or anything else. We're really excited to have you join our team for the co-op term. Feel free to ask me anything!`
          }
        },
        {
          type: 'document',
          title: 'Create onboarding Notion doc',
          description: 'Create comprehensive onboarding documentation for Daniel in Notion',
          priority: 'medium',
          estimatedTime: '15 minutes',
          config: {
            platform: 'Notion',
            title: 'Daniel\'s Co-op Onboarding Guide',
            content: `# Welcome Daniel! 🎉

## First Day Checklist
- [ ] Office tour (or virtual setup if remote)
- [ ] Meet your mentor and team members
- [ ] Set up development environment
- [ ] Review project assignments
- [ ] Complete IT setup (accounts, equipment)

## Week 1 Goals
- [ ] Complete security training
- [ ] Attend team standup meetings
- [ ] Set up development tools and IDE
- [ ] Review codebase and documentation
- [ ] Have 1:1 with your manager

## Resources
- **Slack workspace:** [Company Slack]
- **Code repository:** [GitHub/GitLab links]
- **Documentation:** [Internal wiki links]
- **Team calendar:** [Calendar link]

## Your Team
- **Manager:** [Manager Name] - [email]
- **Mentor:** [Mentor Name] - [email]
- **Buddy:** [Buddy Name] - [email]

## Projects You'll Work On
- Project A: [Description]
- Project B: [Description]

## Important Dates
- Start Date: [Date]
- Mid-term review: [Date]
- Final presentation: [Date]
- Last day: [Date]

Welcome to the team! 🚀`,
            assignee: 'Daniel',
            dueDate: 'First day'
          }
        },
        {
          type: 'slack',
          title: 'Introduce Daniel to the team',
          description: 'Send introduction message about Daniel joining as co-op student',
          priority: 'medium',
          estimatedTime: '1 minute',
          config: {
            channel: '#general',
            message: `🎉 Team Introduction! 🎉

We're excited to welcome Daniel to our team as our new co-op student! 

👨‍💻 **About Daniel:**
- Starting his co-op term with us on [Start Date]
- Will be working on [project/team name]
- Brings fresh perspective and enthusiasm to our development team

Daniel will be working closely with [mentor name] and contributing to [specific projects]. Let's all give him a warm welcome and help him get settled in!

Daniel, feel free to introduce yourself when you join! We're looking forward to working with you. 🚀

#coop #newteammember #welcome`
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
      'first day',
      'co-op',
      'coop',
      'intern',
      'student',
      'daniel',
      'new team member'
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
        text: "Perfect! I'll help you set up Daniel's co-op onboarding workflow.",
        facialExpression: "smile",
        animation: "Talking_1"
      },
      {
        text: "This includes his offer email, follow-up call, onboarding documentation, and team introduction.",
        facialExpression: "default",
        animation: "Talking_0"
      },
      {
        text: "Daniel's onboarding workflow is now ready to deploy! Let's give him a great first experience.",
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