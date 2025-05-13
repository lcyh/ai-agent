/*
 * @Author: changluo
 * @Description: 聊天相关类型定义
 */
import type { ModelType } from './api';

// 定义对话类型
export type ChatType = 'agent';

/**
 * 聊天消息接口
 */
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  loading?: boolean;
  streaming?: boolean;
  suggestions?: string[];
  chatType?: ChatType; // 对话类型，用于区分不同的对话场景

  /**
   * 图表相关数据，仅在特定条件下显示
   * 目前主要在联网搜索模式且查询包含数据相关关键词时使用
   */
  chart?: {
    title: string;
    // 可以根据需要添加更多图表相关属性
  };
}

// 导出ModelType类型供使用
export type { ModelType }; 