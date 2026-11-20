package co.gcalls.shell;
import android.content.Context;
import android.content.SharedPreferences;

import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.PackageList;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.Promise;



public class LocalStorageModule extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "LocalStorageModule";
    private static final String PREFS_NAME = "GcallsPref";

    public LocalStorageModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return MODULE_NAME;
    }

    @ReactMethod
    public void saveData(String key, String value) {
        SharedPreferences sharedPreferences = getSharedPreferences();
        SharedPreferences.Editor editor = sharedPreferences.edit();
        editor.putString(key, value);
        editor.apply();
    }

    @ReactMethod
    public void getData(String key, Promise promise) {
            SharedPreferences sharedPreferences = getSharedPreferences();
            String value = sharedPreferences.getString(key, null);
            promise.resolve(value);
        }


    @ReactMethod
    public void testing(Promise promise) {
        String result = "ok";
        promise.resolve(result);
    }

    private SharedPreferences getSharedPreferences() {
        Context context = getReactApplicationContext().getApplicationContext();
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }
}