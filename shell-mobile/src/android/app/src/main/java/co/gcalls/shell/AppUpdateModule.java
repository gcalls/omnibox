package co.gcalls.shell;

import android.app.Activity;
import android.content.pm.PackageInfo;
import android.os.Build;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.google.android.play.core.appupdate.AppUpdateInfo;
import com.google.android.play.core.appupdate.AppUpdateManager;
import com.google.android.play.core.appupdate.AppUpdateManagerFactory;
import com.google.android.play.core.appupdate.AppUpdateOptions;
import com.google.android.play.core.install.InstallStateUpdatedListener;
import com.google.android.play.core.install.model.AppUpdateType;
import com.google.android.play.core.install.model.InstallStatus;
import com.google.android.play.core.install.model.UpdateAvailability;

/**
 * Phiên bản app + Google Play In-App Updates (không cần Firebase/Google Cloud).
 * Chỉ hoạt động với bản cài từ Google Play (kể cả track internal/open testing); bản cài từ APK → checkUpdate trả null.
 */
public class AppUpdateModule extends ReactContextBaseJavaModule {
    private static final int REQUEST_CODE = 4711;
    private final AppUpdateManager manager;
    private InstallStateUpdatedListener flexibleListener;

    public AppUpdateModule(ReactApplicationContext reactContext) {
        super(reactContext);
        manager = AppUpdateManagerFactory.create(reactContext);
    }

    @Override
    public String getName() {
        return "AppUpdateModule";
    }

    @ReactMethod
    public void getAppInfo(Promise promise) {
        try {
            ReactApplicationContext ctx = getReactApplicationContext();
            PackageInfo pi = ctx.getPackageManager().getPackageInfo(ctx.getPackageName(), 0);
            long code = Build.VERSION.SDK_INT >= 28 ? pi.getLongVersionCode() : pi.versionCode;
            WritableMap m = Arguments.createMap();
            m.putString("version", pi.versionName);
            m.putDouble("versionCode", code);
            m.putString("bundleId", ctx.getPackageName());
            promise.resolve(m);
        } catch (Exception e) {
            promise.reject("app_info", e);
        }
    }

    /** {available, inProgress, availableVersionCode, immediateAllowed, flexibleAllowed} hoặc null nếu không hỏi được Play. */
    @ReactMethod
    public void checkUpdate(Promise promise) {
        manager.getAppUpdateInfo()
            .addOnSuccessListener(info -> {
                WritableMap m = Arguments.createMap();
                int a = info.updateAvailability();
                m.putBoolean("available", a == UpdateAvailability.UPDATE_AVAILABLE);
                m.putBoolean("inProgress", a == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS);
                m.putDouble("availableVersionCode", info.availableVersionCode());
                m.putBoolean("immediateAllowed", info.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE));
                m.putBoolean("flexibleAllowed", info.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE));
                promise.resolve(m);
            })
            .addOnFailureListener(e -> promise.resolve(null));
    }

    /** immediate = màn hình cập nhật toàn màn hình của Play (bắt buộc); ngược lại tải ngầm rồi cài khi xong. */
    @ReactMethod
    public void startUpdate(boolean immediate, Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity == null) {
            promise.resolve(false);
            return;
        }
        int type = immediate ? AppUpdateType.IMMEDIATE : AppUpdateType.FLEXIBLE;
        manager.getAppUpdateInfo()
            .addOnSuccessListener(info -> {
                int a = info.updateAvailability();
                boolean ok = (a == UpdateAvailability.UPDATE_AVAILABLE
                        || (immediate && a == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS))
                        && info.isUpdateTypeAllowed(type);
                if (!ok) {
                    promise.resolve(false);
                    return;
                }
                if (!immediate && flexibleListener == null) {
                    flexibleListener = state -> {
                        if (state.installStatus() == InstallStatus.DOWNLOADED) {
                            manager.completeUpdate();
                        }
                    };
                    manager.registerListener(flexibleListener);
                }
                try {
                    manager.startUpdateFlowForResult(info, activity, AppUpdateOptions.newBuilder(type).build(), REQUEST_CODE);
                    promise.resolve(true);
                } catch (Exception e) {
                    promise.resolve(false);
                }
            })
            .addOnFailureListener(e -> promise.resolve(false));
    }
}
