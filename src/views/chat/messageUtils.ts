/*
 * @Author: changluo
 * @Description: 消息处理相关工具函数
 */
import type { Message } from './types';
import type { ModelType } from '../../api/ai';
import { deepseekApi, siliconFlowApi } from '../../api/ai';

// 定义API响应数据块类型
interface ChunkResponse {
  choices?: Array<{
    delta?: {
      content?: string;
    };
  }>;
}

// 定义回调函数类型
export interface MessageCallbacks {
  onContentUpdate: (content: string) => void;
  onComplete: () => void;
  onStatusChange?: (loading: boolean, streaming: boolean) => void;
  updateUI: (messageIndex: number, content: string) => void;
}

/**
 * 处理大语言模型响应
 * @param model 模型类型
 * @param params API参数
 * @param aiMessageIndex 消息索引
 * @param messageContent 原始消息内容
 * @param callbacks 回调函数集合
 * @param signal 中断信号
 */
export async function processLLMResponse(
  model: ModelType,
  params: any,
  aiMessageIndex: number,
  messageContent: string,
  callbacks: MessageCallbacks,
  signal: AbortSignal
): Promise<void> {
  let currentContent = '';
  const { onContentUpdate, onComplete, updateUI } = callbacks;

  try {
    // 获取正确的API服务
    const apiService = model === 'deepseek' ? deepseekApi : siliconFlowApi;
    console.log('开始处理流式响应，使用API服务:', model);

    // 调用API并处理流式响应
    const streamPromise = apiService.chatCompletionStream(
      params,
      signal,
      (chunk: ChunkResponse) => {
        // 处理每个响应块
        if (chunk.choices && chunk.choices.length > 0) {
          const content = chunk.choices[0].delta?.content || '';
          if (content) {
            // 更新内容
            currentContent += content;
            onContentUpdate(currentContent);

            // 更新UI
            updateUI(aiMessageIndex, currentContent);
          }
        }
      },
      () => {
        // 响应完成的回调
        console.log('API回调：流式响应完成');
        onComplete();
      }
    );

    console.log('流式响应API调用已完成');
    return streamPromise;
  } catch (error) {
    console.error('处理LLM响应时出错:', error);
    throw error; // 向上传递错误
  }
}

/**
 * 模拟搜索响应
 * @param query 查询内容
 * @param aiMessageIndex 消息索引
 * @param onContentUpdate 内容更新回调
 * @param onComplete 完成回调
 * @param signal 中断信号
 */
export async function simulateSearchResponse(
  query: string,
  aiMessageIndex: number,
  onContentUpdate: (content: string) => void,
  onComplete: () => void,
  signal: AbortSignal
): Promise<void> {
  console.log('使用联网搜索模式，模拟API响应');
  const fullResponse = `我使用联网搜索功能为您查询：${query}\n\n搜索结果显示，有多个相关信息来源，综合分析如下...`;

  try {
    console.log('开始模拟打字效果');
    let currentContent = '';

    // 逐字符模拟打字效果
    for (let i = 0; i < fullResponse.length; i++) {
      if (signal.aborted) {
        console.log('请求被取消，停止模拟打字');
        break;
      }

      // 每次添加一个字符
      currentContent = fullResponse.substring(0, i + 1);
      onContentUpdate(currentContent);

      // 更自然的打字速度
      await new Promise(resolve => setTimeout(resolve, 20 + Math.random() * 20));
    }

    console.log('模拟打字完成');
    onComplete();
  } catch (error) {
    console.error('模拟搜索响应时出错:', error);
    throw error;
  }
}

/**
 * 更新消息UI状态
 * @param messageIndex 消息索引
 * @param content 新的消息内容
 * @param conversation 对话数组
 */
export function updateMessageUI(
  messageIndex: number,
  content: string,
  conversation: Message[]
): void {
  if (messageIndex >= 0 && messageIndex < conversation.length) {
    // 创建新对象以确保Vue可以检测到变化
    conversation[messageIndex] = {
      ...conversation[messageIndex],
      content: content,
      loading: true,
      streaming: true
    };
  }
}

/**
 * 处理API响应错误
 * @param error 错误对象
 * @param messageIndex 消息索引
 * @param conversation 对话数组
 */
export function handleResponseError(
  error: any,
  messageIndex: number,
  conversation: Message[]
): void {
  // 区分超时和其他错误
  const isTimeout = error instanceof Error && error.message.includes('操作超时');
  const errorMessage = isTimeout
    ? '请求超时，请检查网络连接或稍后再试'
    : (error instanceof Error ? error.message : '未知错误');

  console.error('响应处理错误:', errorMessage);

  if (messageIndex >= 0 && messageIndex < conversation.length) {
    // 更新错误消息
    conversation[messageIndex] = {
      role: 'assistant',
      content: `抱歉，请求出现错误: ${errorMessage}`,
      timestamp: Date.now(),
      loading: false,
      streaming: false
    };
  }
}

/**
 * 防抖函数
 * @param fn 要执行的函数
 * @param delay 延迟时间(ms)
 * @returns 防抖处理后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: number | null = null;

  return function (this: any, ...args: Parameters<T>) {
    if (timer) clearTimeout(timer);

    timer = window.setTimeout(() => {
      fn.apply(this, args);
      timer = null;
    }, delay);
  };
}

/**
 * 判断消息是否包含图表关键词
 * @param content 消息内容
 * @returns 是否可能需要图表
 */
export function shouldShowChart(content: string): boolean {
  const chartKeywords = ['图表', '图形', '统计', 'chart', 'graph', 'plot', '趋势', '数据'];
  return chartKeywords.some(keyword => content.toLowerCase().includes(keyword));
}

/**
 * 判断消息是否来自用户
 * @param message 消息对象
 * @returns 是否是用户消息
 */
export function isUserMessage(message: Message): boolean {
  return message.role === 'user';
}

/**
 * 获取适合当前内容的模型类型
 * @param content 消息内容
 * @returns 推荐的模型类型
 */
export function getAppropriateModel(content: string): ModelType {
  // 根据内容复杂度选择模型
  if (content.length > 1000 || content.includes('```')) {
    return 'deepseek';
  }

  if (shouldShowChart(content)) {
    return 'web';
  }

  return 'silicon';
}

// 为全局变量声明类型定义，用于TypeScript编译
declare global {
  interface Window {
    abortController?: AbortController;
  }
} 