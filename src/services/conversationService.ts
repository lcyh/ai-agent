/*
 * @Author: changluo
 * @Description: 对话管理相关服务
 */
import { ref, reactive, computed } from 'vue';
import type { Message, ChatType } from '../types/chat';
import type { ConversationHistory } from '../types/conversationHistory';
import type { ModelType } from '../types/api';
import { formatTime, DEFAULT_WELCOME_MESSAGE } from './messageService';
import { normalizeChatType } from '../utils/chatUtils';

// 根据对话类型提供不同的欢迎消息
const getDefaultWelcomeMessage = (chatType: ChatType): Message => {
  switch (chatType) {
    case 'agent':
      return {
        role: 'assistant',
        content: '你好！我是AI Agent，可以帮你解决各种问题，包括信息搜索和编程问题，请问有什么我可以帮助你的?',
        timestamp: Date.now(),
        chatType: 'agent',
        suggestions: ['解决编程问题', '搜索最新资讯', '帮我优化代码']
      };
    case 'general':
    default:
      return {
        role: 'assistant',
        content: '你好！我是AI助手，有什么我可以帮你的？',
        timestamp: Date.now(),
        chatType: 'general',
        suggestions: ['介绍一下你自己', '今天天气如何?', '写一篇文章', '请帮我写一下代码']
      };
  }
};

/**
 * 使用对话管理服务创建聊天功能
 */
