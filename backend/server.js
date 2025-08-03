const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('../frontend')); // 服务前端文件
app.use('/data', express.static('./data')); // 服务数据文件

// 内存中存储用户会话
const userSessions = new Map();

// 存储每个题目被分配的次数，用于均匀分布
const itemAssignmentCount = new Map();

// 存储已使用的用户名（防止重复）
const usedParticipantNames = new Set();

// 每个用户需要评价的题目数量
const ITEMS_PER_USER = 20;

// 加载原始数据
let originalData;
try {
    const dataPath = path.join(__dirname, 'data', 'pilot_1_1.json');
    originalData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log(`从 pilot_1_1.json 加载了 ${originalData.length} 个数据项`);
    
    // 初始化每个题目的分配次数为0
    originalData.forEach(item => {
        itemAssignmentCount.set(item.index, 0);
    });
    
    // 加载已完成的会话中的用户名
    loadExistingUserNames();
} catch (error) {
    console.error('加载数据时出错:', error);
    process.exit(1);
}

// Fisher-Yates 洗牌算法
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// 均匀分布选择算法 - 确保每个题目被分配的次数尽可能平均
function selectBalancedItems(allItems, count) {
    if (count >= allItems.length) {
        // 如果需要的数量大于等于总数，返回所有项目
        return shuffleArray(allItems);
    }
    
    // 创建一个包含每个项目及其被分配次数的数组
    const itemsWithCounts = allItems.map(item => ({
        item: item,
        assignmentCount: itemAssignmentCount.get(item.index) || 0
    }));
    
    // 按分配次数升序排序，次数相同的随机排序
    itemsWithCounts.sort((a, b) => {
        if (a.assignmentCount !== b.assignmentCount) {
            return a.assignmentCount - b.assignmentCount;
        }
        return Math.random() - 0.5; // 随机排序
    });
    
    // 选择前count个项目
    const selectedItems = itemsWithCounts.slice(0, count).map(itemWithCount => itemWithCount.item);
    
    // 更新选中项目的分配次数
    selectedItems.forEach(item => {
        const currentCount = itemAssignmentCount.get(item.index) || 0;
        itemAssignmentCount.set(item.index, currentCount + 1);
    });
    
    // 随机打乱选中的项目顺序
    return shuffleArray(selectedItems);
}

// 生成唯一会话ID
function generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 加载已存在的用户名（从results文件夹）
function loadExistingUserNames() {
    try {
        const resultsDir = path.join(__dirname, 'results');
        if (!fs.existsSync(resultsDir)) {
            console.log('Results文件夹不存在，跳过加载已有用户名');
            return;
        }
        
        const files = fs.readdirSync(resultsDir);
        const sessionFiles = files.filter(file => file.startsWith('session_') && file.endsWith('.json'));
        
        sessionFiles.forEach(filename => {
            try {
                const filepath = path.join(resultsDir, filename);
                const sessionData = JSON.parse(fs.readFileSync(filepath, 'utf8'));
                
                if (sessionData.participantName) {
                    usedParticipantNames.add(sessionData.participantName);
                }
            } catch (error) {
                console.warn(`无法解析文件 ${filename}:`, error.message);
            }
        });
        
        console.log(`从 ${sessionFiles.length} 个结果文件中加载了 ${usedParticipantNames.size} 个已使用的用户名`);
        if (usedParticipantNames.size > 0) {
            console.log('已使用的用户名:', Array.from(usedParticipantNames));
        }
    } catch (error) {
        console.warn('加载已有用户名时出错:', error.message);
    }
}

// API 路由

