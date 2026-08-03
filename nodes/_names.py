from enum import Enum

prefix = '🪛 '

# IMPORTANT DON'T CHANGE THE 'NAME' AND 'TYPE' OF THE ENUMS, IT WILL BREAK THE COMPATIBILITY!
# remember: NAME is for search, DESC is for contextual
class CLASSES(Enum):
    CBOOLEAN_NAME = 'Primitive boolean [UsageMonitor]'
    CBOOLEAN_DESC = prefix + 'Primitive boolean'
    CTEXT_NAME = 'Primitive string [UsageMonitor]'
    CTEXT_DESC = prefix + 'Primitive string'
    CTEXTML_NAME = 'Primitive string multiline [UsageMonitor]'
    CTEXTML_DESC = prefix + 'Primitive string multiline'
    CINTEGER_NAME = 'Primitive integer [UsageMonitor]'
    CINTEGER_DESC = prefix + 'Primitive integer'
    CFLOAT_NAME = 'Primitive float [UsageMonitor]'
    CFLOAT_DESC = prefix + 'Primitive float'

    CDEBUGGER_CONSOLE_ANY_NAME = 'Show any [UsageMonitor]'
    CDEBUGGER_ANY_DESC = prefix + 'Show any value to console/display'
    CDEBUGGER_CONSOLE_ANY_TO_JSON_NAME = 'Show any to JSON [UsageMonitor]'
    CDEBUGGER_CONSOLE_ANY_TO_JSON_DESC = prefix + 'Show any to JSON'

    CLIST_ANY_TYPE = 'ListAny'
    CLIST_ANY_NAME = 'List of any [UsageMonitor]'
    CLIST_ANY_DESC = prefix + 'List of any'
    CLIST_STRING_TYPE = 'ListString'
    CLIST_STRING_NAME = 'List of strings [UsageMonitor]'
    CLIST_STRING_DESC = prefix + 'List of strings'

    CSWITCH_FROM_ANY_NAME = 'Switch from any [UsageMonitor]'
    CSWITCH_FROM_ANY_DESC = prefix + 'Switch from any'
    CSWITCH_ANY_NAME = 'Switch any [UsageMonitor]'
    CSWITCH_ANY_DESC = prefix + 'Switch any'
    CSWITCH_STRING_NAME = 'Switch string [UsageMonitor]'
    CSWITCH_STRING_DESC = prefix + 'Switch string'
    CSWITCH_CONDITIONING_NAME = 'Switch conditioning [UsageMonitor]'
    CSWITCH_CONDITIONING_DESC = prefix + 'Switch conditioning'
    CSWITCH_IMAGE_NAME = 'Switch image [UsageMonitor]'
    CSWITCH_IMAGE_DESC = prefix + 'Switch image'
    CSWITCH_MASK_NAME = 'Switch mask [UsageMonitor]'
    CSWITCH_MASK_DESC = prefix + 'Switch mask'
    CSWITCH_LATENT_NAME = 'Switch latent [UsageMonitor]'
    CSWITCH_LATENT_DESC = prefix + 'Switch latent'

    CPIPE_ANY_TYPE = 'CPipeAny'
    CPIPE_TO_ANY_NAME = 'Pipe to/edit any [UsageMonitor]'
    CPIPE_TO_ANY_DESC = prefix + 'Pipe to/edit any'
    CPIPE_FROM_ANY_NAME = 'Pipe from any [UsageMonitor]'
    CPIPE_FROM_ANY_DESC = prefix + 'Pipe from any'

    CIMAGE_LOAD_METADATA_NAME = 'Load image with metadata [UsageMonitor]'
    CIMAGE_LOAD_METADATA_DESC = prefix + 'Load image with metadata'
    CIMAGE_GET_RESOLUTION_NAME = 'Get resolution [UsageMonitor]'
    CIMAGE_GET_RESOLUTION_DESC = prefix + 'Get resolution'
    CIMAGE_PREVIEW_IMAGE_NAME = 'Preview from image [UsageMonitor]'
    CIMAGE_PREVIEW_IMAGE_DESC = prefix + 'Preview from image'
    CIMAGE_PREVIEW_METADATA_NAME = 'Preview from metadata [UsageMonitor]'
    CIMAGE_PREVIEW_METADATA_DESC = prefix + 'Preview from metadata'
    CIMAGE_SAVE_METADATA_NAME = 'Save image with extra metadata [UsageMonitor]'
    CIMAGE_SAVE_METADATA_DESC = prefix + 'Save image with extra metadata'

    CMETADATA_EXTRACTOR_NAME = 'Metadata extractor [UsageMonitor]'
    CMETADATA_EXTRACTOR_DESC =  prefix + 'Metadata extractor'
    CMETADATA_COMPARATOR_NAME = 'Metadata comparator [UsageMonitor]'
    CMETADATA_COMPARATOR_DESC = prefix + 'Metadata comparator'

    CUTILS_JSON_COMPARATOR_NAME = 'JSON comparator [UsageMonitor]'
    CUTILS_JSON_COMPARATOR_DESC = prefix + 'JSON comparator'
    CUTILS_STAT_SYSTEM_NAME = 'Stats system [UsageMonitor]'
    CUTILS_STAT_SYSTEM_DESC = prefix + 'Stats system (powered by WAS)'

    # CPARAMETERS_NAME = 'External parameter from JSON file [UsageMonitor]'
    # CPARAMETERS_DESC = prefix + 'External parameters from JSON file'

    CJSONFILE_NAME = 'Read JSON file [UsageMonitor]'
    CJSONFILE_DESC = prefix + 'Read JSON file (BETA)'

    CJSONEXTRACTOR_NAME = 'JSON extractor [UsageMonitor]'
    CJSONEXTRACTOR_DESC = prefix + 'JSON extractor (BETA)'
