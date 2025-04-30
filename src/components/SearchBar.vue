<template>
  <div 
    class="search-container" 
    :class="{'search-expanded': isExpanded || searchQuery}"
    @mouseenter="isExpanded = true"
    @mouseleave="!searchQuery && (isExpanded = false)"
  >
    <div class="search-input-wrapper">
      <input
        ref="searchInput"
        v-model="searchQuery"
        class="search-input"
        type="text"
        :placeholder="isExpanded ? placeholder : '搜索...'"
        @focus="showSuggestions = true; isExpanded = true"
        @keydown.enter="performSearch"
        @keydown.escape="clearSearch"
        @keydown.down="navigateSuggestion(1)"
        @keydown.up="navigateSuggestion(-1)"
      />
      
      <button 
        v-if="searchQuery" 
        class="clear-button"
        @click="clearSearch"
      >
        <img src="../assets/icons/icon-close.svg" alt="清除" class="w-4 h-4" />
      </button>
      
      <button 
        class="search-button" 
        @click="performSearch"
      >
        <img src="../assets/icons/icon-search.svg" alt="搜索" class="w-4 h-4" />
      </button>
    </div>
    
    <!-- 搜索建议 -->
    <div v-if="showSuggestions && (suggestions.length > 0 || searchHistory.length > 0)" class="suggestions-container">
      <!-- 搜索建议 -->
      <div v-if="suggestions.length > 0">
        <div class="suggestion-category">搜索建议</div>
        <div 
          v-for="(suggestion, index) in suggestions" 
          :key="`suggestion-${index}`"
          class="suggestion-item"
          :class="{ 'suggestion-active': selectedIndex === index }"
          @click="selectSuggestion(suggestion)"
          @mouseenter="selectedIndex = index"
        >
          <img src="../assets/icons/icon-search.svg" alt="建议" class="w-3 h-3 mr-2" />
          <span v-html="highlightMatch(suggestion, searchQuery)"></span>
        </div>
      </div>
      
      <!-- 搜索历史 -->
      <div v-if="searchHistory.length > 0 && !searchQuery">
        <div class="suggestion-category">
          <span>搜索历史</span>
          <button class="clear-history-button" @click.stop="clearHistory">清除</button>
        </div>
        <div 
          v-for="(item, index) in searchHistory" 
          :key="`history-${index}`"
          class="suggestion-item"
          :class="{ 'suggestion-active': selectedIndex === index + suggestions.length }"
          @click="selectSuggestion(item)"
          @mouseenter="selectedIndex = index + suggestions.length"
        >
          <img src="../assets/icons/icon-history.svg" alt="历史" class="w-3 h-3 mr-2" />
          <span>{{ item }}</span>
        </div>
      </div>
    </div>
    
    <!-- 搜索过滤器 -->
    <div v-if="showFilters" class="filters-container">
      <div class="filter-header">
        <span>搜索过滤</span>
        <button @click="toggleFilters" class="filter-toggle-button">隐藏</button>
      </div>
      
      <div class="filter-section">
        <label class="filter-label">搜索范围</label>
        <div class="filter-options">
          <label class="filter-option">
            <input type="radio" v-model="searchOptions.currentOnly" :value="false" />
            <span>所有对话</span>
          </label>
          <label class="filter-option">
            <input type="radio" v-model="searchOptions.currentOnly" :value="true" />
            <span>当前对话</span>
          </label>
        </div>
      </div>
      
      <div class="filter-section">
        <label class="filter-label">消息类型</label>
        <div class="filter-options">
          <label class="filter-option">
            <input type="radio" v-model="searchOptions.messageType" value="all" />
            <span>全部</span>
          </label>
          <label class="filter-option">
            <input type="radio" v-model="searchOptions.messageType" value="user" />
            <span>用户消息</span>
          </label>
          <label class="filter-option">
            <input type="radio" v-model="searchOptions.messageType" value="assistant" />
            <span>AI响应</span>
          </label>
        </div>
      </div>
      
      <div class="filter-section">
        <label class="filter-label">其他选项</label>
        <div class="filter-options">
          <label class="filter-option">
            <input type="checkbox" v-model="searchOptions.caseSensitive" />
            <span>区分大小写</span>
          </label>
        </div>
      </div>
      
      <div class="filter-actions">
        <button @click="clearFilters" class="secondary-button">重置</button>
        <button @click="performSearch" class="primary-button">应用</button>
      </div>
    </div>
    
    <!-- 搜索结果 -->
    <div v-if="showResults && searchResults.length > 0" class="results-container">
      <div class="results-header">
        <span>找到 {{ searchResults.length }} 条结果</span>
        <button @click="closeResults" class="close-results-button">关闭</button>
      </div>
      
      <div class="results-list">
        <div 
          v-for="(result, index) in searchResults" 
          :key="`result-${index}`"
          class="result-item"
          @click="selectResult(result)"
        >
          <div class="result-header">
            <span class="result-title">{{ result.conversationTitle }}</span>
            <span class="result-time">{{ formatTime(result.timestamp) }}</span>
          </div>
          
          <div class="result-content">
            <span class="result-role" :class="result.message.role === 'user' ? 'user-role' : 'ai-role'">
              {{ result.message.role === 'user' ? '用户' : 'AI' }}
            </span>
            <p class="result-text" v-html="highlightMatch(result.matchedText, searchQuery)"></p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 未找到结果 -->
    <div v-if="showResults && searchResults.length === 0 && searchQuery" class="no-results">
      <p>未找到与"{{ searchQuery }}"相关的结果</p>
      <p class="no-results-tips">尝试使用不同的关键词或调整搜索过滤器</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import type { ConversationHistory } from '../types/conversationHistory';
