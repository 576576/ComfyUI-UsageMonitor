import { app, api, ComfyButtonGroup } from './comfy/index.js';
import { MonitorUI } from './monitorUI.js';
import { Colors } from './styles.js';
import { convertNumberToPascalCase } from './utils.js';

const ComfyKeyMenuDisplayOption = 'Comfy.UseNewMenu';
enum MenuDisplayOptions {
  'Disabled' = 'Disabled',
  'Top' = 'Top',
  'Bottom' = 'Bottom',
}

// enum MonitorPosition {
//   'Top' = 'Top',
//   'Sidebar' = 'Sidebar',
//   'Floating' = 'Floating',
// }

class UsageMonitorMonitor {
  readonly idExtensionName = 'UsageMonitor.monitor';
  private menuDisplayOption: MenuDisplayOptions = MenuDisplayOptions.Disabled;
  private usagemonitorButtonGroup: ComfyButtonGroup = null;

  // private settingsMonitorPosition: TMonitorSettings;
  private settingsRate: TMonitorSettings;
  private settingsMonitorHeight: TMonitorSettings;
  private settingsMonitorWidth: TMonitorSettings;
  private monitorCPUElement: TMonitorSettings;
  private monitorRAMElement: TMonitorSettings;
  private monitorHDDElement: TMonitorSettings;
  private settingsHDD: TMonitorSettings;
  private monitorGPUSettings: TMonitorSettings[] = [];
  private monitorVRAMSettings: TMonitorSettings[] = [];
  private monitorTemperatureSettings: TMonitorSettings[] = [];

  private monitorUI: MonitorUI;
  private monitorCPUTempElement: TMonitorSettings;

  private cpuName = 'Unknown CPU';

  private translations: Record<string, string> = {};

  translate = (key: string): string => {
    // Support nested keys with dot notation, e.g. 'desc.Refresh interval'.
    const parts = key.split('.');
    let value: any = this.translations;
    for (const part of parts) {
      if (value === null || value === undefined || typeof value !== 'object') {
        return key;
      }
      value = value[part];
    }
    return typeof value === 'string' ? value : key;
  };

  getCurrentLanguage = (): string => {
    // Prefer ComfyUI's current language, fall back to the browser language.
    try {
      const comfyLang =
        (app as any).translation?.currentLanguage?.() ??
        (app as any).translation?.language;
      if (comfyLang) {
        return comfyLang;
      }
    } catch (error) {
      // ignore
    }
    return navigator.language || 'en';
  };

  getTranslationsFromServer = async (): Promise<void> => {
    try {
      const lang = this.getCurrentLanguage();
      const resp = await api.fetchApi(
        `/usagemonitor/translations?lang=${encodeURIComponent(lang)}`,
        { cache: 'no-store' },
      );
      if (resp.status === 200) {
        this.translations = await resp.json();
      }
    } catch (error) {
      console.error('UsageMonitor: failed to load translations', error);
    }
  };

  // private readonly monitorPositionId = 'UsageMonitor.MonitorPosition';
  private readonly monitorWidthId = 'UsageMonitor.MonitorWidth';
  private readonly monitorWidth = 60;
  private readonly monitorHeightId = 'UsageMonitor.MonitorHeight';
  private readonly monitorHeight = 30;
  private readonly labelFontSizeId = 'UsageMonitor.LabelFontSize';
  private readonly labelFontSize = 10;
  private readonly valueFontSizeId = 'UsageMonitor.ValueFontSize';
  private readonly valueFontSize = 10;
  private readonly textOpacityId = 'UsageMonitor.TextOpacity';
  // Transparency semantics: 0 = fully opaque, 100 = fully transparent.
  private readonly textOpacity = 0;
  private readonly textBoldId = 'UsageMonitor.TextBold';
  private readonly textBold = false;
  private readonly hideNumberId = 'UsageMonitor.HideNumber';
  private readonly hideNumber = false;
  private readonly monitorEnabledId = 'UsageMonitor.MonitorEnabled';
  private settingsLabelFontSize: TMonitorSettings;
  private settingsValueFontSize: TMonitorSettings;
  private settingsTextOpacity: TMonitorSettings;
  private settingsTextBold: TMonitorSettings;
  private settingsHideNumber: TMonitorSettings;
  private settingsMonitorEnabled: TMonitorSettings;
  private originalSettingTypes: Record<string, string> = {};

