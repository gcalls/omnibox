package co.gcalls.shell;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.telephony.TelephonyManager;
import android.view.KeyEvent;
import android.util.Log;
import android.app.Activity;
import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import co.gcalls.shell.R;
import android.content.Intent;
import android.net.Uri;
import android.telecom.TelecomManager;
import android.widget.Toast;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.provider.CallLog;


// use to listen to callbutton from android device
public class CallButtonInterceptor extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
  
        // Should have permission NEW_OUTGOING_CALL to receive this intent
        Log.w("co.gcalls.shell", "Outgoing call to: " + intent.hasExtra(Intent.EXTRA_PHONE_NUMBER));
        
        if (intent.hasExtra(Intent.EXTRA_PHONE_NUMBER) ) {
            setResultData(null);
            
            String outgoingNumber = intent.getStringExtra(Intent.EXTRA_PHONE_NUMBER);
            
            String phoneNumber = outgoingNumber; // Replace with the actual phone number
        
            Intent callIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("tel:" + outgoingNumber));

            Log.w("co.gcalls.shell","Outgoing call to: " + outgoingNumber);

            callIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(callIntent);

        
        // TelecomManager telecomManager = (TelecomManager) context.getSystemService(Context.TELECOM_SERVICE);
        // String defaultDialerPackage = telecomManager.getDefaultDialerPackage();
                
        
        // Log.w("co.gcalls.shell", "Default dialer package1: " + context.getPackageName());
        
        // if(defaultDialerPackage.equals(context.getPackageName())) {
        //     setResultData(null);
        //     Log.w("My OUTGOING CALL RECEIVER", "Default dialer package is GCalls");
        //     Intent callIntent = new Intent(Intent.ACTION_CALL, Uri.parse("tel:" + outgoingNumber));
        //     callIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        //     callIntent.setPackage(defaultDialerPackage);
        //     context.startActivity(callIntent);
        
        // }
    
        }

    }
}
