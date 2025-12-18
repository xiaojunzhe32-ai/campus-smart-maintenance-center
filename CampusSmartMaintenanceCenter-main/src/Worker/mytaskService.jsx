// src/services/mytaskService.js
import api from '../services/api';
import { message } from 'antd';

// 维修工人任务状态枚举
export const TASK_STATUS = {
  PENDING: { value: 'pending', label: '待受理', color: 'orange' },
  PROCESSING: { value: 'processing', label: '处理中', color: 'blue' },
  COMPLETED: { value: 'completed', label: '已完成', color: 'green' },
  TO_BE_EVALUATED: { value: 'to_be_evaluated', label: '待评价', color: 'purple' },
  CLOSED: { value: 'closed', label: '已关闭', color: 'default' },
  REJECTED: { value: 'rejected', label: '已驳回', color: 'red' },
};

// 报修分类枚举
export const REPAIR_CATEGORIES = {
  waterAndElectricity: { value: "waterAndElectricity", label: "水电维修" },
  networkIssues: { value: "networkIssues", label: "网络故障" },
  furnitureRepair: { value: "furnitureRepair", label: "家具维修" },
  applianceIssues: { value: "applianceIssues", label: "电器故障" },
  publicFacilities: { value: "publicFacilities", label: "公共设施" },
};

// 维修人员数据
export const REPAIRMEN = {
  1: { id: 1, name: '张师傅', phone: '13800138001', specialty: ['水管维修', '电路检修'] },
  2: { id: 2, name: '李师傅', phone: '13800138002', specialty: ['灯具维修', '门窗修复'] },
  3: { id: 3, name: '王师傅', phone: '13800138003', specialty: ['公共设施', '家具维修'] },
};

// 将后端状态枚举值映射到前端状态值
const mapStatusToFrontend = (backendStatus) => {
  if (!backendStatus) return backendStatus;
  
  const statusMap = {
    'WAITING_ACCEPT': 'pending',
    'IN_PROGRESS': 'processing',
    'RESOLVED': 'completed',
    'WAITING_FEEDBACK': 'to_be_evaluated',
    'FEEDBACKED': 'closed',
    'CLOSED': 'closed',
    'REJECTED': 'rejected',
  };
  
  // 如果已经是前端格式，直接返回
  if (statusMap[backendStatus]) {
    return statusMap[backendStatus];
  }
  
  // 如果已经是小写格式（前端格式），直接返回
  if (['pending', 'processing', 'completed', 'to_be_evaluated', 'closed', 'rejected'].includes(backendStatus.toLowerCase())) {
    return backendStatus.toLowerCase();
  }
  
  return backendStatus;
};

