<template>
  <div class="flex h-screen bg-[#F1F6FB]">
    <!-- 左侧导航栏 -->
    <aside 
      class="flex flex-col justify-between h-full bg-[#F1F6FB] p-3 py-3 transition-all duration-300" 
      :class="isCollapsed ? 'w-[80px]' : 'w-[240px]'"
    >
      <div class="flex flex-col gap-4">
        <!-- Logo -->
        <div class="flex justify-between items-center w-full">
          <div class="flex items-center gap-2">
            <div class="relative">
              <img src="../assets/icons/logo.svg" class="w-6 h-6 rounded-full" alt="Logo" />
              <div v-if="isCollapsed" class="tooltip">AI Agent</div>
            </div>
            <span v-if="!isCollapsed" class="text-xl font-medium text-[#1D2129] truncate">AI Agent</span>
          </div>
          <div class="p-1 rounded cursor-pointer hover:bg-gray-100 relative" @click="isCollapsed = !isCollapsed">
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
        <a-button type="primary" class="flex items-center justify-center h-10 w-full relative" style="background-color: #165DFF" @click="newConversation">
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
          <!-- <div class="flex items-center gap-2 p-[9px] px-3 rounded hover:bg-white cursor-pointer relative">
            <img src="../assets/icons/icon-chart.svg" alt="图表" class="w-4 h-4" />
            <span v-if="!isCollapsed" class="text-[#1D2129]">AI图表</span>
            <div v-if="isCollapsed" class="tooltip">AI图表</div>
          </div> -->
          <!-- <div class="flex items-center gap-2 p-[9px] px-3 rounded hover:bg-white cursor-pointer relative">
            <img src="../assets/icons/icon-library.svg" alt="知识库" class="w-4 h-4" />
            <span v-if="!isCollapsed" class="text-[#1D2129]">知识库</span>
            <div v-if="isCollapsed" class="tooltip">知识库</div>
          </div>
          <div class="flex items-center gap-2 p-[9px] px-3 rounded hover:bg-white cursor-pointer relative">
            <img src="../assets/icons/icon-apps.svg" alt="智能体" class="w-4 h-4" />
            <span v-if="!isCollapsed" class="text-[#1D2129]">智能体</span>
            <div v-if="isCollapsed" class="tooltip">智能体</div>
          </div> -->
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
            <div v-for="(conv, index) in recentConversations" :key="index" class="flex items-center gap-2 p-[9px] px-3 rounded hover:bg-white cursor-pointer" @click="switchToConversation(conv.id)">
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

    <!-- 主内容区 -->
    <main class="flex-1 flex flex-col relative bg-white rounded-xl mx-4 my-3">
      <!-- 页头 -->
      <div class="flex justify-between items-center p-2.5 px-4 border-b border-[#F2F3F5] absolute top-0 left-0 right-0 bg-white z-10 rounded-t-xl">
        <div class="flex items-center gap-6">
          <div class="px-2 py-1">
            <span class="text-base font-medium text-[#1D2129]">这是一段对话</span>
          </div>
          <div class="flex items-center gap-2 bg-[#F2F3F5] px-3 py-1.5 rounded">
            <img src="../assets/icons/icon-search.svg" alt="搜索" class="w-4 h-4" />
            <span class="text-[#86909C]">搜索</span>
          </div>
        </div>
      </div>

      <!-- 对话区域 -->
      <div class="flex-1 overflow-auto p-6 px-6 pt-24 pb-40 md:px-[100px] lg:px-[160px]">
        <!-- 对话内容 -->
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
                <div class="bg-[#165DFF] text-white p-3 px-4 rounded-lg max-w-3xl shadow-sm">
                  <p class="text-sm">{{ message.content }}</p>
                </div>
              </div>
              <img src="../assets/icons/user-avatar.svg" class="w-10 h-10 rounded-full flex-shrink-0" alt="User" />
            </div>
            
            <!-- AI气泡 -->
            <div v-else-if="message.role === 'assistant'" class="flex justify-start gap-4 mb-6">
              <img src="../assets/icons/logo.svg" class="w-10 h-10 rounded-full flex-shrink-0" alt="AI" />
              <div class="flex flex-col w-full max-w-3xl">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-xs text-[#4E5969]">AI Agent</span>
                  <span class="text-xs text-[#86909C]">{{ formatTime(message.timestamp) }}</span>
                </div>
                <div class="bg-white shadow-sm border border-[#F2F3F5] p-3 px-4 rounded-lg">
                  <!-- 使用v-html渲染格式化后的消息内容，允许代码块渲染 -->
                  <div v-if="!hasCodeBlock(message.content)" class="text-sm text-[#1D2129] whitespace-pre-wrap">{{ message.content }}</div>
                  <div v-else v-html="formatMessageWithCodeBlocks(message.content)" class="message-content"></div>
                  
                  <!-- 可能的图表或搜索结果 -->
                  <div v-if="message.streaming && message.chart?.title" class="mt-4 border border-[#F2F3F5] rounded-xl p-4">
                    <div class="flex items-center gap-x-2 mb-2">
                      <div class="text-base font-medium">{{ message.chart.title }}</div>
                    </div>
                    <div class="w-full h-60 bg-gray-100 rounded flex items-center justify-center">
                      <!-- 图表渲染位置 -->
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
                        <img src="../assets/icons/icon-volume.svg" alt="朗读" class="w-4 h-4" />
                      </div>
                      <div class="p-1 rounded cursor-pointer hover:bg-gray-100" @click="copyMessageContent(message.content)">
                        <img src="../assets/icons/icon-copy.svg" alt="复制" class="w-4 h-4" />
                      </div>
                      <div class="p-1 rounded cursor-pointer hover:bg-gray-100">
                        <img src="../assets/icons/icon-refresh.svg" alt="刷新" class="w-4 h-4" />
                      </div>
                      <div class="p-1 rounded cursor-pointer hover:bg-gray-100">
                        <img src="../assets/icons/icon-share.svg" alt="分享" class="w-4 h-4" />
                      </div>
                      <div class="p-1 rounded cursor-pointer hover:bg-gray-100">
                        <img src="../assets/icons/icon-more.svg" alt="更多" class="w-4 h-4" />
                      </div>
                    </div>
                    
                    <div class="flex gap-1">
                      <div class="p-1 rounded cursor-pointer hover:bg-gray-100">
                        <img src="../assets/icons/icon-thumb-up.svg" alt="赞" class="w-4 h-4" />
                      </div>
                      <div class="p-1 rounded cursor-pointer hover:bg-gray-100">
                        <img src="../assets/icons/icon-thumb-down.svg" alt="踩" class="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- 猜你想问 -->
                <div v-if="message.suggestions && message.suggestions.length > 0" class="flex flex-col gap-2 mt-3">
                  <div v-for="(suggestion, sIndex) in message.suggestions" :key="sIndex" 
                       class="flex justify-between items-center border border-[#F2F3F5] rounded-lg p-2 px-3 cursor-pointer hover:bg-gray-50"
                       @click="sendMessage(suggestion)">
                    <span class="text-sm text-[#1D2129]">🔍 {{ suggestion }}</span>
                    <img src="../assets/icons/icon-chart.svg" alt="发送" class="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入框 - 简化版 -->
      <div class="absolute bottom-0 left-0 right-0 bg-white border-t border-[#F2F3F5] p-4 shadow-lg">
        <div class="max-w-4xl mx-auto">
          <!-- 输入框和发送按钮 -->
          <div class="flex flex-col">
            <!-- 模型选择区域 -->
            <div class="flex flex-wrap items-center gap-2 mb-3">
              <div 
                class="flex items-center gap-1 px-2 py-1 rounded cursor-pointer" 
                :class="selectedModel === 'deepseek' ? 'bg-[#EFF3FF] border border-[#94BFFF]' : 'bg-[#F7F8FA]'"
                @click="selectModel('deepseek')"
              >
                <img src="../assets/icons/icon-deepseek.svg" class="w-4 h-4" alt="DeepSeek" />
                <span class="text-[#1D2129]">DeepSeek-R1</span>
              </div>
              <div 
                class="flex items-center gap-1 px-2 py-1 rounded cursor-pointer" 
                :class="selectedModel === 'silicon' ? 'bg-[#EFF3FF] border border-[#94BFFF]' : 'bg-[#F7F8FA]'"
                @click="selectModel('silicon')"
              >
                <img src="../assets/icons/icon-deepseek.svg" class="w-4 h-4" alt="硅基流动" />
                <span class="text-[#1D2129]">硅基流动</span>
              </div>
              <div 
                class="flex items-center gap-1 px-2 py-1 rounded cursor-pointer" 
                :class="selectedModel === 'web' ? 'bg-[#EFF3FF] border border-[#94BFFF]' : 'bg-[#F7F8FA]'"
                @click="selectModel('web')"
              >
                <img src="../assets/icons/icon-global.svg" class="w-4 h-4" alt="联网搜索" />
                <span class="text-[#1D2129]">联网搜索</span>
              </div>
            </div>
            
            <!-- 输入和发送区域 -->
            <div class="flex items-center justify-between min-h-[56px] border border-[#E5E6EB] rounded-lg p-2 px-4 bg-white focus-within:border-[#165DFF]">
              <input 
                v-model="inputMessage" 
                type="text" 
                placeholder="给AI Agent发消息" 
                class="flex-1 outline-none text-[#1D2129] text-sm"
                @keyup.enter="sendMessage()"
              />
              <div 
                class="w-8 h-8 flex items-center justify-center rounded-full bg-[#165DFF] cursor-pointer hover:bg-[#4080FF] ml-2 transition-colors"
                @click="sendMessage()"
              >
                <img src="../assets/icons/icon-sent.svg" class="w-4 h-4" alt="发送" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, nextTick, computed } from 'vue';
