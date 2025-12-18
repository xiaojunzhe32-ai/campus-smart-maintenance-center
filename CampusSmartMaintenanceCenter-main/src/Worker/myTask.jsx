// src/components/MyTask.jsx
import React, { useState, useEffect } from 'react';
import { 
  Table, Tag, Button, Space, Select, Input, 
  Modal, Form,  Card, Row, Col, 
  Statistic, Progress, Descriptions, Image
} from 'antd';
import { SearchOutlined, PlayCircleOutlined, CheckCircleOutlined,
  EditOutlined, EyeOutlined, ClockCircleOutlined,
  ExclamationCircleOutlined, StarOutlined
} from '@ant-design/icons';
import { mytaskService, mytaskUtils } from './mytaskService.jsx';

const { Option } = Select;
const { Search } = Input;

const MyTask = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    priority: 'all',
    keyword: '',
  });
  const [startModalVisible, setStartModalVisible] = useState(false);
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [startForm] = Form.useForm();
  const [completeForm] = Form.useForm();
  const [notesForm] = Form.useForm();

  // 当前维修工人ID - 从登录信息中获取
  const getCurrentRepairmanId = () => {
    try {
      const userStr = localStorage.getItem('user');
      console.log('从localStorage获取的用户信息字符串:', userStr);
      if (userStr) {
        const user = JSON.parse(userStr);
        console.log('解析后的用户对象:', user);
        const userId = user.userId || user.id || null;
        console.log('提取的维修工ID:', userId);
        return userId;
      }
    } catch (e) {
      console.error('获取用户信息失败:', e);
    }
    return null;
  };
  
  const currentRepairmanId = getCurrentRepairmanId();
  console.log('当前维修工ID (组件级别):', currentRepairmanId);

  // 加载任务列表
  const loadTasks = async (searchFilters = {}) => {
    if (!currentRepairmanId) {
      console.warn('无法加载任务：维修工ID为空');
      setTasks([]);
      return;
    }
    
    setLoading(true);
    try {
      // 仅将状态筛选传给后端，其它筛选在前端本地处理
      const mergedFilters = { ...filters, ...searchFilters };
      const requestFilters = {};
      if (mergedFilters.status && mergedFilters.status !== 'all') {
        requestFilters.status = mergedFilters.status;
      }

      console.log('开始加载任务，后端请求参数:', { currentRepairmanId, requestFilters });
      const result = await mytaskService.getMyTasks(currentRepairmanId, requestFilters);
      console.log('获取到的任务数据:', result);
      console.log('任务列表数量:', result.data?.length || 0);
      setTasks(result.data || []);
    } catch (error) {
      console.error('加载任务失败:', error);
      setTasks([]); // 确保即使出错也设置为空数组
      // 错误信息已经在service中显示，这里不需要重复显示
    } finally {
      setLoading(false);
    }
  };

  // 加载统计数据
  const loadStats = async () => {
    if (!currentRepairmanId) {
      console.warn('无法加载统计：维修工ID为空');
      setStats({
        total: 0,
        pending: 0,
        processing: 0,
        completed: 0,
        to_be_evaluated: 0,
        closed: 0,
        averageRating: 0,
      });
      return;
    }
    
    try {
      console.log('开始加载统计数据，维修工ID:', currentRepairmanId);
      const statsData = await mytaskService.getRepairmanStats(currentRepairmanId);
      console.log('获取到的统计数据:', statsData);
      setStats(statsData);
    } catch (error) {
      console.error('加载统计数据失败:', error);
      // 设置默认统计数据
      setStats({
        total: 0,
        pending: 0,
        processing: 0,
        completed: 0,
        to_be_evaluated: 0,
        closed: 0,
        averageRating: 0,
      });
    }
  };

  // 处理筛选条件变化
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    // 仅当状态变化时才重新请求后端，其它筛选在前端本地处理
    if (key === 'status') {
      loadTasks({ status: value });
    }
  };

  // 处理关键词搜索
  const handleSearch = (value) => {
    const newFilters = { ...filters, keyword: value };
    setFilters(newFilters);
    // 关键词搜索在前端本地过滤，不重新请求后端
  };

  // 本地应用分类、优先级、关键词筛选
  const applyFilters = () => {
    let result = [...tasks];

    // 状态筛选：后端已按状态过滤，但这里再兜底一次
    if (filters.status && filters.status !== 'all') {
      result = result.filter(task => task.status === filters.status);
    }

    // 分类筛选
    if (filters.category && filters.category !== 'all') {
      result = result.filter(task => task.category === filters.category);
    }

    // 优先级筛选
    if (filters.priority && filters.priority !== 'all') {
      result = result.filter(task => task.priority === filters.priority);
    }

    // 关键词筛选（位置 / 描述 / 学生姓名）
    if (filters.keyword && filters.keyword.trim() !== '') {
      const kw = filters.keyword.trim().toLowerCase();
      result = result.filter(task => {
        const location = (task.location || '').toLowerCase();
        const desc = (task.description || '').toLowerCase();
        const studentName = (task.studentName || task.studentId || '').toLowerCase();
        return (
          location.includes(kw) ||
          desc.includes(kw) ||
          studentName.includes(kw)
        );
      });
    }

    setFilteredTasks(result);
  };

  // 当任务列表或筛选条件变化时，重新计算本地筛选结果
  useEffect(() => {
    applyFilters();
  }, [tasks, filters]);

  // 打开开始任务模态框
  const handleStartClick = (task) => {
    setSelectedTask(task);
    setStartModalVisible(true);
    startForm.setFieldsValue({
      estimated_completion_time: task.estimated_completion_time || task.estimatedCompletionTime || '',
    });
  };

  // 打开完成任务模态框
  const handleCompleteClick = (task) => {
    setSelectedTask(task);
    setCompleteModalVisible(true);
    completeForm.setFieldsValue({
      notes: task.notes || task.processNotes || '',
    });
  };

  // 打开更新备注模态框
  const handleNotesClick = (task) => {
    setSelectedTask(task);
    setNotesModalVisible(true);
    notesForm.setFieldsValue({
      notes: task.notes || '',
    });
  };

  // 打开详情模态框
  const handleDetailClick = async (task) => {
    try {
      // 从API获取任务详情
      const taskId = task.ticketId || task.id;
      if (!taskId) {
        message.error('任务ID不存在');
        return;
      }
      const taskDetail = await mytaskService.getTaskById(taskId, currentRepairmanId);
      setSelectedTask(taskDetail);
      setDetailModalVisible(true);
    } catch (error) {
      console.error('获取任务详情失败:', error);
    }
  };

  // 处理开始任务
  const handleStartSubmit = async (values) => {
    try {
      const taskId = selectedTask.ticketId || selectedTask.id;
      if (!taskId) {
        message.error('任务ID不存在');
        return;
      }
      await mytaskService.startTask(
        taskId, 
        currentRepairmanId, 
        values.estimated_completion_time
      );
      setStartModalVisible(false);
      // 刷新任务列表和统计数据
      await loadTasks();
      await loadStats();
    } catch (error) {
      console.error('开始任务失败:', error);
      // 错误信息已经在service中显示
    }
  };

  // 处理完成任务
  const handleCompleteSubmit = async (values) => {
    try {
      const taskId = selectedTask.ticketId || selectedTask.id;
      if (!taskId) {
        message.error('任务ID不存在');
        return;
      }
      await mytaskService.completeTask(
        taskId,
        currentRepairmanId,
        values.notes
      );
      setCompleteModalVisible(false);
      // 刷新任务列表和统计数据
      await loadTasks();
      await loadStats();
    } catch (error) {
      console.error('完成任务失败:', error);
      // 错误信息已经在service中显示
    }
  };

  // 处理更新备注
  const handleNotesSubmit = async (values) => {
    try {
      await mytaskService.updateTaskNotes(
        selectedTask.id, 
        currentRepairmanId, 
        values.notes
      );
      setNotesModalVisible(false);
      loadTasks(); // 刷新任务列表
    } catch (error) {
      console.error('更新备注失败:', error);
      // 错误信息已经在service中显示
    }
  };

  // 初始化加载数据
  useEffect(() => {
    if (currentRepairmanId) {
      console.log('开始加载任务，维修工ID:', currentRepairmanId);
      loadTasks();
      loadStats();
    } else {
      console.warn('无法获取维修工ID，请先登录');
      message.warning('无法获取用户信息，请重新登录');
    }
  }, []);

  // 表格列定义
  const columns = [
    {
      title: '任务ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id, record) => id || record.ticketId || '未知',
    },
    {
      title: '报修分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category) => {
        if (!category) return '未知';
        const categoryInfo = mytaskUtils.getCategoryInfo(category);
        return categoryInfo ? categoryInfo.label : category;
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
      width: 200,
      render: (description) => description || '无描述',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status, record) => {
        // 安全获取状态信息，避免工具函数未定义或抛错导致整行渲染失败
        let statusInfo = { label: status || '未知', color: 'default' };
        let isOverdue = false;
        try {
          if (mytaskUtils && typeof mytaskUtils.getStatusInfo === 'function') {
            statusInfo = mytaskUtils.getStatusInfo(status) || statusInfo;
          }
          if (mytaskUtils && typeof mytaskUtils.isTaskOverdue === 'function') {
            isOverdue = !!mytaskUtils.isTaskOverdue(record);
          }
        } catch (e) {
          console.error('渲染状态信息出错:', e, { status, record });
        }
        
        return (
          <Space direction="vertical" size="small">
            <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
            {isOverdue && (
              <Tag color="red" icon={<ExclamationCircleOutlined />}>
                已超时
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority) => {
        let priorityInfo = { label: priority || '未知', color: 'default' };
        try {
          if (mytaskUtils && typeof mytaskUtils.getPriorityInfo === 'function') {
            priorityInfo = mytaskUtils.getPriorityInfo(priority) || priorityInfo;
          }
        } catch (e) {
          console.error('渲染优先级出错:', e, { priority });
        }
        return <Tag color={priorityInfo.color}>{priorityInfo.label}</Tag>;
      },
    },
    {
      title: '学生信息',
      dataIndex: 'studentName',
      key: 'studentName',
      width: 120,
      render: (name, record) => {
        const studentName = name || record.studentName || record.studentId || '未知';
        const contactPhone = record.contactPhone || '';
        return (
          <div>
            <div>{studentName}</div>
            {contactPhone && (
              <div style={{ fontSize: '12px', color: '#666' }}>
                {contactPhone}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: '分配时间',
      dataIndex: 'assigned_at',
      key: 'assigned_at',
      width: 150,
      render: (time, record) => {
        const assignedTime = time || record.assignedAt;
        if (assignedTime) {
          // 如果是字符串，直接显示；如果是日期对象，格式化
          return typeof assignedTime === 'string' ? assignedTime : new Date(assignedTime).toLocaleString('zh-CN');
        }
        return '未分配';
      },
    },
    {
      title: '预计完成',
      dataIndex: 'estimated_completion_time',
      key: 'estimated_completion_time',
      width: 150,
      render: (time, record) => {
        const estimatedTime = time || record.estimatedCompletionTime || record.estimated_completion_time;
        if (estimatedTime) {
          // 如果是字符串，直接显示；如果是日期对象，格式化
          return typeof estimatedTime === 'string' ? estimatedTime : new Date(estimatedTime).toLocaleString('zh-CN');
        }
        return '未设置';
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => {
        const isPending = record.status === 'pending';
        const isProcessing = record.status === 'processing';
        
        return (
          <Space size="small" direction="vertical">
            <Space size="small">
              {isPending && (
                <Button 
                  type="primary" 
                  size="small"
                  icon={<PlayCircleOutlined />}
                  onClick={() => handleStartClick(record)}
                >
                  开始处理
                </Button>
              )}
              {isProcessing && (
                <Button 
                  type="primary" 
                  size="small"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleCompleteClick(record)}
                >
                  完成任务
                </Button>
              )}
              <Button 
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleNotesClick(record)}
              >
                备注
              </Button>
            </Space>
            <Button 
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleDetailClick(record)}
            >
              详情
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <div
      style={{ padding: 24, background: '#ffffffff'}}>
      <h2>我的任务</h2>
      
      {/* 统计卡片 */}
      {stats && (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={4}>
              <Statistic title="总任务数" value={stats.total} />
            </Col>
            <Col span={4}>
              <Statistic title="待受理" value={stats.pending} valueStyle={{ color: '#faad14' }} />
            </Col>
            <Col span={4}>
              <Statistic title="处理中" value={stats.processing} valueStyle={{ color: '#1890ff' }} />
            </Col>
            <Col span={4}>
              <Statistic title="待评价" value={stats.to_be_evaluated} valueStyle={{ color: '#722ed1' }} />
            </Col>
            <Col span={4}>
              <Statistic title="已完成" value={stats.completed} valueStyle={{ color: '#52c41a' }} />
            </Col>
            <Col span={4}>
              <Statistic 
                title="平均评分" 
                value={stats.averageRating} 
                prefix={<StarOutlined />}
                valueStyle={{ color: '#fadb14' }}
              />
            </Col>
          </Row>
        </Card>
      )}

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
              <Option value="to_be_evaluated">待评价</Option>
              <Option value="completed">已完成</Option>
            </Select>
          </Col>

          <Col span={6}>
            <div style={{ marginBottom: 8 }}>分类筛选</div>
            <Select style={{ width: '100%' }} value={filters.category}
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

          <Col span={6}>
            <div style={{ marginBottom: 8 }}>优先级筛选</div>
            <Select
              style={{ width: '100%' }}
              value={filters.priority}
              onChange={(value) => handleFilterChange('priority', value)}
            >
              <Option value="all">全部优先级</Option>
              <Option value="high">高</Option>
              <Option value="medium">中</Option>
              <Option value="low">低</Option>
            </Select>
          </Col>

          <Col span={6}>
            <div style={{ marginBottom: 8 }}>关键词搜索</div>
            <Search
              placeholder="搜索位置、描述或学生姓名..."
              allowClear
              enterButton={<SearchOutlined />}
              onSearch={handleSearch}
              onChange={(e) => {
                if (!e.target.value) {
                  handleSearch('');
                }
              }}
            />
          </Col>
        </Row>
      </Card>

      {/* 任务表格 */}
          <Table
            columns={columns}
            dataSource={filteredTasks}
            rowKey={(record) => record.ticketId || record.id || record.key || Math.random()}
            loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => 
            `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
        }}
        scroll={{ x: 1500 }}
      />

      {/* 开始任务模态框 */}
      <Modal
        title="开始处理任务"
        open={startModalVisible}
        onCancel={() => setStartModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedTask && (
          <Form
            form={startForm}
            layout="vertical"
            onFinish={handleStartSubmit}
          >
            <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="任务ID">{selectedTask.ticketId || selectedTask.id}</Descriptions.Item>
              <Descriptions.Item label="报修位置">{selectedTask.location || selectedTask.locationText}</Descriptions.Item>
              <Descriptions.Item label="问题描述">{selectedTask.description || '无描述'}</Descriptions.Item>
              <Descriptions.Item label="学生信息">
                {selectedTask.studentName || selectedTask.studentId || '未知'} 
                {selectedTask.contactPhone && ` (${selectedTask.contactPhone})`}
              </Descriptions.Item>
            </Descriptions>

            <Form.Item
              label="预计完成时间"
              name="estimated_completion_time"
              rules={[{ required: true, message: '请选择预计完成时间!' }]}
            >
              <Input type="datetime-local" />
            </Form.Item>
            
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" icon={<PlayCircleOutlined />}>
                  开始处理
                </Button>
                <Button onClick={() => setStartModalVisible(false)}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* 完成任务模态框 */}
      <Modal
        title="完成任务"
        open={completeModalVisible}
        onCancel={() => setCompleteModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedTask && (
          <Form
            form={completeForm}
            layout="vertical"
            onFinish={handleCompleteSubmit}
          >
            <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="任务ID">{selectedTask.id}</Descriptions.Item>
              <Descriptions.Item label="报修位置">{selectedTask.location}</Descriptions.Item>
              <Descriptions.Item label="问题描述">{selectedTask.description}</Descriptions.Item>
            </Descriptions>

            <Form.Item
              label="完成备注"
              name="notes"
              rules={[{ required: true, message: '请输入完成备注!' }]}
            >
              <Input.TextArea 
                rows={4} 
                placeholder="请描述维修过程和结果..."
              />
            </Form.Item>
            
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" icon={<CheckCircleOutlined />}>
                  确认完成
                </Button>
                <Button onClick={() => setCompleteModalVisible(false)}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* 更新备注模态框 */}
      <Modal
        title="更新任务备注"
        open={notesModalVisible}
        onCancel={() => setNotesModalVisible(false)}
        footer={null}
        width={500}
      >
        {selectedTask && (
          <Form
            form={notesForm}
            layout="vertical"
            onFinish={handleNotesSubmit}
          >
            <Form.Item
              label="任务备注"
              name="notes"
            >
              <Input.TextArea 
                rows={4} 
                placeholder="请输入任务备注信息..."
              />
            </Form.Item>
            
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  保存备注
                </Button>
                <Button onClick={() => setNotesModalVisible(false)}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* 任务详情模态框 */}
      <Modal
        title="任务详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={700}
      >
        {selectedTask && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="任务ID" span={1}>
              {selectedTask.id}
            </Descriptions.Item>
            <Descriptions.Item label="状态" span={1}>
              {(() => {
                let statusInfo = { label: selectedTask.status || '未知', color: 'default' };
                try {
                  if (mytaskUtils && typeof mytaskUtils.getStatusInfo === 'function') {
                    statusInfo = mytaskUtils.getStatusInfo(selectedTask.status) || statusInfo;
                  }
                } catch (e) {
                  console.error('详情中渲染状态出错:', e, { selectedTask });
                }
                return (
                  <Tag color={statusInfo.color}>
                    {statusInfo.label}
                  </Tag>
                );
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="报修分类" span={1}>
              {(() => {
                try {
                  if (mytaskUtils && typeof mytaskUtils.getCategoryInfo === 'function') {
                    const info = mytaskUtils.getCategoryInfo(selectedTask.category);
                    return info?.label || selectedTask.category || '未知';
                  }
                } catch (e) {
                  console.error('详情中渲染分类出错:', e, { selectedTask });
                }
                return selectedTask.category || '未知';
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="优先级" span={1}>
              {(() => {
                let priorityInfo = { label: selectedTask.priority || '未知', color: 'default' };
                try {
                  if (mytaskUtils && typeof mytaskUtils.getPriorityInfo === 'function') {
                    priorityInfo = mytaskUtils.getPriorityInfo(selectedTask.priority) || priorityInfo;
                  }
                } catch (e) {
                  console.error('详情中渲染优先级出错:', e, { selectedTask });
                }
                return (
                  <Tag color={priorityInfo.color}>
                    {priorityInfo.label}
                  </Tag>
                );
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="具体位置" span={2}>
              {selectedTask.location}
            </Descriptions.Item>
            <Descriptions.Item label="问题描述" span={2}>
              {selectedTask.description}
            </Descriptions.Item>
            <Descriptions.Item label="学生信息" span={1}>
              {selectedTask.studentName} (学号: {selectedTask.studentID})
            </Descriptions.Item>
            <Descriptions.Item label="联系电话" span={1}>
              {selectedTask.contactPhone}
            </Descriptions.Item>
            <Descriptions.Item label="提交时间" span={1}>
              {selectedTask.created_at}
            </Descriptions.Item>
            <Descriptions.Item label="分配时间" span={1}>
              {selectedTask.assigned_at || selectedTask.assignedAt ? 
                (typeof (selectedTask.assigned_at || selectedTask.assignedAt) === 'string' ? 
                  (selectedTask.assigned_at || selectedTask.assignedAt) : 
                  new Date(selectedTask.assigned_at || selectedTask.assignedAt).toLocaleString('zh-CN')) : 
                '未分配'}
            </Descriptions.Item>
            <Descriptions.Item label="预计完成时间" span={1}>
              {selectedTask.estimated_completion_time || selectedTask.estimatedCompletionTime ? 
                (typeof (selectedTask.estimated_completion_time || selectedTask.estimatedCompletionTime) === 'string' ? 
                  (selectedTask.estimated_completion_time || selectedTask.estimatedCompletionTime) : 
                  new Date(selectedTask.estimated_completion_time || selectedTask.estimatedCompletionTime).toLocaleString('zh-CN')) : 
                '未设置'}
            </Descriptions.Item>
            <Descriptions.Item label="实际完成时间" span={1}>
              {selectedTask.completed_at || '未完成'}
            </Descriptions.Item>
            <Descriptions.Item label="任务耗时" span={1}>
              {(() => {
                try {
                  if (mytaskUtils && typeof mytaskUtils.calculateTaskDuration === 'function') {
                    return mytaskUtils.calculateTaskDuration(selectedTask) || '未开始';
                  }
                } catch (e) {
                  console.error('详情中计算任务耗时出错:', e, { selectedTask });
                }
                return '未开始';
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="是否超时" span={1}>
              {(() => {
                let overdue = false;
                try {
                  if (mytaskUtils && typeof mytaskUtils.isTaskOverdue === 'function') {
                    overdue = !!mytaskUtils.isTaskOverdue(selectedTask);
                  }
                } catch (e) {
                  console.error('详情中判断是否超时出错:', e, { selectedTask });
                }
                return overdue ? (
                  <Tag color="red" icon={<ExclamationCircleOutlined />}>已超时</Tag>
                ) : (
                  <Tag color="green">正常</Tag>
                );
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="维修备注" span={2}>
              {selectedTask.notes || '无'}
            </Descriptions.Item>
            {selectedTask.images && selectedTask.images.length > 0 && (
              <Descriptions.Item label="报修图片" span={2}>
                <Image.PreviewGroup>
                  {selectedTask.images.map((img, index) => (
                    <Image
                      key={index}
                      width={100}
                      src={img}
                      placeholder={
                        <div style={{ width: 100, height: 100, background: '#f5f5f5' }} />
                      }
                    />
                  ))}
                </Image.PreviewGroup>
              </Descriptions.Item>
            )}
            {selectedTask.rating && (
              <Descriptions.Item label="用户评分" span={1}>
                <Space>
                  <StarOutlined style={{ color: '#fadb14' }} />
                  {Number(selectedTask.rating) || 0} 分
                </Space>
              </Descriptions.Item>
            )}
            {selectedTask.feedback && (
              <Descriptions.Item label="用户反馈" span={2}>
                {selectedTask.feedback}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default MyTask;