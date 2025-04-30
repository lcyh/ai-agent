/*
 * @Author: changluo
 * @Description: 搜索服务
 */
import type { Message } from '../types/chat';
import type { ConversationHistory } from '../types/conversationHistory';
import { ref } from 'vue';

// 搜索历史记录
export const searchHistory = ref<string[]>([]);

// 搜索选项接口
export interface SearchOptions {
  currentOnly?: boolean;    // 是否只搜索当前对话
  messageType?: 'all' | 'user' | 'assistant';  // 消息类型筛选
  dateRange?: {             // 日期范围
    start?: number;
    end?: number;
  };
  caseSensitive?: boolean;  // 是否区分大小写
}

// 搜索结果项接口
export interface SearchResultItem {
  conversationId: string;
  conversationTitle: string;
  messageIndex: number;
  message: Message;
  timestamp: number;
  matchedText: string;
  highlight: { start: number, end: number }[];
}

/**
 * 对话内容搜索
 * @param query 搜索关键词
 * @param conversations 对话历史数据
 * @param currentConversation 当前对话内容
 * @param options 搜索选项
 * @returns 搜索结果
 */
export function searchConversations(
  query: string,
  conversations: ConversationHistory[],
  currentConversation: Message[],
  options: SearchOptions = {}
): SearchResultItem[] {
  if (!query.trim()) return [];

  // 保存搜索记录
  saveSearchQuery(query);

  const results: SearchResultItem[] = [];
  const queryLower = options.caseSensitive ? query : query.toLowerCase();

  // 搜索当前对话
  if (!options.currentOnly) {
    conversations.forEach(conv => {
      // 日期范围过滤
      if (options.dateRange) {
        if (options.dateRange.start && conv.timestamp < options.dateRange.start) return;
        if (options.dateRange.end && conv.timestamp > options.dateRange.end) return;
      }

      conv.messages.forEach((msg, index) => {
        // 消息类型过滤
        if (options.messageType && options.messageType !== 'all' && msg.role !== options.messageType) return;

        // 内容匹配
        const content = options.caseSensitive ? msg.content : msg.content.toLowerCase();
        if (content.includes(queryLower)) {
          const highlights = findAllMatches(content, queryLower);

          results.push({
            conversationId: conv.id,
            conversationTitle: conv.title,
            messageIndex: index,
            message: msg,
            timestamp: msg.timestamp,
            matchedText: extractMatchContext(msg.content, queryLower),
            highlight: highlights
          });
        }
      });
    });
  }

  // 搜索当前对话
  currentConversation.forEach((msg, index) => {
    // 消息类型过滤
    if (options.messageType && options.messageType !== 'all' && msg.role !== options.messageType) return;

    // 内容匹配
    const content = options.caseSensitive ? msg.content : msg.content.toLowerCase();
    if (content.includes(queryLower)) {
      const highlights = findAllMatches(content, queryLower);

      results.push({
        conversationId: 'current',
        conversationTitle: '当前对话',
        messageIndex: index,
        message: msg,
        timestamp: msg.timestamp,
        matchedText: extractMatchContext(msg.content, queryLower),
        highlight: highlights
      });
    }
  });

  // 结果按时间倒序排序
  return results.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * 保存搜索记录
 */
function saveSearchQuery(query: string): void {
  // 去重并保持最新的10条记录
  const trimmedQuery = query.trim();
  if (!trimmedQuery || searchHistory.value.includes(trimmedQuery)) return;

  searchHistory.value = [trimmedQuery, ...searchHistory.value].slice(0, 10);

  // 可以实现本地存储以持久化搜索记录
  try {
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value));
  } catch (e) {
    console.warn('无法保存搜索历史到本地存储');
  }
}

/**
 * 加载搜索历史
 */
export function loadSearchHistory(): void {
  try {
    const history = localStorage.getItem('searchHistory');
    if (history) {
      searchHistory.value = JSON.parse(history);
    }
  } catch (e) {
    console.warn('无法从本地存储加载搜索历史');
  }
}

/**
 * 清除搜索历史
 */
export function clearSearchHistory(): void {
  searchHistory.value = [];
  try {
    localStorage.removeItem('searchHistory');
  } catch (e) {
    console.warn('无法清除本地存储中的搜索历史');
  }
}

/**
 * 查找所有匹配位置
 */
function findAllMatches(text: string, query: string): { start: number, end: number }[] {
  const matches: { start: number, end: number }[] = [];
  let index = 0;

  while ((index = text.indexOf(query, index)) > -1) {
    matches.push({
      start: index,
      end: index + query.length
    });
    index += query.length;
  }

  return matches;
}

/**
 * 提取匹配上下文
 */
function extractMatchContext(text: string, query: string): string {
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return text.substring(0, 100);

  // 提取匹配周围的上下文
  const contextStart = Math.max(0, index - 50);
  const contextEnd = Math.min(text.length, index + query.length + 50);

  let result = text.substring(contextStart, contextEnd);
  if (contextStart > 0) result = '...' + result;
  if (contextEnd < text.length) result = result + '...';

  return result;
}

/**
 * 生成搜索建议
 */
export function generateSearchSuggestions(
  query: string,
  conversations: ConversationHistory[]
): string[] {
  if (!query || query.length < 2) return [];

  const queryLower = query.toLowerCase();
  const suggestions = new Set<string>();

  // 从历史对话标题中提取
  conversations.forEach(conv => {
    if (conv.title.toLowerCase().includes(queryLower)) {
      suggestions.add(conv.title);
    }
  });

  // 从搜索历史中提取
  searchHistory.value.forEach(item => {
    if (item.toLowerCase().includes(queryLower)) {
      suggestions.add(item);
    }
  });

  // 返回不超过5个建议
  return [...suggestions].slice(0, 5);
} 