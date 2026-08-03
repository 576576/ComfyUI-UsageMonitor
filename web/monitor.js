import { app, api, ComfyButtonGroup } from './comfy/index.js';
import { MonitorUI } from './monitorUI.js';
import { Colors } from './styles.js';
import { convertNumberToPascalCase } from './utils.js';
const ComfyKeyMenuDisplayOption = 'Comfy.UseNewMenu';
var MenuDisplayOptions;
(function (MenuDisplayOptions) {
    MenuDisplayOptions["Disabled"] = "Disabled";
    MenuDisplayOptions["Top"] = "Top";
    MenuDisplayOptions["Bottom"] = "Bottom";
})(MenuDisplayOptions || (MenuDisplayOptions = {}));
class UsageMonitorMonitor {
    constructor() {
        Object.defineProperty(this, "idExtensionName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'UsageMonitor.monitor'
        });
        Object.defineProperty(this, "menuDisplayOption", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: MenuDisplayOptions.Disabled
        });
        Object.defineProperty(this, "usagemonitorButtonGroup", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "settingsRate", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "settingsMonitorHeight", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "settingsMonitorWidth", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "monitorCPUElement", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "monitorRAMElement", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "monitorHDDElement", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "settingsHDD", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "monitorGPUSettings", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "monitorVRAMSettings", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "monitorTemperatureSettings", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "monitorUI", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "monitorCPUTempElement", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "cpuName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'Unknown CPU'
        });
        Object.defineProperty(this, "translations", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        });
        Object.defineProperty(this, "translate", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (key) => {
                const parts = key.split('.');
                let value = this.translations;
                for (const part of parts) {
                    if (value === null || value === undefined || typeof value !== 'object') {
                        return key;
                    }
                    value = value[part];
                }
                return typeof value === 'string' ? value : key;
            }
        });
        Object.defineProperty(this, "getCurrentLanguage", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: () => {
                try {
                    const comfyLang = app.translation?.currentLanguage?.() ??
                        app.translation?.language;
                    if (comfyLang) {
                        return comfyLang;
                    }
                }
                catch (error) {
                }
                return navigator.language || 'en';
            }
        });
        Object.defineProperty(this, "getTranslationsFromServer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async () => {
                try {
                    const lang = this.getCurrentLanguage();
                    const resp = await api.fetchApi(`/usagemonitor/translations?lang=${encodeURIComponent(lang)}`, { cache: 'no-store' });
                    if (resp.status === 200) {
                        this.translations = await resp.json();
                    }
                }
                catch (error) {
                    console.error('UsageMonitor: failed to load translations', error);
                }
            }
        });
        Object.defineProperty(this, "monitorWidthId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'UsageMonitor.MonitorWidth'
        });
        Object.defineProperty(this, "monitorWidth", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 60
        });
        Object.defineProperty(this, "monitorHeightId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'UsageMonitor.MonitorHeight'
        });
        Object.defineProperty(this, "monitorHeight", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 30
        });
        Object.defineProperty(this, "labelFontSizeId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'UsageMonitor.LabelFontSize'
        });
        Object.defineProperty(this, "labelFontSize", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 10
        });
        Object.defineProperty(this, "valueFontSizeId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'UsageMonitor.ValueFontSize'
        });
        Object.defineProperty(this, "valueFontSize", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 10
        });
        Object.defineProperty(this, "textOpacityId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'UsageMonitor.TextOpacity'
        });
        Object.defineProperty(this, "textOpacity", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 100
        });
        Object.defineProperty(this, "settingsLabelFontSize", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "settingsValueFontSize", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "settingsTextOpacity", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "createSettingsRate", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: () => {
                this.settingsRate = {
                    id: 'UsageMonitor.RefreshRate',
                    name: this.translate('Refresh interval'),
                    category: [this.translate('UsageMonitor'), this.translate('Graphic Configuration'), 'refresh'],
                    tooltip: this.translate('desc.Refresh interval'),
                    type: 'slider',
                    attrs: {
                        min: 0,
                        max: 2,
                        step: .25,
                    },
                    defaultValue: .5,
                    onChange: async (value) => {
                        let valueNumber;
                        try {
                            valueNumber = parseFloat(value);
                            if (isNaN(valueNumber)) {
                                throw new Error('invalid value');
                            }
                        }
                        catch (error) {
                            console.error(error);
                            return;
                        }
                        try {
                            await this.updateServer({ rate: valueNumber });
                        }
                        catch (error) {
                            console.error(error);
                            return;
                        }
                        const data = {
                            cpu_utilization: 0,
                            cpu_temperature: 0,
                            device: 'cpu',
                            gpus: [
                                {
                                    gpu_utilization: 0,
                                    gpu_temperature: 0,
                                    vram_total: 0,
                                    vram_used: 0,
                                    vram_used_percent: 0,
                                },
                            ],
                            hdd_total: 0,
                            hdd_used: 0,
                            hdd_used_percent: 0,
                            ram_total: 0,
                            ram_used: 0,
                            ram_used_percent: 0,
                        };
                        if (valueNumber === 0) {
                            this.monitorUI.updateDisplay(data);
                        }
                        this.monitorUI?.updateAllAnimationDuration(valueNumber);
                    },
                };
            }
        });
        Object.defineProperty(this, "createSettingsMonitorWidth", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: () => {
                this.settingsMonitorWidth = {
                    id: this.monitorWidthId,
                    name: this.translate('Pixel Width'),
                    category: [this.translate('UsageMonitor'), this.translate('Graphic Configuration'), 'width'],
                    tooltip: this.translate('desc.Monitor width'),
                    type: 'slider',
                    attrs: {
                        min: 60,
                        max: 100,
                        step: 1,
                    },
                    defaultValue: this.monitorWidth,
                    onChange: (value) => {
                        let valueNumber;
                        try {
                            valueNumber = parseInt(value);
                            if (isNaN(valueNumber)) {
                                throw new Error('invalid value');
                            }
                        }
                        catch (error) {
                            console.error(error);
                            return;
                        }
                        this.updateMonitorStyle();
                    },
                };
            }
        });
        Object.defineProperty(this, "createSettingsMonitorHeight", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: () => {
                this.settingsMonitorHeight = {
                    id: this.monitorHeightId,
                    name: this.translate('Pixel Height'),
                    category: [this.translate('UsageMonitor'), this.translate('Graphic Configuration'), 'height'],
                    tooltip: this.translate('desc.Monitor height'),
                    type: 'slider',
                    attrs: {
                        min: 16,
                        max: 50,
                        step: 1,
                    },
                    defaultValue: this.monitorHeight,
                    onChange: async (value) => {
                        let valueNumber;
                        try {
                            valueNumber = parseInt(value);
                            if (isNaN(valueNumber)) {
                                throw new Error('invalid value');
                            }
                        }
                        catch (error) {
                            console.error(error);
                            return;
                        }
                        this.updateMonitorStyle();
                    },
                };
            }
        });
        Object.defineProperty(this, "createSettingsFontSize", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: () => {
                this.settingsLabelFontSize = {
                    id: this.labelFontSizeId,
                    name: this.translate('Label Font Size'),
                    category: [this.translate('UsageMonitor'), this.translate('Graphic Configuration'), 'fontsize'],
                    tooltip: this.translate('desc.Label font size'),
                    type: 'slider',
                    attrs: {
                        min: 6,
                        max: 20,
                        step: 1,
                    },
                    defaultValue: this.labelFontSize,
                    onChange: () => {
                        this.updateMonitorStyle();
                    },
                };
                this.settingsValueFontSize = {
                    id: this.valueFontSizeId,
                    name: this.translate('Number Font Size'),
                    category: [this.translate('UsageMonitor'), this.translate('Graphic Configuration'), 'fontsize'],
                    tooltip: this.translate('desc.Number font size'),
                    type: 'slider',
                    attrs: {
                        min: 6,
                        max: 20,
                        step: 1,
                    },
                    defaultValue: this.valueFontSize,
                    onChange: () => {
                        this.updateMonitorStyle();
                    },
                };
                this.settingsTextOpacity = {
                    id: this.textOpacityId,
                    name: this.translate('Text Opacity'),
                    category: [this.translate('UsageMonitor'), this.translate('Graphic Configuration'), 'opacity'],
                    tooltip: this.translate('desc.Text opacity'),
                    type: 'slider',
                    attrs: {
                        min: 0,
                        max: 100,
                        step: 1,
                    },
                    defaultValue: this.textOpacity,
                    onChange: () => {
                        this.updateMonitorStyle();
                    },
                };
            }
        });
        Object.defineProperty(this, "createSettingsCPU", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: () => {
                this.monitorCPUElement = {
                    id: 'UsageMonitor.ShowCpu',
                    name: this.translate('Overall Usage'),
                    category: [this.translate('UsageMonitor'), `Cpu 0 - ${this.cpuName}`, 'Cpu'],
                    type: 'boolean',
                    label: this.translate('CPU'),
                    symbol: '%',
                    defaultValue: true,
                    htmlMonitorRef: undefined,
                    htmlMonitorSliderRef: undefined,
                    htmlMonitorLabelRef: undefined,
                    cssColor: Colors.CPU,
                    onChange: async (value) => {
                        await this.updateServer({ switchCPU: value });
                        this.updateWidget(this.monitorCPUElement);
                    },
                };
            }
        });
        Object.defineProperty(this, "createSettingsCPUTemp", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: () => {
                this.monitorCPUTempElement = {
                    id: 'UsageMonitor.ShowCpuTemp',
                    name: this.translate('CPU') + ' ' + this.translate('Temperature'),
                    category: [this.translate('UsageMonitor'), `Cpu 0 - ${this.cpuName}`, 'Temperature'],
                    type: 'boolean',
                    label: this.translate('CPU') + ' ' + this.translate('Temperature'),
                    symbol: '℃',
                    defaultValue: false,
                    htmlMonitorRef: undefined,
                    htmlMonitorSliderRef: undefined,
                    htmlMonitorLabelRef: undefined,
                    cssColor: Colors.TEMP_START,
                    cssColorFinal: Colors.TEMP_END,
                    onChange: async (value) => {
                        await this.updateServer({ switchCPUTemp: value });
                        this.updateWidget(this.monitorCPUTempElement);
                    },
                };
                app.ui.settings.addSetting(this.monitorCPUTempElement);
            }
        });
        Object.defineProperty(this, "createSettingsRAM", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: () => {
                this.monitorRAMElement = {
                    id: 'UsageMonitor.ShowRam',
                    name: this.translate('RAM') + ' ' + this.translate('Usage'),
                    category: [this.translate('UsageMonitor'), this.translate('Hardware'), 'Ram'],
                    type: 'boolean',
                    label: this.translate('RAM'),
                    symbol: '%',
                    defaultValue: true,
                    htmlMonitorRef: undefined,
                    htmlMonitorSliderRef: undefined,
                    htmlMonitorLabelRef: undefined,
                    cssColor: Colors.RAM,
                    onChange: async (value) => {
                        await this.updateServer({ switchRAM: value });
                        this.updateWidget(this.monitorRAMElement);
                    },
                };
            }
        });
        Object.defineProperty(this, "createSettingsGPUUsage", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (name, index, moreThanOneGPU) => {
                if (name === undefined || index === undefined) {
                    console.warn('getGPUsFromServer: name or index undefined', name, index);
                    return;
                }
                let label = 'GPU ';
                label += moreThanOneGPU ? index : '';
                const monitorGPUNElement = {
                    id: 'UsageMonitor.ShowGpuUsage' + convertNumberToPascalCase(index),
                    name: this.translate('Overall Usage'),
                    category: [this.translate('UsageMonitor'), `GPU ${index} - ${name}`, 'Usage'],
                    type: 'boolean',
                    label,
                    symbol: '%',
                    monitorTitle: `${index}: ${name}`,
                    defaultValue: true,
                    htmlMonitorRef: undefined,
                    htmlMonitorSliderRef: undefined,
                    htmlMonitorLabelRef: undefined,
                    cssColor: Colors.GPU,
                    onChange: async (value) => {
                        await this.updateServerGPU(index, { utilization: value });
                        this.updateWidget(monitorGPUNElement);
                    },
                };
                this.monitorGPUSettings[index] = monitorGPUNElement;
                app.ui.settings.addSetting(this.monitorGPUSettings[index]);
                this.monitorUI.createDOMGPUMonitor(this.monitorGPUSettings[index]);
            }
        });
        Object.defineProperty(this, "createSettingsGPUVRAM", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (name, index, moreThanOneGPU) => {
                if (name === undefined || index === undefined) {
                    console.warn('getGPUsFromServer: name or index undefined', name, index);
                    return;
                }
                let label = 'VRAM ';
                label += moreThanOneGPU ? index : '';
                const monitorVRAMNElement = {
                    id: 'UsageMonitor.ShowGpuVram' + convertNumberToPascalCase(index),
                    name: this.translate('VRAM'),
                    category: [this.translate('UsageMonitor'), `GPU ${index} - ${name}`, 'VRAM'],
                    type: 'boolean',
                    label: label,
                    symbol: '%',
                    monitorTitle: `${index}: ${name}`,
                    defaultValue: true,
                    htmlMonitorRef: undefined,
                    htmlMonitorSliderRef: undefined,
                    htmlMonitorLabelRef: undefined,
                    cssColor: Colors.VRAM,
                    onChange: async (value) => {
                        await this.updateServerGPU(index, { vram: value });
                        this.updateWidget(monitorVRAMNElement);
                    },
                };
                this.monitorVRAMSettings[index] = monitorVRAMNElement;
                app.ui.settings.addSetting(this.monitorVRAMSettings[index]);
                this.monitorUI.createDOMGPUMonitor(this.monitorVRAMSettings[index]);
            }
        });
        Object.defineProperty(this, "createSettingsGPUTemp", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (name, index, moreThanOneGPU) => {
                if (name === undefined || index === undefined) {
                    console.warn('getGPUsFromServer: name or index undefined', name, index);
                    return;
                }
                let label = 'Temp ';
                label += moreThanOneGPU ? index : '';
                const monitorTemperatureNElement = {
                    id: 'UsageMonitor.ShowGpuTemperature' + convertNumberToPascalCase(index),
                    name: this.translate('Temperature'),
                    category: [this.translate('UsageMonitor'), `GPU ${index} - ${name}`, 'Temperature'],
                    type: 'boolean',
                    label: label,
                    symbol: '℃',
                    monitorTitle: `${index}: ${name}`,
                    defaultValue: true,
                    htmlMonitorRef: undefined,
                    htmlMonitorSliderRef: undefined,
                    htmlMonitorLabelRef: undefined,
                    cssColor: Colors.TEMP_START,
                    cssColorFinal: Colors.TEMP_END,
                    onChange: async (value) => {
                        await this.updateServerGPU(index, { temperature: value });
                        this.updateWidget(monitorTemperatureNElement);
                    },
                };
                this.monitorTemperatureSettings[index] = monitorTemperatureNElement;
                app.ui.settings.addSetting(this.monitorTemperatureSettings[index]);
                this.monitorUI.createDOMGPUMonitor(this.monitorTemperatureSettings[index]);
            }
        });
        Object.defineProperty(this, "createSettingsHDD", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: () => {
                this.monitorHDDElement = {
                    id: 'UsageMonitor.ShowHdd',
                    name: this.translate('Show Storage') + ' ' + this.translate('Usage'),
                    category: [this.translate('UsageMonitor'), this.translate('Show Storage'), 'Show'],
                    type: 'boolean',
                    label: this.translate('Storage'),
                    symbol: '%',
                    defaultValue: false,
                    htmlMonitorRef: undefined,
                    htmlMonitorSliderRef: undefined,
                    htmlMonitorLabelRef: undefined,
                    cssColor: Colors.DISK,
                    onChange: async (value) => {
                        await this.updateServer({ switchHDD: value });
                        this.updateWidget(this.monitorHDDElement);
                    },
                };
                this.settingsHDD = {
                    id: 'UsageMonitor.WhichHdd',
                    name: this.translate('Partition to show'),
                    category: [this.translate('UsageMonitor'), this.translate('Show Storage'), 'Which'],
                    type: 'combo',
                    defaultValue: '/',
                    options: [],
                    onChange: async (value) => {
                        await this.updateServer({ whichHDD: value });
                    },
                };
            }
        });
        Object.defineProperty(this, "createSettings", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: () => {
                app.ui.settings.addSetting(this.settingsRate);
                app.ui.settings.addSetting(this.settingsMonitorHeight);
                app.ui.settings.addSetting(this.settingsMonitorWidth);
                app.ui.settings.addSetting(this.settingsLabelFontSize);
                app.ui.settings.addSetting(this.settingsValueFontSize);
                app.ui.settings.addSetting(this.settingsTextOpacity);
                app.ui.settings.addSetting(this.monitorRAMElement);
                app.ui.settings.addSetting(this.monitorCPUElement);
                void this.getHDDsFromServer().then((data) => {
                    this.settingsHDD.options = data;
                    app.ui.settings.addSetting(this.settingsHDD);
                });
                app.ui.settings.addSetting(this.monitorHDDElement);
                void this.getGPUsFromServer().then((gpus) => {
                    let moreThanOneGPU = false;
                    if (gpus.length > 1) {
                        moreThanOneGPU = true;
                    }
                    gpus?.forEach(({ name, index }) => {
                        this.createSettingsGPUTemp(name, index, moreThanOneGPU);
                        this.createSettingsGPUVRAM(name, index, moreThanOneGPU);
                        this.createSettingsGPUUsage(name, index, moreThanOneGPU);
                    });
                    this.finishedLoad();
                });
            }
        });
        Object.defineProperty(this, "finishedLoad", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: () => {
                this.monitorUI.orderMonitors();
                this.updateAllWidget();
                this.moveMonitor(this.menuDisplayOption);
                this.updateMonitorStyle();
            }
        });
        Object.defineProperty(this, "updateMonitorStyle", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: () => {
                if (!this.monitorUI) {
                    return;
                }
                const w = app.extensionManager.setting.get(this.monitorWidthId);
                const h = app.extensionManager.setting.get(this.monitorHeightId);
                const labelFontSize = app.extensionManager.setting.get(this.labelFontSizeId);
                const valueFontSize = app.extensionManager.setting.get(this.valueFontSizeId);
                const textOpacity = app.extensionManager.setting.get(this.textOpacityId);
                this.monitorUI.updateMonitorStyle(w, h, labelFontSize, valueFontSize, textOpacity);
            }
        });
        Object.defineProperty(this, "updateDisplay", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (value) => {
                if (value !== this.menuDisplayOption) {
                    this.menuDisplayOption = value;
                    this.moveMonitor(this.menuDisplayOption);
                }
            }
        });
        Object.defineProperty(this, "moveMonitor", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (menuPosition) => {
                let parentElement;
                switch (menuPosition) {
                    case MenuDisplayOptions.Disabled:
                        parentElement = document.getElementById('queue-button');
                        if (parentElement && this.monitorUI.rootElement) {
                            parentElement.insertAdjacentElement('afterend', this.usagemonitorButtonGroup.element);
                        }
                        else {
                            console.error('UsageMonitor: parentElement to move monitors not found!', parentElement);
                        }
                        break;
                    case MenuDisplayOptions.Top:
                    case MenuDisplayOptions.Bottom:
                        app.menu?.settingsGroup.element.before(this.usagemonitorButtonGroup.element);
                }
            }
        });
        Object.defineProperty(this, "updateAllWidget", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: () => {
                this.updateWidget(this.monitorCPUElement);
                this.updateWidget(this.monitorCPUTempElement);
                this.updateWidget(this.monitorRAMElement);
                this.updateWidget(this.monitorHDDElement);
                this.monitorGPUSettings.forEach((monitorSettings) => {
                    monitorSettings && this.updateWidget(monitorSettings);
                });
                this.monitorVRAMSettings.forEach((monitorSettings) => {
                    monitorSettings && this.updateWidget(monitorSettings);
                });
                this.monitorTemperatureSettings.forEach((monitorSettings) => {
                    monitorSettings && this.updateWidget(monitorSettings);
                });
            }
        });
        Object.defineProperty(this, "updateWidget", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (monitorSettings) => {
                if (this.monitorUI) {
                    const value = app.extensionManager.setting.get(monitorSettings.id);
                    this.monitorUI.showMonitor(monitorSettings, value);
                }
            }
        });
        Object.defineProperty(this, "updateServer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async (data) => {
                const resp = await api.fetchApi('/usagemonitor/monitor', {
                    method: 'PATCH',
                    body: JSON.stringify(data),
                    cache: 'no-store',
                });
                if (resp.status === 200) {
                    return await resp.text();
                }
                throw new Error(resp.statusText);
            }
        });
        Object.defineProperty(this, "updateServerGPU", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async (index, data) => {
                const resp = await api.fetchApi(`/usagemonitor/monitor/GPU/${index}`, {
                    method: 'PATCH',
                    body: JSON.stringify(data),
                    cache: 'no-store',
                });
                if (resp.status === 200) {
                    return await resp.text();
                }
                throw new Error(resp.statusText);
            }
        });
        Object.defineProperty(this, "getHDDsFromServer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async () => {
                return this.getDataFromServer('HDD');
            }
        });
        Object.defineProperty(this, "getGPUsFromServer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async () => {
                return this.getDataFromServer('GPU');
            }
        });
        Object.defineProperty(this, "getCPUFromServer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async () => {
                const resp = await api.fetchApi('/usagemonitor/monitor/CPU', {
                    cache: 'no-store',
                });
                if (resp.status === 200) {
                    const data = await resp.json();
                    if (data?.name) {
                        this.cpuName = data.name;
                    }
                }
            }
        });
        Object.defineProperty(this, "getDataFromServer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async (what) => {
                const resp = await api.fetchApi(`/usagemonitor/monitor/${what}`, {
                    method: 'GET',
                    cache: 'no-store',
                });
                if (resp.status === 200) {
                    return await resp.json();
                }
                throw new Error(resp.statusText);
            }
        });
        Object.defineProperty(this, "setup", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async () => {
                if (this.monitorUI) {
                    return;
                }
                try {
                    await this.getTranslationsFromServer();
                }
                catch (error) {
                    console.error('UsageMonitor: failed to load translations', error);
                }
                try {
                    await this.getCPUFromServer();
                }
                catch (error) {
                    console.error('UsageMonitor: failed to load CPU name', error);
                }
                this.createSettingsRate();
                this.createSettingsMonitorHeight();
                this.createSettingsMonitorWidth();
                this.createSettingsFontSize();
                this.createSettingsCPU();
                this.createSettingsCPUTemp();
                this.createSettingsRAM();
                this.createSettingsHDD();
                this.createSettings();
                const currentRate = parseFloat(app.extensionManager.setting.get(this.settingsRate.id));
                this.menuDisplayOption = app.extensionManager.setting.get(ComfyKeyMenuDisplayOption);
                app.ui.settings.addEventListener(`${ComfyKeyMenuDisplayOption}.change`, (e) => {
                    this.updateDisplay(e.detail.value);
                });
                this.usagemonitorButtonGroup = new ComfyButtonGroup();
                app.menu?.settingsGroup.element.before(this.usagemonitorButtonGroup.element);
                this.monitorUI = new MonitorUI(this.usagemonitorButtonGroup.element, this.monitorCPUElement, this.monitorRAMElement, this.monitorHDDElement, this.monitorCPUTempElement, this.monitorGPUSettings, this.monitorVRAMSettings, this.monitorTemperatureSettings, currentRate, this.translate);
                this.updateDisplay(this.menuDisplayOption);
                this.registerListeners();
            }
        });
        Object.defineProperty(this, "registerListeners", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: () => {
                api.addEventListener('usagemonitor.monitor', (event) => {
                    if (event?.detail === undefined) {
                        return;
                    }
                    this.monitorUI.updateDisplay(event.detail);
                }, false);
            }
        });
    }
}
const usagemonitorMonitor = new UsageMonitorMonitor();
app.registerExtension({
    name: usagemonitorMonitor.idExtensionName,
    setup: usagemonitorMonitor.setup,
});