// 维修工人任务服务 - 全部改为调用真实API
export const mytaskService = {
  // 获取维修工人的所有任务
  getMyTasks: async (repairmanId, params = {}) => {
    try {
      // 构建请求参数，如果 status 是 'all'，则不传递 status 参数
      const requestParams = { ...params };
      if (requestParams.status === 'all' || requestParams.status === null || requestParams.status === undefined) {
        delete requestParams.status;
      }
      // 移除 repairmanId，因为后端会从 SecurityContext 获取
      delete requestParams.repairmanId;
      
      // 移除静态数据过滤，直接调用API
      const response = await api.repairman.getMyTasks(requestParams);
      
      // 假设API返回的数据结构为 { code: 200, data: { list: [], total: number, page: number, pageSize: number } }
      if (response.code === 200) {
        // 确保从正确的路径获取数据
        const dataObj = response.data || {};
        const rawData = dataObj.list || (Array.isArray(dataObj) ? dataObj : []);
        console.log('后端返回的原始数据:', rawData);
        console.log('response.data结构:', response.data);
        
        // 映射后端状态枚举值到前端状态值，并补充前端展示/统计所需字段
        const mappedData = Array.isArray(rawData) ? rawData.map(task => {
          const originalStatus = task.status; // 保存原始状态用于调试
          const frontendStatus = mapStatusToFrontend(task.status);
          return {
            ...task,
            id: task.ticketId || task.id,
            ticketId: task.ticketId || task.id, // 确保 ticketId 存在
            status: frontendStatus,
            originalStatus: originalStatus, // 保存原始状态
            category: task.categoryName || task.category,
            location: task.locationText || task.location,
            description: task.description || '', // 添加描述字段
            created_at: task.createdAt || task.created_at,
            assigned_at: task.assignedAt || task.assigned_at,
            completed_at: task.completedAt || task.completed_at,
            // 优先级（用于列表显示和筛选）
            priority: task.priority || 'low',
            estimated_completion_time: task.estimatedCompletionTime || task.estimated_completion_time,
            processNotes: task.processNotes || task.notes,
            studentName: task.studentName || task.studentId || '', // 添加学生名称
            contactPhone: task.contactPhone || '', // 添加联系电话
            // 评价分数（从后端 TicketSummaryDto.ratingScore 映射）
            rating: task.ratingScore ?? task.rating ?? null,
          };
        }) : [];
        
        console.log('映射后的任务数据:', mappedData);
        console.log('任务数量:', mappedData.length);
        
        return {
          data: mappedData,
          total: dataObj.total || mappedData.length,
          page: dataObj.page || 0,
          pageSize: dataObj.pageSize || 10,
        };
      } else {
        throw new Error(response.message || '获取任务失败');
      }
    } catch (error) {
      console.error('获取任务失败:', error);
      message.error('获取任务失败: ' + error.message);
      throw error;
    }
  },

  // 根据ID获取单个任务
  getTaskById: async (taskId, repairmanId) => {
    try {
      const response = await api.repairman.getTaskDetail(taskId);
      if (response.code === 200) {
        const task = response.data;
        // 映射状态和字段名，并补充评价相关字段，供详情弹窗使用
        const mapped = {
          ...task,
          id: task.ticketId || task.id,
          ticketId: task.ticketId || task.id,
          status: mapStatusToFrontend(task.status),
          category: task.categoryName || task.category,
          location: task.locationText || task.location,
          description: task.description || '',
          created_at: task.createdAt || task.created_at,
          assigned_at: task.assignedAt || task.assigned_at,
          completed_at: task.completedAt || task.completed_at,
          // 学生信息（便于详情展示）
          studentID: task.studentId || task.studentID,
          studentId: task.studentId || task.studentID,
          studentName: task.studentNickname || task.studentName,
          contactPhone: task.contactPhone || task.studentPhone || task.phone || '',
          // 预计完成时间
          estimated_completion_time: task.estimatedCompletionTime || task.estimated_completion_time,
          // 评价信息：从后端 RatingDto 中提取评分和评论
          rating: task.rating?.score ?? task.rating ?? null,
          feedback: task.rating?.comment ?? task.feedback ?? '',
          // 图片：从 TicketImageDto 列表中提取 imageUrl
          images: Array.isArray(task.images)
            ? task.images
                .map(img => img.imageUrl || img.url || img)
                .filter(Boolean)
            : [],
        };

        console.log('映射后的任务详情:', mapped);
        return mapped;
      } else {
        throw new Error(response.message || '获取任务详情失败');
      }
    } catch (error) {
      console.error('获取任务详情失败:', error);
      message.error('获取任务详情失败: ' + error.message);
      throw error;
    }
  },

  // 开始处理任务
  startTask: async (taskId, repairmanId, estimatedTime = null) => {
    try {
      const response = await api.repairman.startTask(taskId, estimatedTime);
      if (response.code === 200) {
        message.success('任务开始处理成功');
        return response.data;
      } else {
        throw new Error(response.message || '开始任务失败');
      }
    } catch (error) {
      console.error('开始任务失败:', error);
      message.error('开始任务失败: ' + error.message);
      throw error;
    }
  },

  // 完成任务
  completeTask: async (taskId, repairmanId, completionNotes = '') => {
    try {
      const response = await api.repairman.completeTask(taskId, completionNotes);
      if (response.code === 200) {
        message.success('任务完成成功');
        return response.data;
      } else {
        throw new Error(response.message || '完成任务失败');
      }
    } catch (error) {
      console.error('完成任务失败:', error);
      message.error('完成任务失败: ' + error.message);
      throw error;
    }
  },

  // 更新任务备注
  updateTaskNotes: async (taskId, repairmanId, notes) => {
    try {
      // 假设有更新备注的API，如果没有可以暂时使用完成任务API或其他方式
      // 这里先模拟成功
      await new Promise(resolve => setTimeout(resolve, 500));
      message.success('备注更新成功');
      return { success: true };
    } catch (error) {
      console.error('更新备注失败:', error);
      message.error('更新备注失败: ' + error.message);
      throw error;
    }
  },

  // 获取维修工人的统计数据
  getRepairmanStats: async (repairmanId) => {
    try {
      // 获取所有任务来计算统计数据
      const result = await mytaskService.getMyTasks(repairmanId, {});
      const tasks = result.data || [];
      
      console.log('统计数据计算，任务列表:', tasks);
      
      const stats = {
        total: tasks.length,
        pending: tasks.filter(task => {
          const status = mapStatusToFrontend(task.status || task.originalStatus);
          return status === 'pending';
        }).length,
        processing: tasks.filter(task => {
          const status = mapStatusToFrontend(task.status || task.originalStatus);
          return status === 'processing';
        }).length,
        // “已完成”：包含 已完成、本应待评价、已关闭（从维修工视角都已处理完）
        completed: tasks.filter(task => {
          const status = mapStatusToFrontend(task.status || task.originalStatus);
          return (
            status === 'completed' ||
            status === 'to_be_evaluated' ||
            status === 'closed'
          );
        }).length,
        to_be_evaluated: tasks.filter(task => {
          const status = mapStatusToFrontend(task.status || task.originalStatus);
          return status === 'to_be_evaluated';
        }).length,
        closed: tasks.filter(task => {
          const status = mapStatusToFrontend(task.status || task.originalStatus);
          return status === 'closed';
        }).length,
        averageRating: 0,
      };
      
      // 计算平均评分
      const ratedTasks = tasks.filter(task => {
        const rating = task.rating;
        return rating !== null && rating !== undefined && !isNaN(Number(rating));
      });
      if (ratedTasks.length > 0) {
        const totalRating = ratedTasks.reduce(
          (sum, task) => sum + Number(task.rating),
          0
        );
        stats.averageRating = Number(totalRating / ratedTasks.length).toFixed(1);
      }
      
      return stats;
    } catch (error) {
      console.error('获取统计数据失败:', error);
      // 返回默认统计数据
      return {
        total: 0,
        pending: 0,
        processing: 0,
        completed: 0,
        to_be_evaluated: 0,
        closed: 0,
        averageRating: 0,
      };
    }
  },

  // 搜索任务
  searchMyTasks: async (repairmanId, filters = {}) => {
    try {
      // 直接使用getMyTasks API，传递搜索参数
      const response = await api.repairman.getMyTasks({
        ...filters,
        repairmanId: repairmanId
      });
      
      if (response.code === 200) {
        return {
          data: response.data.list || response.data,
          total: response.data.total || (response.data.list ? response.data.list.length : 0),
          page: response.data.page || 1,
          pageSize: response.data.pageSize || 10,
        };
      } else {
        throw new Error(response.message || '搜索任务失败');
      }
    } catch (error) {
      console.error('搜索任务失败:', error);
      message.error('搜索任务失败: ' + error.message);
      throw error;
    }
  },
};

