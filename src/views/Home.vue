<!--
 * @Author: changluo
 * @Description: 
 * @LastEditors: luc19964 luochang@gopherasset.com
-->
<template>
  <div class="main-layout" :class="{'text-sm': isMobile, [`chat-type-${activeChatType}`]: true}">
    <!-- 左侧导航栏组件 -->
    <SideNavigation 
      :isCollapsed="isCollapsed"
      :isMobile="isMobile"
      :recentConversations="recentConversations"
      :activeChatType="activeChatType"
      :conversationsByType="conversationsByType"
      @toggle-collapse="isCollapsed = !isCollapsed"
      @new-conversation="newConversation"
      @switch-conversation="switchToConversation"
      @clear-all-conversations="clearAllConversations"
    />

    <!-- 聊天区域组件 -->
    <ChatArea 
      :conversation="conversation"
      :isMobile="isMobile"
      :selectedModel="selectedModel"
      :isLoading="isLoading"
      :activeChatType="activeChatType"
      :recentConversations="recentConversations"
      @toggle-collapse="isCollapsed = !isCollapsed"
      @send-message="sendMessage"
      @select-model="selectModel"
      @cancel-request="cancelRequest"
      @jump-to-message="jumpToMessage"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import type { ModelType } from '../types/api';
import type { ChatType } from '../types/chat';
import { modelConfig } from '../api/ai';
import { 
  REQUEST_TIMEOUT,
  createUserMessage,
  createLoadingAIMessage,
  withTimeout,
  handleResponseError,
  processModelResponse,
  simulateSearchResponse
} from '../services/messageService';
import { scrollToBottom, debouncedScroll, throttledResize, setupCodeBlockEventListeners } from '../services/uiService';
import { useConversationManager } from '../services/conversationService';
import { normalizeChatType } from '../utils/chatUtils';
import SideNavigation from '../components/SideNavigation.vue';
import ChatArea from '../components/ChatArea.vue';

// 对话管理
const {
  activeConversationId,
  conversation,
  historyConversations,
  recentConversations,
  conversationsByType,
  activeChatType,
  newConversation,
  saveCurrentConversation,
  switchToConversation,
  finalizeAIMessage,
  updateMessageUI,
  initializeConversation
} = useConversationManager();

// 界面状态
const isCollapsed = ref(false);
const isMobile = ref(window.innerWidth < 768);
const isLoading = ref(false);
const selectedModel = ref<ModelType>('deepseek');
const abortController = ref<AbortController | null>(null);

/**
 * 处理窗口大小变化
 */
const handleResize = () => {
  isMobile.value = window.innerWidth < 768;
  if (isMobile.value) {
    isCollapsed.value = true;
  }
};

/**
 * 清空所有对话历史
 */
const clearAllConversations = () => {
  // 保留当前会话
  const currentConversation = [...conversation];
  
  // 清空历史记录
  historyConversations.value = [];
  
  // 重新初始化对话
  newConversation('general');
  
  // 如果需要，可以恢复当前会话
  if (currentConversation.length > 0) {
    conversation.splice(0, conversation.length, ...currentConversation);
  }
};

/**
 * 发送消息
 */
const sendMessage = async (content: string) => {
  if (isLoading.value || !content.trim()) return;
  
  // 创建用户消息
  const userMessage = createUserMessage(content, activeChatType.value);
  conversation.push(userMessage);
  
  // 创建AI响应消息（加载状态）
  const aiMessage = createLoadingAIMessage(activeChatType.value);
  const aiMessageIndex = conversation.length;
  conversation.push(aiMessage);
  
  // 滚动到底部
  await nextTick();
  scrollToBottom();
  
  // 设置加载状态
  isLoading.value = true;
  
  // 处理响应
  try {
    // 创建AbortController用于取消请求
    abortController.value = new AbortController();
    
    // 根据对话类型选择不同的处理方式
    if (activeChatType.value === 'general') {
      // 普通对话模式
      await simulateAPIResponse(aiMessageIndex, content);
    } else {
      // 其他对话模式
      await simulateAPIResponse(aiMessageIndex, content);
    }
  } catch (error: any) {
    handleResponseError(error, aiMessageIndex, conversation, abortController.value);
  } finally {
    isLoading.value = false;
    abortController.value = null;
    
    // 对话结束后保存对话历史
    saveCurrentConversation();
  }
};

/**
 * 模拟API响应
 */
const simulateAPIResponse = async (aiMessageIndex: number, messageContent: string) => {
  let responseContent = '';
  
  // 模拟AI思考时间
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // 模拟流式响应
  const generateResponse = async () => {
    try {
      // 准备API参数
      const messages = conversation
        .filter(msg => !msg.loading)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      
      const config = modelConfig[selectedModel.value];
      const apiParams = {
        model: config.model,
        messages,
        temperature: 0.7,
        max_tokens: 1500,
        stream: true
      };
      
      // 处理模型响应
      await processModelResponse(
        selectedModel.value,
        apiParams,
        aiMessageIndex,
        (content: string) => {
          responseContent = content;
          updateMessageUI(aiMessageIndex, responseContent);
        },
        () => {
          finalizeAIMessage(aiMessageIndex, responseContent, messageContent, selectedModel.value);
        },
        abortController.value?.signal as AbortSignal
      );
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error in API response:', error);
      }
      throw error;
    }
  };
  
  // 添加超时处理
  await withTimeout(generateResponse(), REQUEST_TIMEOUT);
};

/**
 * 跳转到指定对话中的消息
 */
const jumpToMessage = (conversationId: string, messageIndex: number) => {
  // 如果是不同的对话，先切换到对应对话
  if (conversationId !== activeConversationId.value) {
    switchToConversation(conversationId);
  }
  
  // 然后滚动到目标消息位置
  nextTick(() => {
    const messageElements = document.querySelectorAll('.message-container');
    if (messageElements.length > messageIndex) {
      messageElements[messageIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
      
      // 添加高亮效果
      messageElements[messageIndex].classList.add('message-highlight');
      setTimeout(() => {
        messageElements[messageIndex].classList.remove('message-highlight');
      }, 2000);
    }
  });
};

/**
 * 取消正在处理的请求
 */
const cancelRequest = () => {
  if (abortController.value) {
    abortController.value.abort();
    abortController.value = null;
  }
  isLoading.value = false;
};

/**
 * 选择模型
 */
const selectModel = (model: ModelType) => {
  selectedModel.value = model;
};

// 初始化
onMounted(() => {
  // 监听窗口大小变化
  window.addEventListener('resize', () => throttledResize(handleResize));
  
  // 初始化对话
  initializeConversation();
  
  // 设置代码块事件监听
  setupCodeBlockEventListeners();
  
  // 初始检查窗口大小
  handleResize();
});
</script>

<style lang="scss">
@import '../assets/styles/layout.scss';
@import '../assets/styles/messages.scss';

.message-highlight {
  animation: highlight-pulse 2s ease-in-out;
}

@keyframes highlight-pulse {
  0% {
    background-color: rgba(22, 93, 255, 0.05);
  }
  50% {
    background-color: rgba(22, 93, 255, 0.1);
  }
  100% {
    background-color: transparent;
  }
}
</style> 