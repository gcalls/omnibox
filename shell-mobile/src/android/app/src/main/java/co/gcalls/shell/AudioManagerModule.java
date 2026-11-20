package co.gcalls.shell;
import android.bluetooth.BluetoothHeadset;
import android.bluetooth.BluetoothProfile;
import android.content.Context;
import android.media.AudioManager;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import android.bluetooth.BluetoothAdapter;
import android.util.Log;
import android.bluetooth.BluetoothDevice;


public class AudioManagerModule extends ReactContextBaseJavaModule {

    private BluetoothHeadset mBluetoothHeadset;
    private AudioManager audioManager;
    private boolean IS_BLUETOOTH_CONNECTED = false;
    private Context mContext;

    public AudioManagerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        mContext = reactContext;
        audioManager = (AudioManager) reactContext.getSystemService(Context.AUDIO_SERVICE);
        initializeBluetoothHeadset();
    }

    @Override
    public String getName() {
        return "AudioManagerModule";
    }

    private void initializeBluetoothHeadset() {
        BluetoothAdapter bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
        if (bluetoothAdapter != null) {
            bluetoothAdapter.getProfileProxy(mContext, mProfileListener, BluetoothProfile.HEADSET);
        }
    }

    private BluetoothProfile.ServiceListener mProfileListener = new BluetoothProfile.ServiceListener() {
        public void onServiceConnected(int profile, BluetoothProfile proxy) {
            if (profile == BluetoothProfile.HEADSET) {
                mBluetoothHeadset = (BluetoothHeadset) proxy;
                try {
                    BluetoothAdapter bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
                    if (bluetoothAdapter != null) {
                        
                        for (BluetoothDevice device : bluetoothAdapter.getBondedDevices()) {
                            IS_BLUETOOTH_CONNECTED = true;
                            // Log.w("co.gcalls.shell", "IS_BLUETOOTH_CONNECTED: " + IS_BLUETOOTH_CONNECTED);
                            // Log.w("co.gcalls.shell", "IS_BLUETOOTH_CONNECTED: " + device);
                        }
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                    // Handle the exception (log, display an error, or take appropriate action)
                }
            }
        }
    

        @Override
        public void onServiceDisconnected(int profile) {
            if (profile == BluetoothProfile.HEADSET) {
                mBluetoothHeadset = null;
                IS_BLUETOOTH_CONNECTED = false;
                // Log.w("co.gcalls.shell", "IS_BLUETOOTH_CONNECTED: " + IS_BLUETOOTH_CONNECTED);
                // Handle Bluetooth device disconnected
            }
        }
    };

    @ReactMethod
    public void setupAndroidSpeakerOn() {

        if (!IS_BLUETOOTH_CONNECTED) {
            setAudioPlayByEarPhone(0);
        } ;
    }

    @ReactMethod
    public void setupAndroidSpeakerOff() {
  
        if (!IS_BLUETOOTH_CONNECTED) {
            setAudioPlayByEarPhone(3);
        } ;
    }

    public void setAudioPlayByEarPhone(int state) {
        AudioManager audioManager = (AudioManager) getReactApplicationContext().getSystemService(ReactApplicationContext.AUDIO_SERVICE);
    
        // Reset audio settings before changing state
        audioManager.setMode(AudioManager.MODE_NORMAL);
        audioManager.setSpeakerphoneOn(false);
        audioManager.stopBluetoothSco();
    
        // Apply the desired audio state
        if (state == 0) {
            audioManager.setSpeakerphoneOn(true);
        } else if (state == 1) {
            audioManager.setSpeakerphoneOn(false);
        } else {
            audioManager.setSpeakerphoneOn(false);
            audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
            int currVolume = audioManager.getStreamVolume(AudioManager.STREAM_VOICE_CALL);
            audioManager.setStreamVolume(AudioManager.STREAM_VOICE_CALL, currVolume, AudioManager.STREAM_VOICE_CALL);
        }
    }
}
