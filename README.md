# ComfyUI-UsageMonitor [![Donate](https://img.shields.io/badge/Donate-PayPal-blue.svg)](https://paypal.me/crystian77) <a src="https://colab.research.google.com/assets/colab-badge.svg" href="https://colab.research.google.com/drive/1xiTiPmZkcIqNOsLQPO1UNCdJZqgK3U5k?usp=sharing"><img src="https://colab.research.google.com/assets/colab-badge.svg" alt="Open in Colab"></a>

**_🪛 A real-time resource monitor for ComfyUI 🪛_**

Watch your system resources (CPU, GPU, RAM, VRAM, GPU temperature and disk space) directly on the ComfyUI menu in real-time, so you can identify bottlenecks in your workflow and know when it is time to restart the server, unload models or close some tabs.

# Table of contents
- [Resources monitor](#resources-monitor)
- Others: [About](#about), [Changelog](#changelog), [Installation](#installation), [Use](#use), [Acknowledgements](#acknowledgements)

---

## General

### Resources monitor

**🎉Finally, you can see the resources used by ComfyUI (CPU, GPU, RAM, VRAM, GPU Temp and space) on the menu in real-time!**

Horizontal:  
![Monitors](./docs/monitor1.webp)

Vertical:  
![Monitors](./docs/monitor3.webp)

Now you can identify the bottlenecks in your workflow and know when it's time to restart the server, unload models or even close some tabs!

You can configure the refresh rate which resources to show:

![Monitors](./docs/monitor-settings.png)

> **Notes:**
> - The GPU data is available when you use CUDA (NVIDIA) or ROCm (AMD).
> - This extension needs ComfyUI 1915 (or higher).
> - The cost of the monitor is low (0.1 to 0.5% of utilization), you can disable it from settings (`Refres rate` to `0`).
> - Data comes from these libraries:
>   - [psutil](https://pypi.org/project/psutil/)
>   - [torch](https://pytorch.org/)
>   - [nvidia-ml-py](https://pypi.org/project/nvidia-ml-py/) (official NVIDIA library)
>   - [amdsmi](https://pypi.org/project/amdsmi/) (official AMD library)

---

## About

**Notes from the author:**
- This is my first project in python ¯\\_(ツ)_/¯ (PR are welcome!)
- I'm a software engineer but in other languages (web technologies)
- My Instagram is: https://www.instagram.com/crystian.ia I'll publish my works on it, so consider following me for news! :)
- I'm not a native English speaker, so sorry for my English :P

---

## Changelog

### 1.27.0 (17/08/2025)
- revert the lower case on name, cannot change on registry ¯\_(ツ)_/¯
- zluda check removed, it is not necessary anymore

### 1.25.3 (27/07/2025)
- change the name to lower case

### 1.24.0 (02/06/2025)
- PRs by community merged
- Improved VRAM usage/readout
- HDD error handling

### 1.23.0 (02/06/2025)
- Jetson support added by @johnnynunez
- some ui fixes

### 1.19.0 (06/10/2024)
- HORIZONTAL UI! New version is ready! 🎉

### 1.18.0 (21/09/2024)
- HORIZONTAL UI! 🎉
- Configurable size of monitors on settings menu

### 1.17.0 (21/09/2024)
- Settings menu reorganized
- Preparing for horizontal UI
- Update from ComfyUI (typescript and new features)

### 1.16.0 (31/07/2024)
- Rollback of AMD support by manager does not support other repository parameter (https://test.pypi.org/simple by pyrsmi)

### 1.15.0 (21/07/2024)
- AMD Branch merged to the main branch, should work for AMD users on **Linux**

### 1.14.0 (15/07/2024)
- Tried to use AMD info, but it breaks installation on windows, so I removed it ¯\_(ツ)_/¯
- AMD Branch added, if you use AMD and Linux, you can try it (not tested for me)

### 1.13.0 (01/07/2024)
- Integrate with new ecosystem of ComfyUI

### 1.12.0 (27/03/2024)
- GPU Temperature added

### 1.10.0 (17/01/2024)
- Multi-gpu added

### 1.9.2 (15/01/2024)
- Big refactor on hardwareInfo and monitor.ts, gpu was separated on another file, preparing for multi-gpu support

### 1.8.0 (14/01/2024) - internal
- HDD monitor selector on settings

### 1.7.0 (11/01/2024) - internal
- Typescript added!

### 1.6.0 (11/01/2024)
- Fix issue [#7](https://github.com/576576/ComfyUI-UsageMonitor/issues/7) to the thread deadlock on concurrency

### 1.5.0 (10/01/2024)
- Improvements on the resources monitor and how handle the threads
- Some fixes

### 1.3.0 (08/01/2024)
- Added in general Resources monitor (CPU, GPU, RAM, VRAM, and space)
- Added this icon to identify this set of tools: 🪛

### 1.0.0 (26/12/2023)
- First release

---

## Installation

### Install from GitHub
1. Install [ComfyUi](https://github.com/comfyanonymous/ComfyUI).
2. Clone this repo into `custom_nodes`:
    ```
    cd ComfyUI/custom_nodes
    git clone https://github.com/576576/ComfyUI-UsageMonitor.git
    cd ComfyUI-UsageMonitor
    pip install -r requirements.txt
    ```
3. Start up ComfyUI.

#### For AMD users
If you are an AMD user with Linux (ROCm), AMD GPU monitoring works out of the box on this branch
(uses `amdsmi`) — install normally as described above:

  ```
  cd ComfyUI/custom_nodes
  git clone https://github.com/576576/ComfyUI-UsageMonitor.git
  cd ComfyUI-UsageMonitor
  pip install -r requirements.txt
  ```

> The legacy `AMD` branch (older pyrsmi-based implementation) is still available for reference.

### Install from manager

Search for `usagemonitor` in the [manager](https://github.com/ltdrdata/ComfyUI-Manager.git) and install it.

---

## Use

Once installed, the resource monitor appears on the ComfyUI menu in real-time.

If for some reason you need to see the logs, you can define the environment variable `USAGEMONITOR_LOGLEVEL` and set the [value](https://docs.python.org/es/3/howto/logging.html).

---

## Acknowledgements

This project is a renamed continuation of the original [**ComfyUI-Crystools**](https://github.com/crystian/ComfyUI-Crystools) created by [Crystian](https://github.com/crystian).  
All credit for the original work goes to the original author.
