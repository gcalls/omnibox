package co.gcalls.shell;
import android.app.Activity;
import android.app.Application;
import android.os.Bundle;
import android.util.Log;



public class GcallsLifeCycleTracker  implements Application.ActivityLifecycleCallbacks {
    
    private int activityCount = 0;
    private boolean isAppFullyOpened = false;

    @Override
    public void onActivityCreated(Activity activity, Bundle savedInstanceState) {
        if (activityCount == 0) {
            // App is opened
        }
        activityCount++;
    }

    @Override
    public void onActivityStarted(Activity activity) {
        if (activityCount == 0) {
            // App is opened
            isAppFullyOpened = true;
        }
        activityCount++;
    }

    @Override
    public void onActivityResumed(Activity activity) {
        // Handle activity resumed
    }

    @Override
    public void onActivityPaused(Activity activity) {
        // Handle activity paused
    }

    @Override
    public void onActivityStopped(Activity activity) {
        activityCount--;
        if (activityCount == 0) {
            // App is in the background
            isAppFullyOpened = false;
        }
    }

    @Override
    public void onActivityDestroyed(Activity activity) {
        // Handle activity destroyed
    }

    @Override
    public void onActivitySaveInstanceState(Activity activity, Bundle outState) {
        // Handle activity state saving
    }

    public boolean isAppFullyOpened() {
        Log.w("co.gcalls.shell", "isAppFullyOpened: " + isAppFullyOpened);
        return isAppFullyOpened;
    }
}
