import { createStyleSheet, formatBytes } from './utils.js';

export class MonitorUI {
  protected htmlClassMonitor = 'usagemonitor-monitors-container';
  lastMonitor = 1; // just for order on monitors section
  styleSheet: HTMLStyleElement;
  maxVRAMUsed: Record<number, number> = {}; // Add this to track max VRAM per GPU

  constructor(
    public rootElement: HTMLElement,
    private monitorCPUElement: TMonitorSettings,
    private monitorRAMElement: TMonitorSettings,
    private monitorHDDElement: TMonitorSettings,
    private monitorCPUTempElement: TMonitorSettings,
    private monitorGPUSettings: TMonitorSettings[],
    private monitorVRAMSettings: TMonitorSettings[],
    private monitorTemperatureSettings: TMonitorSettings[],
    private currentRate: number,
    private translate: (key: string) => string,
  ) {
    // Initialize the root container (id + classes)
    if (this.rootElement.children.length === 0) {
      this.rootElement.setAttribute('id', 'usagemonitor-monitors-root');
      this.rootElement.classList.add(this.htmlClassMonitor);
      this.rootElement.classList.add(this.constructor.name);
    }
    this.createDOM();

    this.styleSheet = createStyleSheet('usagemonitor-monitors-size');
  }

  createDOM = (): void => {
    if (!this.rootElement) {
      throw Error('UsageMonitor: MonitorUI - Container not found');
    }

    // this.container.style.order = '2';
    this.rootElement.appendChild(this.createMonitor(this.monitorCPUElement));
    this.rootElement.appendChild(this.createMonitor(this.monitorCPUTempElement));
    this.rootElement.appendChild(this.createMonitor(this.monitorRAMElement));
    this.rootElement.appendChild(this.createMonitor(this.monitorHDDElement));
    this.updateAllAnimationDuration(this.currentRate);
  };

  createDOMGPUMonitor = (monitorSettings?: TMonitorSettings): void => {
    if (!(monitorSettings && this.rootElement)) {
      return;
    }

    this.rootElement.appendChild(this.createMonitor(monitorSettings));
    this.updateAllAnimationDuration(this.currentRate);
  };

  orderMonitors = (): void => {
    try {
      // @ts-ignore
      this.monitorCPUElement.htmlMonitorRef.style.order = '' + this.lastMonitor++;
      // @ts-ignore
      this.monitorRAMElement.htmlMonitorRef.style.order = '' + this.lastMonitor++;
      // @ts-ignore
      this.monitorGPUSettings.forEach((_monitorSettings, index) => {
        // @ts-ignore
        this.monitorGPUSettings[index].htmlMonitorRef.style.order = '' + this.lastMonitor++;
        // @ts-ignore
        this.monitorVRAMSettings[index].htmlMonitorRef.style.order = '' + this.lastMonitor++;
        // @ts-ignore
        this.monitorTemperatureSettings[index].htmlMonitorRef.style.order = '' + this.lastMonitor++;
      });
      // @ts-ignore
      this.monitorHDDElement.htmlMonitorRef.style.order = '' + this.lastMonitor++;
    } catch (error) {
      console.error('orderMonitors', error);
    }
  };