import expandIcon from '../assets/icons/expand.svg';
import { deepseekApi, siliconFlowApi, modelConfig } from '../api/ai';
import type { ModelType } from '../api/ai';
import { 
  formatTime, 
  scrollToBottom, 
  DEFAULT_WELCOME_MESSAGE,
  createUserMessage,
  createLoadingAIMessage,
  withTimeout,
  REQUEST_TIMEOUT,
  hasCodeBlock,
  formatMessageWithCodeBlocks,
  copyMessageContent,
  debounce,
  finalizeAIMessage,
  updateMessageUI,
  handleResponseError,
  setupCodeBlockEventListeners
} from './chat/utils';
import type { Message } from './chat/types';

// 对话历史记录类型定义
interface ConversationHistory {
  id: string;
  title: string;
  timestamp: number;
  lastMessage: string;
  messages: Message[];
}

// 状态变量
const isCollapsed = ref(false);
const inputMessage = ref('');
const selectedModel = ref<ModelType>('deepseek'); // 默认选择DeepSeek-R1
const isLoading = ref(false);
const abortController = ref<AbortController | null>(null);
const activeConversationId = ref<string>('default');
const historyConversations = ref<ConversationHistory[]>([]);

// 获取当前激活的对话
const currentConversation = computed(() => {
  return historyConversations.value.find(conv => conv.id === activeConversationId.value) || historyConversations.value[0];
});

