/*
 * @Author: changluo
 * @Description: 聊天工具函数
 */
import type { ChatType } from '../types/chat';

// 有效的聊天类型列表
export const VALID_CHAT_TYPES: ChatType[] = ['general', 'agent', 'image'];

/**
 * 验证并规范化聊天类型
 * @param chatType 需要验证的聊天类型
 * @param defaultType 无效时返回的默认类型，默认为'general'
 * @returns 有效的聊天类型
 */
export function normalizeChatType(chatType: unknown, defaultType: ChatType = 'general'): ChatType {
  // 如果传入的类型是字符串且包含在有效类型列表中，则返回它
  if (typeof chatType === 'string' && VALID_CHAT_TYPES.includes(chatType as ChatType)) {
    return chatType as ChatType;
  }

  // 否则返回默认类型
  return defaultType;
} 