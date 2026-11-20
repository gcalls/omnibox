package co.gcalls.shell.contacts;


import android.app.Service;
import android.content.Intent;
import android.os.IBinder;
import android.util.Log;

public class AuthenticationService extends Service {

    private static final String TAG = "AuthenticationService";

    private Authenticator mAuthenticator;

    @Override
    public void onCreate() {

        // Workaround for bug where sometimes service is started twice
        if (Log.isLoggable(TAG, Log.VERBOSE)) {
            Log.v(TAG, "SampleSyncAdapter Authentication Service started.");

        }


        mAuthenticator = new Authenticator(this);

        


        Log.v(TAG, "SampleSyncAdapter Authenticator Service started.");
        Log.v(TAG, mAuthenticator.toString());

    }

    @Override
    public void onDestroy() {


        Log.v(TAG, "ON Destroy");

        if (Log.isLoggable(TAG, Log.VERBOSE)) {
            Log.v(TAG, "SampleSyncAdapter Authentication Service stopped.");
        }
    }

    @Override
    public IBinder onBind(Intent intent) {


        Log.v(TAG, "ON Bind");

        if (Log.isLoggable(TAG, Log.VERBOSE)) {
            Log.v(TAG, "getBinder()...  returning the AccountAuthenticator binder for intent "
                    + intent);
        }
        return mAuthenticator.getIBinder();
    }
}