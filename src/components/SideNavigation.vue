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
      <a-button type="primary" class="flex items-center justify-center h-10 w-full relative" :style="{ backgroundColor: '$primary-color' }" @click="createNewConversation">
        <img src="../assets/icons/icon-add.svg" alt="新建" class="w-4 h-4" :class="isCollapsed ? '' : 'mr-2'" />
        <span v-if="!isCollapsed">创建新对话</span>
        <div v-if="isCollapsed" class="tooltip">创建新对话</div>
      </a-button>

      <!-- 功能列表 -->
      <div class="flex flex-col gap-0.5">
        <div class="flex items-center gap-2 p-[9px] px-3 rounded hover:bg-white cursor-pointer relative">
          <img src="../assets/icons/icon-search.svg" alt="搜索" class="w-4 h-4" />
          <span v-if="!isCollapsed" class="text-[#1D2129]">AI搜索</span>
          <div v-if="isCollapsed" class="tooltip">AI搜索</div>
        </div>
        <div class="flex items-center gap-2 p-[9px] px-3 rounded hover:bg-white cursor-pointer relative">
          <img src="../assets/icons/icon-code.svg" alt="编程" class="w-4 h-4" />
          <span v-if="!isCollapsed" class="text-[#1D2129]">AI编程</span>
          <div v-if="isCollapsed" class="tooltip">AI编程</div>
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
        
        <div class="flex flex-col gap-0.5">
          <div 
            v-for="(conv, index) in recentConversations" 
            :key="index" 
            class="flex items-center gap-2 p-[9px] px-3 rounded hover:bg-white cursor-pointer" 
            @click="switchConversation(conv.id)"
          >
            <div class="w-2 h-2 rounded-full bg-[#BEDAFF]"></div>
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
import { defineProps, defineEmits } from 'vue';
import expandIcon from '../assets/icons/expand.svg';

// 对话历史记录类型定义
interface ConversationHistory {
  id: string;
  title: string;
  timestamp: number;
  lastMessage: string;
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
  }
});

// 定义事件
const emit = defineEmits(['toggle-collapse', 'new-conversation', 'switch-conversation']);

// 切换折叠状态
const toggleCollapse = () => {
  emit('toggle-collapse');
};

// 创建新对话
const createNewConversation = () => {
  emit('new-conversation');
};

// 切换到指定对话
const switchConversation = (id: string) => {
  emit('switch-conversation', id);
};
</script>

<style lang="scss" scoped>
// 组件特有样式在这里定义
</style> 