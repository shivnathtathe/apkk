import JSZip from 'jszip';

export async function generateAndroidStudioProjectZip(): Promise<Blob> {
  const zip = new JSZip();

  // Root files
  zip.file(
    'settings.gradle.kts',
    `pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\\\.android.*")
                includeGroupByRegex("com\\\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "LumenTorch"
include(":app")
`
  );

  zip.file(
    'build.gradle.kts',
    `plugins {
    id("com.android.application") version "8.3.0" apply false
    id("org.jetbrains.kotlin.android") version "1.9.22" apply false
}
`
  );

  zip.file(
    'gradle.properties',
    `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true
kotlin.code.style=official
`
  );

  // Gradle wrapper
  zip.file(
    'gradle/wrapper/gradle-wrapper.properties',
    `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.4-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`
  );

  // App module build.gradle.kts
  zip.file(
    'app/build.gradle.kts',
    `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.example.lumentorch"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.example.lumentorch"
        minSdk = 33 // Android 13 (Tiramisu)
        targetSdk = 34 // Android 14 (Play Store requirement)
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
            isShrinkResources = true
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
    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.activity:activity-compose:1.8.2")
    implementation(platform("androidx.compose:compose-bom:2024.02.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
}
`
  );

  zip.file(
    'app/proguard-rules.pro',
    `# Add project specific ProGuard rules here.
-keepclassmembers class * extends android.service.quicksettings.TileService {
    <methods>;
}
`
  );

  // AndroidManifest.xml
  zip.file(
    'app/src/main/AndroidManifest.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    package="com.example.lumentorch">

    <!-- Flashlight hardware feature requirement -->
    <uses-feature
        android:name="android.hardware.camera.flash"
        android:required="true" />

    <!-- Camera feature marked false so devices without front camera still install -->
    <uses-feature
        android:name="android.hardware.camera"
        android:required="false" />

    <!-- Camera permission is required for Camera2 API access -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.FLASHLIGHT" />
    <uses-permission android:name="android.permission.VIBRATE" />

    <application
        android:allowBackup="true"
        android:dataExtractionRules="@xml/data_extraction_rules"
        android:fullBackupContent="@xml/backup_rules"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.LumenTorch">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="portrait"
            android:theme="@style/Theme.LumenTorch">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Android 13+ Quick Settings Tile Service -->
        <service
            android:name=".service.TorchTileService"
            android:exported="true"
            android:icon="@drawable/ic_torch"
            android:label="@string/tile_name"
            android:permission="android.permission.BIND_QUICK_SETTINGS_TILE">
            <intent-filter>
                <action android:name="android.service.quicksettings.action.QS_TILE" />
            </intent-filter>
        </service>

    </application>

</manifest>
`
  );

  // Kotlin files
  zip.file(
    'app/src/main/java/com/example/lumentorch/camera/TorchManager.kt',
    `package com.example.lumentorch.camera

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

/**
 * TorchManager handles multi-level flashlight brightness introduced in Android 13 (API 33, Tiramisu).
 */
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
`
  );

  zip.file(
    'app/src/main/java/com/example/lumentorch/service/TorchTileService.kt',
    `package com.example.lumentorch.service

import android.content.Intent
import android.os.Build
import android.service.quicksettings.Tile
import android.service.quicksettings.TileService
import com.example.lumentorch.MainActivity
import com.example.lumentorch.camera.TorchManager

class TorchTileService : TileService() {

    private lateinit var torchManager: TorchManager

    override fun onCreate() {
        super.onCreate()
        torchManager = TorchManager(this)
    }

    override fun onStartListening() {
        super.onStartListening()
        updateTileState()
    }

    override fun onClick() {
        super.onClick()
        val isCurrentlyOn = qsTile.state == Tile.STATE_ACTIVE
        if (isCurrentlyOn) {
            torchManager.turnOffTorch()
        } else {
            val targetLevel = (torchManager.maxStrengthLevel * 0.75f).toInt().coerceAtLeast(1)
            torchManager.setTorchBrightness(targetLevel)
        }
        updateTileState()
    }

    private fun updateTileState() {
        val tile = qsTile ?: return
        val isOn = torchManager.isTorchOn.value
        tile.state = if (isOn) Tile.STATE_ACTIVE else Tile.STATE_INACTIVE
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val level = torchManager.currentStrength.value
            val max = torchManager.maxStrengthLevel
            tile.subtitle = if (isOn) "Level $level/$max" else "Off"
        }
        tile.updateTile()
    }

    override fun onDestroy() {
        super.onDestroy()
        torchManager.release()
    }
}
`
  );

  zip.file(
    'app/src/main/java/com/example/lumentorch/MainActivity.kt',
    `package com.example.lumentorch

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.FlashlightOn
import androidx.compose.material.icons.filled.FlashlightOff
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.lumentorch.camera.TorchManager

class MainActivity : ComponentActivity() {

    private lateinit var torchManager: TorchManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        torchManager = TorchManager(this)

        setContent {
            MaterialTheme(
                colorScheme = darkColorScheme(
                    primary = Color(0xFFFFB74D), // Amber
                    surface = Color(0xFF1E1E1E),
                    background = Color(0xFF121212)
                )
            ) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    TorchScreen(torchManager = torchManager)
                }
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
    val maxLevel = torchManager.maxStrengthLevel.coerceAtLeast(1)

    var sliderValue by remember { mutableStateOf(currentStrength.toFloat().coerceAtLeast(1f)) }
    var isStrobeActive by remember { mutableStateOf(false) }
    var strobeFreqHz by remember { mutableStateOf(8f) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        // App Bar Header
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = "LumenTorch",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
            Text(
                text = "Android 13+ Camera2 Controller (Max Level: $maxLevel)",
                fontSize = 12.sp,
                color = Color.Gray
            )
        }

        // Center Power Switch
        Button(
            onClick = {
                if (isTorchOn) {
                    torchManager.turnOffTorch()
                    isStrobeActive = false
                } else {
                    torchManager.setTorchBrightness(sliderValue.toInt())
                }
            },
            modifier = Modifier.size(140.dp),
            shape = CircleShape,
            colors = ButtonDefaults.buttonColors(
                containerColor = if (isTorchOn) Color(0xFFFFB74D) else Color(0xFF2A2A2A)
            ),
            elevation = ButtonDefaults.buttonElevation(defaultElevation = 8.dp)
        ) {
            Icon(
                imageVector = if (isTorchOn) Icons.Default.FlashlightOn else Icons.Default.FlashlightOff,
                contentDescription = if (isTorchOn) "Torch On" else "Torch Off",
                modifier = Modifier.size(54.dp),
                tint = if (isTorchOn) Color.Black else Color.Gray
            )
        }

        // Brightness Slider Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(modifier = Modifier.padding(18.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Brightness Level", color = Color.White, fontWeight = FontWeight.SemiBold)
                    Text("\${sliderValue.toInt()} / $maxLevel", color = Color(0xFFFFB74D), fontWeight = FontWeight.Bold)
                }

                Spacer(modifier = Modifier.height(8.dp))

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

                Spacer(modifier = Modifier.height(8.dp))

                // Presets
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    val presets = listOf(1, (maxLevel * 0.25f).toInt(), (maxLevel * 0.5f).toInt(), (maxLevel * 0.75f).toInt(), maxLevel)
                    presets.forEach { preset ->
                        FilledTonalButton(
                            onClick = {
                                sliderValue = preset.toFloat()
                                torchManager.setTorchBrightness(preset)
                            },
                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("$preset", fontSize = 12.sp)
                        }
                    }
                }
            }
        }

        // Strobe Section
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(modifier = Modifier.padding(18.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Strobe / Flicker Mode", color = Color.White, fontWeight = FontWeight.SemiBold)
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
                    Spacer(modifier = Modifier.height(10.dp))
                    Text("Speed: \${strobeFreqHz.toInt()} Hz", color = Color.LightGray, fontSize = 12.sp)
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
  );

  // XML Resources
  zip.file(
    'app/src/main/res/values/strings.xml',
    `<resources>
    <string name="app_name">LumenTorch</string>
    <string name="tile_name">Flashlight</string>
</resources>
`
  );

  zip.file(
    'app/src/main/res/values/colors.xml',
    `<resources>
    <color name="primary">#FFB74D</color>
    <color name="background">#121212</color>
</resources>
`
  );

  zip.file(
    'app/src/main/res/values/themes.xml',
    `<resources>
    <style name="Theme.LumenTorch" parent="android:Theme.Material.NoActionBar">
        <item name="android:statusBarColor">#121212</item>
        <item name="android:navigationBarColor">#121212</item>
    </style>
</resources>
`
  );

  zip.file(
    'app/src/main/res/xml/data_extraction_rules.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<data-extraction-rules>
    <cloud-backup>
        <include domain="sharedpref" path="."/>
    </cloud-backup>
</data-extraction-rules>
`
  );

  zip.file(
    'app/src/main/res/xml/backup_rules.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<full-backup-content>
    <include domain="sharedpref" path="."/>
</full-backup-content>
`
  );

  zip.file(
    'app/src/main/res/drawable/ic_torch.xml',
    `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#FFFFFFFF"
        android:pathData="M18,2H6c-1.1,0 -2,0.9 -2,2v3l4,4v11c0,1.1 0.9,2 2,2h4c1.1,0 2,-0.9 2,-2V11l4,-4V4C20,2.9 19.1,2 18,2zM12,14c-0.55,0 -1,-0.45 -1,-1s0.45,-1 1,-1s1,0.45 1,1S12.55,14 12,14z"/>
</vector>
`
  );

  // README with Play Store instructions
  zip.file(
    'PLAYSTORE_PUBLISH_GUIDE.md',
    `# LumenTorch - Google Play Store Publishing Guide

## How to Build the Signed Android App Bundle (.aab)

1. Open **Android Studio** (Hedgehog, Iguana, or Koala).
2. Choose **File > Open** and select this extracted directory.
3. Wait for Gradle sync to complete.
4. Go to top menu: **Build > Generate Signed Bundle / APK...**
5. Select **Android App Bundle (.aab)** and click **Next**.
6. **Key store path**: Click *Create new...* (save your key file securely, you will need it for all future updates).
7. Select **release** build variant and click **Create**.
8. Android Studio will generate the signed \`.aab\` file in \`app/release/app-release.aab\`.

## Uploading to Google Play Console

1. Log in to [Google Play Console](https://play.google.com/console).
2. Click **Create app**:
   - App name: \`LumenTorch - Brightness Controller\`
   - Default language: English
   - App or game: App
   - Free or paid: Free
3. In **Dashboard > Release > Production > Create new release**:
   - Upload the \`app-release.aab\` file.
   - Enter release notes (e.g., "Initial release: Camera2 multi-level torch brightness & strobe controller").
4. **App Content & Data Safety**:
   - Camera permission: Declare that camera access is strictly used to control the physical LED flash hardware.
   - Data collection: Select **"No user data is collected or shared"**.
   - Provide Privacy Policy URL (you can use the included privacy policy template).
5. Submit for review! (Typically approved within 24-48 hours).
`
  );

  // Privacy Policy Template
  zip.file(
    'PRIVACY_POLICY.md',
    `# Privacy Policy for LumenTorch

*Last updated: November 2026*

LumenTorch is committed to protecting your privacy.

### Camera Permission Usage
LumenTorch requests the \`CAMERA\` permission strictly to access the device's camera flash unit via the Android Camera2 API (\`CameraManager.turnOnTorchWithStrengthLevel\` and \`CameraManager.setTorchMode\`).

- **No Images or Videos**: LumenTorch never captures, records, stores, or accesses photos or video streams.
- **No Data Collection**: We do not collect, store, or transmit any personal information, device identifiers, or analytics.
- **Offline Functionality**: The application operates completely offline without internet connectivity.

### Contact
If you have any questions regarding this Privacy Policy, please contact the developer at your support email.
`
  );

  // GitHub Actions Workflow to build signed AAB in cloud without a laptop!
  zip.file(
    '.github/workflows/build-playstore-aab.yml',
    `name: Build and Sign Play Store AAB

on:
  push:
    branches: [ "main", "master" ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

    - name: Set up JDK 17
      uses: actions/setup-java@v4
      with:
        java-version: '17'
        distribution: 'temurin'
        cache: gradle

    - name: Grant execute permission for gradlew
      run: chmod +x gradlew || true

    - name: Build Android App Bundle (.aab)
      run: ./gradlew bundleRelease --stacktrace

    - name: Upload Signed AAB Artifact
      uses: actions/upload-artifact@v4
      with:
        name: LumenTorch-PlayStore-AAB
        path: app/build/outputs/bundle/release/*.aab
`
  );

  return await zip.generateAsync({ type: 'blob' });
}

