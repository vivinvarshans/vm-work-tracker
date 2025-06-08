let currentSessionId = null;
let sessionTimer = null;
let sessionStartTime = null;

document.addEventListener('DOMContentLoaded', () => {
    loadWorkSessions();
    checkActiveSession();
});

async function startWorkSession() {
    const employeeName = document.getElementById('employeeName').value.trim();
    const projectName = document.getElementById('projectName').value.trim();
    const activityType = document.getElementById('activityType').value;
    const taskDescription = document.getElementById('taskDescription').value.trim();

    if (!employeeName || !projectName || !activityType || !taskDescription) {
        showNotification('Please fill all fields', 'error');
        return;
    }

    try {
        const response = await fetch('/api/work/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                employee_name: employeeName,
                project_name: projectName,
                activity_type: activityType,
                task_description: taskDescription
            })
        });

        const result = await response.json();

        if (response.ok) {
            currentSessionId = result.sessionId;
            sessionStartTime = new Date();
            
            // Store session info in localStorage for persistence
            localStorage.setItem('activeWorkSession', JSON.stringify({
                id: currentSessionId,
                employee_name: employeeName,
                project_name: projectName,
                activity_type: activityType,
                task_description: taskDescription,
                start_time: sessionStartTime.toISOString()
            }));
            
            showActiveSession({
                employee_name: employeeName,
                project_name: projectName,
                activity_type: activityType,
                task_description: taskDescription,
                start_time: sessionStartTime.toISOString()
            });
            
            document.getElementById('startWorkForm').reset();
            showNotification('Work session started successfully!', 'success');
        } else {
            showNotification(result.error || 'Error starting work session', 'error');
        }
    } catch (error) {
        console.error('Error starting work session:', error);
        showNotification('Error starting work session', 'error');
    }
}

async function stopCurrentSession() {
    if (!currentSessionId) return;

    if (confirm('Are you sure you want to stop the current work session?')) {
        try {
            const response = await fetch(`/api/work/${currentSessionId}/stop`, {
                method: 'POST'
            });

            const result = await response.json();

            if (response.ok) {
                hideActiveSession();
                loadWorkSessions();
                localStorage.removeItem('activeWorkSession');
                showNotification(`Work session completed. Duration: ${result.duration} minutes`, 'success');
            } else {
                showNotification(result.error || 'Error stopping work session', 'error');
            }
        } catch (error) {
            console.error('Error stopping work session:', error);
            showNotification('Error stopping work session', 'error');
        }
    }
}

function showActiveSession(session) {
    const activeSessionDiv = document.getElementById('activeSession');
    const sessionDetails = document.getElementById('sessionDetails');
    const startSessionCard = document.getElementById('startSessionCard');

    sessionDetails.innerHTML = `
        <p><strong>Employee:</strong> ${session.employee_name}</p>
        <p><strong>Project:</strong> ${session.project_name}</p>
        <p><strong>Activity:</strong> ${session.activity_type}</p>
        <p><strong>Task:</strong> ${session.task_description}</p>
        <p><strong>Started:</strong> ${new Date(session.start_time).toLocaleString()}</p>
    `;

    activeSessionDiv.style.display = 'block';
    startSessionCard.style.display = 'none';

    // Start timer
    startSessionTimer(new Date(session.start_time));
}

function hideActiveSession() {
    document.getElementById('activeSession').style.display = 'none';
    document.getElementById('startSessionCard').style.display = 'block';
    currentSessionId = null;
    sessionStartTime = null;
    
    if (sessionTimer) {
        clearInterval(sessionTimer);
        sessionTimer = null;
    }
}

function startSessionTimer(startTime) {
    // Update timer immediately
    updateTimer(startTime);
    
    // Then update every second
    sessionTimer = setInterval(() => {
        updateTimer(startTime);
    }, 1000);
}

function updateTimer(startTime) {
    const now = new Date();
    const diff = now - startTime;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    const timerElement = document.getElementById('sessionTimer');
    if (timerElement) {
        timerElement.textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

async function loadWorkSessions() {
    try {
        const response = await fetch('/api/work');
        const sessions = await response.json();
        displayWorkSessions(sessions);
    } catch (error) {
        console.error('Error loading work sessions:', error);
        showNotification('Error loading work sessions', 'error');
    }
}

function displayWorkSessions(sessions) {
    const tableBody = document.getElementById('sessionsTable');
    tableBody.innerHTML = '';

    if (sessions.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">No work sessions found</td>
            </tr>
        `;
        return;
    }

    sessions.slice(0, 20).forEach(session => { // Show recent 20 sessions
        const statusBadge = session.status === 'Completed' ? 'bg-success' : 'bg-warning';
        const duration = session.duration_minutes ? 
            `${Math.floor(session.duration_minutes / 60)}h ${session.duration_minutes % 60}m` : 
            'In Progress';
        
        const row = `
            <tr>
                <td>${session.employee_name}</td>
                <td>${session.project_name}</td>
                <td>${session.activity_type}</td>
                <td>${new Date(session.start_time).toLocaleString()}</td>
                <td>${duration}</td>
                <td>
                    <span class="badge ${statusBadge}">
                        ${session.status}
                    </span>
                </td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });
}

function checkActiveSession() {
    const activeSession = localStorage.getItem('activeWorkSession');
    if (activeSession) {
        const session = JSON.parse(activeSession);
        currentSessionId = session.id;
        sessionStartTime = new Date(session.start_time);
        showActiveSession(session);
    }
}

function refreshSessions() {
    loadWorkSessions();
    showNotification('Sessions refreshed', 'success');
}

function goHome() {
    window.location.href = '../index.html';
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
            <span class="notification-message">${message}</span>
        </div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #000000;
        color: white;
        padding: 16px 20px;
        border-radius: 20px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}
