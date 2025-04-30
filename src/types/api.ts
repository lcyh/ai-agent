/*
 * @Author: changluo
 * @Description: 
 * @LastEditors: luc19964 luochang@gopherasset.com
 */
/*
 * @Author: changluo
 * @Description: API相关类型定义
 */

// 模型类型
export type ModelType = 'deepseek' | 'silicon' | 'web';

// 模型配置类型定义
export interface ModelConfigType {
  model: string;
  apiVersion: string;
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

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  code?: number;
} 