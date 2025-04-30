/*
 * @Author: changluo
 * @Description: 聊天相关工具函数
 */
import type { ModelType } from '../../api/ai';
import type { Message } from './types';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';

/**
 * 请求超时设置（毫秒）
 */
export const REQUEST_TIMEOUT = 30000; // 30秒

/**
 * 格式化时间
 * @param timestamp 时间戳
 * @returns 格式化后的时间字符串 HH:MM
 */
export const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * 自动滚动到底部
 * 优化后的滚动方法，更可靠地滚动到聊天底部
 */
export const scrollToBottom = (): void => {
  // 更短延迟以使滚动更及时
  setTimeout(() => {
    // 查找聊天内容容器
    const container = document.querySelector('.overflow-auto');
    if (container) {
      // 计算需要额外考虑的底部安全距离（防止内容被输入框遮挡）
      const safetyMargin = 150;

      // 先使用平滑滚动提供更好的用户体验
      container.scrollTo({
        top: container.scrollHeight + safetyMargin,
        behavior: 'smooth'
      });

      // 再次尝试滚动，确保内容完全滚动到位
      setTimeout(() => {
        container.scrollTo({
          top: container.scrollHeight + safetyMargin,
          behavior: 'auto'
        });

        // 第三次尝试，解决某些浏览器的渲染延迟问题
        setTimeout(() => {
          container.scrollTo({
            top: container.scrollHeight + safetyMargin,
            behavior: 'auto'
          });
        }, 300);
      }, 150);
    }
  }, 10);
};

/**
 * 根据上下文生成更智能的推荐问题
 * @param query 当前查询
 * @param model 模型类型
 * @param history 历史消息
 * @returns 推荐问题列表
 */
export const generateContextAwareSuggestions = (query: string, model: ModelType, history: Message[]): string[] => {
  // 分析用户最近的查询和AI回复
  const userQueries = history
    .filter(msg => msg.role === 'user')
    .map(msg => msg.content);

  // 获取基础推荐问题
  const baseSuggestions = generateSuggestions(query, model);

  // 如果上下文中有关于代码的讨论
  if (userQueries.some(q => q.includes('代码') || q.includes('编程') || q.includes('开发'))) {
    return [
      '这段代码有什么优化空间？',
      '如何解决这个编程问题？',
      ...baseSuggestions.slice(0, 1)
    ];
  }

  // 如果上下文中有关于AI或模型的讨论
  if (userQueries.some(q => q.includes('AI') || q.includes('模型') || q.includes('人工智能'))) {
    return [
      '这个AI模型的优势是什么？',
      'AI在这个领域的应用前景如何？',
      ...baseSuggestions.slice(0, 1)
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
  return baseSuggestions;
};

/**
 * 生成基础推荐问题
 * @param query 当前查询
 * @param model 模型类型
 * @returns 推荐问题列表
 */
export const generateSuggestions = (query: string, model: ModelType): string[] => {
  switch (model) {
    case 'deepseek':
      return ['告诉我更多关于DeepSeek的信息', '你能做什么？', '帮我分析一下这个问题'];
    case 'silicon':
      return ['你和DeepSeek有什么区别？', '可以给我讲个故事吗？', '如何使用硅基流动模型'];
    case 'web':
      return ['查找更多相关信息', '对比不同搜索结果', '总结关键观点'];
    default:
      return [];
  }
};

/**
 * 默认欢迎消息
 */
export const DEFAULT_WELCOME_MESSAGE: Message = {
  role: 'assistant',
  content: '你好！我是AI Agent，有什么我可以帮助你的吗？',
  timestamp: Date.now(),
  suggestions: ['介绍一下你自己', '今天天气如何？', '帮我写一篇文章']
};

/**
 * 创建用户消息
 * @param content 消息内容
 * @returns 用户消息对象
 */
export const createUserMessage = (content: string): Message => ({
  role: 'user',
  content,
  timestamp: Date.now()
});

/**
 * 创建AI消息（加载状态）
 * @returns AI消息对象
 */
export const createLoadingAIMessage = (): Message => ({
  role: 'assistant',
  content: '',
  timestamp: Date.now(),
  loading: true,
  streaming: true
});

/**
 * 简化版超时Promise
 * @param promise 原始Promise
 * @param ms 超时时间（毫秒）
 * @returns Promise
 */
export const withTimeout = async <T>(promise: Promise<T>, ms = 30000): Promise<T> => {
  // 创建一个超时Promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`操作超时 (${ms / 1000}秒)`)), ms);
  });

  // 使用Promise.race
  return Promise.race([promise, timeoutPromise]);
};

