let data = [];
let currentIndex = 0;

// Load data
fetch('data/pilot_1_1.json')
    .then(response => response.json())
    .then(jsonData => {
        data = jsonData;
        document.getElementById('totalPages').textContent = data.length;
        displayData(currentIndex);
    })
    .catch(error => {
        console.error('Error loading data:', error);
        alert('Failed to load data, please refresh the page and try again');
    });

function displayData(index) {
    if (index < 0 || index >= data.length) return;

    const item = data[index];
    
    // Update image
    const imagePath = `data/img/post${item.index}.png`;
    document.getElementById('postImage').src = imagePath;
    document.getElementById('postImage').onerror = function() {
        this.src = '';
        this.alt = 'Image not found';
    };

    // Update text content
    document.getElementById('communityNote').textContent = item.community_notes;
    document.getElementById('llmNote').textContent = item.LLM_notes;

    // Update tweet number
    document.getElementById('currentPage').textContent = index + 1;

    // Update button state
    document.getElementById('prevBtn').disabled = index === 0;
    const nextBtn = document.getElementById('nextBtn');
    
    // On last page, change Next to Submit
    if (index === data.length - 1) {
        nextBtn.textContent = 'Submit';
        nextBtn.onclick = submitData;
    } else {
        nextBtn.textContent = 'Next';
        nextBtn.onclick = nextPage;
    }
    
    // Reset all radio buttons
    const communityRadios = document.querySelectorAll('input[name="community_helpfulness"]');
    communityRadios.forEach(radio => radio.checked = false);
    
    const llmRadios = document.querySelectorAll('input[name="llm_helpfulness"]');
    llmRadios.forEach(radio => radio.checked = false);
    
    // Reset all Likert scale options
    const likertRadios = document.querySelectorAll('input[type="radio"][name*="_source_quality"], input[type="radio"][name*="_clarity"], input[type="radio"][name*="_coverage"], input[type="radio"][name*="_context"], input[type="radio"][name*="_impartiality"]');
    likertRadios.forEach(radio => radio.checked = false);
    
    // Reset comparison question
    const comparisonRadios = document.querySelectorAll('input[name="note_comparison"]');
    comparisonRadios.forEach(radio => radio.checked = false);
    
    // Reset collapsible state (default collapsed)
    const collapsibleContents = document.querySelectorAll('.collapsible-content');
    const collapsibleHeaders = document.querySelectorAll('.collapsible-header');
    collapsibleContents.forEach(content => content.classList.remove('show'));
    collapsibleHeaders.forEach(header => header.classList.remove('active'));
}

function previousPage() {
    if (currentIndex > 0) {
        currentIndex--;
        displayData(currentIndex);
    }
}

function nextPage() {
    if (currentIndex < data.length - 1) {
        currentIndex++;
        displayData(currentIndex);
    }
}

// Keyboard shortcut support
document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowLeft') {
        previousPage();
    } else if (e.key === 'ArrowRight') {
        nextPage();
    }
});

// Handle radio button change
function handleRadioChange(radio, noteType) {
    // Currently just logging selection, not storing
    console.log(`Selected: ${radio.value} for ${noteType} note, item index: ${data[currentIndex].index}`);
}

// Handle Likert scale change
function handleLikertChange(radio, noteType, dimension) {
    // Currently just logging selection, not storing
    console.log(`Likert: ${radio.value} for ${noteType} note, dimension: ${dimension}, item index: ${data[currentIndex].index}`);
}

// Handle comparison choice change
function handleComparisonChange(radio) {
    // Currently just logging selection, not storing
    console.log(`Comparison: ${radio.value} selected, item index: ${data[currentIndex].index}`);
}

// Collapsible functionality
function toggleCollapse(contentId, buttonElement) {
    const content = document.getElementById(contentId);
    const header = buttonElement;
    
    if (content.classList.contains('show')) {
        // Collapse
        content.classList.remove('show');
        header.classList.remove('active');
    } else {
        // Expand
        content.classList.add('show');
        header.classList.add('active');
    }
}

// Submit data function
function submitData() {
    // Log submission details
    console.log('Data submitted!');
    console.log('Submission time:', new Date().toISOString());
    
    // Get participant name from localStorage if available
    const participantName = localStorage.getItem('participantName');
    if (participantName) {
        console.log('Participant:', participantName);
    }
    
    // Redirect to completion page
    window.location.href = 'completion.html';
}