  updateDisplay = (data: TStatsData): void => {
    this.updateMonitor(this.monitorCPUElement, data.cpu_utilization);
    this.updateMonitor(this.monitorCPUTempElement, data.cpu_temperature);
    this.updateMonitor(this.monitorRAMElement, data.ram_used_percent, data.ram_used, data.ram_total);
    this.updateMonitor(this.monitorHDDElement, data.hdd_used_percent, data.hdd_used, data.hdd_total);

    if (data.gpus === undefined || data.gpus.length === 0) {
      console.warn('UpdateAllMonitors: no GPU data');
      return;
    }

    this.monitorGPUSettings.forEach((monitorSettings, index) => {
      if (data.gpus[index]) {
        const gpu = data.gpus[index];
        if (gpu === undefined) {
          // console.error('UpdateAllMonitors: no GPU data for index', index);
          return;
        }

        this.updateMonitor(monitorSettings, gpu.gpu_utilization);
      } else {
        // console.error('UpdateAllMonitors: no GPU data for index', index);
      }
    });

    this.monitorVRAMSettings.forEach((monitorSettings, index) => {
      if (data.gpus[index]) {
        const gpu = data.gpus[index];
        if (gpu === undefined) {
          // console.error('UpdateAllMonitors: no GPU VRAM data for index', index);
          return;
        }

        this.updateMonitor(monitorSettings, gpu.vram_used_percent, gpu.vram_used, gpu.vram_total);
      } else {
        // console.error('UpdateAllMonitors: no GPU VRAM data for index', index);
      }
    });

    this.monitorTemperatureSettings.forEach((monitorSettings, index) => {
      if (data.gpus[index]) {
        const gpu = data.gpus[index];
        if (gpu === undefined) {
          // console.error('UpdateAllMonitors: no GPU VRAM data for index', index);
          return;
        }

        this.updateMonitor(monitorSettings, gpu.gpu_temperature);
        if (monitorSettings.cssColorFinal && monitorSettings.htmlMonitorSliderRef) {
          monitorSettings.htmlMonitorSliderRef.style.backgroundColor =
            `color-mix(in srgb, ${monitorSettings.cssColorFinal} ${gpu.gpu_temperature}%, ${monitorSettings.cssColor})`;
        }
      } else {
        // console.error('UpdateAllMonitors: no GPU VRAM data for index', index);
      }
    });
  };

  // eslint-disable-next-line complexity
  updateMonitor = (monitorSettings: TMonitorSettings, percent: number, used?: number, total?: number): void => {
    if (!(monitorSettings.htmlMonitorSliderRef && monitorSettings.htmlMonitorLabelRef)) {
      return;
    }

    if (percent < 0) {
      monitorSettings.htmlMonitorLabelRef.innerHTML = 'NaN';
      return;
    }

    const prefix = monitorSettings.monitorTitle ? monitorSettings.monitorTitle + ' - ' : '';
    let title = `${Math.floor(percent)}${monitorSettings.symbol}`;
    let postfix = '';

    // Add max VRAM tracking for VRAM monitors
    if (used !== undefined && total !== undefined) {
      // Extract GPU index from monitorTitle (assuming format "X: GPU Name")
      const gpuIndex = parseInt(monitorSettings.monitorTitle?.split(':')[0] || '0');

      // Initialize max VRAM if not set or glitch
      const currentMax = this.maxVRAMUsed[gpuIndex] ?? 0;
      const validMax = (currentMax === 0 || currentMax > total) ? 0 : currentMax;

      // Update max VRAM if current usage is higher
      const newMax = used > validMax ? used : validMax;
      this.maxVRAMUsed[gpuIndex] = newMax;

      postfix = ` - ${formatBytes(used)} / ${formatBytes(total)}`;
      // Add max VRAM to tooltip
      postfix += ` ${this.translate('Max:')} ${formatBytes(newMax)}`;
    }

    title = `${prefix}${title}${postfix}`;

    if (monitorSettings.htmlMonitorRef) {
      monitorSettings.htmlMonitorRef.title = title;
    }
    monitorSettings.htmlMonitorLabelRef.innerHTML = `${Math.floor(percent)}${monitorSettings.symbol}`;
    monitorSettings.htmlMonitorSliderRef.style.width = `${Math.floor(percent)}%`;
  };

