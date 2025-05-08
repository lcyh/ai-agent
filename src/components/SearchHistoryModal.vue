<template>
  <div v-if="visible" class="search-history-modal-overlay" @click.self="handleClose">
    <div class="search-history-modal">
      <div class="search-history-header">
        <div class="flex items-center gap-2">
          <img src="../assets/icons/icon-search.svg" alt="搜索" class="w-4 h-4" />
          <input 
            v-model="searchQuery" 
            ref="searchInput"
            type="text" 
            class="search-input" 
            placeholder="搜索聊天..." 
            @input="handleSearch"
            @keydown.esc="handleClose"
            autofocus
          />
        </div>
        <div class="flex items-center cursor-pointer" @click="handleClose">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </div>
      </div>
      
      <div class="search-history-body">
        <div v-if="searchQuery && !filteredConversations.length" class="text-center text-[#86909C] text-sm py-4">
          无匹配结果
        </div>
        <div v-else-if="!searchQuery && !recentConversations.length" class="text-center text-[#86909C] text-sm py-4">
          暂无历史会话
        </div>
        <div v-else class="search-result-list">
          <div 
            v-for="conv in filteredConversations.length ? filteredConversations : recentConversations" 
            :key="conv.id" 
            class="search-result-item"
            @click="handleSelectConversation(conv.id)"
          >
            <div class="conversation-indicator" :class="isActiveConversation(conv.id) ? 'bg-[#4CAF50]' : 'bg-[#CCCCCC]'"></div>
            <div class="flex flex-col">
              <span class="search-result-title">{{ conv.title || formatConversationTitle(conv) }}</span>
              <span class="search-result-time">{{ formatDate(conv.timestamp) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineProps, defineEmits, onMounted, watch, nextTick } from 'vue';
import type { ChatType } from '../types/chat';

// 定义会话历史接口
interface ConversationHistory {
  id: string;
  title: string;
  timestamp: number;
  lastMessage: string;
  chatType: ChatType;
}

// 组件属性
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  recentConversations: {
    type: Array as () => ConversationHistory[],
    required: true
  },
  activeConversationId: {
    type: String,
    default: ''
  }
});

// 发射事件
const emit = defineEmits(['close', 'select-conversation']);

// 组件状态
const searchQuery = ref('');
const searchInput = ref<HTMLInputElement | null>(null);

// 计算搜索结果
const filteredConversations = computed(() => {
  if (!searchQuery.value) return [];
  
  const query = searchQuery.value.toLowerCase();
  return props.recentConversations.filter(conv => {
    const title = (conv.title || formatConversationTitle(conv)).toLowerCase();
    const lastMessage = conv.lastMessage?.toLowerCase() || '';
    return title.includes(query) || lastMessage.includes(query);
  });
});

// 判断会话是否激活
const isActiveConversation = (id: string): boolean => {
  return id === props.activeConversationId;
};

// 生成会话标题
const formatConversationTitle = (conv: ConversationHistory): string => {
  if (conv.title) return conv.title;
  if (conv.chatType === 'agent') return 'AI Agent对话';
  return '无标题对话';
};

// 格式化日期
const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  } else if (date.toDateString() === yesterday.toDateString()) {
    return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  } else {
    return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
};

// 处理搜索输入
const handleSearch = () => {
  // 实时搜索，不需要额外处理
};

// 处理选择会话
const handleSelectConversation = (id: string) => {
  emit('select-conversation', id);
  handleClose();
};

// 关闭弹窗
const handleClose = () => {
  emit('close');
  searchQuery.value = '';
};

// 当弹窗显示时自动聚焦输入框
watch(() => props.visible, (newVal) => {
  if (newVal) {
    nextTick(() => {
      searchInput.value?.focus();
    });
  }
});
</script>

<style lang="scss" scoped>
.search-history-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 60px;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.search-history-modal {
  width: 500px;
  max-width: 90vw;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  animation: slideDown 0.3s ease;
}

.search-history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #E5E6EB;
}

.search-input {
  border: none;
  outline: none;
  width: 100%;
  font-size: 16px;
  color: #1D2129;
  background: transparent;
}

.search-history-body {
  max-height: 60vh;
  overflow-y: auto;
}

.search-result-list {
  padding: 8px;
}

.search-result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  cursor: pointer;
  border-radius: 8px;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #F7F8FA;
  }
}

.conversation-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.search-result-title {
  font-size: 14px;
  color: #1D2129;
  margin-bottom: 4px;
}

.search-result-time {
  font-size: 12px;
  color: #86909C;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 自定义滚动条样式
.search-history-body {
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
</style> 