import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Form, 
  Input, 
  Button, 
  Avatar, 
  message,
  Upload,
  Space
} from 'antd';
import { 
  UserOutlined, 
  EditOutlined,
  UploadOutlined
} from '@ant-design/icons';
// 引入封装好的 API 服务
import api from './api.jsx'; 

const PersonalInfoEd = ({ visible, onCancel, userInfo, onUpdate }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null); // 初始化为 null 而不是空字符串
  // 新增：用于存储用户新选择的头像文件
  const [avatarFile, setAvatarFile] = useState(null);

  // 根据角色获取对应的部门
  const getDepartmentByRole = (role) => {
    const roleDepartmentMap = {
      'STUDENT': '计算机学院',
      'STAFF': '后勤维修部',
      'ADMIN': '系统管理部',
    };
    return roleDepartmentMap[role] || '';
  };

  // 当用户信息或弹窗显示状态变化时，更新表单数据
  useEffect(() => {
    if (visible && userInfo) {
      // 用户名对应数据库sys_user表的name字段（即nickname）
      // 优先使用nickname，因为这是后端UserDto中的字段，对应数据库的name列
      const displayName = userInfo.nickname || userInfo.username || userInfo.name || '';
      
      // 部门根据role自动设置，与role同步
      const userRole = userInfo.role || '';
      const department = getDepartmentByRole(userRole);
      
      form.setFieldsValue({
        username: displayName,
        phone: userInfo.contactPhone || userInfo.phone || '',
        department: department, // 根据role自动设置，不可修改
      });
      // 设置头像 URL，优先使用 avatarUrl，然后是 avatar
      const currentAvatar = userInfo.avatarUrl || userInfo.avatar || null;
      setAvatarUrl(currentAvatar); // 使用 null 而不是空字符串
      setAvatarFile(null); // 重置选中的文件
    }
  }, [visible, userInfo, form]);

  // 处理表单提交
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      let avatarUrlToUpdate = avatarUrl; // 默认使用当前头像 URL
      
      // 🟢 修改点：如果有新选择的头像文件，先上传获取 URL
      if (avatarFile) {
        try {
          const uploadResponse = await api.common.uploadImages([avatarFile]);
          if (uploadResponse && uploadResponse.length > 0 && uploadResponse[0].url) {
            // 后端返回的是相对路径，需要转换为完整 URL（因为后端 @URL 验证要求）
            const uploadedUrl = uploadResponse[0].url;
            // 转换为完整 URL
            avatarUrlToUpdate = uploadedUrl.startsWith('http') 
              ? uploadedUrl 
              : `http://localhost:8080${uploadedUrl.startsWith('/') ? uploadedUrl : '/' + uploadedUrl}`;
            console.log('头像上传成功，URL:', avatarUrlToUpdate);
          } else {
            throw new Error('头像上传失败：未返回有效的 URL');
          }
        } catch (uploadError) {
          console.error('头像上传失败:', uploadError);
          message.error('头像上传失败，请重试');
          return;
        }
      }

      // 🟢 修改点：构建 JSON 格式的更新请求，符合后端 UserUpdateRequest DTO
      // 注意：后端 UserUpdateRequest 要求所有字段都不为空，且 avatarUrl 必须是有效的 URL
      let finalAvatarUrl = avatarUrlToUpdate || userInfo?.avatarUrl || userInfo?.avatar;
      
      // 如果还是没有头像 URL，使用默认值（完整 URL）
      if (!finalAvatarUrl || !finalAvatarUrl.trim()) {
        finalAvatarUrl = 'http://localhost:8080/uploads/default-avatar.png';
      } else {
        // 确保是完整的 URL 格式（后端 @URL 验证要求）
        finalAvatarUrl = finalAvatarUrl.trim();
        if (!finalAvatarUrl.startsWith('http://') && !finalAvatarUrl.startsWith('https://')) {
          // 如果是相对路径，转换为完整 URL
          finalAvatarUrl = finalAvatarUrl.startsWith('/')
            ? `http://localhost:8080${finalAvatarUrl}`
            : `http://localhost:8080/${finalAvatarUrl}`;
        }
        // 确保 URL 格式正确（移除末尾空格等）
        finalAvatarUrl = finalAvatarUrl.trim();
      }
      
      // 验证 URL 格式（简单验证）
      try {
        new URL(finalAvatarUrl);
      } catch (e) {
        console.error('头像 URL 格式无效:', finalAvatarUrl);
        message.error('头像 URL 格式不正确，请重新上传');
        setLoading(false);
        return;
      }
      
      // 构建更新请求，nickname对应数据库sys_user表的name字段
      const updateRequest = {
        nickname: (values.username || userInfo?.nickname || userInfo?.name || '用户').trim(),
        contactPhone: (values.phone || userInfo?.contactPhone || userInfo?.phone || '').trim(),
        avatarUrl: finalAvatarUrl.trim(),
      };

      // 验证必填字段
      if (!updateRequest.nickname || !updateRequest.nickname.trim()) {
        message.error('昵称不能为空');
        setLoading(false);
        return;
      }
      if (!updateRequest.contactPhone || !updateRequest.contactPhone.trim()) {
        message.error('手机号不能为空');
        setLoading(false);
        return;
      }
      if (!updateRequest.avatarUrl || !updateRequest.avatarUrl.trim()) {
        message.error('头像URL不能为空');
        setLoading(false);
        return;
      }
      
      // 验证手机号格式
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(updateRequest.contactPhone)) {
        message.error('手机号格式不正确');
        setLoading(false);
        return;
      }

      console.log('准备发送更新请求:', updateRequest);
      console.log('请求数据序列化:', JSON.stringify(updateRequest));

      // 🟢 修改点：调用真实 API，发送 JSON 格式数据
      // PUT /api/users/me
      try {
        const updatedUser = await api.users.updateMe(updateRequest);
        console.log('更新成功，返回数据:', updatedUser);
        
        // 调用父组件传递的更新函数
        if (onUpdate) {
          onUpdate(updatedUser);
        }
        
        message.success('个人信息更新成功！');
        onCancel(); // 关闭弹窗
      } catch (apiError) {
        console.error('API 调用错误:', apiError);
        // 尝试解析错误信息
        let errorMessage = '更新失败，请重试';
        if (apiError.message) {
          errorMessage = apiError.message;
        } else if (apiError.response) {
          errorMessage = apiError.response.message || errorMessage;
        }
        message.error(errorMessage);
        throw apiError; // 重新抛出以便外部 catch 处理
      }
    } catch (error) {
      console.error('更新个人信息出错:', error);
      // 如果还没有显示错误消息，显示通用错误
      if (!error.message || error.message === '网络错误: Failed to fetch') {
        message.error('网络连接失败，请检查后端服务是否正常运行');
      }
    } finally {
      setLoading(false);
    }
  };

  // 🟢 修改点：头像上传配置
  const uploadProps = {
    name: 'avatar',
    showUploadList: false,
    // 拦截自动上传，改为手动处理
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('只能上传图片文件！');
        return Upload.LIST_IGNORE;
      }

      // 1. 保存文件对象，以便稍后在 handleSubmit 中提交
      setAvatarFile(file);

      // 2. 创建本地预览 URL，让用户能立即看到效果
      const previewUrl = URL.createObjectURL(file);
      setAvatarUrl(previewUrl);

      // 返回 false 阻止 AntD 组件自动发起 POST 请求
      return false;
    },
  };

  // 初始化用户信息（简化，因为部门会根据role自动设置）
  const initialUserInfo = userInfo || {
    username: 'unknown',
    phone: '',
    department: '',
  };

  return (
    <Modal
      title={
        <Space>
          <EditOutlined />
          编辑个人信息
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={600}
      destroyOnHidden={true}
      maskClosable={false}
    >
      <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
        {/* 头像上传区域 */}
        <div style={{ textAlign: 'center' }}>
          <Avatar
            size={80}
            src={avatarUrl && avatarUrl.trim() ? avatarUrl : null}
            icon={(!avatarUrl || !avatarUrl.trim()) && <UserOutlined />}
            style={{ marginBottom: 8 }}
          />
          <Upload {...uploadProps}>
            <Button icon={<UploadOutlined />} size="small">
              更换头像
            </Button>
          </Upload>
        </div>

        {/* 表单区域 */}
        <div style={{ flex: 1 }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={initialUserInfo}
          >
            <Form.Item
              label="用户名"
              name="username"
              rules={[
                { required: true, message: '请输入用户名!' },
                { min: 2, message: '用户名至少2个字符!' }
              ]}
            >
              <Input 
                prefix={<UserOutlined />} 
                placeholder="请输入用户名（对应数据库sys_user表的name字段）"
              />
            </Form.Item>
            
            <Form.Item
              label="手机号"
              name="phone"
              rules={[
                { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码!' }
              ]}
            >
              <Input placeholder="请输入手机号码" />
            </Form.Item>

            <Form.Item
              label="部门"
              name="department"
            >
              <Input 
                placeholder="部门（根据角色自动设置，不可修改）" 
                disabled={true}
                style={{ backgroundColor: '#f5f5f5' }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button onClick={onCancel}>
                  取消
                </Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  保存更改
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </div>
      </div>
    </Modal>
  );
};

export default PersonalInfoEd;