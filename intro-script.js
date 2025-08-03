document.addEventListener('DOMContentLoaded', function() {
    const nameInput = document.getElementById('participantName');
    const instructionsCheckbox = document.getElementById('instructionsRead');
    const startButton = document.getElementById('startButton');
    const form = document.getElementById('introForm');

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
    startButton.addEventListener('click', function() {
        const participantName = nameInput.value.trim();
        
        if (participantName && instructionsCheckbox.checked) {
            // Store participant name in localStorage for later use
            localStorage.setItem('participantName', participantName);
            
            // Log the start of the study
            console.log('Study started by:', participantName);
            console.log('Instructions confirmed at:', new Date().toISOString());
            
            // Redirect to main study page
            window.location.href = 'index.html';
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