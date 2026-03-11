# ShadowArt - 光影投影装置设计器

一个交互式网页工具，用于设计和可视化通过剪裁盒子四壁产生特定形状投影的光学装置。

## 功能特性

- 🎨 **预设形状选择**：支持心形、星形、圆形和正方形
- 📐 **参数实时调整**：盒子尺寸、高度、投影距离等
- 🖼️ **3D可视化**：使用Three.js实时渲染装置模型
- 📊 **交互式图表**：投影验证和剪裁曲线分析
- 💾 **数据导出**：支持剪裁模板下载和JSON数据导出
- 📱 **响应式设计**：适配桌面和移动设备

## 在线演示

访问 [GitHub Pages 部署](https://solidsteam.github.io/shadowArt/) 体验在线工具。

## 本地运行

1. 克隆仓库：
   ```bash
   git clone https://github.com/solidsteam/shadowArt.git
   cd shadowArt
   ```

2. 启动本地服务器：
   ```bash
   # 使用Python
   python -m http.server 8000
   
   # 或使用Node.js
   npx serve
   ```

3. 在浏览器中打开 `http://localhost:8000`

## 部署到GitHub Pages

项目已配置自动部署，当代码推送到 `main` 分支时会自动构建并部署到GitHub Pages。

### 手动部署

1. 进入仓库的 **Settings** > **Pages**
2. 选择 **Deploy from a branch**
3. 选择 **main** 分支和 **/(root)** 文件夹
4. 点击 **Save**

## 算法原理

本工具基于逆投影变换计算：
1. 给定目标形状在投影平面上的坐标
2. 通过光源点（0,0,0）到目标点的光线
3. 计算光线与盒子四壁的交点
4. 确定每个侧面的剪裁曲线

## 技术栈

- **前端框架**：原生JavaScript + Bootstrap 5
- **3D渲染**：Three.js
- **图表可视化**：Plotly.js
- **部署**：GitHub Pages + GitHub Actions

## 项目结构

```
shadowArt/
├── index.html          # 主页面
├── style.css          # 样式表
├── app.js             # 主应用逻辑
├── main.py            # 原始Python实现
├── .github/workflows/ # 部署配置
│   └── deploy.yml
└── README.md          # 本文档
```

## 使用示例

1. 选择目标形状（如心形）
2. 调整盒子尺寸为10cm，高度12cm
3. 设置投影距离40cm
4. 点击"开始计算"按钮
5. 查看3D可视化结果和剪裁曲线
6. 下载剪裁模板用于实际制作

## 实际制作建议

- 使用硬纸板或亚克力板制作盒子
- 将剪裁模板精确转移到材料上
- 使用明亮的点光源（如LED）
- 在暗室中效果最佳

## 许可证

MIT License - 详见 LICENSE 文件

## 贡献

欢迎提交Issue和Pull Request！

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开Pull Request

## 联系

项目作者：[SolidSteam](https://github.com/solidsteam)

---
*基于Python原版代码转换的JavaScript实现，可直接部署到GitHub Pages*
