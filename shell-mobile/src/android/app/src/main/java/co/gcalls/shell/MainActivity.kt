package co.gcalls.shell

import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.net.Uri
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "Gcalls"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  // null: mở lại sau khi Android đã đóng tiến trình (từ đa nhiệm) → khởi động sạch, không khôi phục trạng thái view
  // cũ của React Native (khôi phục có thể làm app văng – "Omnibox keeps stopping"). Khuyến nghị của React Native.
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(null)
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
    // Quyền (micro, thông báo, thiết bị lân cận/Bluetooth) xin ở màn hình cấp quyền lần đầu bên JS (components/Boot.tsx),
    // có giải thích lý do – không xin ở đây nữa: trước đây xin lại mỗi lần onStart và trùng requestCode với
    // PermissionsAndroid của React Native (đánh số từ 0) → kết quả quyền trả nhầm, yêu cầu quyền bên JS bị treo.
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

}
