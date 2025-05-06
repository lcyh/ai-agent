<template>
  <aside 
    v-if="!isMobile || !isCollapsed"
    class="sidebar" 
    :class="isCollapsed ? 'sidebar--collapsed' : 'sidebar--expanded'"
  >
    <div class="flex flex-col gap-4">
      <!-- Logo 和折叠按钮 -->
      <div v-if="!isCollapsed" class="flex justify-between items-center w-full">
        <div class="flex items-center gap-2">
          <div class="relative">
            <img src="../assets/icons/logo.svg" class="w-6 h-6 rounded-full" alt="Logo" />
          </div>
          <span class="text-xl font-medium truncate">AI Agent</span>
        </div>
        <div class="p-1 rounded cursor-pointer hover:bg-gray-100 relative" @click="toggleCollapse">
          <img 
            :src="expandIcon" 
            alt="折叠" 
            class="w-5 h-5" 
          />
        </div>
      </div>

      <!-- 折叠时显示的垂直排列布局 -->
      <div v-if="isCollapsed" class="flex flex-col items-center gap-6">
        <!-- Logo -->
        <div 
          class="tooltip-wrapper"
          @mouseenter="showTooltip($event, 'AI Agent')"
          @mouseleave="hideTooltip"
        >
          <img src="../assets/icons/logo.svg" class="w-8 h-8 rounded-full cursor-pointer" alt="Logo" />
        </div>
        
        <!-- 折叠按钮 -->
        <div 
          class="tooltip-wrapper"
          @mouseenter="showTooltip($event, '展开导航')"
          @mouseleave="hideTooltip"
        >
          <div class="p-1 rounded cursor-pointer hover:bg-gray-100" @click="toggleCollapse">
            <img 
              :src="expandIcon" 
              alt="展开" 
              class="w-5 h-5 rotate-180" 
            />
          </div>
        </div>
      </div>

      <!-- 开启新对话按钮 -->
      <a-button v-if="!isCollapsed" type="primary" class="new-chat-button flex items-center justify-center h-10 w-full relative" :style="{ backgroundColor: '$primary-color' }" @click="createNewConversation('general')">
        <div class="flex items-center justify-center">
          <img src="../assets/icons/icon-chat.svg" alt="开启新对话" class="w-4 h-4 mr-2" />
          <span>开启新对话</span>
        </div>
      </a-button>

      <!-- 折叠时的新对话按钮 -->
      <div 
        v-if="isCollapsed" 
        class="tooltip-wrapper"
        @mouseenter="showTooltip($event, '开启新对话')"
        @mouseleave="hideTooltip"
      >
        <div class="p-2 rounded-full flex items-center justify-center cursor-pointer new-chat-icon" @click="createNewConversation('general')">
          <img src="../assets/icons/icon-chat.svg" alt="开启新对话" class="w-5 h-5" />
        </div>
      </div>

      <div class="w-full h-px bg-[#E5E6EB]"></div>

      <!-- 对话历史 -->
      <div v-if="!isCollapsed" class="flex flex-col gap-4">
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-2">
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
                :class="{ 'conversation-item--active': isActiveConversation(conv.id) }"
                @click="switchConversation(conv.id)"
              >
                <div class="conversation-type-indicator" 
                     :class="[getChatTypeColor(conv.chatType), 
                             isActiveConversation(conv.id) ? 'conversation-type-indicator--active' : '']"></div>
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
                :class="{ 'conversation-item--active': isActiveConversation(conv.id) }"
                @click="switchConversation(conv.id)"
              >
                <div class="conversation-type-indicator" 
                     :class="[getChatTypeColor(conv.chatType), 
                             isActiveConversation(conv.id) ? 'conversation-type-indicator--active' : '']"></div>
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
                :class="{ 'conversation-item--active': isActiveConversation(conv.id) }"
                @click="switchConversation(conv.id)"
              >
                <div class="conversation-type-indicator" 
                     :class="[getChatTypeColor(conv.chatType), 
                             isActiveConversation(conv.id) ? 'conversation-type-indicator--active' : '']"></div>
                <span class="conversation-title">{{ conv.title || formatConversationTitle(conv) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 对话历史图标（折叠状态） -->
      <div 
        v-else 
        class="tooltip-wrapper"
        @mouseenter="showTooltip($event, '对话历史')"
        @mouseleave="hideTooltip"
      >
        <div class="flex items-center p-[9px] px-3 rounded hover:bg-white cursor-pointer">
          <img src="../assets/icons/icon-chat.svg" alt="对话历史" class="w-4 h-4" />
        </div>
      </div>
    </div>

    <!-- 个人入口 -->
    <div v-if="!isCollapsed" class="flex items-center gap-2 p-2 px-3 rounded hover:bg-white cursor-pointer">
      <img src="../assets/icons/user-avatar.svg" class="w-6 h-6 rounded-full" alt="User" />
      <span class="text-[#1D2129] truncate">lc</span>
    </div>

    <!-- 折叠状态的个人入口 -->
    <div 
      v-else 
      class="tooltip-wrapper"
      @mouseenter="showTooltip($event, 'lc')"
      @mouseleave="hideTooltip"
    >
      <div class="flex items-center rounded hover:bg-white cursor-pointer">
        <img src="../assets/icons/user-avatar.svg" class="w-6 h-6 rounded-full" alt="User" />
      </div>
    </div>
  </aside>
  
  <!-- 通过teleport将气泡提示渲染到body -->
  <teleport to="body">
    <div v-if="tooltipVisible" class="global-tooltip" :style="tooltipStyle">
      {{ tooltipText }}
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, computed, ref, onMounted, onBeforeUnmount } from 'vue';
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

// 气泡提示状态
const tooltipVisible = ref(false);
const tooltipText = ref('');
const tooltipStyle = ref({});
let tooltipTimer: number | null = null;

// 显示气泡提示
const showTooltip = (event: MouseEvent, text: string) => {
  if (tooltipTimer) {
    window.clearTimeout(tooltipTimer);
    tooltipTimer = null;
  }
  
  const element = event.currentTarget as HTMLElement;
  const rect = element.getBoundingClientRect();
  
  tooltipText.value = text;
  tooltipStyle.value = {
    top: `${rect.top + rect.height / 2}px`,
    left: `${rect.right + 15}px`,
  };
  tooltipVisible.value = true;
};

// 隐藏气泡提示
const hideTooltip = () => {
  tooltipTimer = window.setTimeout(() => {
    tooltipVisible.value = false;
  }, 100);
};

// 在组件卸载前清除所有定时器
onBeforeUnmount(() => {
  if (tooltipTimer) {
    window.clearTimeout(tooltipTimer);
  }
});

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
  activeConversationId: {
    type: String,
    default: ''
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
const currentActiveId = ref(''); // 内部跟踪的当前选中对话ID

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
  currentActiveId.value = id; // 更新内部状态
  emit('switch-conversation', id);
};

// 判断对话是否处于激活状态
const isActiveConversation = (id: string): boolean => {
  return id === props.activeConversationId || id === currentActiveId.value;
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
  return props.recentConversations;
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

.tooltip-wrapper {
  position: relative;
  display: inline-block;
}

.tooltip-wrapper:hover .tooltip {
  visibility: visible;
  opacity: 1;
}

.tooltip {
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  margin-left: 12px;
  z-index: 9999; 
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  visibility: hidden;
  opacity: 0;
  transition: opacity 0.2s;
}

.tooltip::before {
  content: "";
  position: absolute;
  top: 50%;
  right: 100%;
  margin-top: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: transparent rgba(0, 0, 0, 0.8) transparent transparent;
}

// 新对话按钮样式
.new-chat-button {
  background-color: #165dff !important;
  color: white;
  border-radius: 8px;
  overflow: hidden;
  border: none;
  box-shadow: 0 2px 5px rgba(22, 93, 255, 0.2);
  transition: all 0.3s ease;
  
  &:hover {
    background-color: #4080ff !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(22, 93, 255, 0.3);
  }
  
  &:active {
    transform: translateY(1px);
  }
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
  padding: 6px 12px 6px 6px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 4px;
  transition: all 0.2s ease;
}

.conversation-item:hover {
  background-color: #f0f2f5;
}

.conversation-type-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 8px;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.conversation-type-indicator--active {
  animation: heartbeat 2.5s ease-in-out infinite;
  box-shadow: 0 0 0 rgba(22, 93, 255, 0.4);
}

@keyframes heartbeat {
  0% {
    transform: scale(1);
  }
  25% {
    transform: scale(1.2);
  }
  50% {
    transform: scale(1);
  }
  75% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

.conversation-title {
  color: #4E5969;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.time-group-label {
  padding: 6px 12px 6px 0;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #4E5969;
  border-radius: 8px;
}

.conversation-item--active {
  background-color: rgba(22, 93, 255, 0.1);
  border-radius: 8px;
  font-weight: 500;
  transform: translateX(0) !important;
  box-shadow: 0 2px 4px rgba(22, 93, 255, 0.1);
  
  .conversation-title {
    color: #165DFF;
  }
  
  &:hover {
    background-color: rgba(22, 93, 255, 0.15);
  }
}

// 新对话图标样式（折叠状态）
.new-chat-icon {
  background-color: #165dff;
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  transition: all 0.3s ease;
  position: relative; /* 确保相对定位 */
  
  &:hover {
    background-color: #4080ff;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(22, 93, 255, 0.3);
  }
  
  img {
    filter: brightness(0) invert(1);
  }
}

.global-tooltip {
  position: fixed;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 99999;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-50%);
  pointer-events: none;
  left: 70px;
  margin-left: 15px;
}

.global-tooltip::before {
  content: "";
  position: absolute;
  top: 50%;
  right: 100%;
  margin-top: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: transparent rgba(0, 0, 0, 0.8) transparent transparent;
}
</style> 