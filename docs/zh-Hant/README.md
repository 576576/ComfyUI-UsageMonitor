<h1 align="center">ComfyUI-UsageMonitor</h1>

<p align="center">
<a href="../zh/README.md">中文 (简体)</a> &nbsp;|&nbsp; 中文 (繁體) &nbsp;|&nbsp; <a href="../en/README.md">English</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20Linux-blue" alt="Platform">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
</p>

**_🪛 ComfyUI 即時資源監控 🪛_**

直接在 ComfyUI 選單上即時查看系統資源（CPU、GPU、記憶體、顯存、GPU 溫度和磁碟空間），協助您識別工作流程中的瓶頸，並知道何時該重新啟動伺服器、卸載模型或關閉一些分頁。

## 資源監控

**🎉 現在您終於可以在選單上即時查看 ComfyUI 使用的資源（CPU、GPU、記憶體、顯存、GPU 溫度和磁碟空間）了！**

橫向：  
![Monitors](../../assets/images/monitor1.webp)

縱向：  
![Monitors](../../assets/images/monitor3.webp)

現在您可以識別工作流程中的瓶頸，知道何時該重新啟動伺服器、卸載模型甚至關閉一些分頁！您還可以設定重新整理頻率以及要顯示哪些資源：

![Monitors](../../assets/images/monitor-settings.png)

> **注意事項:**
> - 使用 CUDA（NVIDIA）或 ROCm（AMD）時即可取得 GPU 資料。
> - 本擴充功能需要 ComfyUI 1915（或更高版本）。
> - 監控開銷很低（佔用 0.1% 到 0.5%），您可以在設定中將其停用（將 `重新整理頻率` 設為 `0`）。
> - 資料來自以下程式庫：[psutil](https://pypi.org/project/psutil/)、[torch](https://pytorch.org/)、[nvidia-ml-py](https://pypi.org/project/nvidia-ml-py/)（NVIDIA 官方程式庫）和 [amdsmi](https://pypi.org/project/amdsmi/)（AMD 官方程式庫）。

## 功能特色

功能 | 描述
--- | ---
即時監控 | 在 ComfyUI 選單上即時顯示 CPU、GPU、記憶體、顯存、GPU 溫度和磁碟空間
支援 NVIDIA 與 AMD | 透過 `nvidia-ml-py` 支援 CUDA，透過 `amdsmi` 支援 ROCm
橫向與縱向版面配置 | 選擇適合您工作流程的監控版面配置
完全可設定 | 重新整理頻率和顯示的資源均可在設定選單中設定

---

## 安裝

1. 安裝 [ComfyUI](https://github.com/comfyanonymous/ComfyUI)。
2. 將此儲存庫複製到 `custom_nodes`（見下文）。
3. 啟動 ComfyUI。

```
cd ComfyUI/custom_nodes
git clone https://github.com/576576/ComfyUI-UsageMonitor.git
cd ComfyUI-UsageMonitor
pip install -r requirements.txt
```

> **AMD 使用者（ROCm）：** 本分支開箱即用地支援 AMD GPU 監控（使用 `amdsmi`）——依照上述說明正常安裝即可。舊版 `AMD` 分支仍可供參考。

### 從管理員安裝

在[管理員](https://github.com/ltdrdata/ComfyUI-Manager.git)中搜尋 `usagemonitor` 並安裝。

## 專案結構

```text
ComfyUI-UsageMonitor/
├── general/               硬體資訊（CPU / GPU / HDD）
├── server/               監控 API 路由
├── web/               前端監控介面
├── core/               設定與日誌
└── assets/               圖片與 i18n 文件
```

## 致謝

本專案是原版 [**ComfyUI-Crystools**](https://github.com/crystian/ComfyUI-Crystools)（由 [Crystian](https://github.com/crystian) 建立）的更名延續。  
原作品的功勞歸於原作者。

## 授權

MIT © ComfyUI-UsageMonitor Contributors
