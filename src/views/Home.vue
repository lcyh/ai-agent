<!--
 * @Author: changluo
 * @Description: 
 * @LastEditors: luc19964 luochang@gopherasset.com
-->
<template>
  <div class="main-layout" :class="{'text-sm': isMobile}">
    <!-- 左侧导航栏组件 -->
    <SideNavigation 
      :isCollapsed="isCollapsed"
      :isMobile="isMobile"
      :recentConversations="recentConversations"
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
import { ref, onMounted, nextTick } from 'vue';
import type { ModelType } from '../types/api';
import { modelConfig } from '../api/ai';
import { 
  REQUEST_TIMEOUT,
  createUserMessage,
  createLoadingAIMessage,
  withTimeout,
  handleResponseError,
  processModelResponse,
} from '../services/messageService';
import { scrollToBottom, throttledResize, setupCodeBlockEventListeners } from '../services/uiService';
import { useConversationManager } from '../services/conversationService';
import SideNavigation from '../components/SideNavigation.vue';
import ChatArea from '../components/ChatArea.vue';

// 对话管理
const {
  activeConversationId,
  conversation,
  historyConversations,
  recentConversations,
  conversationsByType,
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
  newConversation();
  
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
  const userMessage = createUserMessage(content, 'agent');
  conversation.push(userMessage);
  
  // 创建AI响应消息（加载状态）
  const aiMessage = createLoadingAIMessage('agent');
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
    
    // 处理API响应
    await simulateAPIResponse(aiMessageIndex, content);
  } catch (error: any) {
    handleResponseError(error, aiMessageIndex, conversation, abortController.value);
  } finally {
    isLoading.value = false;
    abortController.value = null;
    
    // 对话结束后保存对话历史并滚动到底部
    saveCurrentConversation();
    // 确保AI响应完成后也滚动到底部
    nextTick(() => {
      scrollToBottom();
    });
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
      if (error.name === 'TimeoutError') {
        throw error;
      }
      
      // 处理模型生成失败
      console.error('Model response error:', error);
      throw new Error(error.message || '获取响应失败，请重试');
    }
  };
  
  // 使用超时包装
  await withTimeout(generateResponse(), REQUEST_TIMEOUT);
};

/**
 * 模型选择
 */
const selectModel = (modelType: ModelType) => {
  selectedModel.value = modelType;
};

/**
 * 跳转到指定消息
 */
const jumpToMessage = (index: number) => {
  console.log('跳转到消息:', index);
  // 在实际应用中，这里通常会滚动到指定消息
};

/**
 * 取消请求
 */
const cancelRequest = () => {
  if (abortController.value) {
    abortController.value.abort();
    abortController.value = null;
  }
  // 找到加载中的消息并清除加载状态
  const loadingMessageIndex = conversation.findIndex(msg => msg.loading);
  if (loadingMessageIndex >= 0) {
    conversation[loadingMessageIndex].loading = false;
    conversation[loadingMessageIndex].content = '请求已取消';
  }
  isLoading.value = false;
};

// 组件挂载时初始化
onMounted(() => {
  // 注册窗口大小变化事件
  window.addEventListener('resize', handleResize);
  handleResize();
  
  // 初始化默认对话
  initializeConversation();
  
  // 设置代码块交互事件
  setupCodeBlockEventListeners();
});
</script>

<style lang="scss">
// .main-layout {
//   display: flex;
//   height: 100vh;
//   width: 100%;
//   overflow: hidden;
//   background-color: white;
// }

// 针对移动设备的样式
// @media screen and (max-width: 768px) {
//   .main-layout {
//     .sidebar--expanded {
//       position: fixed;
//       z-index: 50;
//       box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
//     }
//   }
// }

/* 美化全局滚动条 */
// ::-webkit-scrollbar {
//   width: 6px;
//   height: 6px;
// }

// ::-webkit-scrollbar-track {
//   background: transparent;
// }

// ::-webkit-scrollbar-thumb {
//   background-color: #e5e6eb;
//   border-radius: 3px;
// }

// ::-webkit-scrollbar-thumb:hover {
//   background-color: #c9cdd4;
// }

/* 自定义用户消息和AI消息气泡样式 */
// .user-bubble {
//   background-color: #4080ff;
//   color: white;
//   border-radius: 0.5rem;
//   padding: 0.75rem 1rem;
//   max-width: 85%;
//   box-shadow: 0 2px 4px rgba(64, 128, 255, 0.2);
//   word-break: break-word;
// }

// .ai-bubble {
//   background-color: #f2f3f5;
//   border-radius: 0.5rem;
//   padding: 0.75rem 1rem;
//   max-width: 100%;
//   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
//   word-break: break-word;
// }

// .message-content {
//   :deep(pre) {
//     margin: 0.5rem 0;
//     padding: 0.75rem;
//     border-radius: 0.25rem;
//     background-color: #1e293b;
//     overflow-x: auto;
//     color: #e2e8f0;
//     font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    
//     code {
//       background-color: transparent;
//       padding: 0;
//       border-radius: 0;
//       color: inherit;
//     }
//   }
  
//   :deep(code) {
//     background-color: rgba(22, 93, 255, 0.1);
//     padding: 0.125rem 0.25rem;
//     border-radius: 0.25rem;
//     font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
//     font-size: 0.875em;
//     color: #1e293b;
//   }
  
//   :deep(p) {
//     margin-bottom: 0.75rem;
//     &:last-child {
//       margin-bottom: 0;
//     }
//   }
  
//   :deep(ul), :deep(ol) {
//     margin-bottom: 0.75rem;
//     padding-left: 1.5rem;
    
//     li {
//       margin-bottom: 0.25rem;
//     }
//   }
  
//   :deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6) {
//     margin-top: 1.5rem;
//     margin-bottom: 0.75rem;
//     font-weight: 600;
//   }
  
//   :deep(h1) { font-size: 1.5rem; }
//   :deep(h2) { font-size: 1.3rem; }
//   :deep(h3) { font-size: 1.17rem; }
  
//   :deep(a) {
//     color: #165dff;
//     text-decoration: none;
    
//     &:hover {
//       text-decoration: underline;
//     }
//   }
// }

// .suggestion-item {
//   display: flex;
//   align-items: center;
//   justify-content: space-between;
//   padding: 0.5rem 0.75rem;
//   background-color: #f7f8fa;
//   border: 1px solid #e5e6eb;
//   border-radius: 0.5rem;
//   cursor: pointer;
//   transition: all 0.2s ease;
  
//   &:hover {
//     background-color: #f2f3f5;
//     border-color: #c9cdd4;
//   }
// }

/* 滚动到底部按钮 */
.scroll-to-bottom-btn {
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
  }
}
</style> 