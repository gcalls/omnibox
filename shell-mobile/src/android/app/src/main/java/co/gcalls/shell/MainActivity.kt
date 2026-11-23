package co.gcalls.shell

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.AudioManager
import android.net.Uri
import android.os.Bundle
import androidx.core.app.ActivityCompat
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "Gcalls"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    handleIntent(intent)
  }

  override fun onStart() {
    super.onStart()
    // Âm thanh cho cuộc gọi VoIP trong WebView: chế độ communication, bật loa ngoài
    (getSystemService(Context.AUDIO_SERVICE) as AudioManager).apply {
      mode = AudioManager.MODE_IN_COMMUNICATION
      @Suppress("DEPRECATION") stopBluetoothSco()
      @Suppress("DEPRECATION") isBluetoothScoOn = false
      @Suppress("DEPRECATION") isSpeakerphoneOn = true
    }
    if (ActivityCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
      ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.BLUETOOTH_CONNECT), REQUEST_BLUETOOTH_CONNECT)
    }
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    handleIntent(intent)
  }

  // ACTION_CALL tel:<số> → mở lại app bằng gcalls://<số> để JS (Linking) nhận số cần gọi
  private fun handleIntent(intent: Intent?) {
    if (intent?.action != Intent.ACTION_CALL) return
    val phoneNumber = intent.data?.schemeSpecificPart ?: return
    getSharedPreferences("GcallsPref", Context.MODE_PRIVATE).edit().putString("phoneNumber", phoneNumber).apply()
    startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("gcalls://$phoneNumber")))
  }

  companion object {
    private const val REQUEST_BLUETOOTH_CONNECT = 1
  }
}