import type { Message } from '../types/chat';
import { 
  searchConversations, 
  generateSearchSuggestions, 
  searchHistory,
  clearSearchHistory,
  loadSearchHistory,
  type SearchOptions, 
  type SearchResultItem 
} from '../services/searchService';
import { formatTime as formatTimeUtil } from '../services/messageService';

// 接收参数
const props = defineProps({
  conversations: {
    type: Array as () => ConversationHistory[],
    required: true
  },
  currentConversation: {
    type: Array as () => Message[],
    required: true
  },
  placeholder: {
    type: String,
    default: '搜索'
  }
});

// 触发事件
const emit = defineEmits([
  'search',
  'select-result',
  'clear'
]);

// 状态变量
const searchInput = ref<HTMLInputElement | null>(null);
const searchQuery = ref('');
const searchResults = ref<SearchResultItem[]>([]);
const suggestions = ref<string[]>([]);
const showSuggestions = ref(false);
const showFilters = ref(false);
const showResults = ref(false);
const selectedIndex = ref(-1);
const isExpanded = ref(false);
const searchOptions = ref<SearchOptions>({
  currentOnly: false,
  messageType: 'all',
  caseSensitive: false
});

// 延迟搜索处理
let searchTimeout: number | null = null;

// 监听搜索查询变化
watch(searchQuery, (newQuery) => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  
  if (newQuery.trim()) {
    // 延迟300ms，避免频繁搜索
    searchTimeout = window.setTimeout(() => {
      updateSuggestions();
    }, 300);
  } else {
    suggestions.value = [];
  }
});

// 更新搜索建议
const updateSuggestions = () => {
  if (!searchQuery.value.trim()) {
    suggestions.value = [];
    return;
  }
  
  suggestions.value = generateSearchSuggestions(
    searchQuery.value,
    props.conversations
  );
};

// 执行搜索
const performSearch = () => {
  if (!searchQuery.value.trim()) return;
  
  searchResults.value = searchConversations(
    searchQuery.value,
    props.conversations,
    props.currentConversation,
    searchOptions.value
  );
  
  showSuggestions.value = false;
  showResults.value = true;
  selectedIndex.value = -1;
  
  emit('search', { 
    query: searchQuery.value, 
    results: searchResults.value, 
    options: searchOptions.value 
  });
};

// 清除搜索
const clearSearch = () => {
  searchQuery.value = '';
  searchResults.value = [];
  showSuggestions.value = false;
  showResults.value = false;
  selectedIndex.value = -1;
  isExpanded.value = false;
  
  emit('clear');
};

// 选择搜索建议
const selectSuggestion = (suggestion: string) => {
  searchQuery.value = suggestion;
  showSuggestions.value = false;
  performSearch();
};

// 导航搜索建议
const navigateSuggestion = (direction: number) => {
  const totalOptions = suggestions.value.length + 
    (searchQuery.value ? 0 : searchHistory.value.length);
  
  if (totalOptions === 0) return;
  
  if (selectedIndex.value === -1 && direction < 0) {
    selectedIndex.value = totalOptions - 1;
  } else {
    selectedIndex.value = (selectedIndex.value + direction + totalOptions) % totalOptions;
  }
  
  if (selectedIndex.value >= 0) {
    if (selectedIndex.value < suggestions.value.length) {
      searchQuery.value = suggestions.value[selectedIndex.value];
    } else {
      const historyIndex = selectedIndex.value - suggestions.value.length;
      searchQuery.value = searchHistory.value[historyIndex];
    }
  }
};

