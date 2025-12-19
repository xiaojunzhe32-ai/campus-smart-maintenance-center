import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Tag, Spin, Statistic, Alert } from 'antd';
import { Pie, Column, Line } from '@ant-design/charts';
import { statisticsService } from './statisticsService';
import { TASK_STATUS } from '../Worker/mytaskService';

const DataAnalysis = () => {
  const [categoryData, setCategoryData] = useState([]);
  const [locationData, setLocationData] = useState([]);
  const [ratingData, setRatingData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]); // 新增：月度统计数据
  const [overallStats, setOverallStats] = useState({
    totalRepairs: 0,
    avgProcessingTime: '0 天',
    userSatisfaction: '0%'
  });
  const [loading, setLoading] = useState(true);

  const loadStatistics = async () => {
    setLoading(true);
    
    try {
      // 新增：获取月度统计数据
      const [categoryStats, locationStats, ratingStats, statusStats, monthlyStats, overallStatsData] = await Promise.all([
        statisticsService.getRepairCategoryStats(),
        statisticsService.getLocationRepairStats(),
        statisticsService.getRepairmanRatingStats(),
        statisticsService.getOrderStatusStats(),
        statisticsService.getMonthlyStats(), // 新增：获取月度统计
        statisticsService.getOverallStats()
      ]);

      console.log('分类统计数据:', categoryStats);
      console.log('位置统计数据:', locationStats);
      console.log('评分统计数据:', ratingStats);
      console.log('状态统计数据:', statusStats);
      console.log('月度统计数据:', monthlyStats); // 新增：调试信息

      setCategoryData(categoryStats);
      setLocationData(locationStats);
      setRatingData(ratingStats);
      setStatusData(statusStats);
      setMonthlyData(monthlyStats); // 设置月度统计数据
      setOverallStats(overallStatsData);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>正在加载统计数据...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px' }}>
      <h2>数据统计与分析</h2>
      
      {/* 统计摘要 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={8}>
          <Card size="small" title="总报修数" variant="borderless">
            <Statistic
              value={overallStats.totalRepairs}
              valueStyle={{ color: '#1890ff', fontSize: '24px', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" title="平均处理时间" variant="borderless">
            <Statistic
              value={overallStats.avgProcessingTime}
              valueStyle={{ color: '#52c41a', fontSize: '24px', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" title="用户满意度" variant="borderless">
            <Statistic
              value={overallStats.userSatisfaction}
              valueStyle={{ color: '#fa541c', fontSize: '24px', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 2×2田字格布局 */}
      <Row gutter={[16, 16]}>
        {/* 第一行第一列：报修分类占比 */}
        <Col xs={24} md={12}>
          <Card 
            title="报修分类占比" 
            variant="borderless"
            extra={
              <div style={{ fontSize: '12px', color: '#666' }}>
                总计: {categoryData.reduce((sum, item) => sum + item.value, 0)} 次报修
              </div>
            }
          >
            <RepairCategoryPieChart data={categoryData} />
          </Card>
        </Col>

        {/* 第一行第二列：工单状态分布（新增） */}
        <Col xs={24} md={12}>
          <Card 
            title="工单状态分布" 
            variant="borderless"
            extra={
              <div style={{ fontSize: '12px', color: '#666' }}>
                总计: {statusData.reduce((sum, item) => sum + item.value, 0)} 个工单
              </div>
            }
          >
            <OrderStatusPieChart data={statusData} />
          </Card>
        </Col>

        {/* 第二行第一列：具体位置报修数量排行 */}
        <Col xs={24} md={12}>
          <Card 
            title="位置报修数量排行" 
            variant="borderless"
            extra={
              <div style={{ fontSize: '12px', color: '#666' }}>
                前{locationData.length}个位置报修统计
              </div>
            }
          >
            <LocationRepairColumnChart data={locationData} />
          </Card>
        </Col>

        {/* 第二行第二列：维修人员平均评分排行 */}
        <Col xs={24} md={12}>
          <Card 
            title="维修人员评分排行" 
            variant="borderless"
            extra={
              <div style={{ fontSize: '12px', color: '#666' }}>
                基于用户评价计算的平均分
              </div>
            }
          >
            <RepairmanRatingTable data={ratingData} />
          </Card>
        </Col>
      </Row>

      {/* 新增：月度统计折线图，放在田字格下面 */}
      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col xs={24}>
          <Card 
            title="月度统计" 
            variant="borderless"
            extra={
              <div style={{ fontSize: '12px', color: '#666' }}>
                近六个月工单数量统计
              </div>
            }
          >
            <MonthlyLineChart data={monthlyData} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// 修复后的饼图组件
const RepairCategoryPieChart = ({ data }) => {
  console.log('饼图接收到的数据:', data);
  
  if (!data || data.length === 0) {
    return <div style={{ textAlign: 'center', padding: '50px 0', color: '#999' }}>暂无数据</div>;
  }

  // 简化配置，移除不支持的 label.type，使用 tooltip 和 legend 显示信息
  const config = {
    data: data,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    // 移除 label 配置，避免 "Unknown Component: shape.inner" 错误
    // 使用 tooltip 和 legend 来显示信息
    legend: {
      position: 'right',
      itemName: {
        formatter: (text, item) => {
          const dataItem = data.find(d => d.type === item.name);
          return `${text}: ${dataItem ? dataItem.value : 0}`;
        },
      },
    },
    tooltip: {
      formatter: (datum) => {
        const total = data.reduce((sum, item) => sum + item.value, 0);
        const percent = total > 0 ? ((datum.value / total) * 100).toFixed(1) : '0.0';
        let extra = '';
        if (typeof datum.avgRating === 'number') {
          extra += `，平均评分：${datum.avgRating.toFixed(1)} 分`;
        }
        if (typeof datum.completedTickets === 'number') {
          extra += `，已完成：${datum.completedTickets} 单`;
        }
        return { name: datum.type, value: `${datum.value} (${percent}%)${extra}` };
      },
    },
    interactions: [{ type: 'element-active' }],
    height: 300,
    appendPadding: 10,
  };

  try {
    return <Pie {...config} />;
  } catch (error) {
    console.error('饼图渲染错误:', error);
    return (
      <div style={{ textAlign: 'center', padding: '50px 0', color: '#ff4d4f' }}>
        图表渲染失败，请检查数据格式
      </div>
    );
  }
};

// 新增：工单状态分布饼图组件
const OrderStatusPieChart = ({ data }) => {
  console.log('状态饼图接收到的数据:', data);
  
  if (!data || data.length === 0) {
    return <div style={{ textAlign: 'center', padding: '50px 0', color: '#999' }}>暂无数据</div>;
  }

  // 后端返回的是枚举名（WAITING_ACCEPT 等），这里先映射到前端状态值，再映射到中文标签
  const backendToFrontendStatus = {
    WAITING_ACCEPT: 'pending',
    IN_PROGRESS: 'processing',
    RESOLVED: 'completed',
    WAITING_FEEDBACK: 'to_be_evaluated',
    FEEDBACKED: 'closed',
    CLOSED: 'closed',
    REJECTED: 'rejected',
  };

  // 准备饼图数据，将状态值转换为对应的中文标签
  const chartData = data.map(item => {
    const rawStatus = item.status;
    // 先将枚举名映射为前端状态值（pending/processing/...）
    const frontendStatus =
      backendToFrontendStatus[rawStatus] ||
      (rawStatus ? rawStatus.toLowerCase() : rawStatus);

    // 在 TASK_STATUS 常量中查找对应的配置
    const statusKey = Object.keys(TASK_STATUS).find(
      key => TASK_STATUS[key].value === frontendStatus
    );

    let statusConfig;
    if (statusKey && TASK_STATUS[statusKey]) {
      statusConfig = TASK_STATUS[statusKey];
    } else {
      // 如果找不到对应状态，使用默认值（直接展示后端给的状态字符串）
      console.warn(`未找到状态 ${rawStatus} / ${frontendStatus} 的配置，使用默认值`);
      statusConfig = { label: rawStatus || '未知状态', color: '#d9d9d9' };
    }

    return {
      ...item,
      type: statusConfig.label, // 使用中文标签
      color: statusConfig.color,
    };
  });

  // 饼图配置，移除不支持的 label.type
  const config = {
    data: chartData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    // 移除 label 配置，避免 "Unknown Component: shape.inner" 错误
    // 使用 tooltip 和 legend 来显示信息
    legend: {
      position: 'right',
      itemName: {
        formatter: (text, item) => {
          const dataItem = chartData.find(d => d.type === item.name);
          return `${text}: ${dataItem ? dataItem.value : 0}`;
        },
      },
    },
    tooltip: {
      formatter: (datum) => {
        const total = chartData.reduce((sum, item) => sum + item.value, 0);
        const percent = total > 0 ? ((datum.value / total) * 100).toFixed(1) : '0';
        return { name: datum.type, value: `${datum.value} (${percent}%)` };
      },
    },
    interactions: [{ type: 'element-active' }],
    height: 300,
    appendPadding: 10,
  };

  try {
    return <Pie {...config} />;
  } catch (error) {
    console.error('状态饼图渲染错误:', error);
    return (
      <div style={{ textAlign: 'center', padding: '50px 0', color: '#ff4d4f' }}>
        图表渲染失败，请检查数据格式
      </div>
    );
  }
};

// 修复后的柱状图组件
const LocationRepairColumnChart = ({ data }) => {
  console.log('柱状图接收到的数据:', data);
  
  if (!data || data.length === 0) {
    return <div style={{ textAlign: 'center', padding: '50px 0', color: '#999' }}>暂无数据</div>;
  }

  const config = {
    data: data,
    xField: 'location',
    yField: 'count',
    color: '#1890ff',
    xAxis: {
      label: {
        autoRotate: false,
        formatter: (text) => {
          return text.length > 6 ? text.substring(0, 6) + '...' : text;
        },
      },
    },
    yAxis: {
      label: {
        formatter: (text) => text + ' 次',
      },
    },
    height: 300,
  };

  try {
    return <Column {...config} />;
  } catch (error) {
    console.error('柱状图渲染错误:', error);
    return (
      <div style={{ textAlign: 'center', padding: '50px 0', color: '#ff4d4f' }}>
        图表渲染失败，请检查数据格式
      </div>
    );
  }
};

// 新增：月度统计折线图组件
const MonthlyLineChart = ({ data }) => {
  console.log('折线图接收到的数据:', data);
  
  if (!data || data.length === 0) {
    return <div style={{ textAlign: 'center', padding: '50px 0', color: '#999' }}>暂无数据</div>;
  }

  const config = {
    data: data,
    xField: 'month',
    yField: 'orders',
    smooth: true,
    color: '#13c2c2',
    lineStyle: {
      lineWidth: 3,
    },
    point: {
      size: 5,
      shape: 'circle',
      style: {
        fill: 'white',
        stroke: '#13c2c2',
        lineWidth: 2,
      },
    },
    xAxis: {
      title: {
        text: '月份',
        style: {
          fontSize: 14,
        },
      },
    },
    yAxis: {
      title: {
        text: '工单数量',
        style: {
          fontSize: 14,
        },
      },
      label: {
        formatter: (text) => `${text} 单`,
      },
    },
    height: 400,
    tooltip: {
      formatter: (datum) => {
        return { name: '工单数量', value: `${datum.orders} 单` };
      },
    },
    meta: {
      month: {
        alias: '月份',
      },
      orders: {
        alias: '工单数量',
      },
    },
  };

  try {
    return <Line {...config} />;
  } catch (error) {
    console.error('折线图渲染错误:', error);
    return (
      <div style={{ textAlign: 'center', padding: '50px 0', color: '#ff4d4f' }}>
        图表渲染失败，请检查数据格式
      </div>
    );
  }
};

// 表格组件保持不变
const RepairmanRatingTable = ({ data }) => {
  const columns = [
    {
      title: '排名',
      key: 'rank',
      width: 60,
      render: (_, __, index) => (
        <Tag color={index < 3 ? 'gold' : 'default'}>
          {index + 1}
        </Tag>
      ),
    },
    {
      title: '维修人员',
      dataIndex: 'name',
      key: 'name',
      width: 100,
    },
    {
      title: '平均评分',
      dataIndex: 'rating',
      key: 'rating',
      width: 100,
      render: (rating) => (
        <Tag color={rating >= 4.8 ? 'green' : rating >= 4.5 ? 'blue' : 'orange'}>
          {rating} 分
        </Tag>
      ),
    },
    {
      title: '完成工单数',
      dataIndex: 'completedOrders',
      key: 'completedOrders',
      width: 100,
      render: (count) => `${count} 单`,
    },
    {
      title: '评级',
      key: 'level',
      width: 80,
      render: (record) => {
        if (record.rating >= 4.8) return <Tag color="green">优秀</Tag>;
        if (record.rating >= 4.5) return <Tag color="blue">良好</Tag>;
        return <Tag color="orange">一般</Tag>;
      },
    },
  ];

  return data && data.length > 0 ? (
    <Table
      dataSource={data}
      columns={columns}
      pagination={false}
      size="small"
      rowKey="id"
      scroll={{ y: 240 }}
    />
  ) : (
    <div style={{ textAlign: 'center', padding: '50px 0', color: '#999' }}>暂无数据</div>
  );
};

export default DataAnalysis;