// 初始化对话内容
const conversation = reactive<Message[]>([
  { ...DEFAULT_WELCOME_MESSAGE, timestamp: Date.now() - 60000 }
]);

// 按时间从近到远排序的最近对话
const recentConversations = computed(() => {
  return [...historyConversations.value].sort((a, b) => b.timestamp - a.timestamp);
});

// 滚动节流 - 避免过于频繁的滚动
const debouncedScroll = debounce(scrollToBottom, 100);

// 生成唯一ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 创建新对话
const newConversation = () => {
  // 如果当前对话有内容，保存到历史记录
  if (conversation.length > 1) {
    saveCurrentConversation();
  }
  
  // 重置当前活跃对话ID
  activeConversationId.value = generateId();
  
  // 创建新的对话对象并添加到历史记录
  const newConv: ConversationHistory = {
    id: activeConversationId.value,
    title: `新对话 ${formatTime(Date.now())}`,
    timestamp: Date.now(),
    lastMessage: '',
    messages: [{ ...DEFAULT_WELCOME_MESSAGE, timestamp: Date.now() }]
  };
  
  historyConversations.value.unshift(newConv);
  
  // 清空当前对话内容并添加欢迎消息
  conversation.splice(0, conversation.length);
  conversation.push({
    ...DEFAULT_WELCOME_MESSAGE,
    timestamp: Date.now()
  });
  
  // 清空输入框
  inputMessage.value = '';
};