export function useConversationManager() {
  // 状态变量
  const activeConversationId = ref<string>('default');
  const historyConversations = ref<ConversationHistory[]>([]);
  const conversation = reactive<Message[]>([
    { ...DEFAULT_WELCOME_MESSAGE, timestamp: Date.now() - 60000, chatType: 'general' }
  ]);
  const activeChatType = ref<ChatType>('general');

  // 按时间从近到远排序的最近对话
  const recentConversations = computed(() => {
    return [...historyConversations.value].sort((a, b) => b.timestamp - a.timestamp);
  });

  // 按对话类型筛选的对话列表
  const conversationsByType = computed(() => {
    const result: Record<ChatType, ConversationHistory[]> = {
      general: [],
      agent: []
    };

    // 确保使用有效的聊天类型
    historyConversations.value.forEach(conv => {
      // 确保使用有效的聊天类型
      const chatType = normalizeChatType(conv.chatType);

      result[chatType].push({ ...conv, chatType });
    });

    // 对每种类型的对话按时间从近到远排序
    Object.keys(result).forEach(type => {
      result[type as ChatType].sort((a, b) => b.timestamp - a.timestamp);
    });

    return result;
  });

  // 生成唯一ID
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  /**
   * 创建新对话
   */
  const newConversation = (type: ChatType = 'general') => {
    // 如果当前对话有内容，保存到历史记录
    if (conversation.length > 1) {
      saveCurrentConversation();
    }

    // 创建新的对话ID
    activeConversationId.value = generateId();

    // 更新当前活跃对话类型
    activeChatType.value = type;

    // 获取对应类型的欢迎消息
    const welcomeMessage = getDefaultWelcomeMessage(type);

    // 创建新的对话对象并添加到历史记录
    const typeName = {
      general: '新对话',
      agent: 'AI Agent对话',
      image: '图像对话'
    }[type];

    const newConv: ConversationHistory = {
      id: activeConversationId.value,
      title: `${typeName} ${formatTime(Date.now())}`,
      timestamp: Date.now(),
      lastMessage: '',
      messages: [welcomeMessage],
      chatType: type
    };

    historyConversations.value.unshift(newConv);

    // 清空当前对话内容并添加欢迎消息
    conversation.splice(0, conversation.length);
    conversation.push(welcomeMessage);
  };

  /**
   * 保存当前对话到历史记录
   */
  const saveCurrentConversation = () => {
    // 获取对话概要作为标题
    const userMessages = conversation.filter(msg => msg.role === 'user');
    const title = userMessages.length > 0
      ? userMessages[0].content.substring(0, 20) + (userMessages[0].content.length > 20 ? '...' : '')
      : `对话 ${formatTime(Date.now())}`;

    // 获取最后一条消息概要
    const lastMessage = conversation[conversation.length - 1]?.content.substring(0, 30) || '';

    // 在历史记录中查找当前对话
    const existingIndex = historyConversations.value.findIndex(conv => conv.id === activeConversationId.value);

    if (existingIndex >= 0) {
      // 更新已有对话
      historyConversations.value[existingIndex] = {
        ...historyConversations.value[existingIndex],
        title,
        timestamp: Date.now(),
        lastMessage,
        messages: [...conversation]
      };
    } else {
      // 添加新对话到历史
      historyConversations.value.push({
        id: activeConversationId.value,
        title,
        timestamp: Date.now(),
        lastMessage,
        messages: [...conversation],
        chatType: activeChatType.value
      });
    }
  };

  /**
   * 切换到历史对话
   */
  const switchToConversation = (id: string) => {
    // 保存当前对话
    if (conversation.length > 1) {
      saveCurrentConversation();
    }

    // 更新当前活跃对话ID
    activeConversationId.value = id;

    // 加载选中的对话
    const selectedConv = historyConversations.value.find(conv => conv.id === id);
    if (selectedConv) {
      // 确保使用有效的聊天类型
      const chatType = normalizeChatType(selectedConv.chatType);

      // 更新当前活跃对话类型
      activeChatType.value = chatType;

      // 更新对话内容
      conversation.splice(0, conversation.length);
      selectedConv.messages.forEach(msg => {
        // 确保消息的chatType有效
        const msgChatType = normalizeChatType(msg.chatType, chatType);

        conversation.push({ ...msg, chatType: msgChatType });
      });
    }
  };

  /**
   * 切换对话类型并创建新对话
   */
  const switchChatType = (type: ChatType) => {
    // 如果已经是当前类型，不做任何操作
    if (type === activeChatType.value) return;

    // 创建指定类型的新对话
    newConversation(type);
  };

  /**
   * 完成消息处理
   */
  const finalizeAIMessage = (
    aiMessageIndex: number,
    responseContent: string,
    messageContent: string,
    selectedModel: ModelType
  ) => {
    import('./messageService').then(({ generateSuggestions }) => {
      if (aiMessageIndex >= 0 && aiMessageIndex < conversation.length) {
        // 生成智能推荐问题
        const suggestions = generateSuggestions(
          messageContent,
          selectedModel,
          conversation.slice(0, -2)
        );

        // 获取当前对话类型
        const currentChatType = activeChatType.value;

        // 更新最终消息状态
        conversation[aiMessageIndex] = {
          role: 'assistant',
          content: responseContent,
          timestamp: Date.now(),
          loading: false,
          streaming: false,
          suggestions,
          chatType: currentChatType
        };

        // 如果消息包含数据相关关键词，添加图表
        if (messageContent.includes('数据') ||
          messageContent.includes('图表') ||
          messageContent.includes('统计')) {
          conversation[aiMessageIndex].chart = {
            title: '相关数据统计图表'
          };
        }
      }
    });
  };

  /**
   * 更新消息UI
   */
  const updateMessageUI = (messageIndex: number, content: string): void => {
    if (messageIndex >= 0 && messageIndex < conversation.length) {
      // 创建新对象以确保Vue可以检测到变化
      conversation[messageIndex] = {
        ...conversation[messageIndex],
        content,
        loading: true,
        streaming: true
      };
    }
  };

  // 初始化默认对话
  const initializeConversation = () => {
    // 创建默认对话
    if (historyConversations.value.length === 0) {
      historyConversations.value.push({
        id: activeConversationId.value,
        title: '默认对话',
        timestamp: Date.now(),
        lastMessage: DEFAULT_WELCOME_MESSAGE.content,
        messages: [...conversation],
        chatType: 'general'
      });
    }
  };

  return {
    activeConversationId,
    conversation,
    historyConversations,
    recentConversations,
    conversationsByType,
    activeChatType,
    newConversation,
    saveCurrentConversation,
    switchToConversation,
    switchChatType,
    finalizeAIMessage,
    updateMessageUI,
    initializeConversation
  };
}

/**
 * 获取对话类型的显示名称
 */
export const getConversationTypeLabel = (type: ChatType): string => {
  const labels: Record<ChatType, string> = {
    general: '通用对话',
    agent: 'Agent对话'
  };

  return labels[type] || '未知对话';
}; 