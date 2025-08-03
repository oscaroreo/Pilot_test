document.addEventListener('DOMContentLoaded', function() {
    const nameInput = document.getElementById('participantName');
    const instructionsCheckbox = document.getElementById('instructionsRead');
    const startButton = document.getElementById('startButton');
    const form = document.getElementById('introForm');

    // 创建错误提示元素
    function createErrorContainer() {
        let errorContainer = document.getElementById('errorContainer');
        if (!errorContainer) {
            errorContainer = document.createElement('div');
            errorContainer.id = 'errorContainer';
            errorContainer.style.cssText = `
                margin: 10px 0;
                padding: 12px;
                border-radius: 4px;
                font-size: 14px;
                display: none;
            `;
            form.insertBefore(errorContainer, startButton);
        }
        return errorContainer;
    }

    // 显示错误信息
    function showErrorMessage(message, type = 'error') {
        const errorContainer = createErrorContainer();
        
        if (type === 'warning') {
            errorContainer.style.backgroundColor = '#fff3cd';
            errorContainer.style.borderLeft = '4px solid #ffc107';
            errorContainer.style.color = '#856404';
        } else {
            errorContainer.style.backgroundColor = '#f8d7da';
            errorContainer.style.borderLeft = '4px solid #dc3545';
            errorContainer.style.color = '#721c24';
        }
        
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
        
        // 3秒后自动隐藏
        setTimeout(() => {
            errorContainer.style.display = 'none';
        }, 5000);
    }

    // 将函数添加到全局作用域
    window.showErrorMessage = showErrorMessage;

    // Enable/disable start button based on form completion
    function updateStartButton() {
        const nameEntered = nameInput.value.trim().length > 0;
        const instructionsChecked = instructionsCheckbox.checked;
        
        startButton.disabled = !(nameEntered && instructionsChecked);
    }

    // Add event listeners
    nameInput.addEventListener('input', updateStartButton);
    instructionsCheckbox.addEventListener('change', updateStartButton);

    // Handle start button click
    startButton.addEventListener('click', async function() {
        const participantName = nameInput.value.trim();
        
        if (participantName && instructionsCheckbox.checked) {
            try {
                // Disable button to prevent double-click
                startButton.disabled = true;
                startButton.textContent = 'Starting...';
                
                // Create new session with backend
                const response = await fetch('/api/start-session', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ participantName })
                });
                
                if (response.ok) {
                    const sessionData = await response.json();
                    
                    // Store session info
                    localStorage.setItem('sessionId', sessionData.sessionId);
                    localStorage.setItem('participantName', participantName);
                    
                    console.log('Session created:', sessionData.sessionId);
                    
                    // Redirect to main study page
                    window.location.href = 'index.html';
                } else {
                    const errorData = await response.json();
                    let errorMessage = errorData.error || 'Unknown error';
                    
                    // 根据错误类型显示不同颜色的提示
                    if (errorData.code === 'DUPLICATE_NAME' || errorData.code === 'NAME_IN_USE') {
                        showErrorMessage(errorMessage, 'warning');
                    } else {
                        showErrorMessage(errorMessage, 'error');
                    }
                    
                    startButton.disabled = false;
                    startButton.textContent = 'Start';
                }
                
            } catch (error) {
                console.error('Error starting session:', error);
                showErrorMessage('Failed to start session. Please check if the server is running.', 'error');
                startButton.disabled = false;
                startButton.textContent = 'Start';
            }
        }
    });

    // Handle form submission (Enter key)
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        if (!startButton.disabled) {
            startButton.click();
        }
    });

    // Focus on name input when page loads
    nameInput.focus();
});