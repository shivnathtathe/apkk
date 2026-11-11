package com.example.lumentorch.camera

import android.content.Context
import android.hardware.camera2.CameraAccessException
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.os.Build
import android.util.Log
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class TorchManager(private val context: Context) {

    private val tag = "TorchManager"
    private val cameraManager = context.getSystemService(Context.CAMERA_SERVICE) as CameraManager
    private val managerScope = CoroutineScope(Dispatchers.Default + SupervisorJob())
    private var strobeJob: Job? = null

    var rearCameraId: String? = null
        private set
    var maxStrengthLevel: Int = 1
        private set
    var defaultStrengthLevel: Int = 1
        private set
    var isMultiLevelSupported: Boolean = false
        private set

    private val _isTorchOn = MutableStateFlow(false)
    val isTorchOn: StateFlow<Boolean> = _isTorchOn.asStateFlow()

    private val _currentStrength = MutableStateFlow(1)
    val currentStrength: StateFlow<Int> = _currentStrength.asStateFlow()

    init {
        findCameraWithFlash()
        registerTorchCallback()
    }

    private fun findCameraWithFlash() {
        try {
            for (id in cameraManager.cameraIdList) {
                val characteristics = cameraManager.getCameraCharacteristics(id)
                val facing = characteristics.get(CameraCharacteristics.LENS_FACING)
                val hasFlash = characteristics.get(CameraCharacteristics.FLASH_INFO_AVAILABLE) ?: false

                if (facing == CameraCharacteristics.LENS_FACING_BACK && hasFlash) {
                    rearCameraId = id
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        maxStrengthLevel = characteristics.get(
                            CameraCharacteristics.FLASH_INFO_STRENGTH_MAXIMUM_LEVEL
                        ) ?: 1
                        defaultStrengthLevel = characteristics.get(
                            CameraCharacteristics.FLASH_INFO_STRENGTH_DEFAULT_LEVEL
                        ) ?: 1
                        isMultiLevelSupported = maxStrengthLevel > 1
                    }
                    break
                }
            }
        } catch (e: CameraAccessException) {
            Log.e(tag, "Camera access error", e)
        }
    }

    private fun registerTorchCallback() {
        cameraManager.registerTorchCallback(object : CameraManager.TorchCallback() {
            override fun onTorchModeChanged(cameraId: String, enabled: Boolean) {
                if (cameraId == rearCameraId) {
                    _isTorchOn.value = enabled
                }
            }

            override fun onTorchStrengthLevelChanged(cameraId: String, newStrengthLevel: Int) {
                if (cameraId == rearCameraId) {
                    _currentStrength.value = newStrengthLevel
                }
            }
        }, null)
    }

    fun setTorchBrightness(strengthLevel: Int) {
        val cameraId = rearCameraId ?: return
        val clampedLevel = strengthLevel.coerceIn(1, maxStrengthLevel)
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && isMultiLevelSupported) {
                cameraManager.turnOnTorchWithStrengthLevel(cameraId, clampedLevel)
                _currentStrength.value = clampedLevel
                _isTorchOn.value = true
            } else {
                cameraManager.setTorchMode(cameraId, true)
                _isTorchOn.value = true
            }
        } catch (e: Exception) {
            Log.e(tag, "Failed to set torch brightness", e)
        }
    }

    fun turnOffTorch() {
        stopStrobe()
        val cameraId = rearCameraId ?: return
        try {
            cameraManager.setTorchMode(cameraId, false)
            _isTorchOn.value = false
        } catch (e: Exception) {
            Log.e(tag, "Failed to disable torch", e)
        }
    }

    fun startStrobe(frequencyHz: Float, strengthLevel: Int) {
        stopStrobe()
        val cameraId = rearCameraId ?: return
        val periodMs = (1000f / frequencyHz).toLong().coerceAtLeast(30L)
        val onDurationMs = (periodMs / 2).coerceAtLeast(15L)
        val offDurationMs = (periodMs - onDurationMs).coerceAtLeast(15L)

        strobeJob = managerScope.launch {
            try {
                while (isActive) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && isMultiLevelSupported) {
                        cameraManager.turnOnTorchWithStrengthLevel(cameraId, strengthLevel)
                    } else {
                        cameraManager.setTorchMode(cameraId, true)
                    }
                    delay(onDurationMs)

                    cameraManager.setTorchMode(cameraId, false)
                    delay(offDurationMs)
                }
            } catch (e: Exception) {
                Log.e(tag, "Strobe error", e)
            } finally {
                cameraManager.setTorchMode(cameraId, false)
            }
        }
    }

    fun stopStrobe() {
        strobeJob?.cancel()
        strobeJob = null
    }

    fun release() {
        stopStrobe()
        turnOffTorch()
        managerScope.cancel()
    }
}
