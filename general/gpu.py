import torch
import comfy.model_management
from ..core import logger
import os
import platform

def is_jetson() -> bool:
    """
    Determines if the Python environment is running on a Jetson device by checking the device model
    information or the platform release.
    """
    PROC_DEVICE_MODEL = ''
    try:
        with open('/proc/device-tree/model', 'r') as f:
            PROC_DEVICE_MODEL = f.read().strip()
            logger.info(f"Device model: {PROC_DEVICE_MODEL}")
            return "NVIDIA" in PROC_DEVICE_MODEL
    except Exception as e:
        # logger.warning(f"JETSON: Could not read /proc/device-tree/model: {e} (If you're not using Jetson, ignore this warning)")
        # If /proc/device-tree/model is not available, check platform.release()
        platform_release = platform.release()
        logger.info(f"Platform release: {platform_release}")
        if 'tegra' in platform_release.lower():
            logger.info("Detected 'tegra' in platform release. Assuming Jetson device.")
            return True
        else:
            logger.info("JETSON: Not detected.")
            return False

IS_JETSON = is_jetson()

class CGPUInfo:
    """
    This class is responsible for getting information from GPU (ONLY).
    """
    cuda = False
    pynvmlLoaded = False
    adlxLoaded = False
    jtopLoaded = False
    cudaAvailable = False
    torchDevice = 'cpu'
    cudaDevice = 'cpu'
    cudaDevicesFound = 0
    switchGPU = True
    switchVRAM = True
    switchTemperature = True
    gpus = []
    gpusUtilization = []
    gpusVRAM = []
    gpusTemperature = []

    def __init__(self):
        if IS_JETSON:
            # Try to import jtop for Jetson devices
            try:
                from jtop import jtop
                self.jtopInstance = jtop()
                self.jtopInstance.start()
                self.jtopLoaded = True
                logger.info('jtop initialized on Jetson device.')
            except ImportError as e:
                logger.error('jtop is not installed. ' + str(e))
            except Exception as e:
                logger.error('Could not initialize jtop. ' + str(e))
        else:
            # Try to import NVIDIA (nvidia-ml-py, module name pynvml) for non-Jetson devices
            try:
                import pynvml
                self.pynvml = pynvml
                self.pynvml.nvmlInit()
                self.pynvmlLoaded = True
                logger.info('nvidia-ml-py (pynvml, NVIDIA) initialized.')
            except ImportError as e:
                logger.warning('nvidia-ml-py (pynvml) is not installed. ' + str(e))
            except Exception as e:
                logger.warning('Could not init nvidia-ml-py (pynvml, NVIDIA). ' + str(e))

            # Try to import ADLX (adlxpybind) for AMD devices on Windows (only if NVIDIA failed)
            if not self.pynvmlLoaded:
                try:
                    import ADLXPybind as adlx
                    self.adlx = adlx
                    self._adlx_helper = adlx.ADLXHelper()
                    res = self._adlx_helper.Initialize()
                    if res != adlx.ADLX_RESULT.ADLX_OK:
                        raise Exception(f'ADLX initialization failed: {res}')
                    self._adlx_system = self._adlx_helper.GetSystemServices()
                    if not self._adlx_system:
                        raise Exception('Failed to get ADLX system services')
                    self._adlx_gpu_holder = adlx.ADLXGPUHolder(self._adlx_system)
                    if not self._adlx_gpu_holder.isValid():
                        raise Exception('Failed to create ADLX GPU holder')
                    self._adlx_gpu_list = self._adlx_gpu_holder.getGPUList()
                    if not self._adlx_gpu_list:
                        raise Exception('Failed to get ADLX GPU list')
                    self._adlx_perf_monitoring = self._adlx_system.GetPerformanceMonitoringServices()
                    self._adlx_vram_ranges = {}
                    self._adlx_vram_cache_populated = False
                    self._cache_adlx_vram_ranges()
                    self.adlxLoaded = True
                    logger.info('ADLX (AMD) initialized.')
                except ImportError as e:
                    logger.error('ADLXPybind (adlxpybind) is not installed, falling back to next backend. ' + str(e))
                except Exception as e:
                    logger.error('Could not init ADLX (AMD), falling back to next backend. ' + str(e))

        self.anygpuLoaded = self.pynvmlLoaded or self.adlxLoaded or self.jtopLoaded

        try:
            self.torchDevice = comfy.model_management.get_torch_device_name(comfy.model_management.get_torch_device())
        except Exception as e:
            logger.error('Could not pick default device. ' + str(e))

        if not self.jtopLoaded and not self.deviceGetCount():
            logger.warning('No GPU detected, disabling GPU monitoring.')
            self.anygpuLoaded = False
            self.pynvmlLoaded = False
            self.adlxLoaded = False
            self.jtopLoaded = False

        if self.anygpuLoaded:
            if self.deviceGetCount() > 0:
                self.cudaDevicesFound = self.deviceGetCount()

                logger.info(f"GPU/s:")

                for deviceIndex in range(self.cudaDevicesFound):
                    deviceHandle = self.deviceGetHandleByIndex(deviceIndex)

                    gpuName = self.deviceGetName(deviceHandle, deviceIndex)

                    logger.info(f"{deviceIndex}) {gpuName}")

                    self.gpus.append({
                        'index': deviceIndex,
                        'name': gpuName,
                    })

                    # Same index as gpus, with default values
                    self.gpusUtilization.append(True)
                    self.gpusVRAM.append(True)
                    self.gpusTemperature.append(True)

                self.cuda = True
                logger.info(self.systemGetDriverVersion())
            else:
                logger.warning('No GPU with CUDA detected.')
        else:
            logger.warning('No GPU monitoring libraries available.')

        self.cudaDevice = 'cpu' if self.torchDevice == 'cpu' else 'cuda'
        self.cudaAvailable = torch.cuda.is_available()

        if self.cuda and self.cudaAvailable and self.torchDevice == 'cpu':
            logger.warning('CUDA is available, but torch is using CPU.')

    def getInfo(self):
        logger.debug('Getting GPUs info...')
        return self.gpus

    def getStatus(self):
        gpuUtilization = -1
        gpuTemperature = -1
        vramUsed = -1
        vramTotal = -1
        vramPercent = -1

        gpuType = ''
        gpus = []

        if self.cudaDevice == 'cpu':
            gpuType = 'cpu'
            gpus.append({
                'gpu_utilization': -1,
                'gpu_temperature': -1,
                'vram_total': -1,
                'vram_used': -1,
                'vram_used_percent': -1,
            })
        else:
            gpuType = self.cudaDevice

            if self.anygpuLoaded and self.cuda and self.cudaAvailable:
                for deviceIndex in range(self.cudaDevicesFound):
                    deviceHandle = self.deviceGetHandleByIndex(deviceIndex)

                    gpuUtilization = -1
                    vramPercent = -1
                    vramUsed = -1
                    vramTotal = -1
                    gpuTemperature = -1

                    # GPU Utilization
                    if self.switchGPU and self.gpusUtilization[deviceIndex]:
                        try:
                            gpuUtilization = self.deviceGetUtilizationRates(deviceHandle)
                        except Exception as e:
                            logger.error('Could not get GPU utilization. ' + str(e))
                            logger.error('Monitor of GPU is turning off.')
                            self.switchGPU = False

                    if self.switchVRAM and self.gpusVRAM[deviceIndex]:
                        try:
                            memory = self.deviceGetMemoryInfo(deviceHandle)
                            vramUsed = memory['used']
                            vramTotal = memory['total']

                            # Check if vramTotal is not zero or None
                            if vramTotal and vramTotal != 0:
                                vramPercent = vramUsed / vramTotal * 100
                        except Exception as e:
                            logger.error('Could not get GPU memory info. ' + str(e))
                            self.switchVRAM = False

                    # Temperature
                    if self.switchTemperature and self.gpusTemperature[deviceIndex]:
                        try:
                            gpuTemperature = self.deviceGetTemperature(deviceHandle)
                        except Exception as e:
                            logger.error('Could not get GPU temperature. Turning off this feature. ' + str(e))
                            self.switchTemperature = False

                    gpus.append({
                        'gpu_utilization': gpuUtilization,
                        'gpu_temperature': gpuTemperature,
                        'vram_total': vramTotal,
                        'vram_used': vramUsed,
                        'vram_used_percent': vramPercent,
                    })

        return {
            'device_type': gpuType,
            'gpus': gpus,
        }

    def _adlx_get_gpu(self, index):
        """Get a fresh ADLX GPU object by index, or None."""
        if not self.adlxLoaded or not self._adlx_gpu_list:
            return None
        try:
            return self._adlx_gpu_list.At(index)
        except Exception:
            return None

    def _adlx_get_metrics(self, deviceHandle):
        """Get a fresh ADLX GPU object and its current metrics, or (None, None)."""
        if not self.adlxLoaded or not self._adlx_perf_monitoring:
            return None, None
        gpu = self._adlx_get_gpu(deviceHandle)
        if gpu is None:
            return None, None
        try:
            metrics = self._adlx_perf_monitoring.GetCurrentGPUMetrics(gpu)
            if metrics is None:
                return None, None
            return gpu, metrics
        except Exception:
            return None, None

    def _adlx_release(self, metrics):
        """Release ADLX metrics objects to avoid reference-counting issues."""
        try:
            if metrics is not None and hasattr(metrics, 'Release'):
                metrics.Release()
        except Exception:
            pass

    def _cache_adlx_vram_ranges(self):
        """Cache the total VRAM (in MB) for every GPU index during init."""
        if self._adlx_vram_cache_populated:
            return
        if not self._adlx_perf_monitoring or not self._adlx_gpu_list:
            return
        try:
            if hasattr(self._adlx_gpu_list, 'Size'):
                gpu_count = self._adlx_gpu_list.Size()
            elif hasattr(self._adlx_gpu_list, 'GetCount'):
                gpu_count = self._adlx_gpu_list.GetCount()
            else:
                gpu_count = 0
                try:
                    while True:
                        gpu = self._adlx_gpu_list.At(gpu_count)
                        if gpu is None:
                            break
                        del gpu
                        gpu_count += 1
                except Exception:
                    pass

            for i in range(gpu_count):
                try:
                    gpu = self._adlx_gpu_list.At(i)
                    if gpu:
                        support = self._adlx_perf_monitoring.GetSupportedGPUMetrics(gpu)
                        if support:
                            try:
                                _, max_vram_mb = support.GetGPUVRAMRange()
                                self._adlx_vram_ranges[i] = max_vram_mb
                            except Exception:
                                self._adlx_vram_ranges[i] = 0
                            try:
                                if hasattr(support, 'Release'):
                                    support.Release()
                            except Exception:
                                pass
                        else:
                            self._adlx_vram_ranges[i] = 0
                        del gpu
                    else:
                        self._adlx_vram_ranges[i] = 0
                except Exception:
                    self._adlx_vram_ranges[i] = 0
            self._adlx_vram_cache_populated = True
        except Exception as e:
            logger.debug('Could not cache ADLX VRAM ranges. ' + str(e))

    def deviceGetCount(self):
        """Number of detected GPUs. Falls back to the next backend when the current one fails."""
        if self.pynvmlLoaded:
            try:
                return self.pynvml.nvmlDeviceGetCount()
            except Exception as e:
                logger.error('nvidia-ml-py (pynvml) is not available, falling back to next backend. ' + str(e))
                self.pynvmlLoaded = False
        if self.adlxLoaded:
            try:
                if hasattr(self._adlx_gpu_list, 'Size'):
                    return self._adlx_gpu_list.Size()
                elif hasattr(self._adlx_gpu_list, 'GetCount'):
                    return self._adlx_gpu_list.GetCount()
                else:
                    count = 0
                    try:
                        while True:
                            gpu = self._adlx_gpu_list.At(count)
                            if gpu is None:
                                break
                            count += 1
                    except Exception:
                        pass
                    return count
            except Exception as e:
                logger.error('ADLX is not available, falling back to next backend. ' + str(e))
                self.adlxLoaded = False
        if self.jtopLoaded:
            # For Jetson devices, we assume there's one GPU
            return 1
        self.anygpuLoaded = self.pynvmlLoaded or self.adlxLoaded or self.jtopLoaded
        return 0

    def deviceGetHandleByIndex(self, index):
        """Handle for a GPU index. Falls back to the next backend when the current one fails."""
        if self.pynvmlLoaded:
            try:
                return self.pynvml.nvmlDeviceGetHandleByIndex(index)
            except Exception as e:
                logger.error('nvidia-ml-py (pynvml) is not available, falling back to next backend. ' + str(e))
                self.pynvmlLoaded = False
        if self.adlxLoaded:
            try:
                gpu = self._adlx_get_gpu(index)
                if gpu is None:
                    raise Exception(f'Failed to get GPU at index {index}')
                # index acts as the handle; fresh GPU objects are fetched per query
                return index
            except Exception as e:
                logger.error('ADLX is not available, falling back to next backend. ' + str(e))
                self.adlxLoaded = False
        if self.jtopLoaded:
            return index  # On Jetson, index acts as handle
        return 0

    def deviceGetName(self, deviceHandle, deviceIndex):
        if self.pynvmlLoaded:
            gpuName = 'Unknown GPU'

            try:
                gpuName = self.pynvml.nvmlDeviceGetName(deviceHandle)
                try:
                    gpuName = gpuName.decode('utf-8', errors='ignore')
                except AttributeError:
                    pass

            except Exception as e:
                gpuName = 'Unknown GPU'
                logger.error(f"Could not get GPU name: {e}")

            return gpuName
        elif self.adlxLoaded:
            try:
                gpu = self._adlx_get_gpu(deviceIndex)
                gpuName = 'Unknown GPU'
                if gpu is not None:
                    try:
                        gpuName = gpu.Name()
                    except Exception:
                        gpuName = 'Unknown GPU'
                return gpuName
            except Exception as e:
                logger.error('Could not get GPU name. ' + str(e))
                return 'Unknown GPU'
        elif self.jtopLoaded:
            # Access the GPU name from self.jtopInstance.gpu
            try:
                gpu_info = self.jtopInstance.gpu
                gpu_name = next(iter(gpu_info.keys()))
                return gpu_name
            except Exception as e:
                logger.error('Could not get GPU name. ' + str(e))
                return 'Unknown GPU'
        else:
            return ''

    def systemGetDriverVersion(self):
        if self.pynvmlLoaded:
            try:
                return f'NVIDIA Driver: {self.pynvml.nvmlSystemGetDriverVersion()}'
            except Exception as e:
                logger.error('Could not get NVIDIA driver version. ' + str(e))
                return 'NVIDIA Driver: unknown'
        elif self.adlxLoaded:
            try:
                if hasattr(self._adlx_system, 'GetDriverVersion'):
                    return f'AMD Driver: {self._adlx_system.GetDriverVersion()}'
                return 'AMD Driver: unknown'
            except Exception as e:
                logger.error('Could not get AMD driver version. ' + str(e))
                return 'AMD Driver: unknown'
        elif self.jtopLoaded:
            # No direct method to get driver version from jtop
            return 'NVIDIA Driver: unknown'
        else:
            return 'Driver unknown'

    def deviceGetUtilizationRates(self, deviceHandle):
        if self.pynvmlLoaded:
            try:
                return self.pynvml.nvmlDeviceGetUtilizationRates(deviceHandle).gpu
            except Exception as e:
                logger.error('Could not get GPU utilization. ' + str(e))
                return -1
        elif self.adlxLoaded:
            gpu, metrics = self._adlx_get_metrics(deviceHandle)
            if metrics is None:
                return -1
            try:
                return int(metrics.GPUUsage())
            except Exception as e:
                logger.error('Could not get GPU utilization. ' + str(e))
                return -1
            finally:
                self._adlx_release(metrics)
        elif self.jtopLoaded:
            # GPU utilization from jtop stats
            try:
                gpu_util = self.jtopInstance.stats.get('GPU', -1)
                return gpu_util
            except Exception as e:
                logger.error('Could not get GPU utilization. ' + str(e))
                return -1
        else:
            return 0

    def deviceGetMemoryInfo(self, deviceHandle):
        if self.pynvmlLoaded:
            try:
                mem = self.pynvml.nvmlDeviceGetMemoryInfo(deviceHandle)
                return {'total': mem.total, 'used': mem.used}
            except Exception as e:
                logger.error('Could not get GPU memory info. ' + str(e))
                return {'total': 0, 'used': 0}
        elif self.adlxLoaded:
            gpu, metrics = self._adlx_get_metrics(deviceHandle)
            if metrics is None:
                return {'total': 0, 'used': 0}
            try:
                used_memory = int(metrics.GPUVRAM()) * 1024 * 1024  # MB -> bytes
                max_vram_mb = self._adlx_vram_ranges.get(deviceHandle, 0)
                total_memory = int(max_vram_mb) * 1024 * 1024
                return {'total': total_memory, 'used': used_memory}
            except Exception as e:
                logger.error('Could not get GPU memory info. ' + str(e))
                return {'total': 0, 'used': 0}
            finally:
                self._adlx_release(metrics)
        elif self.jtopLoaded:
            mem_data = self.jtopInstance.memory['RAM']
            total = mem_data['tot']
            used = mem_data['used']
            return {'total': total, 'used': used}
        else:
            return {'total': 1, 'used': 1}

    def deviceGetTemperature(self, deviceHandle):
        if self.pynvmlLoaded:
            try:
                return self.pynvml.nvmlDeviceGetTemperature(deviceHandle, self.pynvml.NVML_TEMPERATURE_GPU)
            except Exception as e:
                logger.error('Could not get GPU temperature. ' + str(e))
                return -1
        elif self.adlxLoaded:
            gpu, metrics = self._adlx_get_metrics(deviceHandle)
            if metrics is None:
                return -1
            try:
                return int(metrics.GPUTemperature())
            except Exception as e:
                logger.error('Could not get GPU temperature. ' + str(e))
                return -1
            finally:
                self._adlx_release(metrics)
        elif self.jtopLoaded:
            try:
                temperature = self.jtopInstance.stats.get('Temp gpu', -1)
                return temperature
            except Exception as e:
                logger.error('Could not get GPU temperature. ' + str(e))
                return -1
        else:
            return 0

    def close(self):
        if self.pynvmlLoaded:
            try:
                self.pynvml.nvmlShutdown()
            except Exception as e:
                logger.error('Could not shut down nvidia-ml-py (pynvml). ' + str(e))
        if self.adlxLoaded:
            try:
                self._adlx_vram_ranges.clear()
                self._adlx_vram_cache_populated = False
                if self._adlx_helper is not None:
                    try:
                        self._adlx_helper.Terminate()
                    except Exception:
                        pass
                    self._adlx_helper = None
            except Exception as e:
                logger.error('Could not shut down ADLX (AMD). ' + str(e))
        if self.jtopLoaded and self.jtopInstance is not None:
            self.jtopInstance.close()
