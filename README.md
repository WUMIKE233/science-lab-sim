# 理科实验可视化仿真 / Science Lab Sim

面向初高中课堂与自学场景的理科实验可视化仿真 Web 应用。当前版本覆盖物理、化学、生物 12 个入门实验，支持参数调节、实时读数与可视化演示。

A browser-based science simulation app for middle and high school learning. The current version includes twelve introductory physics, chemistry, and biology experiments with adjustable parameters, live readings, and visual demonstrations.

## 实验列表 / Experiments

- 物理 / Physics: 单摆周期、欧姆定律、抛体运动、浮力与密度、凸透镜成像
- 化学 / Chemistry: 酸碱中和滴定、反应速率、气体状态方程、纸层析分离
- 生物 / Biology: 显微镜细胞观察、光合作用速率、孟德尔遗传方格

- Physics: pendulum period, Ohm's law, projectile motion, buoyancy and density, convex lens imaging
- Chemistry: acid-base titration, reaction rate, ideal gas law, paper chromatography
- Biology: microscope cell observation, photosynthesis rate, Mendelian Punnett square

## 技术栈 / Tech Stack

- Vite 8
- React 19
- TypeScript
- lucide-react
- GitHub Pages

## 本地运行 / Local Development

```bash
npm install
npm run dev
```

打开终端显示的本地地址即可预览。

Open the local URL printed by the terminal to preview the app.

## 构建 / Build

```bash
npm run build
```

构建产物会输出到 `dist` 目录。

The production build is emitted to the `dist` directory.

## 部署 / Deployment

仓库包含 GitHub Actions 工作流 `.github/workflows/pages.yml`。推送到 `main` 分支后，工作流会自动安装依赖、构建项目，并部署到 GitHub Pages。

This repository includes the GitHub Actions workflow `.github/workflows/pages.yml`. After pushing to the `main` branch, the workflow installs dependencies, builds the app, and deploys it to GitHub Pages.

## 设计说明 / Design Notes

应用使用统一实验模块接口组织每个仿真实验：实验元信息、参数控件、默认值、计算函数和可视化渲染组件。这样可以继续添加新的理科实验，而不需要重写主界面。

The app uses a shared experiment module interface for metadata, controls, defaults, simulation logic, and visual rendering. This makes it straightforward to add more science experiments without rewriting the main interface.