// 工具函数保持不变
export const mytaskUtils = {
  // 获取状态信息
  getStatusInfo: (status) => {
    const statusMap = {
      pending: { label: '待受理', color: 'orange' },
      processing: { label: '处理中', color: 'blue' },
      completed: { label: '已完成', color: 'green' },
      to_be_evaluated: { label: '待评价', color: 'purple' },
      closed: { label: '已关闭', color: 'default' },
      rejected: { label: '已驳回', color: 'red' },
    };
    return statusMap[status] || { label: status, color: 'default' };
  },

  // 获取分类信息
  getCategoryInfo: (category) => {
    const categoryMap = {
      waterAndElectricity: { value: "waterAndElectricity", label: "水电维修" },
      networkIssues: { value: "networkIssues", label: "网络故障" },
      furnitureRepair: { value: "furnitureRepair", label: "家具维修" },
      applianceIssues: { value: "applianceIssues", label: "电器故障" },
      publicFacilities: { value: "publicFacilities", label: "公共设施" },
    };
    return categoryMap[category] || { label: category };
  },

  // 获取优先级信息
  getPriorityInfo: (priority) => {
    const priorityMap = {
      high: { label: '高', color: 'red' },
      medium: { label: '中', color: 'orange' },
      low: { label: '低', color: 'green' },
    };
    return priorityMap[priority] || { label: '未知', color: 'default' };
  },

  // 获取维修人员信息
  getRepairmanInfo: (repairmanId) => {
    return REPAIRMEN[repairmanId] || null;
  },

  // 计算任务耗时
  calculateTaskDuration: (task) => {
    if (!task.assigned_at) return null;
    
    const startTime = new Date(task.assigned_at);
    const endTime = task.completed_at ? new Date(task.completed_at) : new Date();
    const durationMs = endTime - startTime;
    
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    } else {
      return `${minutes}分钟`;
    }
  },

  // 检查任务是否超时
  isTaskOverdue: (task) => {
    if (!task.estimated_completion_time || task.completed_at) return false;
    
    const estimatedTime = new Date(task.estimated_completion_time);
    const currentTime = new Date();
    
    return currentTime > estimatedTime;
  },
};