  // NO POSIBLE TO IMPLEMENT INSIDE THE PANEL
  // createSettingsMonitorPosition = (): void => {
  //   const position = app.extensionManager.setting.get(this.monitorPositionId);
  //   console.log('position', position);
  //   this.settingsMonitorPosition = {
  //     id: this.monitorPositionId,
  //     name: 'Position (floating not implemented yet)',
  //     category: ['UsageMonitor', this.translate('Graphic Configuration'), 'position'],
  //     tooltip: 'Only for new UI',
  //     experimental: true,
  //     // data: [],
  //     type: 'combo',
  //     options: [
  //       MonitorPoistion.Top,
  //       MonitorPoistion.Sidebar,
  //       MonitorPoistion.Floating
  //     ],
  //
  //     defaultValue: MonitorPoistion.Sidebar,
  //     // @ts-ignore
  //     onChange: (_value: string): void => {
  //       // if (this.monitorUI) {
  //       // console.log('onChange', _value);
  //       //   this.moveMonitor(this.menuDisplayOption);
  //       // }
  //     },
  //   };
  // };

  createSettingsMonitorEnabled = (): void => {
    this.settingsMonitorEnabled = {
      id: this.monitorEnabledId,
      name: this.translate('Master Switch'),
      // Two-element category so the '性能监视器' top-level node is NOT a leaf
      // (a single-element category would move the whole group into 'Other').
      category: [this.translate('UsageMonitor'), this.translate('UsageMonitor')],
      // Keep this subgroup above all others (subgroups sort by max sortOrder).
      sortOrder: 1000,
      type: 'boolean',
      defaultValue: true,
      // @ts-ignore
      onChange: async(value: boolean): Promise<void> => {
        try {
          await this.updateServerMonitor(value);
        } catch (error) {
          console.error(error);
          return;
        }
        this.setMonitorEnabled(value);
      },
    };
  };

