'use client';

import { useState } from 'react';
import './globals.css';

// Import your main components
import Header from '../components/layout/header';
import WorkflowSidebar from '../components/layout/workflowsidebar';
import TaskQueue from '../components/layout/TaskQueue';
import { WorkflowProvider } from '../context/WorkflowContext';

export default function RootLayout({ children }) {
  const [activeWorkflow, setActiveWorkflow] = useState(null);

  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <WorkflowProvider>
          {/* Header */}
          <Header />
          
          {/* Main Content Area */}
          <div className="flex h-[calc(100vh-4rem)]">
            
            {/* Left Sidebar - Workflow List */}
            <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
              <WorkflowSidebar 
                activeWorkflow={activeWorkflow}
                setActiveWorkflow={setActiveWorkflow}
              />
            </div>

            {/* Center Panel - This is where children (page.js) renders */}
            <div className="flex-1 bg-gray-50">
              {children}
            </div>

            {/* Right Panel - Task Queue */}
            <div className="w-96 bg-white border-l border-gray-200">
              <TaskQueue activeWorkflow={activeWorkflow} />
            </div>
            
          </div>
        </WorkflowProvider>
      </body>
    </html>
  );
}