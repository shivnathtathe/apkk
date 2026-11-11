package com.shaktilabs.lumentorch.service

import android.os.Build
import android.service.quicksettings.Tile
import android.service.quicksettings.TileService
import com.shaktilabs.lumentorch.camera.TorchManager

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
        val isCurrentlyOn = qsTile?.state == Tile.STATE_ACTIVE
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
