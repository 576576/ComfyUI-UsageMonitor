<p align="center">
  <img src="../../assets/images/icon.png" width="64" alt="ComfyUI-UsageMonitor">
</p>

<h1 align="center">ComfyUI-UsageMonitor</h1>

<p align="center">
中文 (简体) &nbsp;|&nbsp; <a href="../zh-Hant/README.md">中文 (繁體)</a> &nbsp;|&nbsp; <a href="../en/README.md">English</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20Linux-blue" alt="Platform">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
</p>

直接在 ComfyUI 菜单上实时查看系统资源（CPU、GPU、内存、显存、GPU 温度和磁盘空间），帮助您识别工作流中的瓶颈，并知道何时该重启服务器、卸载模型或关闭一些标签页。

## 资源监控

**🎉 现在您终于可以在菜单上实时查看 ComfyUI 使用的资源（CPU、GPU、内存、显存、GPU 温度和磁盘空间）了！**

横向：  
![Monitors](../../assets/images/monitor1.webp)

纵向：  
![Monitors](../../assets/images/monitor3.webp)

现在您可以识别工作流中的瓶颈，知道何时该重启服务器、卸载模型甚至关闭一些标签页！您还可以配置刷新频率以及要显示哪些资源：

![Monitors](../../assets/images/monitor-settings.png)

> **注意事项:**
> - 使用 CUDA（NVIDIA）或 ROCm（AMD）时即可获取 GPU 数据。
> - 本扩展需要 ComfyUI 1915（或更高版本）。
> - 监控开销很低（占用 0.1% 到 0.5%），您可以在设置中将其禁用（将 `刷新频率` 设为 `0`）。
> - 数据来自以下库：[psutil](https://pypi.org/project/psutil/)、[torch](https://pytorch.org/)、[nvidia-ml-py](https://pypi.org/project/nvidia-ml-py/)（NVIDIA 官方库）和 [amdsmi](https://pypi.org/project/amdsmi/)（AMD 官方库）。

## 功能特性

功能 | 描述
--- | ---
实时监控 | 在 ComfyUI 菜单上实时显示 CPU、GPU、内存、显存、GPU 温度和磁盘空间
支持 NVIDIA 与 AMD | 通过 `nvidia-ml-py` 支持 CUDA，通过 `amdsmi` 支持 ROCm
横向与纵向布局 | 选择适合您工作流的监控布局
完全可配置 | 刷新频率和显示的资源均可在设置菜单中配置

---

## 安装

1. 安装 [ComfyUI](https://github.com/comfyanonymous/ComfyUI)。
2. 将此仓库克隆到 `custom_nodes`（见下文）。
3. 启动 ComfyUI。

```
cd ComfyUI/custom_nodes
git clone https://github.com/576576/ComfyUI-UsageMonitor.git
cd ComfyUI-UsageMonitor
pip install -r requirements.txt
```

> **AMD 用户（ROCm）：** 本分支开箱即用地支持 AMD GPU 监控（使用 `amdsmi`）——按上述说明正常安装即可。

### 从管理器安装

在[管理器](https://github.com/ltdrdata/ComfyUI-Manager.git)中搜索 `usagemonitor` 并安装。

## 项目结构

```text
ComfyUI-UsageMonitor/
├── general/               硬件信息（CPU / GPU / HDD）
├── server/               监控 API 路由
├── web/               前端监控界面
├── core/               配置与日志
└── assets/               图片与 i18n 文档
```

## 致谢

本项目是原版 [**ComfyUI-Crystools**](https://github.com/crystian/ComfyUI-Crystools)（由 [Crystian](https://github.com/crystian) 创建）的更名延续。  
原作品的功劳归于原作者。

## 许可证

MIT © ComfyUI-UsageMonitor Contributors
