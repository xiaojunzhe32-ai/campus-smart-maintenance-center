import React, { useState, useEffect } from 'react';
import { 
  Table, Tag, Button, Space, Select, Input, 
  Modal, Form, message, Card, Row, Col, Switch 
} from 'antd';
import { 
  SearchOutlined, UserOutlined, CloseOutlined, CheckOutlined 
} from '@ant-design/icons';
import { repairService, repairUtils } from '../Services/repairService';

const { Option } = Select;
const { Search } = Input;

const RepairOrderList = ({ onRefresh }) => {
  const [repairOrders, setRepairOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    keyword: '',
    includeDeleted: false,
  });
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [repairmen, setRepairmen] = useState([]);
  const [assignForm] = Form.useForm();
  const [rejectForm] = Form.useForm();

  // 加载工单数据
  const loadRepairOrders = async (searchFilters = {}) => {
    setLoading(true);
    try {
      const result = await repairService.getRepairOrders({
        ...filters,
        ...searchFilters,
      });
      setRepairOrders(result.data);
    } catch (error) {
      console.error('获取工单失败:', error);
      message.error('获取工单失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载维修人员列表
  const loadRepairmen = async () => {
    try {
      const repairmenList = await repairService.getRepairmen();
      setRepairmen(repairmenList);
    } catch (error) {
      console.error('获取维修人员列表失败:', error);
      message.error('获取维修人员列表失败');
      // 设置默认维修人员列表作为fallback
      setRepairmen([
        { id: 1, name: '张师傅' },
        { id: 2, name: '李师傅' },
        { id: 3, name: '王师傅' },
        { id: 4, name: '赵师傅' },
      ]);
    }
  };

  // 搜索和筛选工单
  const searchRepairOrders = async (searchFilters = {}) => {
    setLoading(true);
    try {
      // 将 categoryKey 转换为 categoryName（如果存在）
      const processedFilters = { ...filters, ...searchFilters };
      if (processedFilters.category && processedFilters.category !== 'all' && categoryKeyToNameMap[processedFilters.category]) {
        processedFilters.category = categoryKeyToNameMap[processedFilters.category];
        console.log('搜索前分类Key转换:', searchFilters.category, '->', processedFilters.category);
      }
      
      const result = await repairService.searchRepairOrders(processedFilters);
      console.log('搜索工单结果:', result);
      console.log('工单数据（原始）:', result.data);
      
      // 如果数据还没有映射（检查是否有 categoryName 但没有 category），则手动映射
      let mappedData = result.data || [];
      if (mappedData.length > 0 && mappedData[0].categoryName && !mappedData[0].category) {
        console.log('⚠️ 检测到数据未映射，执行手动映射...');
        mappedData = mappedData.map(order => ({
          ...order,
          id: order.ticketId || order.id,
          ticketId: order.ticketId || order.id,
          category: order.categoryName || order.category || '',
          location: order.locationText || order.location || '',
          description: order.description || '',
          priority: order.priority || 'low',
          status: order.status === 'WAITING_ACCEPT' ? 'pending' : 
                  order.status === 'IN_PROGRESS' ? 'processing' :
                  order.status === 'RESOLVED' ? 'completed' :
                  order.status === 'WAITING_FEEDBACK' ? 'to_be_evaluated' :
                  order.status === 'FEEDBACKED' || order.status === 'CLOSED' ? 'closed' :
                  order.status === 'REJECTED' ? 'rejected' : order.status,
          studentID: order.studentId || order.studentID || '',
          repairmanId: order.staffId || order.repairmanId || null,
          created_at: order.createdAt || order.created_at || '',
          deleted: order.deleted || false,
          deletedAt: order.deletedAt || null,
        }));
        console.log('✅ 手动映射完成:', mappedData);
      }
      
      console.log('工单数量:', mappedData?.length || 0);
      setRepairOrders(mappedData);
    } catch (error) {
      console.error('搜索工单失败:', error);
      message.error('搜索工单失败');
      setRepairOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // 切换显示已删除工单
  const handleIncludeDeletedChange = (checked) => {
    const newFilters = { ...filters, includeDeleted: checked };
    setFilters(newFilters);
    searchRepairOrders(newFilters);
  };

  // 分类Key到分类名称的映射
  const categoryKeyToNameMap = {
    'waterAndElectricity': '水电维修',
    'networkIssues': '网络故障',
    'furnitureRepair': '家具维修',
    'applianceIssues': '电器故障',
    'publicFacilities': '公共设施',
  };

  // 处理筛选条件变化
  const handleFilterChange = (key, value) => {
    // 保留现有的所有筛选条件（包括 keyword），只更新指定的筛选条件
    let filterValue = value;
    
    // 如果是分类筛选，将 categoryKey 转换为 categoryName
    if (key === 'category' && value !== 'all' && categoryKeyToNameMap[value]) {
      filterValue = categoryKeyToNameMap[value];
      console.log('分类Key转换:', value, '->', filterValue);
    }
    
    const newFilters = { ...filters, [key]: filterValue };
    setFilters({ ...filters, [key]: value }); // UI状态保持使用categoryKey
    console.log('筛选条件变化:', key, '=', value, '->', filterValue, '完整筛选条件:', newFilters);
    searchRepairOrders(newFilters);
  };

  // 处理关键词搜索
  const handleSearch = (value) => {
    const keyword = value ? value.trim() : '';
    // 保留现有的所有筛选条件（包括 status、category 等），只更新 keyword
    const newFilters = { ...filters, keyword };
    setFilters(newFilters);
    console.log('搜索工单，关键词:', keyword, '完整筛选条件:', newFilters);
    searchRepairOrders(newFilters);
  };

  // 打开分配模态框
  const handleAssignClick = (order) => {
    setSelectedOrder(order);
    setAssignModalVisible(true);
    assignForm.setFieldsValue({
      repairmanId: order.repairmanId || undefined,
    });
  };

  // 打开驳回模态框
  const handleRejectClick = (order) => {
    setSelectedOrder(order);
    setRejectModalVisible(true);
    rejectForm.resetFields();
  };

  // 处理分配维修人员
  const handleAssignSubmit = async (values) => {
    try {
      const orderId = selectedOrder.ticketId || selectedOrder.id;
      if (!orderId) {
        message.error('工单ID不存在');
        return;
      }
      await repairService.assignRepairman(orderId, values.repairmanId);
      message.success('工单分配成功');
      setAssignModalVisible(false);
      loadRepairOrders(); // 刷新数据
      
      // 通知父组件刷新
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('分配工单失败:', error);
      message.error('分配工单失败: ' + (error.message || '未知错误'));
    }
  };

  // 处理驳回工单
  const handleRejectSubmit = async (values) => {
    try {
      await repairService.rejectRepairOrder(selectedOrder.id, values.reason);
      message.success('工单已驳回');
      setRejectModalVisible(false);
      loadRepairOrders(); // 刷新数据
      
      // 通知父组件刷新
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('驳回工单失败:', error);
      message.error('驳回工单失败');
    }
  };

  // 初始化加载数据
  useEffect(() => {
    loadRepairOrders();
    loadRepairmen();
  }, []);

  // 表格列定义
  const columns = [
    {
      title: '工单ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id, record) => {
        const ticketId = id || record.ticketId || record.id;
        return ticketId ? String(ticketId) : '未知';
      },
    },
    {
      title: '报修分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category) => {
        try {
          if (!category) return '未知';
          const categoryInfo = repairUtils.getCategoryInfo ? repairUtils.getCategoryInfo(category) : null;
          return categoryInfo ? categoryInfo.label : category;
        } catch (error) {
          console.error('获取分类信息失败:', error);
          return category || '未知';
        }
      },
    },
    {
      title: '具体位置',
      dataIndex: 'location',
      key: 'location',
      width: 120,
      render: (location) => location || '未指定',
    },
    {
      title: '问题描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (description) => description || '无描述',
    },
    {
      title: '紧急程度',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority) => {
        try {
          if (!repairUtils || typeof repairUtils.getPriorityInfo !== 'function') {
            console.error('repairUtils.getPriorityInfo 不存在');
            // 使用内联的优先级映射
            const priorityMap = {
              low: { label: "低", color: "blue" },
              medium: { label: "中", color: "orange" },
              high: { label: "高", color: "red" },
            };
            const priorityInfo = priorityMap[priority] || { label: priority || '未知', color: 'default' };
            return <Tag color={priorityInfo.color}>{priorityInfo.label}</Tag>;
          }
          const priorityInfo = repairUtils.getPriorityInfo(priority);
          return <Tag color={priorityInfo.color}>{priorityInfo.label}</Tag>;
        } catch (error) {
          console.error('获取优先级信息失败:', error);
          return <Tag color="default">{priority || '未知'}</Tag>;
        }
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status, record) => {
        try {
          // 如果状态是后端格式，先映射
          const frontendStatus = status === 'WAITING_ACCEPT' ? 'pending' : 
                                status === 'IN_PROGRESS' ? 'processing' :
                                status === 'RESOLVED' ? 'completed' :
                                status === 'WAITING_FEEDBACK' ? 'to_be_evaluated' :
                                status === 'FEEDBACKED' || status === 'CLOSED' ? 'closed' :
                                status === 'REJECTED' ? 'rejected' : status;
          const statusInfo = repairUtils.getStatusInfo ? repairUtils.getStatusInfo(frontendStatus) : { label: status || '未知', color: 'default' };
          return (
            <Space direction="vertical" size="small">
              <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
              {!record.repairmanId && <Tag color="default">未分配</Tag>}
              {record.deleted && <Tag color="red">已删除</Tag>}
            </Space>
          );
        } catch (error) {
          console.error('获取状态信息失败:', error);
          return <Tag color="default">{status || '未知'}</Tag>;
        }
      },
    },
    {
      title: '维修人员',
      dataIndex: 'repairmanId',
      key: 'repairmanId',
      width: 100,
      render: (repairmanId, record) => {
        if (!repairmanId) {
          return '未分配';
        }
        // 从维修人员列表中查找
        const repairman = repairmen.find(r => (r.id || r.userId) === repairmanId);
        return repairman ? (repairman.name || repairman.nickname || '未知') : '未分配';
      },
    },
    {
      title: '提交人学号',
      dataIndex: 'studentID',
      key: 'studentID',
      width: 120,
      render: (studentID) => studentID || '未知',
    },
    {
      title: '提交时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (time, record) => {
        // 尝试多个可能的字段名
        const createdAt = time || record.createdAt || record.created_at || '';
        if (!createdAt) return '未知';
        // 如果是字符串，尝试解析；如果是日期对象，格式化
        if (typeof createdAt === 'string') {
          // 如果是 ISO 8601 格式的字符串，解析并格式化
          if (createdAt.includes('T') || createdAt.includes('-')) {
            try {
              const date = new Date(createdAt);
              if (!isNaN(date.getTime())) {
                return date.toLocaleString('zh-CN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                });
              }
            } catch (e) {
              console.error('日期解析失败:', e);
            }
          }
          return createdAt;
        }
        // 如果是日期对象
        try {
          return new Date(createdAt).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          });
        } catch (e) {
          console.error('日期格式化失败:', e);
          return '未知';
        }
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => {
        // 检查状态：pending 或 WAITING_ACCEPT 都可以分配
        const isPending = record.status === 'pending' || record.status === 'WAITING_ACCEPT';
        
        return (
          <Space size="small">
            {isPending && (
              <>
                <Button 
                  type="primary" 
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={() => handleAssignClick(record)}
                >
                  分配
                </Button>
                <Button 
                  danger 
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={() => handleRejectClick(record)}
                >
                  驳回
                </Button>
              </>
            )}
            {!isPending && (
              <span style={{ color: '#999' }}>无操作</span>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <h2>工单管理</h2>
      
      {/* 搜索和筛选区域 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <div style={{ marginBottom: 8 }}>状态筛选</div>
            <Select
              style={{ width: '100%' }}
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
            >
              <Option value="all">全部状态</Option>
              <Option value="pending">待受理</Option>
              <Option value="processing">处理中</Option>
              <Option value="completed">已完成</Option>
              <Option value="to_be_evaluated">待评价</Option>
              <Option value="closed">已关闭</Option>
              <Option value="rejected">已驳回</Option>
            </Select>
          </Col>
          <Col span={6}>
            <div style={{ marginBottom: 8 }}>分类筛选</div>
            <Select
              style={{ width: '100%' }}
              value={filters.category}
              onChange={(value) => handleFilterChange('category', value)}
            >
              <Option value="all">全部分类</Option>
              <Option value="waterAndElectricity">水电维修</Option>
              <Option value="networkIssues">网络故障</Option>
              <Option value="furnitureRepair">家具维修</Option>
              <Option value="applianceIssues">电器故障</Option>
              <Option value="publicFacilities">公共设施</Option>
            </Select>
          </Col>
          <Col span={12}>
            <div style={{ marginBottom: 8 }}>关键词搜索</div>
            <Search
              placeholder="搜索工单ID、描述、位置、学生ID、维修工ID、分类..."
              allowClear
              value={filters.keyword || ''}
              enterButton={<SearchOutlined />}
              onSearch={handleSearch}
              onChange={(e) => {
                const value = e.target.value || '';
                // 实时更新关键词，但不立即搜索（等待用户按回车或点击搜索按钮）
                setFilters({ ...filters, keyword: value });
                // 如果清空了搜索框，立即搜索
                if (!value) {
                  handleSearch('');
                }
              }}
            />
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={24}>
            <Space>
              <span>显示已删除工单：</span>
              <Switch
                checked={filters.includeDeleted}
                onChange={handleIncludeDeletedChange}
                checkedChildren="是"
                unCheckedChildren="否"
              />
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 工单表格 */}
        <Table
          columns={columns}
          dataSource={repairOrders}
          rowKey={(record) => record.ticketId || record.id || Math.random()}
          loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => 
            `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
        }}
        scroll={{ x: 1200 }}
      />

      {/* 分配维修人员模态框 */}
      <Modal
        title="分配维修人员"
        open={assignModalVisible}
        onCancel={() => setAssignModalVisible(false)}
        footer={null}
      >
        <Form
          form={assignForm}
          layout="vertical"
          onFinish={handleAssignSubmit}
        >
          <Form.Item
            label="选择维修人员"
            name="repairmanId"
            rules={[{ required: true, message: '请选择维修人员!' }]}
          >
            <Select placeholder="请选择维修人员">
              {repairmen.map(repairman => (
                <Option key={repairman.id || repairman.userId} value={repairman.id || repairman.userId}>
                  <Space>
                    <UserOutlined />
                    {repairman.name || repairman.nickname || '未知'}
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                确认分配
              </Button>
              <Button onClick={() => setAssignModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 驳回工单模态框 */}
      <Modal
        title="驳回工单"
        open={rejectModalVisible}
        onCancel={() => setRejectModalVisible(false)}
        footer={null}
      >
        <Form
          form={rejectForm}
          layout="vertical"
          onFinish={handleRejectSubmit}
        >
          <Form.Item
            label="驳回原因"
            name="reason"
            rules={[{ required: true, message: '请输入驳回原因!' }]}
          >
            <Input.TextArea 
              rows={4} 
              placeholder="请输入驳回此工单的原因..."
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" danger htmlType="submit">
                确认驳回
              </Button>
              <Button onClick={() => setRejectModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RepairOrderList;