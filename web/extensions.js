import { app } from './comfy/index.js';
import { displayContext } from './common.js';
const usagemonitorExtensionsSerialized = {
    'Read JSON file [UsageMonitor]': 'UsageMonitor.Utils.ReadJsonFile',
    'JSON extractor [UsageMonitor]': 'UsageMonitor.Utils.JsonExtractor',
};
const usagemonitorExtensions = {
    'Get resolution [UsageMonitor]': 'UsageMonitor.Image.GetResolution',
    'Preview from image [UsageMonitor]': 'UsageMonitor.Image.PreviewFromImage',
    'Preview from metadata [UsageMonitor]': 'UsageMonitor.Image.PreviewFromMetadata',
    'Metadata comparator [UsageMonitor]': 'UsageMonitor.Metadata.MetadataComparator',
    'Stats system [UsageMonitor]': 'UsageMonitor.Utils.StatsSystem',
    'Show any to JSON [UsageMonitor]': 'UsageMonitor.Debugger.ConsoleAnyToJson',
};
Object.keys(usagemonitorExtensionsSerialized).forEach(prop => {
    usagemonitorExtensions[prop] = usagemonitorExtensionsSerialized[prop];
});
Object.keys(usagemonitorExtensions).forEach(key => {
    app.registerExtension({
        name: usagemonitorExtensions[key],
        beforeRegisterNodeDef(nodeType, nodeData, appFromArg) {
            if (nodeData.name === key) {
                if (nodeData.name in usagemonitorExtensionsSerialized) {
                    displayContext(nodeType, appFromArg, 0, true);
                }
                else {
                    displayContext(nodeType, appFromArg, 0);
                }
            }
        },
    });
});
