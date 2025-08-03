let data = [];
let currentIndex = 0; // 总是从0开始
let sessionId = null;
let noteMapping = {}; // Store which note type (community/LLM) is assigned to Note A/B for each item

// 存储所有用户响应数据，以实际post的index为键
let userResponses = {}; 
/* 数据结构:
{
  "postIndex": {
    postIndex: 123,  // post的实际index
    noteMapping: "community_first" | "llm_first",  // 哪个笔记被分配为Note A
    communityNote: {
      helpfulness: "",
      details: {
        source_quality: "",
        clarity: "",
        coverage: "",
        context: "",
        impartiality: ""
      }
    },
    llmNote: {
      helpfulness: "",
      details: {
        source_quality: "",
        clarity: "",
        coverage: "",
        context: "",
        impartiality: ""
      }
    },
    comparison: "", // "community_note" | "llm_note"
    timestamp: ""
  }
}
*/

// 初始化某个post的响应数据
function initializeResponseData(postIndex, noteMap) {
    if (!userResponses[postIndex]) {
        userResponses[postIndex] = {
            postIndex: postIndex,
            noteMapping: noteMap,
            communityNote: {
                helpfulness: "",
                details: {
                    source_quality: "",
                    clarity: "",
                    coverage: "",
                    context: "",
                    impartiality: ""
                }
            },
            llmNote: {
                helpfulness: "",
                details: {
                    source_quality: "",
                    clarity: "",
                    coverage: "",
                    context: "",
                    impartiality: ""
                }
            },
            comparison: "",
            timestamp: new Date().toISOString()
        };
    }
}

// 获取当前项目的响应数据
function getCurrentResponseData() {
    const item = data[currentIndex];
    if (!item) return null;
    
    const postIndex = item.index;
    const noteMap = noteMapping[postIndex];
    
    initializeResponseData(postIndex, noteMap);
    return userResponses[postIndex];
}

// 页面加载时重置状态
window.addEventListener('beforeunload', function() {
    // 页面卸载时不保存当前进度
    localStorage.removeItem('currentIndex');
});

// 确保每次页面加载都从头开始
window.addEventListener('load', function() {
    currentIndex = 0; // 强制重置为0
    noteMapping = {}; // 清空映射
});

// Load data from backend
async function loadSessionData() {
    try {
        sessionId = localStorage.getItem('sessionId');
        
        if (!sessionId) {
            alert('No active session found. Please start from the introduction page.');
            window.location.href = 'introduction.html';
            return;
        }
        
        const response = await fetch(`/api/session/${sessionId}/data`);
        
        if (response.ok) {
            const sessionData = await response.json();
            data = sessionData.data;
            currentIndex = 0; // 确保从第一题开始
            document.getElementById('totalPages').textContent = data.length;
            
            // 记录会话开始时间（用于提交时的统计）
            localStorage.setItem('sessionStartTime', new Date().toISOString());
            
            // 立即滚动到顶部，然后显示数据
            window.scrollTo(0, 0);
            displayData(currentIndex);
            console.log(`Loaded ${data.length} randomized items for session ${sessionId}, starting from question 1`);
        } else {
            const errorData = await response.json();
            alert(`Error: ${errorData.error}`);
            window.location.href = 'introduction.html';
        }
        
    } catch (error) {
        console.error('Error loading session data:', error);
        alert('Failed to load data. Please check if the server is running.');
    }
}

// Initialize on page load
loadSessionData();

