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
      @toggle-collapse="isCollapsed = !isCollapsed"
      @new-conversation="newConversation"
      @switch-conversation="switchToConversation"
    />

    <!-- 聊天区域组件 -->
    <ChatArea 
      :conversation="conversation"
      :isMobile="isMobile"
      :selectedModel="selectedModel"
      :isLoading="isLoading"
      @toggle-collapse="isCollapsed = !isCollapsed"
      @send-message="sendMessage"
      @select-model="selectModel"
      @cancel-request="cancelRequest"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import type { ModelType } from '../types/api';
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
import { scrollToBottom, debouncedScroll, setupCodeBlockEventListeners } from '../services/uiService';
import { useConversationManager } from '../services/conversationService';
import SideNavigation from '../components/SideNavigation.vue';
import ChatArea from '../components/ChatArea.vue';

// 对话管理
const {
  conversation,
  recentConversations,
  newConversation,
  saveCurrentConversation,
  switchToConversation,
  finalizeAIMessage,
  updateMessageUI,
  initializeConversation
} = useConversationManager();

// 状态变量
const isCollapsed = ref(false);
const selectedModel = ref<ModelType>('deepseek');
const isLoading = ref(false);
const abortController = ref<AbortController | null>(null);
const isMobile = ref(false);

// 检测移动设备
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768;
  if (isMobile.value) {
    isCollapsed.value = true; // 在移动设备上自动折叠导航栏
  }
};

// 选择模型
const selectModel = (model: ModelType) => {
  selectedModel.value = model;
};

// 发送消息
const sendMessage = async (content?: string) => {
  // 输入检查
  if (isLoading.value) return;
  
  const messageContent = content?.trim() || '';
  if (!messageContent) return;
  
  // 添加消息到对话
  const userMessage = createUserMessage(messageContent);
  const aiMessage = createLoadingAIMessage();
  
  conversation.push(userMessage);
  conversation.push(aiMessage);
  const aiMessageIndex = conversation.length - 1;
  
  // 设置状态
  isLoading.value = true;
  abortController.value = new AbortController();
  
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
    
    // 消息处理
    const handleUpdate = (content: string) => {
      updateMessageUI(aiMessageIndex, content);
      nextTick(() => {
        debouncedScroll();
      });
    };
    
    const handleComplete = () => {
      if (abortController.value?.signal.aborted) return;
      
      const currentContent = conversation[aiMessageIndex].content;
      finalizeAIMessage(
        aiMessageIndex,
        currentContent || '抱歉，未能获取到有效响应',
        messageContent,
        selectedModel.value
      );
      
      // 重置状态
      isLoading.value = false;
      abortController.value = null;
      saveCurrentConversation();
    };
    
    // 根据模型类型处理响应
    if (selectedModel.value === 'web') {
      // 联网搜索模式
      await simulateSearchResponse(
        messageContent,
        handleUpdate,
        handleComplete,
        abortController.value.signal
      );
    } else {
      // LLM处理
      await withTimeout(
        processModelResponse(
          selectedModel.value,
          apiParams,
          aiMessageIndex,
          handleUpdate,
          handleComplete,
          abortController.value.signal
        ),
        REQUEST_TIMEOUT
      );
    }
    
  } catch (error) {
    // 错误处理
    handleResponseError(error, aiMessageIndex, conversation, abortController.value);
    
    // 重置状态
    isLoading.value = false;
    abortController.value = null;
  }
};

// 取消当前请求
const cancelRequest = () => {
  if (abortController.value && isLoading.value) {
    abortController.value.abort();
    
    // 查找最后一个正在加载的AI消息
    const loadingMessageIndex = conversation.findIndex(msg => msg.loading);
    if (loadingMessageIndex !== -1) {
      // 更新为取消状态
      conversation[loadingMessageIndex] = {
        ...conversation[loadingMessageIndex],
        content: '响应已取消',
        loading: false,
        streaming: false
      };
    }
    
    // 重置状态
    isLoading.value = false;
    abortController.value = null;
  }
};

// 观察聊天内容变化，确保视图更新
watch(conversation, () => {
  nextTick(scrollToBottom);
}, { deep: true });

// 组件挂载时初始化
onMounted(() => {
  // 初始化对话
  initializeConversation();
  
  // 初始检测设备类型
  checkMobile();
  
  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    checkMobile();
  });
  
  scrollToBottom();
  setupCodeBlockEventListeners();
});
</script>

<style>
/* 代码块样式 */
.code-block-container {
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  border-radius: 8px;
  overflow: hidden;
  margin: 1rem 0;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.code-block-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #f1f3f5;
  border-bottom: 1px solid #e9ecef;
}

.code-lang-tag {
  font-size: 0.75rem;
  font-weight: 600;
  color: #495057;
  text-transform: uppercase;
}

.code-actions {
  display: flex;
  gap: 8px;
}

.copy-button, .download-button {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #6c757d;
  background-color: transparent;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.copy-button:hover, .download-button:hover {
  background-color: #e9ecef;
  color: #495057;
}

.copy-toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translate(-50%, -100%);
  background-color: #ffffff;
  color: #1D2129;
  padding: 10px 16px;
  border-radius: 8px;
  z-index: 9999;
  opacity: 0;
  transition: all 0.3s ease;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #F2F3F5;
  font-size: 14px;
  max-width: 300px;
  text-align: center;
}

.copy-toast.show {
  opacity: 1;
  transform: translate(-50%, 0);
}

/* 响应式调整 */
@media (max-width: 767px) {
  .code-block-body pre {
    font-size: 0.75rem;
    padding: 10px;
  }
}
</style> 