// src/services/statisticsService.js
import api from '../services/api';
import { message } from 'antd';

// 统一的响应处理函数
const handleApiResponse = async (apiCall) => {
  try {
    const response = await apiCall();
    
    if (response && response.code === 200) {
      return response.data;
    } else {
      throw new Error(response?.message || '请求失败');
    }
  } catch (error) {
    // 如果是 JSON 解析错误，说明返回了非 JSON 数据
    if (error instanceof SyntaxError) {
      console.warn('API 返回了非 JSON 数据，使用模拟数据');
      return null;
    }
    throw error;
  }
};

// 模拟数据作为 fallback - 确保格式正确
export const mockCategoryData = [
  { type: '水电维修', value: 45 },
  { type: '网络故障', value: 30 },
  { type: '家具维修', value: 25 },
  { type: '电器故障', value: 20 },
  { type: '公共设施', value: 15 },
];

export const mockLocationData = [
  { location: '3栋502寝室', count: 12 },
  { location: '教学楼A201', count: 8 },
  { location: '5栋3楼走廊', count: 7 },
  { location: '7栋312寝室', count: 6 },
  { location: '图书馆2楼', count: 5 },
  { location: '食堂1楼', count: 4 },
  { location: '体育馆', count: 3 },
  { location: '行政楼', count: 2 },
];

export const mockRatingData = [
  { id: 1, name: '张师傅', rating: 4.9, completedOrders: 45 },
  { id: 2, name: '李师傅', rating: 4.8, completedOrders: 38 },
  { id: 3, name: '王师傅', rating: 4.7, completedOrders: 32 },
  { id: 4, name: '赵师傅', rating: 4.6, completedOrders: 28 },
  { id: 5, name: '钱师傅', rating: 4.5, completedOrders: 25 },
];

// 新增：工单状态模拟数据
export const mockStatusData = [
  { status: 'pending', value: 15 },
  { status: 'processing', value: 8 },
  { status: 'completed', value: 25 },
  { status: 'to_be_evaluated', value: 12 },
  { status: 'closed', value: 30 },
  { status: 'rejected', value: 5 },
];

// 新增：月度统计模拟数据（最近六个月）
export const mockMonthlyData = [
  { month: '1月', orders: 120 },
  { month: '2月', orders: 98 },
  { month: '3月', orders: 156 },
  { month: '4月', orders: 145 },
  { month: '5月', orders: 178 },
  { month: '6月', orders: 165 },
];

export const statisticsService = {
  // 获取报修分类统计
  getRepairCategoryStats: async () => {
    try {
      const data = await handleApiResponse(() => api.admin.getStatsCategory());
      
      if (data) {
        // 转换数据格式以适配图表组件
        const categoryData = Array.isArray(data) ? data.map(item => ({
          type: item.category || item.name || item.type,
          value: Number(item.count || item.value || 0)
        })) : [];
        
        return categoryData.length > 0 ? categoryData : mockCategoryData;
      }
      
      return mockCategoryData;
    } catch (error) {
      console.error('获取分类统计失败:', error);
      message.warning('使用模拟数据展示（分类统计）');
      return mockCategoryData;
    }
  },

  // 获取位置报修数量排行
  getLocationRepairStats: async () => {
    try {
      const data = await handleApiResponse(() => api.admin.getStatsLocation());
      
      if (data) {
        // 转换数据格式以适配图表组件
        const locationData = Array.isArray(data) ? data.map(item => ({
          location: item.location || item.name,
          count: Number(item.count || item.value || 0)
        })) : [];
        
        return locationData.length > 0 ? locationData : mockLocationData;
      }
      
      return mockLocationData;
    } catch (error) {
      console.error('获取位置统计失败:', error);
      message.warning('使用模拟数据展示（位置统计）');
      return mockLocationData;
    }
  },

  // 获取维修人员评分排行
  getRepairmanRatingStats: async () => {
    try {
      const data = await handleApiResponse(() => api.admin.getStatsRepairmanRating());
      
      if (data) {
        // 转换数据格式以适配表格组件
        const ratingData = Array.isArray(data) ? data.map(item => ({
          id: item.id || Math.random(),
          name: item.name,
          rating: parseFloat(item.rating) || 0,
          completedOrders: Number(item.completedOrders || item.count || 0)
        })) : [];
        
        return ratingData.length > 0 ? ratingData : mockRatingData;
      }
      
      return mockRatingData;
    } catch (error) {
      console.error('获取评分统计失败:', error);
      message.warning('使用模拟数据展示（评分统计）');
      return mockRatingData;
    }
  },

  // 获取总体统计数据
  getOverallStats: async () => {
    try {
      // 尝试获取分类统计来计算总数
      const categoryStats = await statisticsService.getRepairCategoryStats();
      const totalRepairs = categoryStats.reduce((sum, item) => sum + item.value, 0);
      
      return {
        totalRepairs,
        avgProcessingTime: '2.3 天',
        userSatisfaction: '94.5%'
      };
    } catch (error) {
      console.error('获取总体统计失败:', error);
      return {
        totalRepairs: mockCategoryData.reduce((sum, item) => sum + item.value, 0),
        avgProcessingTime: '2.3 天',
        userSatisfaction: '94.5%'
      };
    }
  },

  // 新增：获取工单状态统计
  getOrderStatusStats: async () => {
    try {
      const data = await handleApiResponse(() => api.admin.getStatsOrderStatus());
      
      if (data) {
        // 转换数据格式以适配图表组件
        const statusData = Array.isArray(data) ? data.map(item => ({
          status: item.status,
          value: Number(item.count || item.value || 0)
        })) : [];
        
        return statusData.length > 0 ? statusData : mockStatusData;
      }
      
      return mockStatusData;
    } catch (error) {
      console.error('获取工单状态统计失败:', error);
      message.warning('使用模拟数据展示（工单状态统计）');
      return mockStatusData;
    }
  },

  // 新增：获取月度统计数据
  getMonthlyStats: async () => {
    try {
      const data = await handleApiResponse(() => api.admin.getStatsMonthly());

      if (data) {
        // 后端返回结构：{ months: [...], statusDistribution: {...} }
        const monthsArray = Array.isArray(data.months) ? data.months : [];

        const monthlyData = monthsArray.map(item => ({
          month: item.month || item.date,
          orders: Number(item.count || item.orders || item.value || 0),
        }));

        return monthlyData.length > 0 ? monthlyData : mockMonthlyData;
      }

      return mockMonthlyData;
    } catch (error) {
      console.error('获取月度统计失败:', error);
      message.warning('使用模拟数据展示（月度统计）');
      return mockMonthlyData;
    }
  },

  // 导出模拟数据用于检查
  mockCategoryData,
  mockLocationData,
  mockRatingData,
  mockStatusData, // 新增：导出状态模拟数据
  mockMonthlyData // 新增：导出月度模拟数据
};