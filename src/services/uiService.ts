/*
 * @Author: changluo
 * @Description: UI相关工具函数
 */
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import { debounce, throttle } from 'lodash-es';

/**
 * 滚动到底部
 */
export const scrollToBottom = (): void => {
  setTimeout(() => {
    const container = document.querySelector('.chat-container');
    if (container) {
      const safetyMargin = 200; // 增加安全边距，确保内容完全可见

      // 平滑滚动提供更好的用户体验
      container.scrollTo({
        top: container.scrollHeight + safetyMargin,
        behavior: 'smooth'
      });

      // 确保内容完全滚动到位，对于可能的动态内容加载
      setTimeout(() => {
        container.scrollTo({
          top: container.scrollHeight + safetyMargin,
          behavior: 'auto'
        });
      }, 200); // 增加等待时间
    }
  }, 10);
};

/**
 * 节流的滚动函数
 */
export const debouncedScroll = debounce(scrollToBottom, 100);

/**
 * 窗口调整大小处理函数
 */
export const handleWindowResize = (callback: () => void): void => {
  callback();
};

/**
 * 节流的窗口调整大小函数
 */
export const throttledResize = throttle(handleWindowResize, 250);

/**
 * 初始化Markdown渲染器
 */
export const initMarkdown = (): MarkdownIt => {
  return new MarkdownIt({
    highlight: function (str: string, lang: string) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          const highlighted = hljs.highlight(str, { language: lang }).value;
          const lines = str.split('\n');
          const lineNumbers = lines.map((_, index) => `<span class="line-number">${index + 1}</span>`).join('');

          return `<div class="code-block-container">
                    <div class="code-block-header">
                      <div class="code-lang-tag">${lang.toUpperCase()}</div>
                      <div class="code-actions">
                        <button class="copy-button" data-code="${encodeURIComponent(str)}">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                          <span>复制</span>
                        </button>
                        <button class="download-button" data-code="${encodeURIComponent(str)}" data-lang="${lang}">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                          <span>下载</span>
                        </button>
                      </div>
                    </div>
                    <div class="code-block-body">
                      <div class="line-numbers">${lineNumbers}</div>
                      <pre class="hljs"><code>${highlighted}</code></pre>
                    </div>
                  </div>`;
        } catch (__) { }
      }
      return '';
    }
  });
};

/**
 * 检查消息是否包含代码块
 */
export const hasCodeBlock = (content: string): boolean => {
  return content.includes('```');
};

/**
 * 使用markdown-it格式化消息内容
 */
export const formatMessageWithCodeBlocks = (content: string): string => {
  const markdown = initMarkdown();
  // 确保markdown实例已启用默认功能
  markdown.enable([
    'heading',     // 标题
    'list',        // 列表
    'blockquote',  // 引用
    'table',       // 表格
    'emphasis',    // 强调（斜体、粗体）
    'link',        // 链接
    'strikethrough', // 删除线
    'code',        // 行内代码
    'fence'        // 代码块
  ]);
  return markdown.render(content);
};

/**
 * 显示复制成功提示
 */
export const showCopyTooltip = (text: string): void => {
  // 移除可能已存在的提示
  const existingToast = document.querySelector('.copy-toast');
  if (existingToast) {
    document.body.removeChild(existingToast);
  }

  const toast = document.createElement('div');
  toast.className = 'copy-toast';

  const isSuccess = text.includes('成功');
  const iconSvg = isSuccess
    ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
    : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12" y2="16"></line></svg>';

  toast.innerHTML = `
    <div class="flex items-center gap-2">
      <span class="toast-icon">${iconSvg}</span>
      <span>${text}</span>
    </div>
  `;

  document.body.appendChild(toast);

  // 使用requestAnimationFrame确保DOM更新后再添加show类
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.classList.add('show');

      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
          if (document.body.contains(toast)) {
            document.body.removeChild(toast);
          }
        }, 300);
      }, 2000); // 延长显示时间到2秒
    });
  });
};

/**
 * 复制文本到剪贴板
 */
export const copyToClipboard = async (text: string): Promise<void> => {
  try {
    // 尝试使用现代的 Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      showCopyTooltip('复制成功');
    } else {
      // 回退到传统方法
      const textArea = document.createElement('textarea');
      textArea.value = text;

      // 设置样式使元素不可见
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      // 执行复制命令
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        showCopyTooltip('复制成功');
      } else {
        showCopyTooltip('复制失败，请手动复制');
      }
    }
  } catch (err) {
    console.error('复制失败:', err);
    showCopyTooltip('复制失败，请手动复制');
  }
};

/**
 * 获取语言对应的文件扩展名
 */
export const getFileExtension = (lang: string): string => {
  const extensionMap: Record<string, string> = {
    'javascript': 'js',
    'typescript': 'ts',
    'python': 'py',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'csharp': 'cs',
    'go': 'go',
    'ruby': 'rb',
    'php': 'php',
    'swift': 'swift',
    'kotlin': 'kt',
    'rust': 'rs',
    'scala': 'scala',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'less': 'less',
    'json': 'json',
    'xml': 'xml',
    'yaml': 'yaml',
    'markdown': 'md',
    'shell': 'sh',
    'bash': 'sh',
    'sql': 'sql',
    'dockerfile': 'Dockerfile',
    'plaintext': 'txt'
  };

  const langLower = lang.toLowerCase();
  return extensionMap[langLower] || langLower;
};

/**
 * 下载代码文件
 */
export const downloadCode = (code: string, lang: string): void => {
  const extension = getFileExtension(lang);

  let mimeType = 'text/plain';
  if (extension === 'html') mimeType = 'text/html';
  else if (extension === 'css') mimeType = 'text/css';
  else if (extension === 'json') mimeType = 'application/json';
  else if (extension === 'js') mimeType = 'application/javascript';
  else if (extension === 'xml') mimeType = 'application/xml';

  const blob = new Blob([code], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `code.${extension}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showCopyTooltip('代码已下载');
};

/**
 * 为代码块添加事件监听
 */
export const setupCodeBlockEventListeners = (): void => {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    // 处理代码块复制按钮
    const copyButton = target.closest('.copy-button');
    if (copyButton) {
      const code = copyButton.getAttribute('data-code');
      if (code) {
        copyToClipboard(decodeURIComponent(code));
      }
    }

    // 处理代码块下载按钮
    const downloadButton = target.closest('.download-button');
    if (downloadButton) {
      const code = downloadButton.getAttribute('data-code');
      const lang = downloadButton.getAttribute('data-lang') || 'txt';
      if (code) {
        downloadCode(decodeURIComponent(code), lang);
      }
    }
  });
}; 