// 保存当前对话到历史记录
const saveCurrentConversation = () => {
  // 获取对话概要作为标题
  const userMessages = conversation.filter(msg => msg.role === 'user');
  const title = userMessages.length > 0 
    ? userMessages[0].content.substring(0, 20) + (userMessages[0].content.length > 20 ? '...' : '')
    : `对话 ${formatTime(Date.now())}`;
  
  // 获取最后一条消息概要
  const lastMessage = conversation[conversation.length - 1]?.content.substring(0, 30) || '';
  
  // 在历史记录中查找当前对话
  const existingIndex = historyConversations.value.findIndex(conv => conv.id === activeConversationId.value);
  
  if (existingIndex >= 0) {
    // 更新已有对话
    historyConversations.value[existingIndex] = {
      ...historyConversations.value[existingIndex],
      title,
      timestamp: Date.now(),
      lastMessage,
      messages: [...conversation]
    };
  } else {
    // 添加新对话到历史
    historyConversations.value.push({
      id: activeConversationId.value,
      title,
      timestamp: Date.now(),
      lastMessage,
      messages: [...conversation]
    });
  }
};

// 切换到历史对话
const switchToConversation = (id: string) => {
  // 保存当前对话
  if (conversation.length > 1) {
    saveCurrentConversation();
  }
  
  // 更新当前活跃对话ID
  activeConversationId.value = id;
  
  // 加载选中的对话
  const selectedConv = historyConversations.value.find(conv => conv.id === id);
  if (selectedConv) {
    // 更新对话内容
    conversation.splice(0, conversation.length);
    selectedConv.messages.forEach(msg => conversation.push({...msg}));
  }
};

// 处理流式响应
const handleStreamResponse = async (
  params: any, 
  aiMessageIndex: number,
  messageContent: string
) => {
  if (!abortController.value) {
    console.error('中断控制器未初始化，无法发送请求');
    return;
  }
  
  let responseContent = '';
  
  try {
    // 根据模型类型使用不同处理方式
    if (selectedModel.value === 'deepseek' || selectedModel.value === 'silicon') {
      // LLM API处理
      await processLLMResponse(params, aiMessageIndex, messageContent, responseContent);
    } else {
      // 联网搜索模式的简单模拟
      await simulateSearchResponse(messageContent, aiMessageIndex);
    }
    
  } catch (error) {
    // 处理错误情况
    handleResponseError(error, aiMessageIndex, conversation, abortController.value);
    isLoading.value = false;
    abortController.value = null;
  }
};

