<template>
  <aside 
    v-if="!isMobile || !isCollapsed"
    class="sidebar" 
    :class="isCollapsed ? 'sidebar--collapsed' : 'sidebar--expanded'"
  >
    <div class="flex flex-col gap-4">
      <!-- Logo -->
      <div class="flex justify-between items-center w-full">
        <div class="flex items-center gap-2">
          <div class="relative">
            <img src="../assets/icons/logo.svg" class="w-6 h-6 rounded-full" alt="Logo" />
            <div v-if="isCollapsed" class="tooltip">AI Agent</div>
          </div>
          <span v-if="!isCollapsed" class="text-xl font-medium truncate">AI Agent</span>
        </div>
        <div class="p-1 rounded cursor-pointer hover:bg-gray-100 relative" @click="toggleCollapse">
          <img 
            :src="expandIcon" 
            alt="折叠" 
            class="w-5 h-5"
            :class="isCollapsed ? 'rotate-180' : ''" 
          />
          <div v-if="isCollapsed" class="tooltip">{{ isCollapsed ? '展开' : '折叠' }}</div>
        </div>
      </div>

      <!-- 新建对话按钮 -->
      <a-button type="primary" class="flex items-center justify-center h-10 w-full relative" :style="{ backgroundColor: '$primary-color' }" @click="createNewConversation('general')">
        <img src="../assets/icons/icon-add.svg" alt="新建" class="w-4 h-4" :class="isCollapsed ? '' : 'mr-2'" />
        <span v-if="!isCollapsed">创建新对话</span>
        <div v-if="isCollapsed" class="tooltip">创建新对话</div>
      </a-button>

      <!-- 功能列表 -->
      <div class="flex flex-col gap-0.5">
        <div 
          class="flex items-center gap-2 p-[9px] px-3 rounded hover:bg-white cursor-pointer relative"
          :class="{'bg-white': activeChatType === 'agent'}"
          @click="switchToChatType('agent')"
        >
          <img src="../assets/icons/icon-agent.svg" alt="AI Agent" class="w-4 h-4" />
          <span v-if="!isCollapsed" class="text-[#1D2129]">AI Agent</span>
          <div v-if="isCollapsed" class="tooltip">AI Agent</div>
        </div>
        <div 
          class="flex items-center gap-2 p-[9px] px-3 rounded hover:bg-white cursor-pointer relative"
          :class="{'bg-white': activeChatType === 'image'}"
          @click="switchToChatType('image')"
        >
          <img src="../assets/icons/icon-image.svg" alt="图像" class="w-4 h-4" />
          <span v-if="!isCollapsed" class="text-[#1D2129]">AI图像</span>
          <div v-if="isCollapsed" class="tooltip">AI图像</div>
        </div>
      </div>

      <div class="w-full h-px bg-[#E5E6EB]"></div>

      <!-- 最近对话 -->
      <div v-if="!isCollapsed" class="flex flex-col gap-2 px-3">
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-2">
            <img src="../assets/icons/icon-chat.svg" alt="对话" class="w-4 h-4" />
            <span class="text-[#1D2129]">最近对话</span>
          </div>
          <div class="flex items-center gap-0.5 text-xs text-[#86909C] cursor-pointer">
            <span>更多</span>
            <span class="transform rotate-90">></span>
          </div>
        </div>
        
        <!-- 根据当前选择的对话类型显示对应的历史对话 -->
        <div class="flex flex-col gap-0.5">
          <div v-if="filteredConversations.length === 0" class="text-[#86909C] text-xs py-2">
            当前没有历史对话
          </div>
          <div 
            v-for="(conv, index) in filteredConversations" 
            :key="index" 
            class="flex items-center gap-2 p-[9px] px-3 rounded hover:bg-white cursor-pointer" 
            @click="switchConversation(conv.id)"
          >
            <div class="w-2 h-2 rounded-full" :class="getChatTypeColor(conv.chatType)"></div>
            <span class="text-[#4E5969] truncate">{{ conv.title }}</span>
          </div>
        </div>
      </div>
      
      <div v-else class="flex items-center p-[9px] px-3 rounded hover:bg-white cursor-pointer relative">
        <img src="../assets/icons/icon-chat.svg" alt="最近对话" class="w-4 h-4" />
        <div class="tooltip">最近对话</div>
      </div>
    </div>

    <!-- 个人入口 -->
    <div class="flex items-center gap-2 p-2 px-3 rounded hover:bg-white cursor-pointer relative">
      <img src="../assets/icons/user-avatar.svg" class="w-6 h-6 rounded-full" alt="User" />
      <span v-if="!isCollapsed" class="text-[#1D2129] truncate">lc</span>
      <div v-if="isCollapsed" class="tooltip">lc</div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, computed } from 'vue';
import expandIcon from '../assets/icons/expand.svg';
import type { ChatType } from '../types/chat';

// 对话历史记录类型定义
interface ConversationHistory {
  id: string;
  title: string;
  timestamp: number;
  lastMessage: string;
  chatType: ChatType;
}

// 定义组件属性
const props = defineProps({
  isCollapsed: {
    type: Boolean,
    required: true
  },
  isMobile: {
    type: Boolean,
    required: true
  },
  recentConversations: {
    type: Array as () => ConversationHistory[],
    required: true
  },
  activeChatType: {
    type: String as () => ChatType,
    default: 'general'
  },
  conversationsByType: {
    type: Object as () => Record<ChatType, ConversationHistory[]>,
    default: () => ({
      general: [],
      agent: [],
      image: []
    })
  }
});

// 定义事件
const emit = defineEmits(['toggle-collapse', 'new-conversation', 'switch-conversation', 'switch-chat-type']);

// 切换折叠状态
const toggleCollapse = () => {
  emit('toggle-collapse');
};

// 创建新对话
const createNewConversation = (type: ChatType = 'general') => {
  emit('new-conversation', type);
};

// 切换到指定对话
const switchConversation = (id: string) => {
  emit('switch-conversation', id);
};

// 切换对话类型
const switchToChatType = (type: ChatType) => {
  emit('switch-chat-type', type);
};

// 根据当前选中的对话类型筛选对话
const filteredConversations = computed(() => {
  // 如果使用conversationsByType属性，则显示对应类型的对话
  if (props.conversationsByType && props.conversationsByType[props.activeChatType]) {
    return props.conversationsByType[props.activeChatType];
  }
  
  // 回退方案：从所有对话中筛选当前类型的对话
  return props.recentConversations.filter(conv => 
    conv.chatType === props.activeChatType
  );
});

// 根据对话类型获取显示颜色
const getChatTypeColor = (type: ChatType): string => {
  const colors = {
    general: 'bg-[#BEDAFF]',
    agent: 'bg-[#FFD8B2]',
    image: 'bg-[#D8B2FF]'
  };
  return colors[type] || colors.general;
};
</script>

<style lang="scss" scoped>
// 组件特有样式在这里定义
</style> 