  updateAllAnimationDuration = (value: number): void => {
    this.updatedAnimationDuration(this.monitorCPUElement, value);
    this.updatedAnimationDuration(this.monitorCPUTempElement, value);
    this.updatedAnimationDuration(this.monitorRAMElement, value);
    this.updatedAnimationDuration(this.monitorHDDElement, value);
    this.monitorGPUSettings.forEach((monitorSettings) => {
      monitorSettings && this.updatedAnimationDuration(monitorSettings, value);
    });
    this.monitorVRAMSettings.forEach((monitorSettings) => {
      monitorSettings && this.updatedAnimationDuration(monitorSettings, value);
    });
    this.monitorTemperatureSettings.forEach((monitorSettings) => {
      monitorSettings && this.updatedAnimationDuration(monitorSettings, value);
    });
  };

  updatedAnimationDuration = (monitorSettings: TMonitorSettings, value: number): void => {
    const slider = monitorSettings.htmlMonitorSliderRef;
    if (!slider) {
      return;
    }

    slider.style.transition = `width ${value.toFixed(1)}s`;
  };

  createMonitor = (monitorSettings?: TMonitorSettings): HTMLDivElement => {
    if (!monitorSettings) {
      // just for typescript
      return document.createElement('div');
    }

    const htmlMain = document.createElement('div');
    htmlMain.classList.add(monitorSettings.id);
    htmlMain.classList.add('usagemonitor-monitor');

    monitorSettings.htmlMonitorRef = htmlMain;

    if (monitorSettings.title) {
      htmlMain.title = monitorSettings.title;
    }

    const htmlMonitorText = document.createElement('div');
    htmlMonitorText.classList.add('usagemonitor-text');
    htmlMonitorText.innerHTML = monitorSettings.label;
    htmlMain.append(htmlMonitorText);

    const htmlMonitorContent = document.createElement('div');
    htmlMonitorContent.classList.add('usagemonitor-content');
    htmlMain.append(htmlMonitorContent);

    const htmlMonitorSlider = document.createElement('div');
    htmlMonitorSlider.classList.add('usagemonitor-slider');
    if (monitorSettings.cssColorFinal) {
      htmlMonitorSlider.style.backgroundColor =
        `color-mix(in srgb, ${monitorSettings.cssColorFinal} 0%, ${monitorSettings.cssColor})`;
    } else {
      htmlMonitorSlider.style.backgroundColor = monitorSettings.cssColor;
    }
    monitorSettings.htmlMonitorSliderRef = htmlMonitorSlider;
    htmlMonitorContent.append(htmlMonitorSlider);

    const htmlMonitorLabel = document.createElement('div');
    htmlMonitorLabel.classList.add('usagemonitor-label');
    monitorSettings.htmlMonitorLabelRef = htmlMonitorLabel;
    htmlMonitorContent.append(htmlMonitorLabel);
    htmlMonitorLabel.innerHTML = '0' + (monitorSettings.symbol || '%');
    return monitorSettings.htmlMonitorRef;
  };

  updateMonitorStyle = (
    width: number,
    height: number,
    labelFontSize: number,
    valueFontSize: number,
    textOpacity: number,
    textBold: boolean,
  ): void => {
    this.styleSheet.innerText = [
      // eslint-disable-next-line max-len
      `#usagemonitor-monitors-root .usagemonitor-monitor .usagemonitor-content {height: ${height}px; width: ${width}px;}`,
      // eslint-disable-next-line max-len
      `#usagemonitor-monitors-root .usagemonitor-monitor .usagemonitor-text {font-size: ${labelFontSize}px; opacity: ${(100 - textOpacity) / 100}; font-weight: ${textBold ? 'bold' : 'normal'};}`,
      `#usagemonitor-monitors-root .usagemonitor-monitor .usagemonitor-label {font-size: ${valueFontSize}px;}`,
    ].join('\n');
  };

  showMonitor = (monitorSettings: TMonitorSettings, value: boolean): void => {
    if (monitorSettings.htmlMonitorRef) {
      monitorSettings.htmlMonitorRef.style.display = value ? 'flex' : 'none';
    }
  };

  resetMaxVRAM = (): void => {
    this.maxVRAMUsed = {};
  };
}
