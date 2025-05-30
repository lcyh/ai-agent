<template>
  <main class="content-area" :class="isMobile ? 'mx-1 my-1' : 'mx-4 my-3'">
    <!-- 回到底部按钮 -->
    <div v-if="showScrollToBottom" class="scroll-to-bottom-btn cursor-pointer" @click="scrollToBottomHandler">
      <div class="scroll-bottom-icon-container">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#165DFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" class="scroll-circle" fill="#EFF3FF" />
          <path d="M12 8v8" />
          <path d="M8 13l4 3 4-3" />
        </svg>
      </div>
    </div>
    
    <!-- 对话区域 -->
    <div class="chat-container" ref="chatContainerRef" @scroll="handleChatScroll">
      <!-- 对话类型提示 -->
      <div v-if="showChatTypeHint" class="max-w-4xl mx-auto mb-8 p-4 bg-[#F8FAFD] rounded-lg border border-[#E5E6EB]">
        <div class="flex items-start gap-3">
          <div class="p-2 rounded-lg" :class="chatTypeInfo.bgColor">
            <img :src="chatTypeInfo.icon" class="w-6 h-6" :alt="chatTypeInfo.name" />
          </div>
          <div>
            <h3 class="text-base font-medium mb-1">{{ chatTypeInfo.name }}</h3>
            <p class="text-[#4E5969] text-sm">{{ chatTypeInfo.description }}</p>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-8 max-w-4xl mx-auto">
        <!-- 用户消息 -->
        <div v-for="(message, index) in conversation" :key="index" class="w-full">
          <!-- 用户气泡 -->
          <div v-if="message.role === 'user'" class="flex justify-end items-end gap-4 mb-2">
            <div class="flex flex-col items-end">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-xs text-[#86909C]">{{ formatTime(message.timestamp) }}</span>
                <span class="text-xs text-[#4E5969]">lc</span>
              </div>
              <div class="user-bubble">
                <p class="text-sm">{{ message.content }}</p>
              </div>
            </div>
            <img :src="avatarUser" class="w-7 h-7 rounded-full flex-shrink-0" alt="User" />
          </div>
          
          <!-- AI气泡 -->
          <div v-else-if="message.role === 'assistant'" class="flex justify-start gap-4 mb-6">
            <img :src="logoAI" class="w-7 h-7 rounded-full flex-shrink-0" alt="AI" />
            <div class="flex flex-col w-full max-w-3xl">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-xs text-[#4E5969]">{{ chatTypeInfo.aiName }}</span>
                <span class="text-xs text-[#86909C]">{{ formatTime(message.timestamp) }}</span>
              </div>
              <div class="ai-bubble">
                <!-- 使用v-html渲染格式化后的消息内容，所有消息都使用markdown-it处理 -->
                <div v-html="formatMessageWithCodeBlocks(message.content)" class="message-content text-sm"></div>
                
                <!-- 可能的图表或搜索结果 -->
                <div v-if="message.streaming && message.chart?.title" class="mt-4 border border-[#F2F3F5] rounded-xl p-4">
                  <div class="flex items-center gap-x-2 mb-2">
                    <div class="text-base font-medium">{{ message.chart.title }}</div>
                  </div>
                  <div class="w-full h-60 bg-gray-100 rounded flex items-center justify-center">
                    <span class="text-gray-500">图表内容</span>
                  </div>
                </div>
                
                <!-- 加载中 -->
                <div v-if="message.loading" class="flex justify-between items-center mt-3">
                  <div class="flex items-center gap-2">
                    <div class="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span class="text-sm text-gray-500">AI 正在思考中...</span>
                    
                    <!-- 流式响应进度指示 -->
                    <span v-if="message.streaming && message.content" class="text-xs text-[#86909C]">(正在接收响应...)</span>
                  </div>
                  
                  <!-- 取消按钮 -->
                  <button 
                    v-if="message.loading" 
                    @click="cancelRequest"
                    class="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                  >
                    取消
                  </button>
                </div>
                
                <!-- 交互按钮 -->
                <div v-if="!message.loading" class="flex justify-between mt-3">
                  <div class="flex gap-1">
                    <div class="p-1 rounded cursor-pointer hover:bg-gray-100">
                      <img :src="iconVolume" alt="朗读" class="w-4 h-4" />
                    </div>
                    <div class="p-1 rounded cursor-pointer hover:bg-gray-100" @click="copyText(message.content)" data-action="copy">
                      <img :src="iconCopy" alt="复制" class="w-4 h-4" />
                    </div>
                    <div class="p-1 rounded cursor-pointer hover:bg-gray-100">
                      <img :src="iconRefresh" alt="刷新" class="w-4 h-4" />
                    </div>
                    <div class="p-1 rounded cursor-pointer hover:bg-gray-100">
                      <img :src="iconShare" alt="分享" class="w-4 h-4" />
                    </div>
                    <div class="p-1 rounded cursor-pointer hover:bg-gray-100">
                      <img :src="iconMore" alt="更多" class="w-4 h-4" />
                    </div>
                  </div>
                  
                  <div class="flex gap-1">
                    <div class="p-1 rounded cursor-pointer hover:bg-gray-100">
                      <img :src="iconThumbUp" alt="赞" class="w-4 h-4" />
                    </div>
                    <div class="p-1 rounded cursor-pointer hover:bg-gray-100">
                      <img :src="iconThumbDown" alt="踩" class="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 猜你想问 -->
              <div v-if="message.suggestions && message.suggestions.length > 0" class="flex flex-col gap-2 mt-3">
                <div 
                  v-for="(suggestion, sIndex) in message.suggestions" 
                  :key="sIndex" 
                  class="suggestion-item"
                  @click="handleSendMessage(suggestion)"
                >
                  <span class="text-sm">🔍 {{ suggestion }}</span>
                  <img :src="iconChart" alt="发送" class="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- 底部空白占位，确保最后的消息不被输入框遮挡 -->
        <div class="h-10"></div>
      </div>
    </div>

    <!-- 输入框 -->
    <div class="input-area">
      <div class="max-w-4xl mx-auto">
        <div class="flex flex-col">
          <!-- 模型选择区域 -->
          <div class="flex flex-wrap items-center gap-2 mb-3">
            <div 
              v-for="model in models" 
              :key="model.id"
              class="flex items-center gap-1 px-2 py-1 rounded cursor-pointer" 
              :class="selectedModel === model.id ? 'bg-[#EFF3FF] border border-[#94BFFF]' : 'bg-[#F7F8FA]'"
              @click="selectModel(model.id)"
            >
              <img :src="model.icon" class="w-4 h-4" :alt="model.name" />
              <span class="text-[#1D2129]">{{ model.name }}</span>
            </div>
          </div>
          
          <!-- 输入和发送区域 -->
          <div class="flex items-center justify-between min-h-[56px] border border-[#E5E6EB] rounded-lg p-2 px-4 bg-white focus-within:border-[#165DFF]">
            <input 
              v-model="inputText" 
              type="text" 
              :placeholder="chatTypeInfo.placeholder"
              class="flex-1 outline-none text-sm"
              @keyup.enter="onEnterPress"
            />
            <div 
              class="w-8 h-8 flex items-center justify-center rounded-full bg-[#165DFF] cursor-pointer hover:bg-[#4080FF] ml-2 transition-colors"
              @click="onSendClick"
            >
              <img :src="iconSent" class="w-4 h-4" alt="发送" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, defineProps, defineEmits, nextTick } from 'vue';
import { formatTime } from '../services/messageService';
import { formatMessageWithCodeBlocks, copyToClipboard } from '../services/uiService';
import type { Message } from '../types/chat';
import type { ModelType } from '../types/api';
import type { ModelOption } from '../types/component';
import type { ConversationHistory } from '../types/conversationHistory';

// 导入图标
import iconDeepseek from '../assets/icons/icon-deepseek.svg';
import iconGlobal from '../assets/icons/icon-global.svg';
import iconSent from '../assets/icons/icon-sent.svg';
import iconVolume from '../assets/icons/icon-volume.svg';
import iconCopy from '../assets/icons/icon-copy.svg';
import iconRefresh from '../assets/icons/icon-refresh.svg';
import iconShare from '../assets/icons/icon-share.svg';
import iconMore from '../assets/icons/icon-more.svg';
import iconThumbUp from '../assets/icons/icon-thumb-up.svg';
import iconThumbDown from '../assets/icons/icon-thumb-down.svg';
import iconChart from '../assets/icons/icon-chart.svg';
import iconCode from '../assets/icons/icon-code.svg';
import logoAI from '../assets/icons/logo.svg';
import avatarUser from '../assets/icons/user-avatar.svg';
import iconCheck from '../assets/icons/icon-check.svg';

// 定义组件属性
const props = defineProps({
  conversation: {
    type: Array as () => Message[],
    required: true
  },
  isMobile: {
    type: Boolean,
    required: true
  },
  selectedModel: {
    type: String as () => ModelType,
    required: true
  },
  isLoading: {
    type: Boolean,
    required: true
  },
  recentConversations: {
    type: Array as () => ConversationHistory[],
    default: () => []
  }
});

// 定义事件
const emit = defineEmits(['send-message', 'select-model', 'cancel-request']);

// 本地输入框值
const inputText = ref('');

// 可用模型列表 - 所有模型都可选
const models: ModelOption[] = [
  { id: 'deepseek', name: 'DeepSeek-R1', icon: iconDeepseek },
  { id: 'silicon', name: '硅基流动', icon: iconDeepseek }, 
  { id: 'web', name: '联网搜索', icon: iconGlobal }
];

// 聊天类型信息 - 使用常量而非计算属性
const chatTypeInfo = {
  name: 'AI Agent助手',
  icon: iconCode,
  bgColor: 'bg-[#FFF3E8]',
  description: '搜索、编程、写作、创作',
  placeholder: '有什么可以帮你的?',
  aiName: 'AI Agent助手'
};

// 是否显示对话类型提示
const showChatTypeHint = computed(() => {
  // 如果对话中只有一条消息（欢迎消息），则显示提示
  return props.conversation.length <= 1;
});

// 处理Enter键按下
const onEnterPress = () => {
  if (inputText.value.trim() && !props.isLoading) {
    handleSendMessage(inputText.value);
  }
};

// 处理发送按钮点击
const onSendClick = () => {
  if (inputText.value.trim() && !props.isLoading) {
    handleSendMessage(inputText.value);
  }
};

// 处理建议点击发送
const handleSendMessage = (suggestion: string) => {
  if (suggestion) {
    emit('send-message', suggestion);
    inputText.value = '';
    
    // 确保滚动到底部
    showScrollToBottom.value = false;
    nextTick(() => {
      scrollToBottomHandler();
    });
  }
};

// 选择模型
const selectModel = (modelId: ModelType) => {
  emit('select-model', modelId);
};

// 取消请求
const cancelRequest = () => {
  emit('cancel-request');
};

// 复制文本
const copyText = (text: string) => {
  copyToClipboard(text);
  
  // 添加用户视觉反馈
  const copyButtons = document.querySelectorAll('.p-1[data-action="copy"]');
  copyButtons.forEach(button => {
    const originalIcon = button.innerHTML;
    button.innerHTML = `<img src="${iconCheck}" alt="已复制" class="w-4 h-4" />`;
    
    // 2秒后恢复原始图标
    setTimeout(() => {
      button.innerHTML = originalIcon;
    }, 2000);
  });
};

// 滚动处理逻辑
const chatContainerRef = ref<HTMLElement | null>(null);
const showScrollToBottom = ref(false);

const handleChatScroll = () => {
  if (chatContainerRef.value) {
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.value;
    // 当距离底部超过100px或用户已滚动超过一屏内容时显示按钮
    showScrollToBottom.value = scrollTop > 200 || (scrollTop + clientHeight < scrollHeight - 100);
  }
};

const scrollToBottomHandler = () => {
  if (chatContainerRef.value) {
    chatContainerRef.value.scrollTo({
      top: chatContainerRef.value.scrollHeight,
      behavior: 'smooth'
    });
  }
};
</script>

<style lang="scss" scoped>
.chat-container {
  position: relative;
  height: calc(100vh - 180px);
  overflow-y: auto;
  padding: 1rem;
  padding-bottom: 100px; /* 增加底部padding，确保最后的消息不被输入框遮挡 */
  scrollbar-width: thin;
  scrollbar-color: #e5e6eb transparent;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: #e5e6eb;
    border-radius: 2px;
  }
  
  &:hover::-webkit-scrollbar-thumb {
    background-color: #c9cdd4;
  }
}

.scroll-to-bottom-btn {
  position: fixed;
  bottom: 150px; /* 位于输入框上方 */
  right: 20px;
  z-index: 15; /* 确保高于其他元素 */
  
  .scroll-bottom-icon-container {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 12px rgba(22, 93, 255, 0.2);
    border: 1px solid rgba(22, 93, 255, 0.1);
    transition: all 0.2s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(22, 93, 255, 0.3);
      
      .scroll-circle {
        fill: rgba(22, 93, 255, 0.15);
      }
    }
    
    &:active {
      transform: translateY(1px);
    }
    
    svg {
      animation: pulse 2s infinite ease-in-out;
    }
  }
}

@keyframes pulse {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(2px);
  }
  100% {
    transform: translateY(0);
  }
}

.copy-toast.show {
  opacity: 1;
  transform: translate(-50%, 0);
}

.highlight-message {
  animation: highlight-pulse 2s ease;
}

@keyframes highlight-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(22, 93, 255, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(22, 93, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(22, 93, 255, 0);
  }
}

.content-area {
  height: 100vh;
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  padding-bottom: 120px; /* 为固定定位的输入框预留空间 */
}
</style> 