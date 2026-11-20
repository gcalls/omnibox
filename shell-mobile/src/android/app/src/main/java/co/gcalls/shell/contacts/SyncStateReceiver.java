package co.gcalls.shell.contacts;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.accounts.Account;
import android.content.ContentResolver;
import android.net.ConnectivityManager;
import android.provider.ContactsContract;
// import LOg and set package name
import android.util.Log;


public class SyncStateReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        // Log.w("SyncStateReceiver", " " + intent.getAction());
        if (ConnectivityManager.CONNECTIVITY_ACTION.equals(intent.getAction())
                && "com.android.sync.SYNC_CONN_STATUS_CHANGED".equals(intent.getStringExtra("change"))) {
            // Check the sync adapter's state and perform your desired action
            Account account = new Account("your_account_name", "your_account_type");
            if (ContentResolver.isSyncActive(account, ContactsContract.AUTHORITY)) {
                // The contacts provider sync adapter is currently active
                // Perform your desired action here
            } else {
                // The contacts provider sync adapter is currently inactive
                // Perform your desired action here
            }
        }
    }
}
