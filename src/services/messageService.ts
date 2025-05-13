/*
 * @Author: changluo
 * @Description: 消息处理服务
 */
import type { ChatType, Message } from '../types/chat';
import type { ModelType } from '../types/api';
import { deepseekApi, siliconFlowApi } from '../api/ai';
import dayjs from 'dayjs';
import { normalizeChatType } from '../utils/chatUtils';

// 默认欢迎消息
export const DEFAULT_WELCOME_MESSAGE: Message = {
  role: 'assistant',
  content: '你好！我是AI Agent，有什么我可以帮助你的吗？',
  timestamp: Date.now(),
  chatType: 'agent',
  suggestions: ['介绍一下你自己', '今天天气如何？', '帮我写一篇文章']
};

// 请求超时设置（毫秒）
export const REQUEST_TIMEOUT = 30000; // 30秒

/**
 * 创建用户消息
 */
export function createUserMessage(content: string): Message {
  return {
    role: 'user',
    content,
    timestamp: Date.now(),
    chatType: 'agent'
  };
}

/**
 * 创建AI加载消息
 */
export function createLoadingAIMessage(): Message {
  return {
    role: 'assistant',
    content: '',
    loading: true,
    timestamp: Date.now(),
    chatType: 'agent'
  };
}

/**
 * 处理大语言模型响应
 */
export async function processModelResponse(
  model: ModelType,
  params: any,
  messageIndex: number,
  onUpdate: (content: string) => void,
  onComplete: () => void,
  signal: AbortSignal
): Promise<any> {
  let content = '';

  try {
    // 获取正确的API服务
    const apiService = model === 'deepseek' ? deepseekApi : siliconFlowApi;

    // 处理流式响应
    return apiService.chatCompletionStream(
      params,
      signal,
      (chunk) => {
        if (chunk.choices?.[0]?.delta?.content) {
          content += chunk.choices[0].delta.content;
          onUpdate(content);
        }
      },
      onComplete
    );
  } catch (error) {
    console.error('处理模型响应出错:', error);
    throw error;
  }
}

/**
 * 模拟搜索响应
 */
export async function simulateSearchResponse(
  query: string,
  onUpdate: (content: string) => void,
  onComplete: () => void,
  signal: AbortSignal
): Promise<void> {
  const fullResponse = `我使用联网搜索功能为您查询：${query}\n\n搜索结果显示，有多个相关信息来源，综合分析如下...`;

  try {
    let content = '';

    // 逐字符模拟打字效果
    for (let i = 0; i < fullResponse.length; i++) {
      if (signal.aborted) break;

      content = fullResponse.substring(0, i + 1);
      onUpdate(content);

      // 模拟打字速度
      await new Promise(resolve => setTimeout(resolve, 20 + Math.random() * 20));
    }

    onComplete();
  } catch (error) {
    console.error('模拟搜索响应出错:', error);
    throw error;
  }
}

/**
 * 格式化时间
 */
export const formatTime = (timestamp: number): string => {
  return dayjs(timestamp).format('HH:mm');
};

/**
 * 生成智能推荐问题
 */
export const generateSuggestions = (query: string, model: ModelType, history: Message[] = []): string[] => {
  // 基础模型推荐
  const baseRecommendations: Record<ModelType, string[]> = {
    'deepseek': ['告诉我更多关于DeepSeek的信息', '你能做什么？', '帮我分析一下这个问题'],
    'silicon': ['你和DeepSeek有什么区别？', '可以给我讲个故事吗？', '如何使用硅基流动模型'],
    'web': ['查找更多相关信息', '对比不同搜索结果', '总结关键观点']
  };

  // 如果上下文中有关于代码的讨论
  const userQueries = history.filter(msg => msg.role === 'user').map(msg => msg.content);

  if (userQueries.some(q => q.includes('代码') || q.includes('编程') || q.includes('开发'))) {
    return [
      '这段代码有什么优化空间？',
      '如何解决这个编程问题？',
      baseRecommendations[model]?.[0] || '告诉我更多信息'
    ];
  }

  // 根据最新查询动态调整推荐
  if (query.includes('如何') || query.includes('怎么')) {
    return [
      '这个方法的具体步骤是什么？',
      '有没有更简单的方法？',
      '这个方法的优缺点是什么？'
    ];
  }

  // 默认返回基础推荐
  return baseRecommendations[model] || [];
};

/**
 * 超时Promise包装器
 */
export const withTimeout = async <T>(promise: Promise<T>, ms = REQUEST_TIMEOUT): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`操作超时 (${ms / 1000}秒)`)), ms);
  });

  return Promise.race([promise, timeoutPromise]);
};

/**
 * 处理响应错误
 */
export const handleResponseError = (
  error: any,
  messageIndex: number,
  conversation: Message[],
  abortController: AbortController | null
): void => {
  const isTimeout = error instanceof Error && error.message.includes('操作超时');
  const errorMessage = isTimeout
    ? '请求超时，请检查网络连接或稍后再试'
    : (error instanceof Error ? error.message : '未知错误');

  if (!abortController?.signal.aborted && messageIndex >= 0 && messageIndex < conversation.length) {
    // 获取原始消息的chatType，确保是有效类型
    const originalMessage = conversation[messageIndex];
    const chatType = normalizeChatType(originalMessage.chatType);

    conversation[messageIndex] = {
      role: 'assistant',
      content: `抱歉，请求出现错误: ${errorMessage}`,
      timestamp: Date.now(),
      loading: false,
      streaming: false,
      chatType
    };
  }
};