  createSettingsRate = (): void => {
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

      // @ts-ignore
      onChange: async(value: string): Promise<void> => {
        let valueNumber: number;

        try {
          valueNumber = parseFloat(value);
          if (isNaN(valueNumber)) {
            throw new Error('invalid value');
          }
        } catch (error) {
          console.error(error);
          return;
        }
        try {
          await this.updateServer({rate: valueNumber});
        } catch (error) {
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
  };

  createSettingsMonitorWidth = (): void => {
    this.settingsMonitorWidth = {
      id: this.monitorWidthId,
      name: this.translate('Capsule Width'),
      category: [this.translate('UsageMonitor'), this.translate('Graphic Configuration'), 'width'],
      tooltip: this.translate('desc.Capsule width'),
      type: 'slider',
      attrs: {
        min: 60,
        max: 100,
        step: 1,
      },
      defaultValue: this.monitorWidth,
      // @ts-ignore
      onChange: (value: string): void => {
        let valueNumber: number;

        try {
          valueNumber = parseInt(value);
          if (isNaN(valueNumber)) {
            throw new Error('invalid value');
          }
        } catch (error) {
          console.error(error);
          return;
        }

        this.updateMonitorStyle();
      },
    };
  };

  createSettingsMonitorHeight = (): void => {
    this.settingsMonitorHeight = {
      id: this.monitorHeightId,
      name: this.translate('Capsule Height'),
      category: [this.translate('UsageMonitor'), this.translate('Graphic Configuration'), 'height'],
      tooltip: this.translate('desc.Capsule height'),
      type: 'slider',
      attrs: {
        min: 16,
        max: 50,
        step: 1,
      },
      defaultValue: this.monitorHeight,
      // @ts-ignore
      onChange: async(value: string): void => {
        let valueNumber: number;

        try {
          valueNumber = parseInt(value);
          if (isNaN(valueNumber)) {
            throw new Error('invalid value');
          }
        } catch (error) {
          console.error(error);
          return;
        }

        this.updateMonitorStyle();
      },
    };
  };

  createSettingsFontSize = (): void => {
    this.settingsLabelFontSize = {
      id: this.labelFontSizeId,
      name: this.translate('Label Font Size'),
      category: [this.translate('UsageMonitor'), this.translate('Graphic Configuration'), 'labelfontsize'],
      tooltip: this.translate('desc.Label font size'),
      type: 'slider',
      attrs: {
        min: 6,
        max: 20,
        step: 1,
      },
      defaultValue: this.labelFontSize,
      // @ts-ignore
      onChange: (): void => {
        this.updateMonitorStyle();
      },
    };

    this.settingsValueFontSize = {
      id: this.valueFontSizeId,
      name: this.translate('Number Font Size'),
      category: [this.translate('UsageMonitor'), this.translate('Graphic Configuration'), 'numberfontsize'],
      tooltip: this.translate('desc.Number font size'),
      type: 'slider',
      attrs: {
        min: 6,
        max: 20,
        step: 1,
      },
      defaultValue: this.valueFontSize,
      // @ts-ignore
      onChange: (): void => {
        this.updateMonitorStyle();
      },
    };

    this.settingsTextOpacity = {
      id: this.textOpacityId,
      name: this.translate('Text Opacity'),
      category: [this.translate('UsageMonitor'), this.translate('Graphic Configuration'), 'textopacity'],
      tooltip: this.translate('desc.Text opacity'),
      type: 'slider',
      attrs: {
        min: 0,
        max: 100,
        step: 1,
      },
      defaultValue: this.textOpacity,
      // @ts-ignore
      onChange: (): void => {
        this.updateMonitorStyle();
      },
    };
  };

  createSettingsTextBold = (): void => {
    this.settingsTextBold = {
      id: this.textBoldId,
      name: this.translate('Text Bold'),
      category: [this.translate('UsageMonitor'), this.translate('Graphic Configuration'), 'textbold'],
      type: 'boolean',
      defaultValue: this.textBold,
      // @ts-ignore
      onChange: (value: boolean): void => {
        // Pass the new value directly; setting.get() may still return the old value here.
        this.updateMonitorStyle({textBold: value});
      },
    };
  };

  createSettingsHideNumber = (): void => {
    this.settingsHideNumber = {
      id: this.hideNumberId,
      name: this.translate('Hide Number'),
      category: [this.translate('UsageMonitor'), this.translate('Graphic Configuration'), 'hidenumber'],
      type: 'boolean',
      defaultValue: this.hideNumber,
      // @ts-ignore
      onChange: (value: boolean): void => {
        this.updateMonitorStyle({hideNumber: value});
      },
    };
  };

  createSettingsCPU = (): void => {
    // CPU Variables
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
      // @ts-ignore
      onChange: async(value: boolean): Promise<void> => {
        await this.updateServer({switchCPU: value});
        this.updateWidget(this.monitorCPUElement);
      },
    };
  };

  createSettingsCPUTemp = (): void => {
    this.monitorCPUTempElement = {
      id: 'UsageMonitor.ShowCpuTemp',
      name: this.translate('Temperature'),
      category: [this.translate('UsageMonitor'), `Cpu 0 - ${this.cpuName}`, 'Temperature'],
      type: 'boolean',
      // Capsule label stays as 'Temp C' (not localized); the settings name above stays localized.
      label: 'Temp C',
      symbol: '°C',
      defaultValue: false,
      htmlMonitorRef: undefined,
      htmlMonitorSliderRef: undefined,
      htmlMonitorLabelRef: undefined,
      cssColor: Colors.TEMP_START,
      cssColorFinal: Colors.TEMP_END,
      // @ts-ignore
      onChange: async(value: boolean): Promise<void> => {
        await this.updateServer({switchCPUTemp: value});
        this.updateWidget(this.monitorCPUTempElement);
      },
    };

    app.ui.settings.addSetting(this.monitorCPUTempElement);
  };

  createSettingsRAM = (): void => {
    // RAM Variables
    this.monitorRAMElement = {
      id: 'UsageMonitor.ShowRam',
      name: this.translate('RAM') + this.translate('Usage2'),
      category: [this.translate('UsageMonitor'), this.translate('Hardware'), 'Ram'],
      type: 'boolean',
      // Capsule label stays as 'RAM' (not localized); the settings name above stays localized.
      label: 'RAM',
      symbol: '%',
      defaultValue: true,
      htmlMonitorRef: undefined,
      htmlMonitorSliderRef: undefined,
      htmlMonitorLabelRef: undefined,
      cssColor: Colors.RAM,
      // @ts-ignore
      onChange: async(value: boolean): Promise<void> => {
        await this.updateServer({switchRAM: value});
        this.updateWidget(this.monitorRAMElement);
      },
    };
  };

  createSettingsGPUUsage = (name: string, index: number, moreThanOneGPU: boolean): void => {
    if (name === undefined || index === undefined) {
      console.warn('getGPUsFromServer: name or index undefined', name, index);
      return;
    }

    let label = 'GPU ';
    label += moreThanOneGPU ? index : '';

    const monitorGPUNElement: TMonitorSettings = {
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
      // @ts-ignore
      onChange: async(value: boolean): Promise<void> => {
        await this.updateServerGPU(index, {utilization: value});
        this.updateWidget(monitorGPUNElement);
      },
    };

    this.monitorGPUSettings[index] = monitorGPUNElement;
    app.ui.settings.addSetting(this.monitorGPUSettings[index]);
    this.monitorUI.createDOMGPUMonitor(this.monitorGPUSettings[index]);
  };

  createSettingsGPUVRAM = (name: string, index: number, moreThanOneGPU: boolean): void => {
    if (name === undefined || index === undefined) {
      console.warn('getGPUsFromServer: name or index undefined', name, index);
      return;
    }

    let label = 'VRAM ';
    label += moreThanOneGPU ? index : '';

    // GPU VRAM Variables
    const monitorVRAMNElement: TMonitorSettings = {
      id: 'UsageMonitor.ShowGpuVram' + convertNumberToPascalCase(index),
      name: this.translate('VRAM') + this.translate('Usage2'),
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
      // @ts-ignore
      onChange: async(value: boolean): Promise<void> => {
        await this.updateServerGPU(index, {vram: value});
        this.updateWidget(monitorVRAMNElement);
      },
    };

    this.monitorVRAMSettings[index] = monitorVRAMNElement;
    app.ui.settings.addSetting(this.monitorVRAMSettings[index]);
    this.monitorUI.createDOMGPUMonitor(this.monitorVRAMSettings[index]);
  };

  createSettingsGPUTemp = (name: string, index: number, moreThanOneGPU: boolean): void => {
    if (name === undefined || index === undefined) {
      console.warn('getGPUsFromServer: name or index undefined', name, index);
      return;
    }

    let label = 'Temp ';
    label += moreThanOneGPU ? index : '';

    // GPU Temperature Variables
    const monitorTemperatureNElement: TMonitorSettings = {
      id: 'UsageMonitor.ShowGpuTemperature' + convertNumberToPascalCase(index),
      name: this.translate('Temperature'),
      category: [this.translate('UsageMonitor'), `GPU ${index} - ${name}`, 'Temperature'],
      type: 'boolean',
      label: label,
      symbol: '°C',
      monitorTitle: `${index}: ${name}`,
      defaultValue: true,
      htmlMonitorRef: undefined,
      htmlMonitorSliderRef: undefined,
      htmlMonitorLabelRef: undefined,
      cssColor: Colors.TEMP_START,
      cssColorFinal: Colors.TEMP_END,
      // @ts-ignore
      onChange: async(value: boolean): Promise<void> => {
        await this.updateServerGPU(index, {temperature: value});
        this.updateWidget(monitorTemperatureNElement);
      },
    };

    this.monitorTemperatureSettings[index] = monitorTemperatureNElement;
    app.ui.settings.addSetting(this.monitorTemperatureSettings[index]);
    this.monitorUI.createDOMGPUMonitor(this.monitorTemperatureSettings[index]);
  };

  createSettingsHDD = (): void => {
    // HDD Variables
    this.monitorHDDElement = {
      id: 'UsageMonitor.ShowHdd',
      name: this.translate('Storage') + this.translate('Usage2'),
      category: [this.translate('UsageMonitor'), this.translate('Storage'), 'Show'],
      type: 'boolean',
      label: this.translate('Storage'),
      symbol: '%',
      // tooltip: 'See Partition to show (HDD)',
      defaultValue: false,
      htmlMonitorRef: undefined,
      htmlMonitorSliderRef: undefined,
      htmlMonitorLabelRef: undefined,
      cssColor: Colors.DISK,
      // @ts-ignore
      onChange: async(value: boolean): Promise<void> => {
        await this.updateServer({switchHDD: value});
        this.updateWidget(this.monitorHDDElement);
      },
    };

    this.settingsHDD = {
      id: 'UsageMonitor.WhichHdd',
      name: this.translate('Partition to show'),
      category: [this.translate('UsageMonitor'), this.translate('Storage'), 'Which'],
      type: 'combo',
      defaultValue: '/',
      options: [],
      // @ts-ignore
      onChange: async(value: string): Promise<void> => {
        await this.updateServer({whichHDD: value});
        this.updateHDDLabel(value);
      },
    };
  };

  createSettings = (): void => {
    app.ui.settings.addSetting(this.settingsMonitorEnabled);
    app.ui.settings.addSetting(this.settingsRate);
    app.ui.settings.addSetting(this.settingsMonitorHeight);
    app.ui.settings.addSetting(this.settingsMonitorWidth);
    app.ui.settings.addSetting(this.settingsTextBold);
    app.ui.settings.addSetting(this.settingsTextOpacity);
    app.ui.settings.addSetting(this.settingsLabelFontSize);
    app.ui.settings.addSetting(this.settingsHideNumber);
    app.ui.settings.addSetting(this.settingsValueFontSize);
    // app.ui.settings.addSetting(this.settingsMonitorPosition);
    app.ui.settings.addSetting(this.monitorRAMElement);

    // Storage section (between Hardware and CPU)
    app.ui.settings.addSetting(this.settingsHDD);
    app.ui.settings.addSetting(this.monitorHDDElement);
    void this.getHDDsFromServer().then((data: string[]): void => {
      // @ts-ignore
      this.settingsHDD.options = data;
      this.updateHDDLabel();
    });

    app.ui.settings.addSetting(this.monitorCPUElement);

    void this.getGPUsFromServer().then((gpus: TGpuName[]): void => {
      let moreThanOneGPU = false;
      if (gpus.length > 1) {
        moreThanOneGPU = true;
      }

      gpus?.forEach(({name, index}) => {
        this.createSettingsGPUTemp(name, index, moreThanOneGPU);
        this.createSettingsGPUVRAM(name, index, moreThanOneGPU);
        this.createSettingsGPUUsage(name, index, moreThanOneGPU);
      });

      this.finishedLoad();
    });
  };

  finishedLoad = (): void => {
    this.monitorUI.orderMonitors();
    this.updateAllWidget();
    this.moveMonitor(this.menuDisplayOption);

    this.updateMonitorStyle();
    this.updateHDDLabel();

    const enabled = Boolean(app.extensionManager.setting.get(this.monitorEnabledId));
    if (!enabled) {
      this.updateServerMonitor(false).catch((error) => {
        console.error('UsageMonitor: failed to stop monitor', error);
      });
    }
    this.setMonitorEnabled(enabled);
  };

  updateMonitorStyle = (overrides?: {textBold?: boolean, hideNumber?: boolean}): void => {
    if (!this.monitorUI) {
      return;
    }
    const w = app.extensionManager.setting.get(this.monitorWidthId);
    const h = app.extensionManager.setting.get(this.monitorHeightId);
    const labelFontSize = app.extensionManager.setting.get(this.labelFontSizeId);
    const valueFontSize = app.extensionManager.setting.get(this.valueFontSizeId);
    const textOpacity = app.extensionManager.setting.get(this.textOpacityId);
    const textBold = overrides?.textBold !== undefined
      ? overrides.textBold
      : Boolean(app.extensionManager.setting.get(this.textBoldId));
    const hideNumber = overrides?.hideNumber !== undefined
      ? overrides.hideNumber
      : Boolean(app.extensionManager.setting.get(this.hideNumberId));
    this.monitorUI.updateMonitorStyle(w, h, labelFontSize, valueFontSize, textOpacity, textBold, hideNumber);
  };

  updateDisplay = (value: MenuDisplayOptions): void => {
    if (value !== this.menuDisplayOption) {
      this.menuDisplayOption = value;
      this.moveMonitor(this.menuDisplayOption);
    }
  };

  moveMonitor = (menuPosition: MenuDisplayOptions): void => {
    // console.log('moveMonitor', menuPosition);
    // setTimeout(() => {
      let parentElement: Element | null | undefined;

      switch (menuPosition) {
        case MenuDisplayOptions.Disabled:
          parentElement = document.getElementById('queue-button');
          if (parentElement && this.monitorUI.rootElement) {
            parentElement.insertAdjacentElement('afterend', this.usagemonitorButtonGroup.element);
          } else {
            console.error('UsageMonitor: parentElement to move monitors not found!', parentElement);
          }
          break;

        case MenuDisplayOptions.Top:
        case MenuDisplayOptions.Bottom:
          // const position = app.extensionManager.setting.get(this.monitorPositionId);
          // if(position === MonitorPosition.Top) {
            app.menu?.settingsGroup.element.before(this.usagemonitorButtonGroup.element);
          // } else {
          //   parentElement = document.getElementsByClassName('comfy-vue-side-bar-header')[0];
          //   if(parentElement){
          //     parentElement.insertBefore(this.usagemonitorButtonGroup.element, parentElement.firstChild);
          //   } else {
          //     console.error('UsageMonitor: parentElement to move monitors not found! back to top');
          //     app.ui.settings.setSettingValue(this.monitorPositionId, MonitorPoistion.Top);
          //   }
          // }
      }
    // }, 100);
  };

  updateAllWidget = (): void => {
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
  };

  /**
   * for the settings menu
   * @param monitorSettings
   */
  updateWidget = (monitorSettings: TMonitorSettings): void => {
    if (this.monitorUI) {
      const value = app.extensionManager.setting.get(monitorSettings.id);
      this.monitorUI.showMonitor(monitorSettings, value);
    }
  };

  updateHDDLabel = (partition?: string): void => {
    // Show the watched partition name directly on the storage capsule.
    const text = partition
      || app.extensionManager.setting.get(this.settingsHDD.id)
      || this.translate('Storage');
    if (this.monitorHDDElement?.htmlMonitorRef) {
      const textElement = this.monitorHDDElement.htmlMonitorRef.querySelector('.usagemonitor-text');
      if (textElement) {
        textElement.textContent = text;
      }
    }
  };

  updateServer = async(data: TStatsSettings): Promise<string> => {
    const resp = await api.fetchApi('/usagemonitor/monitor', {
      method: 'PATCH',
      body: JSON.stringify(data),
      cache: 'no-store',
    });
    if (resp.status === 200) {
      return await resp.text();
    }
    throw new Error(resp.statusText);
  };

  updateServerMonitor = async(monitor: boolean): Promise<string> => {
    const resp = await api.fetchApi('/usagemonitor/monitor/switch', {
      method: 'POST',
      body: JSON.stringify({monitor}),
      cache: 'no-store',
    });
    if (resp.status === 200) {
      return await resp.text();
    }
    throw new Error(resp.statusText);
  };

  getSettingsLookup = (): any => {
    const settingsDialog: any = app.ui.settings;
    return settingsDialog?.settingsLookup ?? settingsDialog?.settingsParamLookup;
  };

  setMonitorsVisible = (enabled: boolean): void => {
    // Hide/show the monitor capsules (root element of all monitors).
    if (this.usagemonitorButtonGroup?.element) {
      this.usagemonitorButtonGroup.element.style.display = enabled ? '' : 'none';
    }
  };

  setMonitorEnabled = (enabled: boolean): void => {
    this.setMonitorsVisible(enabled);
    const lookup = this.getSettingsLookup();
    if (!lookup) {
      return;
    }
    for (const id of Object.keys(lookup)) {
      if (id === this.monitorEnabledId || !id.startsWith('UsageMonitor.')) {
        continue;
      }
      const setting = lookup[id];
      if (!setting) {
        continue;
      }
      if (enabled) {
        this.restoreSettingType(id, setting);
      } else {
        this.hideSetting(id, setting);
      }
    }
  };

  restoreSettingType = (id: string, setting: any): void => {
    const original = this.originalSettingTypes[id];
    if (original !== undefined) {
      setting.type = original;
      delete this.originalSettingTypes[id];
    } else if (setting.type === 'hidden') {
      delete setting.type;
    }
  };

  hideSetting = (id: string, setting: any): void => {
    if (this.originalSettingTypes[id] === undefined) {
      this.originalSettingTypes[id] = setting.type;
    }
    setting.type = 'hidden';
  };

  updateServerGPU = async(index: number, data: TGpuSettings): Promise<string> => {
    const resp = await api.fetchApi(`/usagemonitor/monitor/GPU/${index}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      cache: 'no-store',
    });
    if (resp.status === 200) {
      return await resp.text();
    }
    throw new Error(resp.statusText);
  };

  getHDDsFromServer = async(): Promise<string[]> => {
    return this.getDataFromServer('HDD');
  };

  getGPUsFromServer = async(): Promise<TGpuName[]> => {
    return this.getDataFromServer<TGpuName>('GPU');
  };

  getCPUFromServer = async (): Promise<void> => {
    const resp = await api.fetchApi('/usagemonitor/monitor/CPU', {
      cache: 'no-store',
    });
    if (resp.status === 200) {
      const data = await resp.json();
      if (data?.name) {
        this.cpuName = data.name;
      }
    }
  };

  getDataFromServer = async <T>(what: string): Promise<T[]> => {
    const resp = await api.fetchApi(`/usagemonitor/monitor/${what}`, {
      method: 'GET',
      cache: 'no-store',
    });
    if (resp.status === 200) {
      return await resp.json();
    }
    throw new Error(resp.statusText);
  };

  setup = async (): Promise<void> => {
    if (this.monitorUI) {
      return;
    }
    // Load translations from the server (Python i18n)
    try {
      await this.getTranslationsFromServer();
    } catch (error) {
      console.error('UsageMonitor: failed to load translations', error);
    }
    // Load the CPU name before creating the CPU settings.
    try {
      await this.getCPUFromServer();
    } catch (error) {
      console.error('UsageMonitor: failed to load CPU name', error);
    }
    // this.createSettingsMonitorPosition();
    this.createSettingsMonitorEnabled();
    this.createSettingsRate();
    this.createSettingsMonitorHeight();
    this.createSettingsMonitorWidth();
    this.createSettingsFontSize();
    this.createSettingsTextBold();
    this.createSettingsHideNumber();
    this.createSettingsCPU();
    this.createSettingsCPUTemp();
    this.createSettingsRAM();
    this.createSettingsHDD();
    this.createSettings();

    const currentRate =
      parseFloat(app.extensionManager.setting.get(this.settingsRate.id));

    this.menuDisplayOption = app.extensionManager.setting.get(ComfyKeyMenuDisplayOption);
    app.ui.settings.addEventListener(`${ComfyKeyMenuDisplayOption}.change`, (e: any) => {
        this.updateDisplay(e.detail.value);
      },
    );

    this.usagemonitorButtonGroup = new ComfyButtonGroup();
    app.menu?.settingsGroup.element.before(this.usagemonitorButtonGroup.element);

    this.monitorUI = new MonitorUI(
      this.usagemonitorButtonGroup.element,
      this.monitorCPUElement,
      this.monitorRAMElement,
      this.monitorHDDElement,
      this.monitorCPUTempElement,
      this.monitorGPUSettings,
      this.monitorVRAMSettings,
      this.monitorTemperatureSettings,
      currentRate,
      this.translate,
    );

    this.updateDisplay(this.menuDisplayOption);
    this.registerListeners();
  };

  registerListeners = (): void => {
    api.addEventListener('usagemonitor.monitor', (event: CustomEvent) => {
      if (event?.detail === undefined) {
        return;
      }
      this.monitorUI.updateDisplay(event.detail);
    }, false);
  };
}

const usagemonitorMonitor = new UsageMonitorMonitor();
app.registerExtension({
  name: usagemonitorMonitor.idExtensionName,
  setup: usagemonitorMonitor.setup,
});
