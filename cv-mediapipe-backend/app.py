from flask import Flask, request, jsonify, websocket
from flask_cors import CORS
from conductor_service import ConductorOrchestrationService, WorkflowEngine
import threading
import logging
import time
import json
from datetime import datetime
from typing import Dict, List, Optional
import asyncio
import queue

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger()
logger.level = logging.DEBUG

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Initialize Conductor orchestration service
conductor_service = ConductorOrchestrationService()
workflow_engine = WorkflowEngine()

# Global state for real-time updates
active_connections = set()
execution_queue = queue.Queue()

@app.after_request
def log_response(response):
    print(f"Response Status: {response.status}")
    print(f"Response Headers: {dict(response.headers)}")
    return response

@app.route('/test', methods=['GET', 'POST', 'OPTIONS'])
def test():
    print("Request received!")
    print("Method:", request.method)
    print("Headers:", dict(request.headers))
    return jsonify({"message": "Conductor AI Backend operational!"})

# ================================================
# Workflow Management Endpoints
# ================================================

@app.route('/api/workflows', methods=['POST'])
def create_workflow():
    """
    Create a new enterprise workflow from visual designer configuration
    """
    try:
        data = request.get_json()
        workflow_config = {
            'name': data.get('name', 'Untitled Workflow'),
            'description': data.get('description', ''),
            'steps': data.get('steps', []),
            'platforms': data.get('platforms', []),
            'triggers': data.get('triggers', []),
            'schedule': data.get('schedule', None),
            'priority': data.get('priority', 'medium')
        }

        # Validate workflow configuration
        if not workflow_config['steps']:
            return jsonify({
                'status': 'error',
                'message': 'Workflow must contain at least one step'
            }), 400

        # Create workflow through conductor service
        workflow_id = conductor_service.create_workflow(workflow_config)
        
        logger.info(f"Created workflow: {workflow_id}")

        return jsonify({
            'status': 'success',
            'workflow_id': workflow_id,
            'message': f'Workflow "{workflow_config["name"]}" created successfully'
        }), 201

    except Exception as e:
        logger.error(f"Failed to create workflow: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to create workflow'
        }), 500

