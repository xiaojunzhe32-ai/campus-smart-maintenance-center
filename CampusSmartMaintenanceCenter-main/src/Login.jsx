// Login.jsx
import './Login.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button, Tabs, message, Select } from 'antd';
import backgroundImage from './assets/1001.jpg';
import api from './services/api';

const { Option } = Select;

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState('STUDENT');
    const [activeTab, setActiveTab] = useState('login');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        
        // 添加加载状态，防止重复提交
        const submitButton = e.target.querySelector('button[type="submit"]');
        const originalText = submitButton?.textContent;
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = '登录中...';
        }
        
        try {
            // 添加超时控制（10秒）
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('登录超时，请检查网络连接')), 10000);
            });
            
            const loginPromise = api.auth.login({ userId: username, password });
            const data = await Promise.race([loginPromise, timeoutPromise]);
            
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // 根据用户角色导航到不同页面
            switch(data.user.role) {
                case 'STUDENT':
                    navigate('/stuhome');
                    break;
                case 'STAFF': // 维修工
                    navigate('/workerhome');
                    break;
                case 'ADMIN':
                    navigate('/adminhome');
                    break;
                default:
                    message.error('未知用户角色');
            }
        } catch (error) {
            // 提供更友好的错误提示
            let errorMessage = '登录失败';
            if (error.message.includes('超时')) {
                errorMessage = '登录超时，请检查网络连接后重试';
            } else if (error.message.includes('401') || error.message.includes('密码错误') || error.message.includes('账号不存在')) {
                errorMessage = '用户名或密码错误';
            } else if (error.message.includes('网络') || error.message.includes('fetch')) {
                errorMessage = '网络连接失败，请检查网络后重试';
            } else {
                errorMessage = error.message || '登录失败，请重试';
            }
            message.error(errorMessage);
        } finally {
            // 恢复按钮状态
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalText || '登录';
            }
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            message.error('两次输入的密码不一致');
            return;
        }
        
        try {
            // 使用 api.auth.register，字段名与后端 UserRegisterRequest 对齐
            await api.auth.register({
                userId: username,
                password,
                nickname: name,
                contactPhone: phone,
                role,
            });
            
            message.success('注册成功，请登录');
            setActiveTab('login');
        } catch (error) {
            message.error(error.message || '注册失败');
        }
    };

    return (
        <div className="worker-container" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            minHeight: '100vh',
            backgroundImage: `linear-gradient(rgba(255,255,255,0.5), rgba(255,255,255,0.5)), url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            paddingTop: '100px'
        }}>
            <h1>理工管家——校园报修中心</h1>

            <Tabs 
              activeKey={activeTab} 
              onChange={setActiveTab} 
              centered
              items={[
                {
                  key: 'login',
                  label: '登录',
                  children: (
                    <form onSubmit={handleLogin} style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '15px',
                      backgroundColor: 'rgba(240,242,245,0.85)',
                      padding: '30px',
                      borderRadius: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ minWidth: '70px', textAlign: 'right' }}>用户名:</label>
                        <Input
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="请输入用户名"
                          required
                          style={{ width: 260, boxShadow: '0 5 5px rgba(0,0,0,0.1)' }}
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ minWidth: '70px', textAlign: 'right' }}>密码:</label>
                        <Input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="请输入密码"
                          required
                          style={{ width: 260, boxShadow: '0 5 5px rgba(0,0,0,0.1)' }}
                        />
                      </div>

                      <Button htmlType="submit" type="primary" style={{ padding: '8px 20px' }}>
                        登录
                      </Button>
                    </form>
                  )
                },
                {
                  key: 'register',
                  label: '注册',
                  children: (
                    <form onSubmit={handleRegister} style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '15px',
                      backgroundColor: 'rgba(240,242,245,0.85)',
                      padding: '30px',
                      borderRadius: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ minWidth: '70px', textAlign: 'right' }}>学号/工号:</label>
                        <Input
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="请输入学号或工号"
                          required
                          style={{ width: 260, boxShadow: '0 5 5px rgba(0,0,0,0.1)' }}
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ minWidth: '70px', textAlign: 'right' }}>真实姓名:</label>
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="请输入真实姓名"
                          required
                          style={{ width: 260, boxShadow: '0 5 5px rgba(0,0,0,0.1)' }}
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ minWidth: '70px', textAlign: 'right' }}>手机号:</label>
                        <Input
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="请输入手机号"
                          required
                          style={{ width: 260, boxShadow: '0 5 5px rgba(0,0,0,0.1)' }}
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ minWidth: '70px', textAlign: 'right' }}>角色:</label>
                        <Select
                          value={role}
                          onChange={setRole}
                          style={{ width: 260 }}
                        >
                          <Option value="STUDENT">学生</Option>
                          <Option value="STAFF">维修工</Option>
                          <Option value="ADMIN">管理员</Option>
                        </Select>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ minWidth: '70px', textAlign: 'right' }}>密码:</label>
                        <Input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="请输入密码"
                          required
                          style={{ width: 260, boxShadow: '0 5 5px rgba(0,0,0,0.1)' }}
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ minWidth: '70px', textAlign: 'right' }}>确认密码:</label>
                        <Input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="请再次输入密码"
                          required
                          style={{ width: 260, boxShadow: '0 5 5px rgba(0,0,0,0.1)' }}
                        />
                      </div>

                      <Button htmlType="submit" type="primary" style={{ padding: '8px 20px' }}>
                        注册
                      </Button>
                    </form>
                  )
                }
              ]}
            />
        </div>
    );
}

export default Login;