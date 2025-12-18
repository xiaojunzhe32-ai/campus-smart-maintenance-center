import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Upload,
  message
} from 'antd';
import {
  UploadOutlined
} from '@ant-design/icons';
import { repairService } from '../services/repairService';

const { Option } = Select;
const { TextArea } = Input;

const CreateRepairPage = ({ currentUser, onSubmitSuccess }) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // 处理文件上传
  const handleUploadChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  // 处理文件删除
  const handleRemove = (file) => {
    const newFileList = fileList.filter(item => item.uid !== file.uid);
    setFileList(newFileList);
  };

  // 处理表单提交
  const handleFormSubmit = async (values) => {
    setSubmitting(true);
    try {
      // 创建一个包含所有字段的对象
      const orderData = {
        ...values,
        studentId: currentUser?.studentID,
        locationText: values.location,
        categoryId: getCategoryID(values.category)
      };

      console.log('提交的报修数据:', orderData);
      
      // 调用服务创建报修
      const newOrder = await repairService.createRepairOrder(orderData, fileList);
      console.log('创建报修成功:', newOrder);
      
      message.success('报修申请提交成功！');
      
      // 重置表单
      form.resetFields();
      setFileList([]);
      
      // 通知父组件刷新数据
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (error) {
      console.error('提交报修申请失败:', error);
      message.error('提交报修申请失败，请重试！');
    } finally {
      setSubmitting(false);
    }
  };

  // 获取分类ID
  const getCategoryID = (category) => {
    const categoryMap = {
      waterAndElectricity: 1,
      networkIssues: 2,
      furnitureRepair: 3,
      applianceIssues: 4,
      publicFacilities: 5
    };
    return categoryMap[category] || 1;
  };

  // 上传组件配置
  const uploadProps = {
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('只能上传图片文件!');
        return Upload.LIST_IGNORE;
      }
      
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('图片大小不能超过5MB!');
        return Upload.LIST_IGNORE;
      }
      
      return false;
    },
    fileList,
    onChange: handleUploadChange,
    onRemove: handleRemove,
    multiple: true,
    accept: 'image/*',
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        height: "100%", // 确保容器高度充满父容器
        overflow: "hidden", // 隐藏外部滚动条
      }}
    >
      <Card
        title="创建报修申请"
        style={{
          width: "100%",
          maxWidth: "800px",
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
          height: "100%", // 卡片高度充满容器
          display: "flex",
          flexDirection: "column",
        }}
        headStyle={{ 
          fontSize: "20px", 
          fontWeight: "bold",
          flexShrink: 0, // 防止标题区域被压缩
        }}
        styles={{ body: {
          flex: 1, // 表单区域占据剩余空间
          overflowY: "auto", // 添加垂直滚动
          padding: "16px 24px", // 保持原有内边距
        }}}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          autoComplete="off"
          style={{
            minHeight: "min-content", // 确保表单有最小高度
          }}
        >
          <Form.Item
            label="报修标题"
            name="title"
            rules={[{ required: true, message: "请输入报修标题!" }]}
          >
            <Input placeholder="请输入报修标题" size="large" />
          </Form.Item>

          <Form.Item
            label="报修分类"
            name="category"
            rules={[{ required: true, message: "请选择报修分类!" }]}
          >
            <Select placeholder="请选择报修分类" size="large">
              <Option value="waterAndElectricity">水电维修</Option>
              <Option value="networkIssues">网络故障</Option>
              <Option value="furnitureRepair">家具维修</Option>
              <Option value="applianceIssues">电器故障</Option>
              <Option value="publicFacilities">公共设施</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="具体位置"
            name="location"
            rules={[{ required: true, message: "请输入具体位置!" }]}
          >
            <Input placeholder="例如：3栋502寝室" size="large" />
          </Form.Item>

          <Form.Item
            label="问题描述"
            name="description"
            rules={[{ required: true, message: "请输入问题描述!" }]}
          >
            <TextArea
              rows={6}
              placeholder="请详细描述您遇到的问题..."
              maxLength={500}
              showCount
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="紧急程度"
            name="priority"
            rules={[{ required: true, message: '请选择紧急程度!' }]}
            initialValue="low"
          >
            <Select placeholder="请选择紧急程度" size="large">
              <Option value="low">低</Option>
              <Option value="medium">中</Option>
              <Option value="high">高</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="上传相关图片"
            extra="支持上传多张图片，每张图片大小不超过5MB"
          >
            <Upload
              {...uploadProps}
              listType="picture"
              showUploadList={{
                showPreviewIcon: true,
                showRemoveIcon: true,
              }}
            >
              <Button icon={<UploadOutlined />}>选择图片</Button>
            </Upload>
          </Form.Item>

          <Form.Item
            style={{
              textAlign: "center",
              marginTop: "32px",
              marginBottom: 0, // 移除底部边距
              flexShrink: 0, // 防止按钮区域被压缩
            }}
          >
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={submitting}
              style={{
                width: "150px",
                height: "40px",
                marginRight: "16px",
              }}
            >
              提交报修申请
            </Button>
            <Button
              size="large"
              style={{
                width: "100px",
                height: "40px",
              }}
              onClick={() => {
                form.resetFields();
                setFileList([]);
              }}
            >
              重置
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CreateRepairPage;