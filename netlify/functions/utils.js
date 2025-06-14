// 获取当前域名的工具函数
function getBaseUrl() {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  } else if (process && process.env && process.env.URL) {
    return process.env.URL;
  } else {
    return 'http://localhost:8888'; // fallback for local dev
  }
}

// 验证邮箱格式
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 验证密码强度
function isValidPassword(password) {
  return password && password.length >= 6;
}

// 验证用户名
function isValidUsername(username) {
  return username && username.length >= 2 && /^[a-zA-Z0-9_]+$/.test(username);
}

// 生成随机字符串
function generateRandomString(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 格式化错误响应
function formatErrorResponse(error, statusCode = 500) {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ error: error.message || error })
  };
}

// 格式化成功响应
function formatSuccessResponse(data, statusCode = 200) {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  };
}

module.exports = {
  getBaseUrl,
  isValidEmail,
  isValidPassword,
  isValidUsername,
  generateRandomString,
  formatErrorResponse,
  formatSuccessResponse
};