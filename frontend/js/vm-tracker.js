let currentVMId = null;

// Load VMs on page load
document.addEventListener('DOMContentLoaded', loadVMs);

async function loadVMs() {
    try {
        showLoading();
        const response = await fetch('/api/vms');
        const vms = await response.json();
        displayVMs(vms);
        hideLoading();
    } catch (error) {
        console.error('Error loading VMs:', error);
        showNotification('Error loading VMs', 'error');
        hideLoading();
    }
}

function displayVMs(vms) {
    const vmCards = document.getElementById('vmCards');
    vmCards.innerHTML = '';

    if (vms.length === 0) {
        vmCards.innerHTML = `
            <div class="col-12">
                <div class="text-center">
                    <p>No VMs found. Click "Add New VM" to get started.</p>
                </div>
            </div>
        `;
        return;
    }

    vms.forEach(vm => {
        const statusClass = vm.status === 'Available' ? 'available' : 
                           vm.status === 'In Use' ? 'in-use' : 'stopped';
        
        const card = `
            <div class="vm-card ${statusClass}">
                <div class="vm-header">
                    <h3 class="vm-name">${vm.name}</h3>
                    <span class="platform-badge ${vm.platform.toLowerCase()}">${vm.platform}</span>
                </div>
                <div class="vm-status">
                    <div class="status-indicator ${vm.status.toLowerCase().replace(' ', '-')}"></div>
                    <span class="status-text">${vm.status}</span>
                </div>
                ${vm.current_user ? `<p class="mb-2"><strong>Current User:</strong> ${vm.current_user}</p>` : ''}
                ${vm.start_time ? `<p class="mb-2"><strong>Started:</strong> ${new Date(vm.start_time).toLocaleString()}</p>` : ''}
                
                <div class="vm-specs">
                    <span class="spec">4 vCPU</span>
                    <span class="spec">16GB RAM</span>
                    <span class="spec">100GB SSD</span>
                </div>
                
                <div class="d-grid">
                    ${vm.status === 'Available' ? 
                        `<button class="action-btn start-btn" onclick="showStartVMModal(${vm.id})">Start Session</button>` :
                        vm.status === 'In Use' ? 
                        `<button class="action-btn stop-btn" onclick="stopVM(${vm.id})">Stop Session</button>` :
                        `<button class="action-btn" disabled style="background: #ccc;">Unavailable</button>`
                    }
                </div>
            </div>
        `;
        vmCards.innerHTML += card;
    });
}

function showAddVMModal() {
    document.getElementById('addVMModal').classList.add('show');
}

function showStartVMModal(vmId) {
    currentVMId = vmId;
    document.getElementById('startVMModal').classList.add('show');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
    // Reset forms
    if (modalId === 'addVMModal') {
        document.getElementById('addVMForm').reset();
    } else if (modalId === 'startVMModal') {
        document.getElementById('startVMForm').reset();
    }
}

async function addVM() {
    const name = document.getElementById('vmName').value.trim();
    const platform = document.getElementById('vmPlatform').value;

    if (!name || !platform) {
        showNotification('Please fill all fields', 'error');
        return;
    }

    try {
        const response = await fetch('/api/vms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, platform })
        });

        const result = await response.json();

        if (response.ok) {
            closeModal('addVMModal');
            loadVMs();
            showNotification('VM added successfully!', 'success');
        } else {
            showNotification(result.error || 'Error adding VM', 'error');
        }
    } catch (error) {
        console.error('Error adding VM:', error);
        showNotification('Error adding VM', 'error');
    }
}

async function startVMSession() {
    const userName = document.getElementById('userName').value.trim();
    const purpose = document.getElementById('purpose').value.trim();

    if (!userName || !purpose) {
        showNotification('Please fill all fields', 'error');
        return;
    }

    try {
        const response = await fetch(`/api/vms/${currentVMId}/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_name: userName, purpose })
        });

        const result = await response.json();

        if (response.ok) {
            closeModal('startVMModal');
            loadVMs();
            showNotification('VM session started successfully!', 'success');
        } else {
            showNotification(result.error || 'Error starting VM session', 'error');
        }
    } catch (error) {
        console.error('Error starting VM session:', error);
        showNotification('Error starting VM session', 'error');
    }
}

async function stopVM(vmId) {
    if (confirm('Are you sure you want to stop this VM session?')) {
        try {
            const response = await fetch(`/api/vms/${vmId}/stop`, {
                method: 'POST'
            });

            const result = await response.json();

            if (response.ok) {
                loadVMs();
                showNotification(`VM session stopped. Duration: ${result.duration} minutes`, 'success');
            } else {
                showNotification(result.error || 'Error stopping VM session', 'error');
            }
        } catch (error) {
            console.error('Error stopping VM session:', error);
            showNotification('Error stopping VM session', 'error');
        }
    }
}

function goHome() {
    window.location.href = '../index.html';
}

function showLoading() {
    const vmCards = document.getElementById('vmCards');
    vmCards.innerHTML = `
        <div class="text-center">
            <div class="loading"></div>
            <p>Loading VMs...</p>
        </div>
    `;
}

function hideLoading() {
    // Loading will be replaced by VM cards
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

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
    }
});