// 创建新用户会话并随机化数据
app.post('/api/start-session', (req, res) => {
    try {
        const { participantName } = req.body;
        
        if (!participantName || participantName.trim() === '') {
            return res.status(400).json({ error: 'Participant name cannot be empty' });
        }
        
        const trimmedName = participantName.trim();
        
        // 检查用户名是否已被使用
        if (usedParticipantNames.has(trimmedName)) {
            return res.status(409).json({ 
                error: 'This name has already been used. Please use a different name.',
                code: 'DUPLICATE_NAME'
            });
        }
        
        // 检查是否已有活动会话使用此用户名
        for (const [sessionId, session] of userSessions) {
            if (session.participantName === trimmedName) {
                return res.status(409).json({ 
                    error: 'This name is currently in use. Please try again later or use a different name.',
                    code: 'NAME_IN_USE'
                });
            }
        }
        
        const sessionId = generateSessionId();
        const selectedData = selectBalancedItems(originalData, ITEMS_PER_USER);
        
        // 存储会话数据
        userSessions.set(sessionId, {
            participantName: trimmedName,
            data: selectedData,
            startTime: new Date().toISOString(),
            responses: [],
            currentIndex: 0 // 总是从第一题开始
        });
        
        console.log(`为 ${trimmedName} 创建新会话 (ID: ${sessionId})，分配了 ${selectedData.length} 个题目`);
        
        res.json({
            sessionId,
            totalItems: selectedData.length,
            message: 'Session created successfully'
        });
        
    } catch (error) {
        console.error('创建会话时出错:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 获取特定会话的数据
app.get('/api/session/:sessionId/data', (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = userSessions.get(sessionId);
        
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        res.json({
            data: session.data,
            totalItems: session.data.length,
            participantName: session.participantName
        });
        
    } catch (error) {
        console.error('获取会话数据时出错:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 保存用户响应
app.post('/api/session/:sessionId/response', (req, res) => {
    try {
        const { sessionId } = req.params;
        const { itemIndex, responses } = req.body;
        const session = userSessions.get(sessionId);
        
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        // 保存响应
        const responseData = {
            itemIndex,
            originalIndex: session.data[itemIndex].index,
            timestamp: new Date().toISOString(),
            responses
        };
        
        session.responses.push(responseData);
        session.currentIndex = Math.max(session.currentIndex, itemIndex + 1);
        
        console.log(`为会话 ${sessionId} 保存了第 ${itemIndex} 项的响应`);
        
        res.json({ message: 'Response saved successfully' });
        
    } catch (error) {
        console.error('保存响应时出错:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 提交最终数据
app.post('/api/session/:sessionId/submit', (req, res) => {
    try {
        const { sessionId } = req.params;
        const { userResponses, completionTime, totalItems, sessionSummary } = req.body;
        const session = userSessions.get(sessionId);
        
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        // 创建最终保存的数据结构（不包含原始数据）
        const finalData = {
            participantName: session.participantName,
            sessionId: sessionId,
            startTime: session.startTime,
            completionTime: completionTime || new Date().toISOString(),
            totalItemsAssigned: totalItems || session.data.length,
            sessionSummary: sessionSummary || {
                evaluatedPosts: Object.keys(userResponses || {}).length,
                startTime: session.startTime
            },
            userResponses: userResponses || {}
        };
        
        // 保存会话数据至文件
        const resultsDir = path.join(__dirname, 'results');
        if (!fs.existsSync(resultsDir)) {
            fs.mkdirSync(resultsDir);
        }
        
        const filename = `session_${sessionId}_${session.participantName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}.json`;
        const filepath = path.join(resultsDir, filename);
        
        fs.writeFileSync(filepath, JSON.stringify(finalData, null, 2));
        
        console.log(`会话 ${sessionId} 已完成并保存至 ${filename}`);
        
        // 将用户名标记为已使用
        usedParticipantNames.add(session.participantName);
        console.log(`用户名 "${session.participantName}" 已标记为已使用`);
        
        // 延迟清理内存中的会话
        setTimeout(() => {
            userSessions.delete(sessionId);
            console.log(`会话 ${sessionId} 已从内存中清理`);
        }, 60000); // 1分钟后清理
        
        res.json({ 
            message: 'Data submitted successfully',
            filename
        });
        
    } catch (error) {
        console.error('提交数据时出错:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 获取会话统计信息（用于调试）
app.get('/api/stats', (req, res) => {
    // 计算题目分配统计
    const assignmentStats = {};
    let totalAssignments = 0;
    let minAssignments = Infinity;
    let maxAssignments = 0;
    
    itemAssignmentCount.forEach((count, itemIndex) => {
        assignmentStats[itemIndex] = count;
        totalAssignments += count;
        minAssignments = Math.min(minAssignments, count);
        maxAssignments = Math.max(maxAssignments, count);
    });
    
    // 如果没有任何分配，重置最小值
    if (totalAssignments === 0) {
        minAssignments = 0;
    }
    
    res.json({
        activeSessions: userSessions.size,
        totalDataItems: originalData.length,
        itemsPerUser: ITEMS_PER_USER,
        totalAssignments: totalAssignments,
        averageAssignmentsPerItem: totalAssignments / originalData.length,
        minAssignmentsPerItem: minAssignments,
        maxAssignmentsPerItem: maxAssignments,
        assignmentBalance: maxAssignments - minAssignments,
        usedParticipantNames: Array.from(usedParticipantNames),
        totalCompletedSessions: usedParticipantNames.size,
        uptime: process.uptime(),
        assignmentStats: assignmentStats
    });
});

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`已加载 ${originalData.length} 个数据项`);
    console.log('API 端点:');
    console.log('  POST /api/start-session - 创建新用户会话');
    console.log('  GET  /api/session/:id/data - 获取会话的随机化数据');
    console.log('  POST /api/session/:id/response - 保存用户响应');
    console.log('  POST /api/session/:id/submit - 提交最终数据');
    console.log('  GET  /api/stats - 获取服务器统计信息');
});

module.exports = app;