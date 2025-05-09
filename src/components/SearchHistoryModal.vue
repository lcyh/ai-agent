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
          <div class="text-center text-[#86909C] text-xs py-2">
            {{ `可用历史记录: ${recentConversations.length}条` }}
          </div>
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
import { ref, computed, defineProps, defineEmits, watch, nextTick, onMounted } from 'vue';
import type { ChatType } from '../types/chat';

// 精简会话历史接口
interface ConversationHistory {
  id: string;
  title: string;
  timestamp: number;
  lastMessage: string;
  chatType: ChatType;
}

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

const emit = defineEmits(['close', 'select-conversation']);
const searchQuery = ref('');
const searchInput = ref<HTMLInputElement | null>(null);

// 计算搜索结果 - 简化搜索逻辑
const filteredConversations = computed(() => {
  if (!searchQuery.value) return [];
  
  const query = searchQuery.value.toLowerCase().trim();
  return props.recentConversations.filter(conv => {
    const title = (conv.title || formatConversationTitle(conv)).toLowerCase();
    const lastMessage = (conv.lastMessage || '').toLowerCase();
    return title.includes(query) || lastMessage.includes(query);
  });
});

// 判断会话是否激活
const isActiveConversation = (id: string) => id === props.activeConversationId;

// 生成会话标题
const formatConversationTitle = (conv: ConversationHistory) => {
  if (conv.title) return conv.title;
  return conv.chatType === 'agent' ? 'AI Agent对话' : '无标题对话';
};

// 格式化日期 - 精简版本
const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const formatTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  
  if (date.toDateString() === today.toDateString()) {
    return `今天 ${formatTime}`;
  } else if (date.toDateString() === yesterday.toDateString()) {
    return `昨天 ${formatTime}`;
  } else {
    return `${date.getMonth() + 1}月${date.getDate()}日 ${formatTime}`;
  }
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
    nextTick(() => searchInput.value?.focus());
  }
});

// 监听父组件传入的数据变化
watch(() => props.recentConversations, (newVal) => {
  console.log('SearchHistoryModal recentConversations changed:', newVal.length);
}, { immediate: true });
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
}

.search-history-modal {
  width: 500px;
  max-width: 90vw;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.search-history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
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
  padding: 4px;
}

.search-result-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  
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
  margin-bottom: 2px;
}

.search-result-time {
  font-size: 12px;
  color: #86909C;
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
}
</style> 