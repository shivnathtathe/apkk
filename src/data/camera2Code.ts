export interface CodeFile {
  filename: string;
  language: string;
  description: string;
  code: string;
}

export const ANDROID_CAMERA2_FILES: CodeFile[] = [
  {
    filename: 'TorchManager.kt',
    language: 'kotlin',
    description: 'Android 13+ Camera2 API Manager handling multi-level torch strength and coroutine strobe',
    code: `package com.shaktilabs.lumentorch.camera

import android.content.Context
import android.hardware.camera2.CameraAccessException
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.os.Build
import android.util.Log
import androidx.annotation.RequiresApi
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * TorchManager handles multi-level flashlight brightness introduced in Android 13 (API level 33, Tiramisu).
 * Prior to API 33, Android only supported binary on/off via CameraManager.setTorchMode().
 */
class TorchManager(private val context: Context) {

    private val tag = "TorchManager"
    private val cameraManager = context.getSystemService(Context.CAMERA_SERVICE) as CameraManager
    
    // Coroutine scope for strobe / flicker loops
    private val managerScope = CoroutineScope(Dispatchers.Default + SupervisorJob())
    private var strobeJob: Job? = null

    // Primary rear camera ID with flash unit
    var rearCameraId: String? = null
        private set

    // Hardware capabilities detected at runtime
    var maxStrengthLevel: Int = 1
        private set
    var defaultStrengthLevel: Int = 1
        private set
    var isMultiLevelSupported: Boolean = false
        private set

    // Reactive StateFlows for UI observation
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
                    
                    // Android 13+ (API 33) Camera2 Multi-level Brightness detection
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        maxStrengthLevel = characteristics.get(
                            CameraCharacteristics.FLASH_INFO_STRENGTH_MAXIMUM_LEVEL
                        ) ?: 1
                        defaultStrengthLevel = characteristics.get(
                            CameraCharacteristics.FLASH_INFO_STRENGTH_DEFAULT_LEVEL
                        ) ?: 1
                        
                        isMultiLevelSupported = maxStrengthLevel > 1
                        Log.d(tag, "Camera $id: maxStrength=$maxStrengthLevel, default=$defaultStrengthLevel")
                    } else {
                        maxStrengthLevel = 1
                        isMultiLevelSupported = false
                    }
                    break
                }
            }
        } catch (e: CameraAccessException) {
            Log.e(tag, "Failed to access camera characteristics", e)
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

            override fun onTorchModeUnavailable(cameraId: String) {
                if (cameraId == rearCameraId) {
                    Log.w(tag, "Torch mode unavailable (camera in use or thermal throttling)")
                    _isTorchOn.value = false
                }
            }
        }, null)
    }

    /**
     * Turns on the torch at a specific brightness strength.
     * Uses Android 13+ CameraManager.turnOnTorchWithStrengthLevel()
     * @param strengthLevel Value between 1 and maxStrengthLevel
     */
    fun setTorchBrightness(strengthLevel: Int) {
        val cameraId = rearCameraId ?: return
        val clampedLevel = strengthLevel.coerceIn(1, maxStrengthLevel)

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && isMultiLevelSupported) {
                // API 33+ Native brightness control
                cameraManager.turnOnTorchWithStrengthLevel(cameraId, clampedLevel)
                _currentStrength.value = clampedLevel
                _isTorchOn.value = true
            } else {
                // Backward-compatible binary on
                cameraManager.setTorchMode(cameraId, true)
                _isTorchOn.value = true
            }
        } catch (e: Exception) {
            Log.e(tag, "Error setting torch brightness level $clampedLevel", e)
        }
    }

    /**
     * Completely disables the torch.
     */
    fun turnOffTorch() {
        stopStrobe()
        val cameraId = rearCameraId ?: return
        try {
            cameraManager.setTorchMode(cameraId, false)
            _isTorchOn.value = false
        } catch (e: Exception) {
            Log.e(tag, "Error turning off torch", e)
        }
    }

    /**
     * Starts continuous strobe/flicker at target frequency in Hertz.
     * @param frequencyHz Strobe flashes per second (e.g. 1 to 25 Hz)
     * @param strengthLevel Brightness level to flash with
     */
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
                Log.e(tag, "Strobe loop exception", e)
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
`
  },
  {
    filename: 'MainActivity.kt',
    language: 'kotlin',
    description: 'Jetpack Compose Material 3 UI with Brightness Slider, Strobe Controls & Presets',
    code: `package com.shaktilabs.lumentorch

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.shaktilabs.lumentorch.camera.TorchManager

class MainActivity : ComponentActivity() {

    private lateinit var torchManager: TorchManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        torchManager = TorchManager(this)

        setContent {
            MaterialTheme(
                colorScheme = darkColorScheme(
                    primary = Color(0xFFFFB74D), // Warm Amber
                    surface = Color(0xFF1E1E1E),
                    background = Color(0xFF121212)
                )
            ) {
                TorchScreen(torchManager = torchManager)
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        torchManager.release()
    }
}

@Composable
fun TorchScreen(torchManager: TorchManager) {
    val isTorchOn by torchManager.isTorchOn.collectAsState()
    val currentStrength by torchManager.currentStrength.collectAsState()
    var sliderValue by remember { mutableStateOf(currentStrength.toFloat()) }
    var isStrobeActive by remember { mutableStateOf(false) }
    var strobeFreqHz by remember { mutableStateOf(8f) }

    val maxLevel = torchManager.maxStrengthLevel.coerceAtLeast(1)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        // Header
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = "LumenTorch",
                style = MaterialTheme.typography.headlineMedium,
                color = Color.White
            )
            Text(
                text = "Android 13+ Camera2 Controller (Max Level: $maxLevel)",
                style = MaterialTheme.typography.bodySmall,
                color = Color.Gray
            )
        }

        // Center Big Power Button
        FilledIconButton(
            onClick = {
                if (isTorchOn) {
                    torchManager.turnOffTorch()
                    isStrobeActive = false
                } else {
                    torchManager.setTorchBrightness(sliderValue.toInt())
                }
            },
            modifier = Modifier.size(120.dp),
            colors = IconButtonDefaults.filledIconButtonColors(
                containerColor = if (isTorchOn) MaterialTheme.colorScheme.primary else Color(0xFF2C2C2C)
            )
        ) {
            Text(
                text = if (isTorchOn) "ON" else "OFF",
                style = MaterialTheme.typography.titleLarge,
                color = if (isTorchOn) Color.Black else Color.White
            )
        }

        // Multi-Level Brightness Slider
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Brightness Level", color = Color.White)
                    Text("\${sliderValue.toInt()} / $maxLevel", color = MaterialTheme.colorScheme.primary)
                }

                Slider(
                    value = sliderValue,
                    onValueChange = { newVal ->
                        sliderValue = newVal
                        if (isTorchOn && !isStrobeActive) {
                            torchManager.setTorchBrightness(newVal.toInt())
                        }
                    },
                    valueRange = 1f..maxLevel.toFloat(),
                    steps = (maxLevel - 2).coerceAtLeast(0)
                )

                // Quick Presets Row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    val presets = listOf(1, (maxLevel * 0.25f).toInt(), (maxLevel * 0.5f).toInt(), maxLevel)
                    presets.forEach { preset ->
                        AssistChip(
                            onClick = {
                                sliderValue = preset.toFloat()
                                torchManager.setTorchBrightness(preset)
                            },
                            label = { Text("$preset") }
                        )
                    }
                }
            }
        }

        // Strobe / Flicker Section
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Strobe Flicker Mode", color = Color.White)
                    Switch(
                        checked = isStrobeActive,
                        onCheckedChange = { active ->
                            isStrobeActive = active
                            if (active) {
                                torchManager.startStrobe(strobeFreqHz, sliderValue.toInt())
                            } else {
                                torchManager.stopStrobe()
                                torchManager.turnOffTorch()
                            }
                        }
                    )
                }

                if (isStrobeActive) {
                    Text("Frequency: \${strobeFreqHz.toInt()} Hz", color = Color.Gray)
                    Slider(
                        value = strobeFreqHz,
                        onValueChange = {
                            strobeFreqHz = it
                            torchManager.startStrobe(it, sliderValue.toInt())
                        },
                        valueRange = 1f..25f
                    )
                }
            }
        }
    }
}
`
  },
  {
    filename: 'AndroidManifest.xml',
    language: 'xml',
    description: 'Permissions and camera hardware features for torch access',
    code: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.shaktilabs.lumentorch">

    <!-- Flashlight hardware feature declaration -->
    <uses-feature
        android:name="android.hardware.camera.flash"
        android:required="true" />

    <!-- Camera feature (marked optional so tablets/devices without front cam still install) -->
    <uses-feature
        android:name="android.hardware.camera"
        android:required="false" />

    <!-- Camera permission is required for Camera2 API access -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.FLASHLIGHT" />
    <uses-permission android:name="android.permission.VIBRATE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="LumenTorch"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.Material3.Dark.NoActionBar">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="portrait">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Android 13+ Quick Settings Tile Service -->
        <service
            android:name=".TorchTileService"
            android:exported="true"
            android:label="Lumen Torch"
            android:icon="@drawable/ic_torch"
            android:permission="android.permission.BIND_QUICK_SETTINGS_TILE">
            <intent-filter>
                <action android:name="android.service.quicksettings.action.QS_TILE" />
            </intent-filter>
        </service>

    </application>

</manifest>
`
  },
  {
    filename: 'build.gradle.kts',
    language: 'kotlin',
    description: 'Gradle configuration with Android 13+ SDK (API 33/34) and Jetpack Compose dependencies',
    code: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "com.shaktilabs.lumentorch"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.shaktilabs.lumentorch"
        minSdk = 33 // Android 13 (Tiramisu) for native turnOnTorchWithStrengthLevel
        targetSdk = 36
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
    }
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.8"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.activity:activity-compose:1.8.2")
    implementation(platform("androidx.compose:compose-bom:2024.02.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
}
`
  }
];