// 处理大语言模型响应
const processLLMResponse = async (
  params: any,
  aiMessageIndex: number,
  messageContent: string,
  currentContent: string
) => {
  try {
    // 获取正确的API服务
    const apiService = selectedModel.value === 'deepseek' ? deepseekApi : siliconFlowApi;
    console.log('开始处理流式响应，使用API服务:', selectedModel.value);
    
    // 调用API并处理流式响应
    const streamPromise = apiService.chatCompletionStream(
      params,
      abortController.value!.signal,
      (chunk) => {
        // 处理每个响应块
        if (chunk.choices && chunk.choices.length > 0) {
          const content = chunk.choices[0].delta?.content || '';
          if (content) {
            // 更新内容
            currentContent += content;
            
            // 更新UI
            updateMessageUI(conversation, aiMessageIndex, currentContent);
            
            // 滚动到底部
            nextTick(() => {
              debouncedScroll();
            });
          }
        }
      },
      () => {
        // 响应完成的回调
        console.log('API回调：流式响应完成');
        
        // 完成消息处理
        finalizeAIMessage(
          conversation, 
          aiMessageIndex, 
          currentContent, 
          messageContent,
          abortController.value,
          selectedModel.value
        );
        
        // 重置状态
        isLoading.value = false;
        abortController.value = null;
      }
    );
    
    // 添加超时保护
    await withTimeout(streamPromise, REQUEST_TIMEOUT);
    console.log('流式响应API调用已完成');
  } catch (error) {
    console.error('处理LLM响应时出错:', error);
    throw error; // 向上传递错误
  }
};

// 模拟搜索响应
const simulateSearchResponse = async (
  query: string,
  aiMessageIndex: number
) => {
  console.log('使用联网搜索模式，模拟API响应');
  const fullResponse = `我使用联网搜索功能为您查询：${query}\n\n搜索结果显示，有多个相关信息来源，综合分析如下...`;
  
  try {
    console.log('开始模拟打字效果');
    let currentContent = '';
    
    // 逐字符模拟打字效果
    for (let i = 0; i < fullResponse.length; i++) {
      if (abortController.value?.signal.aborted) {
        console.log('请求被取消，停止模拟打字');
        break;
      }
      
      // 每次添加一个字符
      currentContent = fullResponse.substring(0, i + 1);
      
      // 更新UI
      updateMessageUI(conversation, aiMessageIndex, currentContent);
      
      // 滚动到底部
      nextTick(() => {
        debouncedScroll();
      });
      
      // 更自然的打字速度
      await new Promise(resolve => setTimeout(resolve, 20 + Math.random() * 20));
    }
    
    console.log('模拟打字完成');
    finalizeAIMessage(
      conversation, 
      aiMessageIndex, 
      currentContent, 
      query,
      abortController.value,
      selectedModel.value
    );
    
    // 重置状态
    isLoading.value = false;
    abortController.value = null;
  } catch (error) {
    console.error('模拟搜索响应时出错:', error);
    throw error;
  }
};

// 选择模型
const selectModel = (model: ModelType) => {
  selectedModel.value = model;
};

// 发送消息
const sendMessage = async (content?: string) => {
  // 1. 输入检查
  if (isLoading.value) {
    console.log('已有请求正在进行，忽略新消息');
    return;
  }
  
  const messageContent = content || inputMessage.value.trim();
  if (!messageContent) {
    console.log('消息内容为空，忽略');
    return;
  }
  
  console.log('发送消息:', messageContent);
  
  // 2. 设置消息状态
  const userMessage = createUserMessage(messageContent);
  const aiMessage = createLoadingAIMessage();
  
  // 3. 添加消息到对话
  conversation.push(userMessage);
  conversation.push(aiMessage);
  const aiMessageIndex = conversation.length - 1;
  
  // 4. 重置UI状态
  inputMessage.value = '';
  isLoading.value = true;
  abortController.value = new AbortController();
  
  try {
    // 5. 准备API参数
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
    
    // 6. 确认消息状态
    if (aiMessageIndex < 0 || aiMessageIndex >= conversation.length) {
      throw new Error('消息索引无效');
    }
    
    // 7. 开始处理响应
    await handleStreamResponse(apiParams, aiMessageIndex, messageContent);
    
    // 8. 保存对话到历史
    saveCurrentConversation();
    
  } catch (error) {
    // 9. 错误处理
    console.error('发送消息失败:', error);
    
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
  // 创建默认对话
  if (historyConversations.value.length === 0) {
    historyConversations.value.push({
      id: activeConversationId.value,
      title: '默认对话',
      timestamp: Date.now(),
      lastMessage: DEFAULT_WELCOME_MESSAGE.content,
      messages: [...conversation]
    });
  }
  
  scrollToBottom();
  setupCodeBlockEventListeners();
});
</script>

