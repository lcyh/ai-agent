<!--
 * @Author: changluo
 * @Description:
 * @LastEditors: luc19964 luochang@gopherasset.com
-->

## 项目要求

- 1.请在当前目录里新建项目,当前目录为项目跟目录位置；
  - 技术栈 vue3+vite+ts+vue-router+pinia+pnpm+ant-design-vue+axios+tailwind+postcss+eslint+husky+commitlint 搭建项目
- 2.项目只有一个首页页面，在聊天输入框下面可以切换大模式，该项目要接入的大模型使用情况如下：

  - deepseek
    - 用户指南参考文档：<https://api-docs.deepseek.com/zh-cn/；>
    - 接入 api 参考文档：<https://api-docs.deepseek.com/zh-cn/api/create-chat-completion>
    - apiKey:sk-b296c7944a6742288403a5cac49e9454
  - 硅基流动
    - 用户指南参考文档：<https://docs.siliconflow.cn/cn/userguide/introduction>
    - 接入 api 参考文档<https://docs.siliconflow.cn/cn/api-reference/chat-completions/chat-completions>
    - apiKey: sk-chbfiqdrdopzmajmexrscuxhqkzldojntrrdgydqglaiuwko

- 3.页面 figma 链接参考：<https://www.figma.com/design/n0QeBFsZnw5MaibNZiQDWW/AI-%E7%BB%84%E4%BB%B6%E5%BA%93-%7C-AI-Kits--Community-?node-id=17341-4793&t=Igajc0ss2qqE2X86-4>
- 4.页面布局和样式要高保真还原，图标下载在 src/assets 文件夹里；组件库用 ant-design-vue；
- 5.服务方返回的结果是 markdown 源代码的，需要正确地把 markdown 源代码转换成 HTML 显示，还要实现代码语法高亮功能
- 6.侧边栏面板需要可以通过拖拽边框放大缩小宽度，并提供全屏/退出全屏按钮，点击后可以在全屏和普通模式之间切换
- 7.需要能支持多轮对话
- 8.需要能支持流式响应