// 以下是从Home.vue抽离的函数

/**
 * 初始化Markdown渲染器
 */
export const initMarkdown = () => {
  return new MarkdownIt({
    highlight: function (str: string, lang: string) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          const highlighted = hljs.highlight(str, { language: lang }).value;

          // 生成行号
          const lines = str.split('\n');
          const lineNumbers = lines.map((_, index) => `<span class="line-number">${index + 1}</span>`).join('');

          return `<div class="code-block-container">
                    <div class="code-block-header">
                      <div class="code-lang-tag">${lang.toUpperCase()}</div>
                      <div class="code-actions">
                        <button class="copy-button" data-code="${encodeURIComponent(str)}">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                          <span>复制</span>
                        </button>
                        <button class="download-button" data-code="${encodeURIComponent(str)}" data-lang="${lang}">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                          <span>下载</span>
                        </button>
                      </div>
                    </div>
                    <div class="code-block-body">
                      <div class="line-numbers">${lineNumbers}</div>
                      <pre class="hljs"><code>${highlighted}</code></pre>
                    </div>
                  </div>`;
        } catch (__) { }
      }
      return ''; // 使用默认的转义
    }
  });
};

/**
 * 检查消息是否包含代码块
 * @param content 消息内容
 * @returns 是否包含代码块
 */
export const hasCodeBlock = (content: string): boolean => {
  return content.includes('```');
};

/**
 * 使用markdown-it格式化包含代码块的消息
 * @param content 消息内容
 * @returns 格式化后的HTML
 */
export const formatMessageWithCodeBlocks = (content: string): string => {
  const markdown = initMarkdown();
  return markdown.render(content);
};

/**
 * 显示复制成功提示
 * @param text 提示文本
 */
export const showCopyTooltip = (text: string): void => {
  // 创建临时元素显示提示
  const toast = document.createElement('div');
  toast.className = 'copy-toast';

  // 为复制成功和失败设置不同图标
  const isSuccess = text.includes('成功');
  const iconSvg = isSuccess
    ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
    : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12" y2="16"></line></svg>';

  toast.innerHTML = `
    <div class="flex items-center gap-2">
      <span class="toast-icon">${iconSvg}</span>
      <span>${text}</span>
    </div>
  `;

  document.body.appendChild(toast);

  // 动画显示并自动移除
  setTimeout(() => {
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 1700);
  }, 0);
};

/**
 * 复制文本到剪贴板
 * @param text 要复制的文本
 */
export const copyToClipboard = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text);
    showCopyTooltip('复制成功');
  } catch (err) {
    console.error('复制失败:', err);
    showCopyTooltip('复制失败，请手动复制');
  }
};

/**
 * 复制消息内容
 * @param content 消息内容
 */
export const copyMessageContent = (content: string): void => {
  copyToClipboard(content);
};

/**
 * 获取语言对应的文件扩展名
 * @param lang 语言类型
 * @returns 对应的文件扩展名
 */
export const getFileExtension = (lang: string): string => {
  const extensionMap: Record<string, string> = {
    'javascript': 'js',
    'typescript': 'ts',
    'python': 'py',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'csharp': 'cs',
    'go': 'go',
    'ruby': 'rb',
    'php': 'php',
    'swift': 'swift',
    'kotlin': 'kt',
    'rust': 'rs',
    'scala': 'scala',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'less': 'less',
    'json': 'json',
    'xml': 'xml',
    'yaml': 'yaml',
    'markdown': 'md',
    'shell': 'sh',
    'bash': 'sh',
    'sql': 'sql',
    'dockerfile': 'Dockerfile',
    'plaintext': 'txt'
  };

  // 将语言名称转为小写以增强匹配能力
  const langLower = lang.toLowerCase();
  return extensionMap[langLower] || langLower;
};

/**
 * 下载代码文件
 * @param code 代码内容
 * @param lang 语言类型
 */