function displayData(index) {
    if (index < 0 || index >= data.length) return;

    const item = data[index];
    
    // Generate random assignment for this item if not already done
    if (!noteMapping[item.index]) {
        noteMapping[item.index] = Math.random() < 0.5 ? 'community_first' : 'llm_first';
    }
    
    // Update image
    const imagePath = `data/img/post${item.index}.png`;
    document.getElementById('postImage').src = imagePath;
    document.getElementById('postImage').onerror = function() {
        this.src = '';
        this.alt = 'Image not found';
    };

    // Assign notes to A/B based on random mapping
    const isCommunityFirst = noteMapping[item.index] === 'community_first';
    
    if (isCommunityFirst) {
        // Community Note = Note A, LLM Note = Note B
        document.getElementById('noteAContent').textContent = item.community_notes;
        document.getElementById('noteBContent').textContent = item.LLM_notes;
    } else {
        // LLM Note = Note A, Community Note = Note B
        document.getElementById('noteAContent').textContent = item.LLM_notes;
        document.getElementById('noteBContent').textContent = item.community_notes;
    }

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
    const noteARadios = document.querySelectorAll('input[name="community_helpfulness"]');
    noteARadios.forEach(radio => radio.checked = false);
    
    const noteBRadios = document.querySelectorAll('input[name="llm_helpfulness"]');
    noteBRadios.forEach(radio => radio.checked = false);
    
    // Reset all Likert scale options
    const likertRadios = document.querySelectorAll('input[type="radio"][name*="_source_quality"], input[type="radio"][name*="_clarity"], input[type="radio"][name*="_coverage"], input[type="radio"][name*="_context"], input[type="radio"][name*="_impartiality"]');
    likertRadios.forEach(radio => radio.checked = false);
    
    // Reset comparison question
    const comparisonRadios = document.querySelectorAll('input[name="note_comparison"]');
    comparisonRadios.forEach(radio => radio.checked = false);
    
    // 恢复用户之前的选择（如果存在）
    const postIndex = item.index;
    const savedResponse = userResponses[postIndex];
    if (savedResponse) {
        const isCommunityFirst = savedResponse.noteMapping === 'community_first';
        
        // 恢复有用性选择
        if (savedResponse.communityNote.helpfulness) {
            const helpfulness = savedResponse.communityNote.helpfulness;
            // 根据mapping确定应该选中哪个radio button
            const radioName = isCommunityFirst ? "community_helpfulness" : "llm_helpfulness";
            const radio = document.querySelector(`input[name="${radioName}"][value="${helpfulness}"]`);
            if (radio) radio.checked = true;
        }
        if (savedResponse.llmNote.helpfulness) {
            const helpfulness = savedResponse.llmNote.helpfulness;
            // 根据mapping确定应该选中哪个radio button
            const radioName = isCommunityFirst ? "llm_helpfulness" : "community_helpfulness";
            const radio = document.querySelector(`input[name="${radioName}"][value="${helpfulness}"]`);
            if (radio) radio.checked = true;
        }
        
        // 恢复详细评分选择 - Community Note
        Object.keys(savedResponse.communityNote.details).forEach(dimension => {
            const value = savedResponse.communityNote.details[dimension];
            if (value) {
                const radioName = isCommunityFirst ? `community_${dimension}` : `llm_${dimension}`;
                const radio = document.querySelector(`input[name="${radioName}"][value="${value}"]`);
                if (radio) radio.checked = true;
            }
        });
        
        // 恢复详细评分选择 - LLM Note
        Object.keys(savedResponse.llmNote.details).forEach(dimension => {
            const value = savedResponse.llmNote.details[dimension];
            if (value) {
                const radioName = isCommunityFirst ? `llm_${dimension}` : `community_${dimension}`;
                const radio = document.querySelector(`input[name="${radioName}"][value="${value}"]`);
                if (radio) radio.checked = true;
            }
        });
        
        // 恢复比较选择
        if (savedResponse.comparison) {
            // 将实际的笔记类型转换回note_a/note_b
            let radioValue;
            if (savedResponse.comparison === 'community_note') {
                radioValue = isCommunityFirst ? 'note_a' : 'note_b';
            } else if (savedResponse.comparison === 'llm_note') {
                radioValue = isCommunityFirst ? 'note_b' : 'note_a';
            }
            
            if (radioValue) {
                const comparisonRadio = document.querySelector(`input[name="note_comparison"][value="${radioValue}"]`);
                if (comparisonRadio) comparisonRadio.checked = true;
            }
        }
    }
    
    // Reset collapsible state (default collapsed)
    const collapsibleContents = document.querySelectorAll('.collapsible-content');
    const collapsibleHeaders = document.querySelectorAll('.collapsible-header');
    collapsibleContents.forEach(content => content.classList.remove('show'));
    collapsibleHeaders.forEach(header => header.classList.remove('active'));
    
    // 滚动到页面顶部
    window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
    });
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

// 可选：自动保存当前页面的数据到后端（实时保存）
async function autoSaveCurrentResponse() {
    try {
        if (!sessionId || !data[currentIndex]) return;
        
        const item = data[currentIndex];
        const postIndex = item.index;
        const currentResponse = userResponses[postIndex];
        if (!currentResponse) return;
        
        const saveData = {
            itemIndex: currentIndex,
            postIndex: postIndex,
            timestamp: new Date().toISOString(),
            responses: currentResponse
        };
        
        // 发送到后端（可选功能）
        await fetch(`/api/session/${sessionId}/response`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(saveData)
        });
        
        console.log(`Auto-saved response for question ${currentIndex + 1} (post ${postIndex})`);
    } catch (error) {
        console.warn('Auto-save failed:', error);
    }
}

