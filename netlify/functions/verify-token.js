const jwt = require('jsonwebtoken')
const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

// JWT密钥，建议在环境变量中设置
const JWT_SECRET = process.env.JWT_SECRET

exports.handler = async function(event, context) {
  // 设置CORS头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  }

  // 处理预检请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    }
  }

  // 只允许POST请求
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: '只允许POST请求' })
    }
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: '未提供有效的认证令牌' })
      }
    }

    const token = authHeader.substring(7) // 移除 'Bearer ' 前缀

    try {
      const decoded = jwt.verify(token, JWT_SECRET)

      // 可选：从数据库验证用户是否仍然存在
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('id, username, email, name')
        .eq('id', decoded.userId)
        .single()

      if (fetchError || !user) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: '用户不存在' })
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          valid: true,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.name
          }
        })
      }
    } catch (jwtError) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: '无效的认证令牌' })
      }
    }
  } catch (error) {
    console.error('Token verification error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: '令牌验证过程中发生错误' })
    }
  }
}