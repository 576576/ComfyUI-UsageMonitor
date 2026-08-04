import { createStyleSheet, formatBytes } from './utils.js';
export class MonitorUI {
    constructor(rootElement, monitorCPUElement, monitorRAMElement, monitorHDDElement, monitorCPUTempElement, monitorGPUSettings, monitorVRAMSettings, monitorTemperatureSettings, currentRate, translate) {
        Object.defineProperty(this, "rootElement", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: rootElement
        });
        Object.defineProperty(this, "monitorCPUElement", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: monitorCPUElement
        });
        Object.defineProperty(this, "monitorRAMElement", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: monitorRAMElement
        });
        Object.defineProperty(this, "monitorHDDElement", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: monitorHDDElement
        });
        Object.defineProperty(this, "monitorCPUTempElement", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: monitorCPUTempElement
        });
        Object.defineProperty(this, "monitorGPUSettings", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: monitorGPUSettings
        });
        Object.defineProperty(this, "monitorVRAMSettings", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: monitorVRAMSettings
        });
        Object.defineProperty(this, "monitorTemperatureSettings", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: monitorTemperatureSettings
        });
        Object.defineProperty(this, "currentRate", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: currentRate
        });
        Object.defineProperty(this, "translate", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: translate
        });
        Object.defineProperty(this, "htmlClassMonitor", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'usagemonitor-monitors-container'
        });
        Object.defineProperty(this, "lastMonitor", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1
        });
        Object.defineProperty(this, "styleSheet", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "maxVRAMUsed", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        });
        Object.defineProperty(this, "createDOM", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: () => {
                if (!this.rootElement) {
                    throw Error('UsageMonitor: MonitorUI - Container not found');
                }
                this.rootElement.appendChild(this.createMonitor(this.monitorCPUElement));
                this.rootElement.appendChild(this.createMonitor(this.monitorCPUTempElement));
                this.rootElement.appendChild(this.createMonitor(this.monitorRAMElement));
                this.rootElement.appendChild(this.createMonitor(this.monitorHDDElement));
                this.updateAllAnimationDuration(this.currentRate);
            }
        });
        Object.defineProperty(this, "createDOMGPUMonitor", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (monitorSettings) => {
                if (!(monitorSettings && this.rootElement)) {
                    return;
                }
                this.rootElement.appendChild(this.createMonitor(monitorSettings));
                this.updateAllAnimationDuration(this.currentRate);
            }
        });
        Object.defineProperty(this, "orderMonitors", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: () => {
                try {
                    this.monitorCPUElement.htmlMonitorRef.style.order = '' + this.lastMonitor++;
                    this.monitorCPUTempElement.htmlMonitorRef.style.order = '' + this.lastMonitor++;
                    this.monitorRAMElement.htmlMonitorRef.style.order = '' + this.lastMonitor++;
                    this.monitorGPUSettings.forEach((_monitorSettings, index) => {
                        this.monitorGPUSettings[index].htmlMonitorRef.style.order = '' + this.lastMonitor++;
                        this.monitorVRAMSettings[index].htmlMonitorRef.style.order = '' + this.lastMonitor++;
                        this.monitorTemperatureSettings[index].htmlMonitorRef.style.order = '' + this.lastMonitor++;
                    });
                    this.monitorHDDElement.htmlMonitorRef.style.order = '' + this.lastMonitor++;
                }
                catch (error) {
                    console.error('orderMonitors', error);
                }
            }
        });
        Object.defineProperty(this, "updateDisplay", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (data) => {
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
                            return;
                        }
                        this.updateMonitor(monitorSettings, gpu.gpu_utilization);
                    }
                    else {
                    }
                });
                this.monitorVRAMSettings.forEach((monitorSettings, index) => {
                    if (data.gpus[index]) {
                        const gpu = data.gpus[index];
                        if (gpu === undefined) {
                            return;
                        }
                        this.updateMonitor(monitorSettings, gpu.vram_used_percent, gpu.vram_used, gpu.vram_total);
                    }
                    else {
                    }
                });
                this.monitorTemperatureSettings.forEach((monitorSettings, index) => {
                    if (data.gpus[index]) {
                        const gpu = data.gpus[index];
                        if (gpu === undefined) {
                            return;
                        }
                        this.updateMonitor(monitorSettings, gpu.gpu_temperature);
                        if (monitorSettings.cssColorFinal && monitorSettings.htmlMonitorSliderRef) {
                            monitorSettings.htmlMonitorSliderRef.style.backgroundColor =
                                `color-mix(in srgb, ${monitorSettings.cssColorFinal} ${gpu.gpu_temperature}%, ${monitorSettings.cssColor})`;
                        }
                    }
                    else {
                    }
                });
            }
        });
        Object.defineProperty(this, "updateMonitor", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (monitorSettings, percent, used, total) => {
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
                if (used !== undefined && total !== undefined) {
                    const gpuIndex = parseInt(monitorSettings.monitorTitle?.split(':')[0] || '0');
                    const currentMax = this.maxVRAMUsed[gpuIndex] ?? 0;
                    const validMax = (currentMax === 0 || currentMax > total) ? 0 : currentMax;
                    const newMax = used > validMax ? used : validMax;
                    this.maxVRAMUsed[gpuIndex] = newMax;
                    postfix = ` - ${formatBytes(used)} / ${formatBytes(total)}`;
                    postfix += ` ${this.translate('Max:')} ${formatBytes(newMax)}`;
                }
                title = `${prefix}${title}${postfix}`;
                if (monitorSettings.htmlMonitorRef) {
                    monitorSettings.htmlMonitorRef.title = title;
                }
                monitorSettings.htmlMonitorLabelRef.innerHTML = `${Math.floor(percent)}${monitorSettings.symbol}`;
                monitorSettings.htmlMonitorSliderRef.style.width = `${Math.floor(percent)}%`;
            }
        });
        Object.defineProperty(this, "updateAllAnimationDuration", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (value) => {
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
            }
        });
        Object.defineProperty(this, "updatedAnimationDuration", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (monitorSettings, value) => {
                const slider = monitorSettings.htmlMonitorSliderRef;
                if (!slider) {
                    return;
                }
                slider.style.transition = `width ${value.toFixed(1)}s`;
            }
        });
        Object.defineProperty(this, "createMonitor", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (monitorSettings) => {
                if (!monitorSettings) {
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
                }
                else {
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
            }
        });
        Object.defineProperty(this, "updateMonitorStyle", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (width, height, labelFontSize, valueFontSize, textOpacity, textBold, hideNumber) => {
                this.styleSheet.innerText = [
                    `#usagemonitor-monitors-root .usagemonitor-monitor .usagemonitor-content {height: ${height}px; width: ${width}px;}`,
                    `#usagemonitor-monitors-root .usagemonitor-monitor .usagemonitor-text {font-size: ${labelFontSize}px; opacity: ${(100 - textOpacity) / 100}; font-weight: ${textBold ? 'bold' : 'normal'};}`,
                    `#usagemonitor-monitors-root .usagemonitor-monitor .usagemonitor-label {font-size: ${valueFontSize}px; display: ${hideNumber ? 'none' : 'block'};}`,
                ].join('\n');
            }
        });
        Object.defineProperty(this, "showMonitor", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (monitorSettings, value) => {
                if (monitorSettings.htmlMonitorRef) {
                    monitorSettings.htmlMonitorRef.style.display = value ? 'flex' : 'none';
                }
            }
        });
        Object.defineProperty(this, "resetMaxVRAM", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: () => {
                this.maxVRAMUsed = {};
            }
        });
        if (this.rootElement.children.length === 0) {
            this.rootElement.setAttribute('id', 'usagemonitor-monitors-root');
            this.rootElement.classList.add(this.htmlClassMonitor);
            this.rootElement.classList.add(this.constructor.name);
        }
        this.createDOM();
        this.styleSheet = createStyleSheet('usagemonitor-monitors-size');
    }
}
