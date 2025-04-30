/*
 * @Author: changluo
 * @Description: 对话历史记录相关类型定义
 */
import type { Message, ChatType } from './chat';

/**
 * 对话历史记录接口
 */
export interface ConversationHistory {
  id: string;
  title: string;
  timestamp: number;
  lastMessage: string;
  messages: Message[];
  chatType: ChatType;
} 