@app.route('/api/workflows/<workflow_id>/execute', methods=['POST'])
def execute_workflow(workflow_id):
    """Execute a specific workflow"""
    try:
        data = request.get_json() or {}
        execution_params = data.get('parameters', {})
        
        success = conductor_service.execute_workflow(workflow_id)
        
        if success:
            # Add to execution queue for real-time processing
            execution_queue.put({
                'type': 'workflow_execution',
                'workflow_id': workflow_id,
                'timestamp': datetime.now().isoformat(),
                'parameters': execution_params
            })
            
            return jsonify({
                'status': 'success',
                'message': f'Workflow {workflow_id} execution started',
                'execution_id': f"exec_{int(time.time())}"
            }), 200
        else:
            return jsonify({
                'status': 'error',
                'message': 'Workflow not found or cannot be executed'
            }), 404

    except Exception as e:
        logger.error(f"Failed to execute workflow {workflow_id}: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/workflows/<workflow_id>/status', methods=['GET'])
def get_workflow_status(workflow_id):
    """Get current status of a workflow"""
    try:
        workflow_status = conductor_service.get_workflow_status(workflow_id)
        
        if workflow_status:
            return jsonify({
                'status': 'success',
                'data': {
                    'workflow_id': workflow_id,
                    'name': workflow_status['name'],
                    'status': workflow_status['status'],
                    'progress': workflow_status['progress'],
                    'created_at': workflow_status['created_at'].isoformat(),
                    'platforms': workflow_status['platforms'],
                    'steps_completed': int(workflow_status['progress'] * len(workflow_status['steps'])),
                    'total_steps': len(workflow_status['steps'])
                }
            }), 200
        else:
            return jsonify({
                'status': 'error',
                'message': 'Workflow not found'
            }), 404

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/workflows', methods=['GET'])
def list_workflows():
    """List all workflows with their current status"""
    try:
        workflows = []
        for workflow_id, workflow_data in conductor_service.active_workflows.items():
            workflows.append({
                'id': workflow_id,
                'name': workflow_data['name'],
                'status': workflow_data['status'],
                'progress': workflow_data['progress'],
                'created_at': workflow_data['created_at'].isoformat(),
                'platforms': workflow_data['platforms']
            })
        
        return jsonify({
            'status': 'success',
            'data': {
                'workflows': workflows,
                'total_count': len(workflows)
            }
        }), 200

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/workflows/<workflow_id>/pause', methods=['POST'])
def pause_workflow(workflow_id):
    """Pause a running workflow"""
    try:
        if workflow_id in conductor_service.active_workflows:
            workflow = conductor_service.active_workflows[workflow_id]
            if workflow['status'] == 'running':
                workflow['status'] = 'paused'
                conductor_service.avatar_speak(f"Workflow {workflow['name']} paused")
                
                return jsonify({
                    'status': 'success',
                    'message': f'Workflow {workflow_id} paused'
                }), 200
            else:
                return jsonify({
                    'status': 'error',
                    'message': 'Workflow is not currently running'
                }), 400
        else:
            return jsonify({
                'status': 'error',
                'message': 'Workflow not found'
            }), 404

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

# ================================================
# Platform Integration Endpoints
# ================================================

@app.route('/api/platforms/connect', methods=['POST'])
def connect_platform():
    """Connect to an enterprise platform (Gmail, Slack, etc.)"""
    try:
        data = request.get_json()
        platform_name = data.get('platform', '').lower()
        auth_token = data.get('auth_token', '')
        auth_config = data.get('config', {})

        if not platform_name:
            return jsonify({
                'status': 'error',
                'message': 'Platform name is required'
            }), 400

        # Validate platform
        supported_platforms = ['gmail', 'slack', 'calendar', 'drive', 'crm', 'teams', 'notion', 'asana']
        if platform_name not in supported_platforms:
            return jsonify({
                'status': 'error',
                'message': f'Platform {platform_name} not supported'
            }), 400

        # Connect platform
        success = conductor_service.connect_platform(platform_name, auth_token)
        
        if success:
            return jsonify({
                'status': 'success',
                'message': f'{platform_name.upper()} connected successfully',
                'platform': platform_name,
                'connected_at': datetime.now().isoformat()
            }), 200
        else:
            return jsonify({
                'status': 'error',
                'message': f'Failed to connect to {platform_name}'
            }), 500

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/platforms/status', methods=['GET'])
def get_platform_status():
    """Get status of all platform connections"""
    try:
        platform_status = {}
        for platform, status in conductor_service.platform_connections.items():
            platform_status[platform] = {
                'connected': status['connected'],
                'last_sync': status['last_sync'].isoformat() if status['last_sync'] else None,
                'health': 'healthy' if status['connected'] else 'disconnected'
            }

        return jsonify({
            'status': 'success',
            'data': {
                'platforms': platform_status,
                'total_connected': sum(1 for p in conductor_service.platform_connections.values() if p['connected'])
            }
        }), 200

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/platforms/<platform_name>/disconnect', methods=['POST'])
def disconnect_platform(platform_name):
    """Disconnect from a platform"""
    try:
        if platform_name in conductor_service.platform_connections:
            conductor_service.platform_connections[platform_name]['connected'] = False
            conductor_service.platform_connections[platform_name]['last_sync'] = None
            
            return jsonify({
                'status': 'success',
                'message': f'{platform_name.upper()} disconnected'
            }), 200
        else:
            return jsonify({
                'status': 'error',
                'message': 'Platform not found'
            }), 404

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

# ================================================
# Computer Vision & User Interaction Endpoints
# ================================================

@app.route('/api/monitoring/start', methods=['POST'])
def start_monitoring():
    """Start computer vision monitoring for user interaction"""
    try:
        data = request.get_json() or {}
        session_config = {
            'duration': data.get('duration', None),  # None = continuous
            'track_attention': data.get('track_attention', True),
            'gesture_control': data.get('gesture_control', True),
            'engagement_analytics': data.get('engagement_analytics', True)
        }
        
        conductor_service.start_orchestration_session()
        
        return jsonify({
            'status': 'success',
            'message': 'Computer vision monitoring started',
            'session_config': session_config
        }), 200

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/monitoring/engagement', methods=['GET'])
def get_engagement_metrics():
    """Get real-time user engagement analytics"""
    try:
        engagement_report = conductor_service.get_engagement_report()
        
        return jsonify({
            'status': 'success',
            'data': {
                'engagement_metrics': engagement_report,
                'timestamp': datetime.now().isoformat(),
                'session_active': conductor_service.is_monitoring
            }
        }), 200

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/monitoring/gestures', methods=['POST'])
def execute_gesture_command():
    """Execute a command via gesture recognition"""
    try:
        data = request.get_json()
        gesture = data.get('gesture', '')
        command = data.get('command', '')
        
        if gesture:
            conductor_service.handle_gesture_command(gesture)
        elif command:
            conductor_service.execute_gesture_command(command)
        else:
            return jsonify({
                'status': 'error',
                'message': 'Either gesture or command is required'
            }), 400
        
        return jsonify({
            'status': 'success',
            'message': f'Gesture command executed: {gesture or command}'
        }), 200

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

# ================================================
# Avatar & Guidance System Endpoints
# ================================================

@app.route('/api/avatar/speak', methods=['POST'])
def avatar_speak():
    """Make avatar speak a message"""
    try:
        data = request.get_json()
        message = data.get('message', '')
        
        if not message:
            return jsonify({
                'status': 'error',
                'message': 'Message is required'
            }), 400
        
        conductor_service.avatar_speak(message)
        
        return jsonify({
            'status': 'success',
            'message': 'Avatar message set',
            'avatar_message': message
        }), 200

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/avatar/status', methods=['GET'])
def get_avatar_status():
    """Get current avatar state"""
    try:
        avatar_state = conductor_service.avatar_state.copy()
        
        # Convert deque to list for JSON serialization
        avatar_state['gesture_queue'] = list(avatar_state['gesture_queue'])
        
        return jsonify({
            'status': 'success',
            'data': {
                'avatar_state': avatar_state,
                'timestamp': datetime.now().isoformat()
            }
        }), 200

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

# ================================================
# Analytics & Reporting Endpoints
# ================================================

@app.route('/api/analytics/dashboard', methods=['GET'])
def get_dashboard_analytics():
    """Get comprehensive dashboard analytics"""
    try:
        engagement_report = conductor_service.get_engagement_report()
        
        # Workflow analytics
        workflow_stats = {
            'total_workflows': len(conductor_service.active_workflows),
            'running_workflows': sum(1 for w in conductor_service.active_workflows.values() if w['status'] == 'running'),
            'completed_workflows': sum(1 for w in conductor_service.active_workflows.values() if w['status'] == 'completed'),
            'paused_workflows': sum(1 for w in conductor_service.active_workflows.values() if w['status'] == 'paused')
        }
        
        # Platform health
        platform_health = {
            'total_platforms': len(conductor_service.platform_connections),
            'connected_platforms': sum(1 for p in conductor_service.platform_connections.values() if p['connected']),
            'health_score': sum(1 for p in conductor_service.platform_connections.values() if p['connected']) / len(conductor_service.platform_connections) if conductor_service.platform_connections else 0
        }
        
        return jsonify({
            'status': 'success',
            'data': {
                'engagement_metrics': engagement_report,
                'workflow_analytics': workflow_stats,
                'platform_health': platform_health,
                'system_status': {
                    'monitoring_active': conductor_service.is_monitoring,
                    'uptime': time.time() - (conductor_service.monitoring_start if hasattr(conductor_service, 'monitoring_start') else time.time()),
                    'avatar_active': conductor_service.avatar_state['is_speaking']
                },
                'generated_at': datetime.now().isoformat()
            }
        }), 200

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/analytics/export', methods=['GET'])
def export_analytics():
    """Export analytics data for reporting"""
    try:
        export_data = {
            'workflows': [
                {
                    'id': wid,
                    'name': wdata['name'],
                    'status': wdata['status'],
                    'progress': wdata['progress'],
                    'created_at': wdata['created_at'].isoformat(),
                    'platforms': wdata['platforms']
                }
                for wid, wdata in conductor_service.active_workflows.items()
            ],
            'platform_connections': conductor_service.platform_connections,
            'engagement_history': list(conductor_service.attention_buffer),
            'execution_history': list(conductor_service.execution_buffer),
            'export_timestamp': datetime.now().isoformat()
        }
        
        return jsonify({
            'status': 'success',
            'data': export_data
        }), 200

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

# ================================================
# Health & System Endpoints
# ================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """System health check endpoint"""
    try:
        health_status = {
            'service_status': 'healthy',
            'computer_vision': conductor_service.cap.isOpened() if conductor_service.cap else False,
            'workflow_engine': len(conductor_service.active_workflows) >= 0,
            'avatar_system': conductor_service.avatar_state is not None,
            'platform_integrations': len(conductor_service.platform_connections) > 0,
            'timestamp': datetime.now().isoformat()
        }
        
        # Overall health score
        health_checks = [
            health_status['computer_vision'],
            health_status['workflow_engine'],
            health_status['avatar_system'],
            health_status['platform_integrations']
        ]
        health_score = sum(health_checks) / len(health_checks)
        health_status['health_score'] = health_score
        health_status['overall_status'] = 'healthy' if health_score > 0.75 else 'degraded' if health_score > 0.5 else 'unhealthy'
        
        return jsonify({
            'status': 'success',
            'data': health_status
        }), 200

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

# ================================================
# WebSocket for Real-time Updates (Future Enhancement)
# ================================================

# Note: For production, consider adding WebSocket support for real-time updates
# This would enable live workflow status updates, engagement metrics streaming,
# and real-time avatar communication

# ================================================
# Error Handlers
# ================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'status': 'error',
        'message': 'Endpoint not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'status': 'error',
        'message': 'Internal server error'
    }), 500

