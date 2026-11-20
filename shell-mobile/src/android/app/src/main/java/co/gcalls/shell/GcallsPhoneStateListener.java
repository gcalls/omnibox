package co.gcalls.shell;

import android.content.Context;
import android.content.Intent;
import android.telecom.TelecomManager;
import android.telephony.PhoneStateListener;
import android.telephony.TelephonyManager;
import android.util.Log;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import java.util.List;
// import android.os.Build;


public class GcallsPhoneStateListener extends PhoneStateListener {

    private Context mContext;

    public GcallsPhoneStateListener(Context context) {
        mContext = context;
    }

    public void onCallStateChanged(int state, String incomingNumber) {
        super.onCallStateChanged(state, incomingNumber);
    
        switch (state) {
            case TelephonyManager.CALL_STATE_IDLE:
                // Call ended
                // Log.d("GcallsPhoneStateListener", "Call ended");
                Log.w("GcallsPhoneStateListener", "Call ended");
                break;
            case TelephonyManager.CALL_STATE_OFFHOOK:
                // Call started
                // Log.d("GcallsPhoneStateListener", "Call started");
                Log.w("GcallsPhoneStateListener", "Call started");
                Intent intent = new Intent(TelecomManager.ACTION_CHANGE_DEFAULT_DIALER);
    
                String packageName = mContext.getPackageName();
                PackageManager packageManager = mContext.getPackageManager();
                Intent dialIntent = new Intent(Intent.ACTION_DIAL);
                List<ResolveInfo> resolveInfoList = packageManager.queryIntentActivities(dialIntent, PackageManager.MATCH_DEFAULT_ONLY);
    
                if (resolveInfoList.size() > 1) {
                    // Multiple calling apps are installed on the device
                    // You can display a menu to let the user select a calling app
                    // Log.d("GcallsPhoneStateListener", "Multiple calling apps are installed on the device");
                    // TODO: Display a menu to let the user select a calling app
                } else {
                    // Only one calling app is installed on the device
                    // The device will use this app to make calls
                    // Log.d("GcallsPhoneStateListener", "Only one calling app is installed on the device");
                    // intent.putExtra(TelecomManager.EXTRA_CHANGE_DEFAULT_DIALER_PACKAGE_NAME, packageName);
                    // mContext.startActivity(intent);
                }
    
                // Log.d("GcallsPhoneStateListener", "Call started");

                break;
            case TelephonyManager.CALL_STATE_RINGING:
                // Incoming call
                // Log.d("GcallsPhoneStateListener", "Incoming call");
                Log.w("GcallsPhoneStateListener", "Incoming call");
                break;
            default:
                break;
        }
    }
    
}
