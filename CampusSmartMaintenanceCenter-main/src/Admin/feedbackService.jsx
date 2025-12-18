// src/services/feedbackService.js
import api from '../services/api';
import { message } from 'antd';

export const feedbackService = {
  // 获取所有评价
  getAllFeedbacks: async (params = {}) => {
    try {
      const response = await api.admin.getAllFeedbacks(params);

      // 后端返回的是 PagedResult<RatingDto>，结构为 { list, total }
      // 不再使用前端模拟数据
      if (!response) {
        throw new Error('获取评价列表失败：响应为空');
      }

      // 兼容多种返回结构，先取出原始列表
      const listRaw =
        response.list ||
        response.data?.list ||
        response.data ||
        [];

      if (!Array.isArray(listRaw)) {
        throw new Error('获取评价列表失败：返回数据格式不正确');
      }

      // 将后端 RatingDto 映射为前端使用的字段格式
      const list = listRaw.map(item => ({
        // 评价 ID
        id: item.ratingId ?? item.id,
        // 评分（1~5）
        rating: item.score ?? item.rating ?? 0,
        // 评论内容
        comment: item.comment ?? '',
        // 学生/维修工标识
        studentId: item.studentId ?? item.studentID,
        studentName: item.studentName ?? null, // 后端暂未提供姓名，这里预留字段
        repairmanId: item.staffId ?? item.repairmanId,
        repairmanName: item.repairmanName ?? null,
        // 时间字段
        createdAt: item.ratedAt ?? item.createdAt ?? item.created_at,
      }));

      return list;
    } catch (error) {
      console.error('获取评价列表失败:', error);
      message.error('获取评价列表失败');
      // 出错时返回空数组，让前端显示“暂无评价数据”，而不是测试数据
      return [];
    }
  },

  // 根据ID删除评价
  deleteFeedback: async (feedbackId) => {
    try {
      const response = await api.admin.deleteFeedback(feedbackId);

      // 后端删除接口返回 204 No Content，此时 response 可能是空对象
      // 只要没有抛异常就认为成功
      console.log('删除评价响应:', response);
      message.success('评价删除成功');
      return true;
    } catch (error) {
      console.error('删除评价失败:', error);
      message.error('删除评价失败: ' + error.message);
      throw error;
    }
  },

  // 获取维修人员信息（备用方法，如果API返回的数据中不包含维修人员姓名）
  getRepairmanInfo: (repairmanId) => {
    const repairmen = {
      1: { id: 1, name: '张师傅' },
      2: { id: 2, name: '李师傅' },
      3: { id: 3, name: '王师傅' },
      4: { id: 4, name: '赵师傅' },
    };
    return repairmen[repairmanId] || { id: repairmanId, name: '未知维修工' };
  },
};