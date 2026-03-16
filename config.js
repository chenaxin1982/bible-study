// ================================
// 圣经共同追求 - 配置文件
// ================================

const CONFIG = {
    // GitHub 仓库信息
    github: {
        owner: 'chenaxin1982',
        repo: 'bible-study',
        token: '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'
    },
    
    // 用户管理
    users: {
        // 管理员账户
        'admin': {
            password: '12345678',
            role: 'admin',
            name: '管理员'
        },
        // 普通用户账户
        '张三': {
            password: '12345678',
            role: 'user',
            name: '张三'
        },
        '李四': {
            password: '12345678',
            role: 'user',
            name: '李四'
        },
        '王五': {
            password: '12345678',
            role: 'user',
            name: '王五'
        },
        '赵六': {
            password: '12345678',
            role: 'user',
            name: '赵六'
        }
    },
    
    // 网站信息
    site: {
        name: '圣经共同追求',
        description: '马太福音中所启示包罗万有的基督'
    }
};

// ================================
// 用户管理函数
// ================================

// 验证登录
function validateLogin(username, password) {
    if (!CONFIG.users[username]) {
        return { success: false, message: '用户名不存在' };
    }
    
    const user = CONFIG.users[username];
    if (user.password !== password) {
        return { success: false, message: '密码错误' };
    }
    
    return {
        success: true,
        user: {
            username: username,
            name: user.name,
            role: user.role
        }
    };
}

// 检查是否是管理员
function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'admin';
}

// 获取当前用户
function getCurrentUser() {
    try {
        const userStr = localStorage.getItem('currentUser');
        return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
        return null;
    }
}

// 保存用户到 localStorage
function saveUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('loginTime', new Date().toISOString());
}

// 退出登录
function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('loginTime');
    window.location.href = 'login.html';
}

// 添加新用户（管理员专用）
function addUser(username, password, name, role = 'user') {
    if (!isAdmin()) {
        return { success: false, message: '权限不足' };
    }
    
    if (CONFIG.users[username]) {
        return { success: false, message: '用户已存在' };
    }
    
    CONFIG.users[username] = {
        password: password,
        role: role,
        name: name
    };
    
    // 保存到 localStorage（实际应该保存到后端）
    const usersKey = 'custom_users';
    const customUsers = JSON.parse(localStorage.getItem(usersKey) || '{}');
    customUsers[username] = CONFIG.users[username];
    localStorage.setItem(usersKey, JSON.stringify(customUsers));
    
    return { success: true, message: '用户添加成功' };
}

// 获取所有用户列表（管理员专用）
function getAllUsers() {
    if (!isAdmin()) {
        return [];
    }
    
    // 合并默认用户和自定义用户
    const customUsers = JSON.parse(localStorage.getItem('custom_users') || '{}');
    return {
        ...CONFIG.users,
        ...customUsers
    };
}

// 删除用户（管理员专用）
function deleteUser(username) {
    if (!isAdmin()) {
        return { success: false, message: '权限不足' };
    }
    
    if (username === 'admin') {
        return { success: false, message: '不能删除管理员账户' };
    }
    
    const customUsers = JSON.parse(localStorage.getItem('custom_users') || '{}');
    if (customUsers[username]) {
        delete customUsers[username];
        localStorage.setItem('custom_users', JSON.stringify(customUsers));
        return { success: true, message: '用户删除成功' };
    }
    
    return { success: false, message: '用户不存在' };
}

// 修改用户密码（管理员专用）
function changeUserPassword(username, newPassword) {
    if (!isAdmin()) {
        return { success: false, message: '权限不足' };
    }
    
    const customUsers = JSON.parse(localStorage.getItem('custom_users') || '{}');
    if (CONFIG.users[username]) {
        // 修改默认用户
        CONFIG.users[username].password = newPassword;
        // 同步到自定义用户
        customUsers[username] = CONFIG.users[username];
        localStorage.setItem('custom_users', JSON.stringify(customUsers));
        return { success: true, message: '密码修改成功' };
    } else if (customUsers[username]) {
        customUsers[username].password = newPassword;
        localStorage.setItem('custom_users', JSON.stringify(customUsers));
        return { success: true, message: '密码修改成功' };
    }
    
    return { success: false, message: '用户不存在' };
}
