/*
 * @Author: changluo
 * @Description: 
 * @LastEditors: luc19964 luochang@gopherasset.com
 */
import request from '../utils/request'

// 模型配置类型定义
export interface ModelConfigType {
  model: string;
  apiVersion: string;
}

export type ModelType = 'deepseek' | 'silicon' | 'web';

// 创建一个统一的API配置对象
export const modelConfig: Record<ModelType, ModelConfigType> = {
  deepseek: {
    model: 'deepseek-chat', // DeepSeek官方模型ID
    apiVersion: ''
  },
  silicon: {
    model: 'deepseek-ai/DeepSeek-V3', // 硅基流动平台模型ID
    apiVersion: 'v1'
  },
  web: {
    model: 'search', // 模拟搜索模型ID
    apiVersion: ''
  }
}

// 定义响应块处理回调函数类型
export type ChunkCallback = (chunk: {
  choices?: Array<{
    delta?: {
      content?: string;
    };
  }>;
}) => void;

// 定义完成回调函数类型
export type CompletionCallback = () => void;

// DeepSeek API 接口封装
export const deepseekApi = {
  // 聊天完成接口
  chatCompletion: (params: any) => {
    return request({
      url: 'https://api.deepseek.com/chat/completions',
      method: 'post',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY || 'sk-b296c7944a6742288403a5cac49e9454'}`
      },
      data: params
    })
  },

  // 流式聊天完成接口
  chatCompletionStream: async (
    params: any,
    signal: AbortSignal,
    onChunk: ChunkCallback,
    onCompletion: CompletionCallback
  ) => {
    const url = 'https://api.deepseek.com/chat/completions';
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY || 'sk-b296c7944a6742288403a5cac49e9454'}`
    };

    try {
      console.log('开始请求流式数据...');
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
        signal // 用于取消请求
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 使用原生的ReadableStream处理
      if (!response.body) {
        throw new Error('ReadableStream not supported in this browser.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      // 简化流处理逻辑
      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          console.log('流读取完成');
          break;
        }

        // 解码并处理数据
        const chunk = decoder.decode(value, { stream: true });
        console.log('接收到数据块:', chunk.length, '字节');

        // 按行处理
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;

          const data = line.slice(6); // 移除 "data: " 前缀

          if (data === '[DONE]') {
            console.log('收到[DONE]信号');
            continue; // 继续处理可能的其他数据
          }

          try {
            const parsedData = JSON.parse(data);
            console.log('解析数据:', parsedData?.choices?.[0]?.delta?.content || '');
            onChunk(parsedData);
          } catch (err) {
            console.error('解析数据失败:', err);
          }
        }
      }

      // 流处理结束后调用完成回调
      console.log('流处理全部完成，调用完成回调');
      onCompletion();
      return { success: true };
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('请求被用户取消');
      } else {
        console.error('流请求错误:', error);
      }
      throw error;
    }
  }
}

// 硅基流动 API 接口封装
export const siliconFlowApi = {
  // 聊天完成接口
  chatCompletion: (params: any) => {
    return request({
      url: 'https://api.siliconflow.cn/v1/chat/completions',
      method: 'post',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SILICONFLOW_API_KEY || 'sk-chbfiqdrdopzmajmexrscuxhqkzldojntrrdgydqglaiuwko'}`
      },
      data: params
    })
  },

  // 流式聊天完成接口
  chatCompletionStream: async (
    params: any,
    signal: AbortSignal,
    onChunk: ChunkCallback,
    onCompletion: CompletionCallback
  ) => {
    const url = 'https://api.siliconflow.cn/v1/chat/completions';
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SILICONFLOW_API_KEY || 'sk-chbfiqdrdopzmajmexrscuxhqkzldojntrrdgydqglaiuwko'}`
    };

    try {
      console.log('开始请求流式数据...');
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
        signal // 用于取消请求
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 使用原生的ReadableStream处理
      if (!response.body) {
        throw new Error('ReadableStream not supported in this browser.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      // 简化流处理逻辑
      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          console.log('流读取完成');
          break;
        }

        // 解码并处理数据
        const chunk = decoder.decode(value, { stream: true });
        console.log('接收到数据块:', chunk.length, '字节');

        // 按行处理
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;

          const data = line.slice(6); // 移除 "data: " 前缀

          if (data === '[DONE]') {
            console.log('收到[DONE]信号');
            continue; // 继续处理可能的其他数据
          }

          try {
            const parsedData = JSON.parse(data);
            console.log('解析数据:', parsedData?.choices?.[0]?.delta?.content || '');
            onChunk(parsedData);
          } catch (err) {
            console.error('解析数据失败:', err);
          }
        }
      }

      // 流处理结束后调用完成回调
      console.log('流处理全部完成，调用完成回调');
      onCompletion();
      return { success: true };
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('请求被用户取消');
      } else {
        console.error('流请求错误:', error);
      }
      throw error;
    }
  }
} 