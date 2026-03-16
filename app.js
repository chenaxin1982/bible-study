// ================================
// 圣经共同追求 - 主逻辑文件
// ================================

/**
 * 检查登录状态
 */
function checkLoginStatus() {
    const loggedIn = localStorage.getItem('loggedIn');
    const username = localStorage.getItem('username');
    const loginStatusEl = document.getElementById('loginStatus');
    const welcomeMsgEl = document.getElementById('welcomeMsg');
    
    if (loggedIn === 'true' && username) {
        if (loginStatusEl) {
            loginStatusEl.style.display = 'flex';
        }
        if (welcomeMsgEl) {
            welcomeMsgEl.textContent = `欢迎，${username}`;
        }
    } else {
        if (loginStatusEl) {
            loginStatusEl.style.display = 'none';
        }
    }
}

/**
 * 退出登录
 */
function logout() {
    if (confirm('确定要退出登录吗？')) {
        localStorage.removeItem('loggedIn');
        localStorage.removeItem('username');
        localStorage.removeItem('loginTime');
        window.location.href = 'index.html';
    }
}

/**
 * 创建 GitHub Issue（用于打卡）
 * @param {string} title - Issue 标题
 * @param {string} body - Issue 内容
 * @param {Array<string>} labels - 标签列表
 * @returns {Promise<object|null>}
 */
async function createGitHubIssue(title, body, labels = []) {
    const { owner, repo, token } = CONFIG.github;
    
    if (token === 'YOUR_TOKEN_HERE') {
        alert('配置错误：请先在 js/config.js 中配置 GitHub Token');
        return null;
    }
    
    const url = `https://api.github.com/repos/${owner}/${repo}/issues`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                title: title,
                body: body,
                labels: labels
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            console.error('GitHub API 错误:', error);
            throw new Error(error.message || '创建 Issue 失败');
        }
        
        const data = await response.json();
        console.log('Issue 创建成功:', data.html_url);
        return data;
        
    } catch (error) {
        console.error('创建 Issue 失败:', error);
        throw error;
    }
}

/**
 * 获取 GitHub Issues 列表
 * @param {object} options - 查询选项
 * @returns {Promise<Array>}
 */
async function getGitHubIssues(options = {}) {
    const { owner, repo, token } = CONFIG.github;
    
    if (token === 'YOUR_TOKEN_HERE') {
        console.warn('未配置 GitHub Token，返回空数据');
        return [];
    }
    
    let url = `https://api.github.com/repos/${owner}/${repo}/issues?state=all&per_page=100`;
    
    // 添加筛选条件
    if (options.labels) {
        url += `&labels=${options.labels.join(',')}`;
    }
    
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!response.ok) {
            throw new Error('获取 Issues 失败');
        }
        
        const data = await response.json();
        return data;
        
    } catch (error) {
        console.error('获取 Issues 失败:', error);
        return [];
    }
}

/**
 * 获取单个 Issue
 * @param {number} issueNumber - Issue 编号
 * @returns {Promise<object|null>}
 */
async function getGitHubIssue(issueNumber) {
    const { owner, repo, token } = CONFIG.github;
    
    const url = `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!response.ok) {
            throw new Error('获取 Issue 失败');
        }
        
        return await response.json();
        
    } catch (error) {
        console.error('获取 Issue 失败:', error);
        return null;
    }
}

/**
 * 计算连续打卡天数
 * @param {Array} checkins - 打卡记录列表
 * @returns {number}
 */
function calculateStreak(checkins) {
    if (!checkins || checkins.length === 0) return 0;
    
    // 按日期排序
    const dates = checkins
        .map(c => new Date(c.created_at || c.date))
        .sort((a, b) => b - a);
    
    if (dates.length === 0) return 0;
    
    let streak = 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 检查是否包含今天或昨天
    const diff = Math.floor((today - dates[0]) / (1000 * 60 * 60 * 24));
    if (diff > 1) return 0; // 断签了
    
    // 计算连续天数
    for (let i = 1; i < dates.length; i++) {
        const dayDiff = Math.floor((dates[i-1] - dates[i]) / (1000 * 60 * 60 * 24));
        if (dayDiff === 1) {
            streak++;
        } else if (dayDiff > 1) {
            break;
        }
    }
    
    return streak;
}

/**
 * 计算最长连续打卡天数
 * @param {Array} checkins - 打卡记录列表
 * @returns {number}
 */
function calculateLongestStreak(checkins) {
    if (!checkins || checkins.length === 0) return 0;
    
    const dates = checkins
        .map(c => new Date(c.created_at || c.date))
        .sort((a, b) => b - a);
    
    let maxStreak = 1;
    let currentStreak = 1;
    
    for (let i = 1; i < dates.length; i++) {
        const dayDiff = Math.floor((dates[i] - dates[i-1]) / (1000 * 60 * 60 * 24));
        
        if (dayDiff === 1) {
            currentStreak++;
            maxStreak = Math.max(maxStreak, currentStreak);
        } else if (dayDiff > 1) {
            currentStreak = 1;
        }
    }
    
    return maxStreak;
}

/**
 * 格式化日期
 * @param {string|Date} date - 日期
 * @param {string} format - 格式
 * @returns {string}
 */
function formatDate(date, format = 'YYYY-MM-DD') {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    if (format === 'YYYY-MM-DD') {
        return `${year}-${month}-${day}`;
    } else if (format === 'YYYY-MM') {
        return `${year}-${month}`;
    } else if (format === 'MM-DD') {
        return `${month}-${day}`;
    }
    
    return d.toLocaleDateString('zh-CN');
}

/**
 * 显示加载提示
 * @param {string} elementId - 元素 ID
 * @param {string} message - 提示信息
 */
function showLoading(elementId, message = '加载中...') {
    const el = document.getElementById(elementId);
    if (el) {
        el.innerHTML = `<div class="loading">${message}</div>`;
    }
}

/**
 * 显示错误提示
 * @param {string} elementId - 元素 ID
 * @param {string} message - 错误信息
 */
function showError(elementId, message = '加载失败') {
    const el = document.getElementById(elementId);
    if (el) {
        el.innerHTML = `<div class="error">${message}</div>`;
    }
}

/**
 * 显示空状态
 * @param {string} elementId - 元素 ID
 * @param {string} message - 提示信息
 */
function showEmpty(elementId, message = '暂无数据') {
    const el = document.getElementById(elementId);
    if (el) {
        el.innerHTML = `<div class="empty">${message}</div>`;
    }
}

// 导出函数（如果需要模块化）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        checkLoginStatus,
        logout,
        createGitHubIssue,
        getGitHubIssues,
        getGitHubIssue,
        calculateStreak,
        calculateLongestStreak,
        formatDate,
        showLoading,
        showError,
        showEmpty
    };
}
