# Netlify Functions API 文档

本项目将用户认证功能重构为独立的 Netlify Functions，提供更清晰的 API 结构和更好的维护性。

## API 端点

### 1. 用户登录
**端点**: `/.netlify/functions/login`  
**方法**: `POST`  
**Content-Type**: `application/json`

#### 请求体
```json
{
  "email": "user@example.com",
  "password": "userpassword"
}
```

#### 成功响应 (200)
```json
{
  "message": "登录成功",
  "user": {
    "id": 1,
    "username": "username",
    "email": "user@example.com",
    "name": "用户姓名"
  },
  "token": "jwt_token_here"
}
```

#### 错误响应
- `400`: 请求参数错误
- `401`: 邮箱或密码错误
- `500`: 服务器内部错误

### 2. 用户注册
**端点**: `/.netlify/functions/register`  
**方法**: `POST`  
**Content-Type**: `application/json`

#### 请求体
```json
{
  "name": "用户姓名",
  "username": "username",
  "email": "user@example.com",
  "password": "userpassword"
}
```

#### 成功响应 (201)
```json
{
  "message": "注册成功",
  "user": {
    "id": 1,
    "username": "username",
    "email": "user@example.com",
    "name": "用户姓名"
  },
  "token": "jwt_token_here"
}
```

#### 错误响应
- `400`: 请求参数错误（缺少必填字段、格式不正确等）
- `409`: 邮箱或用户名已存在
- `500`: 服务器内部错误

### 3. Token 验证
**端点**: `/.netlify/functions/verify-token`  
**方法**: `POST`  
**Headers**: `Authorization: Bearer <token>`

#### 成功响应 (200)
```json
{
  "valid": true,
  "user": {
    "id": 1,
    "username": "username",
    "email": "user@example.com",
    "name": "用户姓名"
  }
}
```

#### 错误响应
- `401`: Token 无效或已过期
- `500`: 服务器内部错误

## 环境变量

确保在 Netlify 环境中设置以下环境变量：

```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
JWT_SECRET=your_jwt_secret_key
```

## 数据库结构

### users 表
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 安全特性

1. **密码加密**: 使用 bcryptjs 进行密码哈希，盐值轮数为 12
2. **JWT Token**: 使用 jsonwebtoken 生成和验证 JWT，有效期 7 天
3. **输入验证**: 对所有输入进行严格验证
4. **CORS 支持**: 支持跨域请求
5. **错误处理**: 统一的错误处理和响应格式

## 迁移说明

### 从旧的 authHandler 迁移

**旧的调用方式**:
```javascript
fetch('/.netlify/functions/authHandler', {
  method: 'POST',
  body: JSON.stringify({
    action: 'login',
    email: 'user@example.com',
    password: 'password'
  })
})
```

**新的调用方式**:
```javascript
fetch('/.netlify/functions/login', {
  method: 'POST',
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password'
  })
})
```

### 主要变化

1. **独立端点**: 每个功能都有独立的端点
2. **简化请求**: 不再需要 `action` 参数
3. **更清晰的职责**: 每个函数只负责一个特定功能
4. **更好的维护性**: 代码更模块化，易于维护和扩展

## 使用示例

### 前端登录示例
```javascript
async function login(email, password) {
  try {
    const response = await fetch('/.netlify/functions/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      // 登录成功处理
    } else {
      // 错误处理
      console.error(data.error);
    }
  } catch (error) {
    console.error('登录失败:', error);
  }
}
```

### 前端注册示例
```javascript
async function register(name, username, email, password) {
  try {
    const response = await fetch('/.netlify/functions/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, username, email, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // 注册成功，可以直接登录或跳转到登录页面
      console.log('注册成功:', data.message);
    } else {
      // 错误处理
      console.error(data.error);
    }
  } catch (error) {
    console.error('注册失败:', error);
  }
}
```