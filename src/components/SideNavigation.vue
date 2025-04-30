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
      </div>

      <div class="w-full h-px bg-[#E5E6EB]"></div>

      <!-- 对话历史 -->
      <div v-if="!isCollapsed" class="flex flex-col gap-2 px-3">
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-2">
            <img src="../assets/icons/icon-chat.svg" alt="对话" class="w-4 h-4" />
            <span class="text-[#1D2129]">对话历史</span>
          </div>
          <div class="flex items-center gap-1 cursor-pointer">
            <div class="p-1 rounded hover:bg-gray-100" @click="showSearchDialog = true">
              <img src="../assets/icons/icon-search.svg" alt="搜索" class="w-3.5 h-3.5" />
            </div>
            <div class="p-1 rounded hover:bg-gray-100" @click="showMoreOptions = !showMoreOptions">
              <img src="../assets/icons/icon-more.svg" alt="更多" class="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
        
        <!-- 更多选项弹出菜单 -->
        <div v-if="showMoreOptions" class="absolute right-4 mt-8 bg-white p-2 rounded-lg shadow-md z-10 border border-[#E5E6EB]">
          <div class="flex flex-col">
            <div class="p-2 hover:bg-[#F7F8FA] rounded cursor-pointer text-[#F53F3F]" @click="clearAllConversations">
              <span class="text-sm">清空历史记录</span>
            </div>
          </div>
        </div>
        
        <!-- 对话历史列表（按时间分组） -->
        <div class="flex flex-col gap-3 max-h-[80vh] overflow-y-auto conversation-list pb-2">
          <div v-if="filteredConversations.length === 0" class="text-[#86909C] text-xs py-4 text-center">
            暂无对话记录
          </div>
          
          <!-- 按类型显示对话列表 -->
          <div class="flex flex-col gap-1">
            <!-- 今天的对话 -->
            <div v-if="todayConversations.length > 0" class="mb-3">
              <div class="time-group-label">
                今天
              </div>
              <div 
                v-for="conv in todayConversations" 
                :key="conv.id" 
                class="conversation-item" 
                @click="switchConversation(conv.id)"
              >
                <div class="conversation-type-indicator" :class="getChatTypeColor(conv.chatType)"></div>
                <span class="conversation-title">{{ conv.title || formatConversationTitle(conv) }}</span>
              </div>
            </div>
            
            <!-- 最近7天的对话 -->
            <div v-if="recentConversations.length > 0" class="mb-3">
              <div class="time-group-label">
                前 7 天
              </div>
              <div 
                v-for="conv in recentConversations" 
                :key="conv.id" 
                class="conversation-item" 
                @click="switchConversation(conv.id)"
              >
                <div class="conversation-type-indicator" :class="getChatTypeColor(conv.chatType)"></div>
                <span class="conversation-title">{{ conv.title || formatConversationTitle(conv) }}</span>
              </div>
            </div>
            
            <!-- 更早的对话 -->
            <div v-if="olderConversations.length > 0">
              <div class="time-group-label">
                更早
              </div>
              <div 
                v-for="conv in olderConversations" 
                :key="conv.id" 
                class="conversation-item" 
                @click="switchConversation(conv.id)"
              >
                <div class="conversation-type-indicator" :class="getChatTypeColor(conv.chatType)"></div>
                <span class="conversation-title">{{ conv.title || formatConversationTitle(conv) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="flex items-center p-[9px] px-3 rounded hover:bg-white cursor-pointer relative">
        <img src="../assets/icons/icon-chat.svg" alt="对话历史" class="w-4 h-4" />
        <div class="tooltip">对话历史</div>
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
import { defineProps, defineEmits, computed, ref } from 'vue';
import expandIcon from '../assets/icons/expand.svg';
import type { ChatType } from '../types/chat';
import { formatTime } from '../services/messageService';

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
      agent: []
    })
  }
});

// UI状态变量
const showMoreOptions = ref(false);
const showSearchDialog = ref(false);

// 定义事件
const emit = defineEmits([
  'toggle-collapse', 
  'new-conversation', 
  'switch-conversation', 
  'switch-chat-type',
  'clear-all-conversations'
]);

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

// 清空所有对话
const clearAllConversations = () => {
  showMoreOptions.value = false; // 关闭菜单
  
  // 显示确认对话框
  if (confirm('确定要清空所有对话历史吗？此操作不可撤销。')) {
    emit('clear-all-conversations');
  }
};

// 按当前活跃的聊天类型过滤对话
const filteredConversations = computed(() => {
  return props.activeChatType === 'general' || props.activeChatType === 'agent'
    ? props.recentConversations.filter(conv => conv.chatType === props.activeChatType)
    : props.recentConversations;
});

// 生成对话标题（如果没有标题）
const formatConversationTitle = (conv: ConversationHistory): string => {
  if (conv.title) return conv.title;
  
  // 根据聊天类型生成默认标题
  if (conv.chatType === 'agent') return 'AI Agent对话';
  return '无标题对话';
};

// 获取聊天类型对应的背景颜色
const getChatTypeColor = (chatType: ChatType): string => {
  switch (chatType) {
    case 'agent':
      return 'bg-[#4CAF50]';
    default:
      return 'bg-[#808080]';
  }
};

// 获取今天的对话
const todayConversations = computed(() => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  
  return filteredConversations.value
    .filter(conv => conv.timestamp >= today)
    .sort((a, b) => b.timestamp - a.timestamp);
});

// 获取最近7天的对话（不含今天）
const recentConversations = computed(() => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const sevenDaysAgo = today - 86400000 * 7; // 7天前
  
  return filteredConversations.value
    .filter(conv => conv.timestamp < today && conv.timestamp >= sevenDaysAgo)
    .sort((a, b) => b.timestamp - a.timestamp);
});

// 获取更早的对话（7天前）
const olderConversations = computed(() => {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - 86400000 * 7;
  
  return filteredConversations.value
    .filter(conv => conv.timestamp < sevenDaysAgo)
    .sort((a, b) => b.timestamp - a.timestamp);
});
</script>

<style lang="scss" scoped>
// 组件特有样式在这里定义
.sidebar {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100vh;
  background-color: #f2f3f5;
  overflow: hidden;
  transition: width 0.3s ease;
  border-right: 1px solid #e5e6eb;
  padding: 1rem;
}

.sidebar--expanded {
  width: 240px;
}

.sidebar--collapsed {
  width: 64px;
}

.tooltip {
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  display: none;
  margin-left: 8px;
  z-index: 1000;
}

// 当鼠标悬停在带有工具提示的元素上时显示工具提示
.relative:hover .tooltip {
  display: block;
}

.conversation-list {
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
  
  /* 滚动条悬停时样式 */
  &:hover::-webkit-scrollbar-thumb {
    background-color: #c9cdd4;
  }
}

/* 对话项样式 */
.group {
  position: relative;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
  }
}

.conversation-item {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 4px;
  transition: all 0.2s ease;
}

.conversation-item:hover {
  background-color: #f0f2f5;
  transform: translateX(2px);
}

.conversation-type-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
  flex-shrink: 0;
}

.conversation-title {
  color: #4E5969;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.time-group-label {
  padding: 6px 12px;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #4E5969;
  border: 1px solid rgba(76, 175, 80, 0.4);
  border-radius: 8px;
  background-color: white;
}
</style> 