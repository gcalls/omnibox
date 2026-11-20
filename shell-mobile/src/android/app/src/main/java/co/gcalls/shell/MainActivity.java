package co.gcalls.shell;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;
import com.facebook.react.bridge.ReactApplicationContext;
import androidx.core.app.ActivityCompat;


// implement for call from hubspot
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.content.Context;
import android.os.Build;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import java.util.List;
import android.telephony.TelephonyManager;
import co.gcalls.shell.GcallsPhoneStateListener;
import android.Manifest;

import androidx.core.content.ContextCompat;
import android.os.Bundle;
import android.telecom.TelecomManager;
import android.util.Log;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.provider.Settings;

import android.view.Window;
import android.view.WindowManager;
import android.content.Intent;
import android.app.Application;
import com.facebook.react.ReactInstanceManager;
import android.content.SharedPreferences;

import android.content.Context;
import android.content.SharedPreferences;
import com.facebook.react.ReactApplication;
import com.facebook.react.bridge.ReactContext;

import android.content.Context;
import android.media.AudioManager;


public class MainActivity extends ReactActivity implements DialogInterface.OnClickListener {

  private static final int REQUEST_CODE_SET_DEFAULT_DIALER = 1;
  private static final int PICK_CONTACT_REQUEST_CODE = 1;
  private static final int PERMISSION_REQUEST_BLUETOOTH_CONNECT = 1;

  private static final String TAG = "MainActivity";


  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    handleIntent(getIntent());

  }

  @Override
  public void onStart() {
    super.onStart();
    Log.w("MainActivity", "onStart");

    // checkDefaultHandler();

    AudioManager audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);

    // Set the audio output route to the earpiece speaker.
    // audioManager.setMode(AudioManager.MODE_NORMAL);
    // audioManager.setSpeakerphoneOn(false);

    audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION); //
    audioManager.stopBluetoothSco(); // stop send and receive
    audioManager.setBluetoothScoOn(false); // turn off bluetooth
    audioManager.setSpeakerphoneOn(true); // true to turn on speakerphone; false to turn it off



    if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.BLUETOOTH_CONNECT)
        != PackageManager.PERMISSION_GRANTED) {
    // Permission is not granted, request it
        ActivityCompat.requestPermissions(this,
            new String[]{android.Manifest.permission.BLUETOOTH_CONNECT},
            PERMISSION_REQUEST_BLUETOOTH_CONNECT);
        }

  }

  private void checkDefaultHandler() {
    TelecomManager telecomManager = (TelecomManager) getSystemService(Context.TELECOM_SERVICE);

    if (!getPackageName().equals(telecomManager.getDefaultDialerPackage())) {
        // Show an alert dialog to prompt the user to set our app as the default handler
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setMessage("Do you want to set " + getString(R.string.app_name) + " as your default handler?");
        builder.setPositiveButton("Yes", this);
        builder.setNegativeButton("No", this);

        AlertDialog dialog = builder.create();

        // Set the window flags to make the dialog appear on top
        Window window = dialog.getWindow();
        WindowManager.LayoutParams params = window.getAttributes();
        params.flags |= WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON;
        window.setAttributes(params);

        dialog.show();
    }
  }

  @Override
  public void onClick(DialogInterface dialog, int which) {
    switch (which) {
      case DialogInterface.BUTTON_POSITIVE:
        // Open the default apps settings to allow the user to set our app as the
        // default handler
        Intent intent = new Intent(Settings.ACTION_MANAGE_DEFAULT_APPS_SETTINGS);
        startActivityForResult(intent, REQUEST_CODE_SET_DEFAULT_DIALER);
        break;
      case DialogInterface.BUTTON_NEGATIVE:
        // Do nothing
        break;
    }
  }

  @Override
  public void onNewIntent(Intent intent) {
    super.onNewIntent(intent);
    handleIntent(intent);
  }



  private void handleIntent(Intent intent) {

    // Log.w("co.gcalls.shell", "PHONE " + intent.toString());

    String action = intent.getAction();
    String type = intent.getType();


    // Log.w("co.gcalls.shell", "action: " + action);
    // Log.w("co.gcalls.shell", "type: " + type);
    
    if (action != null && action.equals(Intent.ACTION_CALL)) {
      
      Uri uri = intent.getData();
      String phoneNumber = uri.getSchemeSpecificPart();
      Intent callIntent = new Intent(Intent.ACTION_VIEW);

      callIntent.setData(Uri.parse("gcalls://" + phoneNumber));
      saveData("phoneNumber",phoneNumber);
      startActivity(callIntent);

    }
  }

  public void saveData(String key, String value) {
      SharedPreferences sharedPreferences = getSharedPreferences("GcallsPref", Context.MODE_PRIVATE);
      SharedPreferences.Editor editor = sharedPreferences.edit();
      editor.putString(key, value);
      editor.apply();
  }

 

  /**
   * Returns the name of the main component registered from JavaScript. This is
   * used to schedule
   * rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "Gcalls";
  }

  /**
   * Returns the instance of the {@link ReactActivityDelegate}. Here we use a util
   * class {@link
   * DefaultReactActivityDelegate} which allows you to easily enable Fabric and
   * Concurrent React
   * (aka React 18) with two boolean flags.
   */
  @Override
  protected ReactActivityDelegate createReactActivityDelegate() {
    return new DefaultReactActivityDelegate(
        this,
        getMainComponentName(),
        // If you opted-in for the New Architecture, we enable the Fabric Renderer.
        DefaultNewArchitectureEntryPoint.getFabricEnabled(), // fabricEnabled
        // If you opted-in for the New Architecture, we enable Concurrent React (i.e.
        // React 18).
        DefaultNewArchitectureEntryPoint.getConcurrentReactEnabled() // concurrentRootEnabled
    );
  }

  @Override
  public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
      super.onRequestPermissionsResult(requestCode, permissions, grantResults);
      if (requestCode == PERMISSION_REQUEST_BLUETOOTH_CONNECT) {
          if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
              // Permission was granted, you can now use Bluetooth features
          } else {
              // Permission denied, handle this case (e.g., show a message or disable Bluetooth functionality)
          }
      }
  }
  






}
