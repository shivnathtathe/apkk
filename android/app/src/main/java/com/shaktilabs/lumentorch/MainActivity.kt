package com.shaktilabs.lumentorch

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.shaktilabs.lumentorch.camera.TorchManager

class MainActivity : ComponentActivity() {

    private lateinit var torchManager: TorchManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        torchManager = TorchManager(this)

        setContent {
            MaterialTheme(
                colorScheme = darkColorScheme(
                    primary = Color(0xFFFFB74D),
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
                painter = painterResource(id = R.drawable.ic_torch),
                contentDescription = if (isTorchOn) "Torch On" else "Torch Off",
                modifier = Modifier.size(54.dp),
                tint = if (isTorchOn) Color.Black else Color.Gray
            )
        }

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
                    Text("${sliderValue.toInt()} / $maxLevel", color = Color(0xFFFFB74D), fontWeight = FontWeight.Bold)
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
                    Text("Speed: ${strobeFreqHz.toInt()} Hz", color = Color.LightGray, fontSize = 12.sp)
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