export const DEVICE_PROFILES = [
  {
    name: 'Google Pixel 8 / 9 Pro',
    model: 'Tensor G3 / G4',
    androidVersion: 'Android 14 / 15',
    maxStrengthLevel: 64,
    defaultStrengthLevel: 32,
    notes: 'Full multi-level support. 64 discrete hardware current regulation steps.'
  },
  {
    name: 'Google Pixel 7 / 7 Pro',
    model: 'Tensor G2',
    androidVersion: 'Android 13 / 14',
    maxStrengthLevel: 32,
    defaultStrengthLevel: 16,
    notes: 'First Pixel generation with native API 33 strength control enabled.'
  },
  {
    name: 'Samsung Galaxy S23 / S24 Ultra',
    model: 'Snapdragon 8 Gen 2 / Gen 3',
    androidVersion: 'One UI 6 (Android 14)',
    maxStrengthLevel: 5,
    defaultStrengthLevel: 3,
    notes: 'Samsung exposes 5 discrete PWM torch levels matching their stock torch slider.'
  },
  {
    name: 'Xiaomi 13 / 14 / Ultra',
    model: 'HyperOS (Android 14)',
    maxStrengthLevel: 100,
    defaultStrengthLevel: 50,
    notes: 'Xiaomi exposes 1-100 normalized current levels.'
  },
  {
    name: 'Nothing Phone (2)',
    model: 'Nothing OS 2.5',
    androidVersion: 'Android 14',
    maxStrengthLevel: 100,
    defaultStrengthLevel: 40,
    notes: 'Supports camera LED strength regulation and Glyph interface sync.'
  }
];