export const downloadCode = (code: string, lang: string): void => {
  // 获取正确的文件扩展名
  const extension = getFileExtension(lang);

  // 根据语言设置正确的MIME类型
  let mimeType = 'text/plain';
  if (extension === 'html') mimeType = 'text/html';
  else if (extension === 'css') mimeType = 'text/css';
  else if (extension === 'json') mimeType = 'application/json';
  else if (extension === 'js') mimeType = 'application/javascript';
  else if (extension === 'xml') mimeType = 'application/xml';

  // 创建文件并下载
  const blob = new Blob([code], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `code.${extension}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showCopyTooltip('代码已下载');
};

/**
 * 防抖函数
 * @param fn 要执行的函数
 * @param delay 延迟时间
 * @returns 防抖处理后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: number | null = null;
  return function (...args: Parameters<T>) {
    if (timer) {
      clearTimeout(timer);
    }
    timer = window.setTimeout(() => {
      fn(...args);
      timer = null;
    }, delay);
  };
}

/**
 * 完成消息处理
 * @param conversation 对话数组
 * @param aiMessageIndex AI消息索引
 * @param responseContent 响应内容
 * @param messageContent 用户消息内容
 * @param abortController 中断控制器
 * @param selectedModel 选定的模型
 */
export const finalizeAIMessage = (
  conversation: Message[],
  aiMessageIndex: number,
  responseContent: string,
  messageContent: string,
  abortController: AbortController | null,
  selectedModel: ModelType,
) => {
  if (aiMessageIndex >= 0 && aiMessageIndex < conversation.length && !abortController?.signal.aborted) {
    console.log('完成消息处理，最终内容长度:', responseContent.length);

    // 检查消息内容是否为空
    if (!responseContent.trim()) {
      console.warn('收到空响应，使用默认回复');
      responseContent = '抱歉，我无法为您提供有效回复。请尝试重新表述您的问题。';
    }

    // 生成智能推荐问题
    const suggestions = generateContextAwareSuggestions(
      messageContent,
      selectedModel,
      conversation.slice(0, -2)
    );

    // 更新最终消息状态
    conversation[aiMessageIndex] = {
      role: 'assistant',
      content: responseContent,
      timestamp: Date.now(),
      loading: false,
      streaming: false,
      suggestions
    };

    // 如果是联网搜索模式且消息包含数据相关关键词，添加图表
    if (selectedModel === 'web' &&
      (messageContent.includes('数据') ||
        messageContent.includes('图表') ||
        messageContent.includes('统计'))) {
      console.log('添加图表组件到消息中');
      conversation[aiMessageIndex].chart = {
        title: '相关数据统计图表'
      };
    }

    // 滚动到底部
    scrollToBottom();

    console.log('消息处理完成');
  } else {
    console.warn('无法完成消息处理：消息索引无效或请求已取消');
  }
};

/**
 * 更新消息UI
 * @param conversation 对话数组
 * @param messageIndex 消息索引
 * @param content 内容
 */
export const updateMessageUI = (conversation: Message[], messageIndex: number, content: string): void => {
  if (messageIndex >= 0 && messageIndex < conversation.length) {
    // 创建新对象以确保Vue可以检测到变化
    conversation[messageIndex] = {
      ...conversation[messageIndex],
      content: content,
      loading: true,
      streaming: true
    };
  }
};

/**
 * 处理响应错误
 * @param error 错误对象
 * @param messageIndex 消息索引
 * @param conversation 对话数组
 * @param abortController 中断控制器
 */
export const handleResponseError = (
  error: any,
  messageIndex: number,
  conversation: Message[],
  abortController: AbortController | null
): void => {
  // 区分超时和其他错误
  const isTimeout = error instanceof Error && error.message.includes('操作超时');
  const errorMessage = isTimeout
    ? '请求超时，请检查网络连接或稍后再试'
    : (error instanceof Error ? error.message : '未知错误');

  console.error('响应处理错误:', errorMessage);

  if (!abortController?.signal.aborted && messageIndex >= 0 && messageIndex < conversation.length) {
    // 更新错误消息
    conversation[messageIndex] = {
      role: 'assistant',
      content: `抱歉，请求出现错误: ${errorMessage}`,
      timestamp: Date.now(),
      loading: false,
      streaming: false
    };
  }
};

/**
 * 为代码块添加事件监听
 */
export const setupCodeBlockEventListeners = (): void => {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    // 处理代码块复制按钮
    const copyButton = target.closest('.copy-button');
    if (copyButton) {
      const code = copyButton.getAttribute('data-code');
      if (code) {
        copyToClipboard(decodeURIComponent(code));
      }
    }

    // 处理代码块下载按钮
    const downloadButton = target.closest('.download-button');
    if (downloadButton) {
      const code = downloadButton.getAttribute('data-code');
      const lang = downloadButton.getAttribute('data-lang') || 'txt';
      if (code) {
        downloadCode(decodeURIComponent(code), lang);
      }
    }
  });
}; 