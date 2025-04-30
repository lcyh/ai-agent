<template>
  <main class="content-area" :class="isMobile ? 'mx-1 my-1' : 'mx-4 my-3'">
    <!-- 页头 -->
    <div class="page-header">
      <div class="flex items-center gap-6">
        <div v-if="isMobile" class="cursor-pointer p-1" @click="toggleCollapse">
          <img :src="iconMenu" class="w-5 h-5" alt="菜单" />
        </div>
        <div class="px-2 py-1">
          <span class="text-base font-medium" :class="{'text-sm': isMobile}">
            {{ chatTypeTitle }}
          </span>
        </div>
        <div class="flex-1">
          <SearchBar
            :conversations="recentConversations"
            :currentConversation="conversation"
            :placeholder="'搜索对话内容...'"
            @select-result="handleSearchResultSelect"
          />
        </div>
      </div>
    </div>

    <!-- 对话区域 -->
    <div class="chat-container">
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
                <!-- 使用v-html渲染格式化后的消息内容，允许代码块渲染 -->
                <div v-if="!hasCodeBlock(message.content)" class="text-sm whitespace-pre-wrap">{{ message.content }}</div>
                <div v-else v-html="formatMessageWithCodeBlocks(message.content)" class="message-content"></div>
                
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
                    <div class="p-1 rounded cursor-pointer hover:bg-gray-100" @click="copyText(message.content)">
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
      </div>
    </div>

    <!-- 输入框 -->
    <div class="input-area">
      <div class="max-w-4xl mx-auto">
        <div class="flex flex-col">
          <!-- 模型选择区域 -->
          <div class="flex flex-wrap items-center gap-2 mb-3">
            <div 
              v-for="model in filteredModels" 
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
import { hasCodeBlock, formatMessageWithCodeBlocks, copyToClipboard } from '../services/uiService';
import type { Message, ChatType } from '../types/chat';
import type { ModelType } from '../types/api';
import type { ModelOption } from '../types/component';
import type { ConversationHistory } from '../types/conversationHistory';
import type { SearchResultItem } from '../services/searchService';
import SearchBar from './SearchBar.vue';

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
import iconMenu from '../assets/icons/icon-more.svg';
import iconSearch from '../assets/icons/icon-search.svg';
import iconCode from '../assets/icons/icon-code.svg';
import iconImage from '../assets/icons/icon-image.svg';
import logoAI from '../assets/icons/logo.svg';
import avatarUser from '../assets/icons/user-avatar.svg';

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
  activeChatType: {
    type: String as () => ChatType,
    default: 'general'
  },
  recentConversations: {
    type: Array as () => ConversationHistory[],
    default: () => []
  }
});

// 定义事件
const emit = defineEmits(['toggle-collapse', 'send-message', 'select-model', 'cancel-request', 'jump-to-message']);

// 本地输入框值
const inputText = ref('');

// 可用模型列表
const allModels: ModelOption[] = [
  { id: 'deepseek', name: 'DeepSeek-R1', icon: iconDeepseek },
  { id: 'silicon', name: '硅基流动', icon: iconDeepseek }, 
  { id: 'web', name: '联网搜索', icon: iconGlobal }
];

// 根据对话类型筛选可用模型
const filteredModels = computed(() => {
  switch (props.activeChatType) {
    case 'agent':
      return allModels.filter(model => model.id === 'deepseek');
    case 'image':
      return allModels.filter(model => model.id === 'silicon');
    case 'general':
    default:
      return allModels;
  }
});

// 根据对话类型显示标题
const chatTypeTitle = computed(() => {
  return {
    general: '通用对话',
    agent: 'AI Agent对话',
    image: 'AI图像对话'
  }[props.activeChatType] || '对话';
});

// 获取对话类型信息
const chatTypeInfo = computed(() => {
  switch (props.activeChatType) {
    case 'agent':
      return {
        name: 'AI Agent助手',
        aiName: 'AI Agent助手',
        icon: iconCode,
        bgColor: 'bg-[#FFF3E8]',
        description: '我可以帮你解决各种问题，包括信息搜索和编程问题，并提供智能建议。',
        placeholder: '向AI Agent提问...'
      };
    case 'image':
      return {
        name: 'AI图像助手',
        aiName: 'AI图像助手',
        icon: iconImage,
        bgColor: 'bg-[#F5E8FF]',
        description: '我可以帮你理解、分析和处理图像，或者根据描述生成图像。',
        placeholder: '描述你需要的图像或上传图片...'
      };
    case 'general':
    default:
      return {
        name: 'AI助手',
        aiName: 'AI助手',
        icon: logoAI,
        bgColor: 'bg-[#EFF3FF]',
        description: '我是一个通用AI助手，可以回答各种问题，提供信息和建议。',
        placeholder: '请输入你的问题'
      };
  }
});

// 是否显示对话类型提示
const showChatTypeHint = computed(() => {
  // 如果对话中只有一条消息（欢迎消息），则显示提示
  return props.conversation.length <= 1;
});

// 切换折叠状态
const toggleCollapse = () => {
  emit('toggle-collapse');
};

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
};

// 处理搜索结果选择
const handleSearchResultSelect = (result: SearchResultItem) => {
  // 如果是当前对话，滚动到相应消息
  if (result.conversationId === 'current') {
    scrollToMessage(result.messageIndex);
  } else {
    // 如果是其他对话，跳转到该对话并定位到特定消息
    emit('jump-to-message', {
      conversationId: result.conversationId,
      messageIndex: result.messageIndex
    });
  }
};

// 滚动到指定消息
const scrollToMessage = (messageIndex: number) => {
  nextTick(() => {
    // 获取所有消息元素
    const messageElements = document.querySelectorAll('.user-bubble, .ai-bubble');
    if (messageElements && messageElements[messageIndex]) {
      // 滚动到指定元素并高亮显示
      messageElements[messageIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
      messageElements[messageIndex].classList.add('highlight-message');
      
      // 移除高亮
      setTimeout(() => {
        messageElements[messageIndex].classList.remove('highlight-message');
      }, 2000);
    }
  });
};
</script>

<style lang="scss" scoped>
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
</style> 