<style>
/* 代码块样式 - 使用图片中的浅色主题 */
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

.copy-button:focus, .download-button:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(130, 138, 145, 0.4);
}

.code-block-body {
  position: relative;
  display: flex;
  overflow-x: auto;
}

.line-numbers {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 16px 8px 16px 12px;
  background-color: #f1f3f5;
  color: #adb5bd;
  user-select: none;
  font-size: 0.875rem;
  border-right: 1px solid #e9ecef;
  text-align: right;
  min-width: 40px;
}

.line-number {
  line-height: 1.5;
  font-size: 0.875rem;
}

.code-block-body pre {
  margin: 0;
  padding: 16px;
  background-color: transparent;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #212529;
  flex-grow: 1;
}

.code-block-body code {
  background-color: transparent;
  padding: 0;
  white-space: pre;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  tab-size: 2;
}

/* 语法高亮颜色 - 更类似图片中的浅色主题 */
.hljs {
  background-color: transparent;
  color: #24292e;
}

.hljs-keyword,
.hljs-selector-tag {
  color: #d73a49;
}

.hljs-built_in {
  color: #6f42c1;
}

.hljs-string,
.hljs-title,
.hljs-section,
.hljs-attribute,
.hljs-literal,
.hljs-addition {
  color: #22863a;
}

.hljs-comment,
.hljs-quote,
.hljs-deletion {
  color: #6a737d;
}

.hljs-number,
.hljs-variable {
  color: #e36209;
}

.hljs-function,
.hljs-title.function_ {
  color: #6f42c1;
}

.hljs-attr,
.hljs-property {
  color: #005cc5;
}

/* 复制提示样式 */
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

.toast-icon {
  display: inline-flex;
  color: #165DFF;
}

/* 为文本代码增加样式 */
.message-content p code,
.message-content li code {
  background-color: rgba(22, 93, 255, 0.1);
  padding: 2px 4px;
  border-radius: 4px;
  color: #165DFF;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  font-size: 0.85em;
}

/* Markdown 格式化样式 */
.message-content h1,
.message-content h2,
.message-content h3,
.message-content h4,
.message-content h5,
.message-content h6 {
  color: #1D2129;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  font-weight: 600;
}

.message-content p {
  margin-bottom: 1rem;
  line-height: 1.6;
}

.message-content ul,
.message-content ol {
  padding-left: 1.5rem;
  margin-bottom: 1rem;
}

.message-content li {
  margin-bottom: 0.5rem;
}

.message-content a {
  color: #165DFF;
  text-decoration: none;
}

.message-content a:hover {
  text-decoration: underline;
}

.message-content blockquote {
  border-left: 4px solid #E5E6EB;
  padding-left: 1rem;
  color: #4E5969;
  margin: 1rem 0;
}
</style>

<style scoped>
/* Tooltip样式 */
.tooltip {
  visibility: hidden;
  position: absolute;
  z-index: 999;
  background-color: rgba(0, 0, 0, 0.75);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-left: 10px;
  opacity: 0;
  transition: opacity 0.2s, visibility 0.2s;
  pointer-events: none;
}

.tooltip::before {
  content: '';
  position: absolute;
  top: 50%;
  right: 100%;
  margin-top: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: transparent rgba(0, 0, 0, 0.75) transparent transparent;
}

/* 当父元素被悬停时显示tooltip */
.relative:hover .tooltip {
  visibility: visible;
  opacity: 1;
}
</style> 