import { app, TLGraphNode, ComfyApp } from './comfy/index.js';
import type { ComfyNode } from './comfy/index.js';
import { displayContext } from './common.js';

const usagemonitorExtensionsSerialized: Record<string, string> = {
  // 'External parameter from JSON file [UsageMonitor]': 'UsageMonitor.Utils.ExternalParameterFromJson',
  'Read JSON file [UsageMonitor]': 'UsageMonitor.Utils.ReadJsonFile',
  'JSON extractor [UsageMonitor]': 'UsageMonitor.Utils.JsonExtractor',
};

const usagemonitorExtensions: Record<string, string> = {
  'Get resolution [UsageMonitor]': 'UsageMonitor.Image.GetResolution',
  'Preview from image [UsageMonitor]': 'UsageMonitor.Image.PreviewFromImage',
  'Preview from metadata [UsageMonitor]': 'UsageMonitor.Image.PreviewFromMetadata',
  'Metadata comparator [UsageMonitor]': 'UsageMonitor.Metadata.MetadataComparator',
  'Stats system [UsageMonitor]': 'UsageMonitor.Utils.StatsSystem',
  'Show any to JSON [UsageMonitor]': 'UsageMonitor.Debugger.ConsoleAnyToJson',
};

Object.keys(usagemonitorExtensionsSerialized).forEach(prop => {
  // @ts-ignore
  usagemonitorExtensions[prop] = usagemonitorExtensionsSerialized[prop];
});

Object.keys(usagemonitorExtensions).forEach(key => {
  app.registerExtension({
    name: usagemonitorExtensions[key],
    beforeRegisterNodeDef(nodeType: ComfyNode, nodeData: TLGraphNode, appFromArg: ComfyApp) {
      if (nodeData.name === key) {
        if (nodeData.name in usagemonitorExtensionsSerialized) {
          displayContext(nodeType, appFromArg, 0, true); // serialize_widgets = true
        } else {
          displayContext(nodeType, appFromArg, 0);
        }
      }
    },
  });
});
