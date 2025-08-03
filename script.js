let data = [];
let currentIndex = 0;

// 加载数据
fetch('data/pilot_1_1.json')
    .then(response => response.json())
    .then(jsonData => {
        data = jsonData;
        document.getElementById('totalPages').textContent = data.length;
        displayData(currentIndex);
    })
    .catch(error => {
        console.error('Error loading data:', error);
        alert('加载数据失败，请刷新页面重试');
    });

function displayData(index) {
    if (index < 0 || index >= data.length) return;

    const item = data[index];
    
    // 更新图片
    const imagePath = `data/img/post${item.index}.png`;
    document.getElementById('postImage').src = imagePath;
    document.getElementById('postImage').onerror = function() {
        this.src = '';
        this.alt = '图片未找到';
    };

    // 更新文本内容
    document.getElementById('postIndex').textContent = item.index;
    document.getElementById('tweetId').textContent = item.tweet_id;
    document.getElementById('postText').textContent = item.post;
    document.getElementById('communityNote').textContent = item.community_notes;
    document.getElementById('llmNote').textContent = item.LLM_notes;
    
    // 更新标签
    const label = document.getElementById('label');
    label.textContent = `标签: ${item.label}`;
    label.className = 'label label-' + item.label;

    // 更新页码
    document.getElementById('currentPage').textContent = index + 1;

    // 更新按钮状态
    document.getElementById('prevBtn').disabled = index === 0;
    document.getElementById('nextBtn').disabled = index === data.length - 1;
    
    // 重置所有单选框
    const communityRadios = document.querySelectorAll('input[name="community_helpfulness"]');
    communityRadios.forEach(radio => radio.checked = false);
    
    const llmRadios = document.querySelectorAll('input[name="llm_helpfulness"]');
    llmRadios.forEach(radio => radio.checked = false);
    
    // 重置所有Likert量表选项
    const likertRadios = document.querySelectorAll('input[type="radio"][name*="_source_quality"], input[type="radio"][name*="_clarity"], input[type="radio"][name*="_coverage"], input[type="radio"][name*="_context"], input[type="radio"][name*="_impartiality"]');
    likertRadios.forEach(radio => radio.checked = false);
    
    // 重置比较选择问题
    const comparisonRadios = document.querySelectorAll('input[name="note_comparison"]');
    comparisonRadios.forEach(radio => radio.checked = false);
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

// 键盘快捷键支持
document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowLeft') {
        previousPage();
    } else if (e.key === 'ArrowRight') {
        nextPage();
    }
});

// 处理单选框变化
function handleRadioChange(radio, noteType) {
    // 目前只是简单记录选择，不做存储
    console.log(`Selected: ${radio.value} for ${noteType} note, item index: ${data[currentIndex].index}`);
}

// 处理Likert量表变化
function handleLikertChange(radio, noteType, dimension) {
    // 目前只是简单记录选择，不做存储
    console.log(`Likert: ${radio.value} for ${noteType} note, dimension: ${dimension}, item index: ${data[currentIndex].index}`);
}

// 处理比较选择变化
function handleComparisonChange(radio) {
    // 目前只是简单记录选择，不做存储
    console.log(`Comparison: ${radio.value} selected, item index: ${data[currentIndex].index}`);
}