@app.errorhandler(400)
def bad_request(error):
    return jsonify({
        'status': 'error',
        'message': 'Bad request'
    }), 400

# ================================================
# Application Startup
# ================================================

def start_background_workers():
    """Start background workers for workflow execution"""
    def workflow_processor():
        while True:
            try:
                if not execution_queue.empty():
                    task = execution_queue.get(timeout=1)
                    logger.info(f"Processing task: {task}")
                    # Process workflow execution tasks
                    # In a real implementation, this would handle actual platform integrations
                time.sleep(0.1)
            except queue.Empty:
                continue
            except Exception as e:
                logger.error(f"Error in workflow processor: {e}")
    
    # Start background worker thread
    worker_thread = threading.Thread(target=workflow_processor, daemon=True)
    worker_thread.start()

# Run the app
if __name__ == '__main__':
    # Start background workers
    start_background_workers()
    
    # Start Flask in a daemon thread
    flask_thread = threading.Thread(
        target=lambda: app.run(host='0.0.0.0', port=8000, debug=False, threaded=True)
    )
    flask_thread.daemon = True
    flask_thread.start()
    
    # Run Conductor interface in main thread
    try:
        logger.info("Starting Conductor AI Orchestration Service...")
        conductor_service.run_conductor_interface()
    except KeyboardInterrupt:
        logger.info("Shutting down Conductor AI...")
    finally:
        conductor_service.stop()