// Keyboard shortcut support
document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowLeft') {
        previousPage();
    } else if (e.key === 'ArrowRight') {
        nextPage();
    } else if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
        // F12 或 Ctrl+Shift+I 时显示所有收集的数据（调试用）
        console.log('=== All User Response Data ===');
        console.log('userResponses:', userResponses);
        console.log('noteMapping:', noteMapping);
        console.log('Current question index:', currentIndex);
        console.log('Total questions:', data.length);
    }
});

// Handle radio button change
function handleRadioChange(radio, noteType) {
    const item = data[currentIndex];
    const isCommunityFirst = noteMapping[item.index] === 'community_first';
    
    // Determine actual note type (community or LLM) based on mapping
    let actualNoteType;
    if (noteType === 'community') {
        actualNoteType = isCommunityFirst ? 'community' : 'llm';
    } else {
        actualNoteType = isCommunityFirst ? 'llm' : 'community';
    }
    
    // 保存用户选择到对应的实际笔记类型
    const responseData = getCurrentResponseData();
    if (responseData) {
        if (actualNoteType === 'community') {
            responseData.communityNote.helpfulness = radio.value;
        } else {
            responseData.llmNote.helpfulness = radio.value;
        }
        responseData.timestamp = new Date().toISOString(); // 更新时间戳
    }
    
    console.log(`Selected: ${radio.value} for Note ${noteType === 'community' ? 'A' : 'B'} (actually ${actualNoteType}), post index: ${item.index}`);
    console.log('Current response data:', getCurrentResponseData());
}

// Handle Likert scale change
function handleLikertChange(radio, noteType, dimension) {
    const item = data[currentIndex];
    const isCommunityFirst = noteMapping[item.index] === 'community_first';
    
    // Determine actual note type (community or LLM) based on mapping
    let actualNoteType;
    if (noteType === 'community') {
        actualNoteType = isCommunityFirst ? 'community' : 'llm';
    } else {
        actualNoteType = isCommunityFirst ? 'llm' : 'community';
    }
    
    // 保存用户选择到对应的实际笔记类型
    const responseData = getCurrentResponseData();
    if (responseData) {
        if (actualNoteType === 'community') {
            responseData.communityNote.details[dimension] = radio.value;
        } else {
            responseData.llmNote.details[dimension] = radio.value;
        }
        responseData.timestamp = new Date().toISOString(); // 更新时间戳
    }
    
    console.log(`Likert: ${radio.value} for Note ${noteType === 'community' ? 'A' : 'B'} (actually ${actualNoteType}), dimension: ${dimension}, post index: ${item.index}`);
    console.log('Current response data:', getCurrentResponseData());
}

// Handle comparison choice change
function handleComparisonChange(radio) {
    const item = data[currentIndex];
    const isCommunityFirst = noteMapping[item.index] === 'community_first';
    
    // 将note_a/note_b转换为实际的笔记类型
    let actualNoteType;
    if (radio.value === 'note_a') {
        actualNoteType = isCommunityFirst ? 'community_note' : 'llm_note';
    } else if (radio.value === 'note_b') {
        actualNoteType = isCommunityFirst ? 'llm_note' : 'community_note';
    }
    
    // 保存用户选择（保存实际的笔记类型）
    const responseData = getCurrentResponseData();
    if (responseData) {
        responseData.comparison = actualNoteType;
        responseData.timestamp = new Date().toISOString(); // 更新时间戳
    }
    
    console.log(`Comparison: ${radio.value} selected (actually ${actualNoteType}), post index: ${item.index}`);
    console.log('Current response data:', getCurrentResponseData());
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
async function submitData() {
    try {
        if (!sessionId) {
            alert('No active session found.');
            return;
        }
        
        // 准备提交的数据，只包含用户响应和基本信息
        const submissionData = {
            userResponses: userResponses,
            completionTime: new Date().toISOString(),
            totalItems: data.length,
            sessionSummary: {
                evaluatedPosts: Object.keys(userResponses).length,
                startTime: localStorage.getItem('sessionStartTime') || 'unknown'
            }
        };
        
        console.log('Submitting data:', submissionData);
        
        // Submit to backend
        const response = await fetch(`/api/session/${sessionId}/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(submissionData)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('Data submitted successfully:', result);
            
            // Clear session data
            localStorage.removeItem('sessionId');
            localStorage.removeItem('sessionStartTime');
            
            // Redirect to completion page
            window.location.href = 'completion.html';
        } else {
            const errorData = await response.json();
            alert(`Error submitting data: ${errorData.error}`);
        }
        
    } catch (error) {
        console.error('Error submitting data:', error);
        alert('Failed to submit data. Please try again.');
    }
}