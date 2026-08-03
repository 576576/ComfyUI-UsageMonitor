import { app, api, ComfyButtonGroup } from './comfy/index.js';
import { commonPrefix } from './common.js';
import { MonitorUI } from './monitorUI.js';
import { Colors } from './styles.js';
import { convertNumberToPascalCase } from './utils.js';
import { ComfyKeyMenuDisplayOption, MenuDisplayOptions } from './progressBarUIBase.js';

// enum MonitorPosition {
//   'Top' = 'Top',
//   'Sidebar' = 'Sidebar',
//   'Floating' = 'Floating',
// }

class UsageMonitorMonitor {
  readonly idExtensionName = 'UsageMonitor.monitor';
  private readonly menuPrefix = commonPrefix;
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

  // private readonly monitorPositionId = 'UsageMonitor.MonitorPosition';
  private readonly monitorWidthId = 'UsageMonitor.MonitorWidth';
  private readonly monitorWidth = 60;
  private readonly monitorHeightId = 'UsageMonitor.MonitorHeight';
  private readonly monitorHeight = 30;

  // NO POSIBLE TO IMPLEMENT INSIDE THE PANEL
  // createSettingsMonitorPosition = (): void => {
  //   const position = app.extensionManager.setting.get(this.monitorPositionId);
  //   console.log('position', position);
  //   this.settingsMonitorPosition = {
  //     id: this.monitorPositionId,
  //     name: 'Position (floating not implemented yet)',
  //     category: ['UsageMonitor', this.menuPrefix + ' Configuration', 'position'],
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

  createSettingsRate = (): void => {
    this.settingsRate = {
      id: 'UsageMonitor.RefreshRate',
      name: 'Refresh per second',
      category: ['UsageMonitor', this.menuPrefix + ' Configuration', 'refresh'],
      tooltip: 'This is the time (in seconds) between each update of the monitors, 0 means no refresh',
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
      name: 'Pixel Width',
      category: ['UsageMonitor', this.menuPrefix + ' Configuration', 'width'],
      tooltip: 'The width of the monitor in pixels on the UI (only on top/bottom UI)',
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

        const h = app.extensionManager.setting.get(this.monitorHeightId);
        this.monitorUI?.updateMonitorSize(valueNumber, h);
      },
    };
  };

  createSettingsMonitorHeight = (): void => {
    this.settingsMonitorHeight = {
      id: this.monitorHeightId,
      name: 'Pixel Height',
      category: ['UsageMonitor', this.menuPrefix + ' Configuration', 'height'],
      tooltip: 'The height of the monitor in pixels on the UI (only on top/bottom UI)',
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

        const w = await app.extensionManager.setting.get(this.monitorWidthId);
        this.monitorUI?.updateMonitorSize(w, valueNumber);
      },
    };
  };

  createSettingsCPU = (): void => {
    // CPU Variables
    this.monitorCPUElement = {
      id: 'UsageMonitor.ShowCpu',
      name: 'CPU Usage',
      category: ['UsageMonitor', this.menuPrefix + ' Hardware', 'Cpu'],
      type: 'boolean',
      label: 'CPU',
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

  createSettingsRAM = (): void => {
    // RAM Variables
    this.monitorRAMElement = {
      id: 'UsageMonitor.ShowRam',
      name: 'RAM Used',
      category: ['UsageMonitor', this.menuPrefix + ' Hardware', 'Ram'],
      type: 'boolean',
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
      name: ' Usage',
      category: ['UsageMonitor', `${this.menuPrefix} Show GPU [${index}] ${name}`, 'Usage'],
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
      name: 'VRAM',
      category: ['UsageMonitor', `${this.menuPrefix} Show GPU [${index}] ${name}`, 'VRAM'],
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
      name: 'Temperature',
      category: ['UsageMonitor', `${this.menuPrefix} Show GPU [${index}] ${name}`, 'Temperature'],
      type: 'boolean',
      label: label,
      symbol: '°',
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
      name: 'Show HDD Used',
      category: ['UsageMonitor', this.menuPrefix + ' Show Hard Disk', 'Show'],
      type: 'boolean',
      label: 'HDD',
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
      name: 'Partition to show',
      category: ['UsageMonitor', this.menuPrefix + ' Show Hard Disk', 'Which'],
      type: 'combo',
      defaultValue: '/',
      options: [],
      // @ts-ignore
      onChange: async(value: string): Promise<void> => {
        await this.updateServer({whichHDD: value});
      },
    };
  };

  createSettings = (): void => {
    app.ui.settings.addSetting(this.settingsRate);
    app.ui.settings.addSetting(this.settingsMonitorHeight);
    app.ui.settings.addSetting(this.settingsMonitorWidth);
    // app.ui.settings.addSetting(this.settingsMonitorPosition);
    app.ui.settings.addSetting(this.monitorRAMElement);
    app.ui.settings.addSetting(this.monitorCPUElement);

    void this.getHDDsFromServer().then((data: string[]): void => {
      // @ts-ignore
      this.settingsHDD.options = data;
      app.ui.settings.addSetting(this.settingsHDD);
    });
    app.ui.settings.addSetting(this.monitorHDDElement);

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

    const w = app.extensionManager.setting.get(this.monitorWidthId);
    const h = app.extensionManager.setting.get(this.monitorHeightId);
    this.monitorUI.updateMonitorSize(w, h);
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

  setup = (): void => {
    if (this.monitorUI) {
      return;
    }
    // this.createSettingsMonitorPosition();
    this.createSettingsRate();
    this.createSettingsMonitorHeight();
    this.createSettingsMonitorWidth();
    this.createSettingsCPU();
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
      this.monitorGPUSettings,
      this.monitorVRAMSettings,
      this.monitorTemperatureSettings,
      currentRate,
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