// 选择搜索结果
const selectResult = (result: SearchResultItem) => {
  emit('select-result', result);
};

// 关闭搜索结果
const closeResults = () => {
  showResults.value = false;
};

// 切换过滤器显示
const toggleFilters = () => {
  showFilters.value = !showFilters.value;
};

// 清除过滤器
const clearFilters = () => {
  searchOptions.value = {
    currentOnly: false,
    messageType: 'all',
    caseSensitive: false
  };
};

// 清除搜索历史
const clearHistory = () => {
  clearSearchHistory();
};

// 高亮匹配的文本
const highlightMatch = (text: string, query: string): string => {
  if (!query.trim()) return text;
  
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, searchOptions.value.caseSensitive ? 'g' : 'gi');
  
  return text.replace(regex, '<mark class="highlight-match">$1</mark>');
};

// 格式化时间
const formatTime = (timestamp: number): string => {
  return formatTimeUtil(timestamp);
};

// 组件挂载时加载历史记录
onMounted(() => {
  loadSearchHistory();
  nextTick(() => {
    searchInput.value?.focus();
  });
});
</script>

<style scoped>
.search-container {
  position: relative;
  width: 180px;
  font-size: 14px;
  transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1);
}

.search-expanded {
  width: 100%;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.search-input {
  width: 100%;
  height: 36px;
  padding: 0 36px 0 12px;
  border: 1px solid #e5e6eb;
  border-radius: 18px;
  background-color: #f7f8fa;
  transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.search-input:focus {
  background-color: #fff;
  border-color: #94bfff;
  box-shadow: 0 0 0 3px rgba(22, 93, 255, 0.1);
  outline: none;
  animation: focusPulse 1.5s ease-in-out infinite;
}

@keyframes focusPulse {
  0% {
    box-shadow: 0 0 0 0 rgba(22, 93, 255, 0.4);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(22, 93, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(22, 93, 255, 0);
  }
}

.clear-button, 
.search-button {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.clear-button {
  right: 36px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.clear-button:hover {
  background-color: rgba(255, 77, 79, 0.1);
  transform: translateY(-50%) scale(1.1);
}

.search-button:hover {
  opacity: 1;
  background-color: rgba(22, 93, 255, 0.1);
  transform: translateY(-50%) scale(1.1);
}

.search-button:active {
  transform: translateY(-50%) scale(0.95);
}

.suggestions-container {
  position: absolute;
  top: 42px;
  left: 0;
  width: 100%;
  max-height: 300px;
  overflow-y: auto;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 6px 16px -8px rgba(0, 0, 0, 0.08),
    0 9px 28px 0 rgba(0, 0, 0, 0.05),
    0 12px 48px 16px rgba(0, 0, 0, 0.03);
  z-index: 100;
  animation: slideDown 0.2s ease-out;
  border: 1px solid rgba(229, 230, 235, 0.7);
  backdrop-filter: blur(8px);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.suggestion-category {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  color: #86909c;
  font-size: 12px;
  background-color: rgba(248, 249, 250, 0.6);
  border-bottom: 1px solid rgba(229, 230, 235, 0.5);
}

.suggestion-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 8px;
  margin: 3px 6px;
}

.suggestion-item:hover,
.suggestion-active {
  background-color: rgba(22, 93, 255, 0.05);
  color: #165dff;
}

.filters-container {
  position: absolute;
  top: 42px;
  left: 0;
  width: 100%;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 6px 16px -8px rgba(0, 0, 0, 0.08),
    0 9px 28px 0 rgba(0, 0, 0, 0.05),
    0 12px 48px 16px rgba(0, 0, 0, 0.03);
  z-index: 100;
  padding: 16px;
  animation: slideDown 0.3s ease-out;
  border: 1px solid rgba(229, 230, 235, 0.7);
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  font-weight: 500;
  color: #1d2129;
}

.filter-toggle-button {
  color: #165dff;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-size: 13px;
  font-weight: 500;
  transition: color 0.2s;
}

.filter-toggle-button:hover {
  color: #4080ff;
}

.filter-section {
  margin-bottom: 16px;
}

.filter-label {
  display: block;
  margin-bottom: 8px;
  color: #4e5969;
  font-size: 13px;
  font-weight: 500;
}

.filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-option {
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: color 0.2s;
}

.filter-option:hover {
  color: #165dff;
}

.filter-option input {
  margin-right: 6px;
  accent-color: #165dff;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.primary-button,
.secondary-button {
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
  font-weight: 500;
}

.primary-button {
  background-color: #165dff;
  color: #fff;
  border: none;
  box-shadow: 0 2px 5px rgba(22, 93, 255, 0.2);
}

.primary-button:hover {
  background-color: #4080ff;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(22, 93, 255, 0.3);
}

.secondary-button {
  background-color: #f2f3f5;
  color: #4e5969;
  border: 1px solid #e5e6eb;
}

.secondary-button:hover {
  background-color: #e5e6eb;
  color: #1d2129;
}

.results-container {
  position: absolute;
  top: 42px;
  left: 0;
  width: 100%;
  max-height: 450px;
  overflow-y: auto;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 6px 16px -8px rgba(0, 0, 0, 0.1),
    0 9px 28px 0 rgba(0, 0, 0, 0.05),
    0 12px 48px 16px rgba(0, 0, 0, 0.03);
  z-index: 100;
  animation: slideDown 0.3s ease-out;
  border: 1px solid rgba(229, 230, 235, 0.7);
  scrollbar-width: thin;
  scrollbar-color: #e5e6eb transparent;
}

.results-container::-webkit-scrollbar {
  width: 6px;
}

.results-container::-webkit-scrollbar-track {
  background: transparent;
}

.results-container::-webkit-scrollbar-thumb {
  background-color: #e5e6eb;
  border-radius: 3px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background-color: rgba(248, 249, 250, 0.8);
  border-bottom: 1px solid #e5e6eb;
  font-size: 13px;
  position: sticky;
  top: 0;
  backdrop-filter: blur(8px);
  z-index: 2;
}

.close-results-button {
  color: #165dff;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-size: 13px;
  font-weight: 500;
  transition: color 0.2s;
}

.close-results-button:hover {
  color: #4080ff;
}

.results-list {
  padding: 6px;
}

.result-item {
  padding: 12px;
  cursor: pointer;
  border-radius: 8px;
  margin-bottom: 4px;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
  animation: fadeIn 0.3s ease-out;
  animation-fill-mode: both;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 添加搜索结果项的交错动画 */
.result-item:nth-child(1) { animation-delay: 0.1s; }
.result-item:nth-child(2) { animation-delay: 0.15s; }
.result-item:nth-child(3) { animation-delay: 0.2s; }
.result-item:nth-child(4) { animation-delay: 0.25s; }
.result-item:nth-child(5) { animation-delay: 0.3s; }
.result-item:nth-child(n+6) { animation-delay: 0.35s; }

.result-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.result-title {
  font-weight: 500;
  color: #1d2129;
}

.result-time {
  color: #86909c;
  font-size: 12px;
}

.result-content {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.result-role {
  color: #165dff;
  font-size: 12px;
  white-space: nowrap;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.user-role {
  background-color: rgba(22, 93, 255, 0.1);
  color: #165dff;
}

.ai-role {
  background-color: rgba(0, 180, 42, 0.1);
  color: #00b42a;
}

.result-text {
  color: #4e5969;
  font-size: 13px;
  line-height: 1.6;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.no-results {
  position: absolute;
  top: 42px;
  left: 0;
  width: 100%;
  padding: 24px 16px;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 6px 16px -8px rgba(0, 0, 0, 0.08),
    0 9px 28px 0 rgba(0, 0, 0, 0.05);
  z-index: 100;
  text-align: center;
  animation: slideDown 0.3s ease-out;
  border: 1px solid rgba(229, 230, 235, 0.7);
}

.no-results p {
  margin: 0;
  color: #1d2129;
}

.no-results-tips {
  font-size: 12px;
  color: #86909c;
  margin-top: 6px !important;
}

.clear-history-button {
  color: #165dff;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-size: 12px;
  font-weight: 500;
  transition: color 0.2s;
}

.clear-history-button:hover {
  color: #4080ff;
}

/* 高亮匹配的文本 */
:deep(.highlight-match) {
  background-color: rgba(22, 93, 255, 0.15);
  font-weight: 500;
  padding: 0 1px;
  border-radius: 2px;
  color: #165dff;
  position: relative;
  display: inline-block;
  animation: highlightFade 1.5s ease-out;
}

@keyframes highlightFade {
  0% {
    background-color: rgba(22, 93, 255, 0.3);
  }
  100% {
    background-color: rgba(22, 93, 255, 0.15);
  }
}

.result-item::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 12px;
  right: 12px;
  height: 1px;
  background-color: #f2f3f5;
}

.result-item:last-child::after {
  display: none;
}

.result-item:hover {
  background-color: rgba(248, 249, 250, 0.8);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
</style> 