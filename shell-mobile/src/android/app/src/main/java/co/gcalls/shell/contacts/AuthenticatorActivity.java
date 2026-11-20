package co.gcalls.shell.contacts;

import android.accounts.Account;
import android.accounts.AccountAuthenticatorActivity;
import android.accounts.AccountManager;
import android.content.ContentResolver;
import android.content.Intent;
import android.os.Bundle;
import android.provider.ContactsContract;
import android.util.Log;


/**
 * The Authenticator activity.
 *
 * Called by the Authenticator and in charge of identifing the user.
 *
 * It sends back to the Authenticator the result.
 */
public class AuthenticatorActivity extends AccountAuthenticatorActivity {

    private AccountManager mAccountManager;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.i("AuthenticatorActivity","AuthenticatorActivity");
        Intent res = new Intent();
        res.putExtra(AccountManager.KEY_ACCOUNT_NAME, AccountGeneral.ACCOUNT_NAME);
        res.putExtra(AccountManager.KEY_ACCOUNT_TYPE, AccountGeneral.ACCOUNT_TYPE);
        res.putExtra(AccountManager.KEY_AUTHTOKEN, AccountGeneral.ACCOUNT_TOKEN);
        Account account = new Account(AccountGeneral.ACCOUNT_NAME, AccountGeneral.ACCOUNT_TYPE);
        mAccountManager = AccountManager.get(this);
        mAccountManager.addAccountExplicitly(account, null, null);


        //mAccountManager.setAuthToken(account, AccountGeneral.AUTHTOKEN_TYPE_FULL_ACCESS, AccountGeneral.ACCOUNT_TOKEN);
        // ContentResolver.setSyncAutomatically(account, ContactsContract.AUTHORITY, true);
        // Request a manual sync
        setAccountAuthenticatorResult(res.getExtras());
        ContentResolver.requestSync(account, ContactsContract.AUTHORITY, Bundle.EMPTY);
        ContentResolver.setIsSyncable(account, ContactsContract.AUTHORITY, 1);
        ContentResolver.setSyncAutomatically(account, ContactsContract.AUTHORITY, false);
        ContentResolver.addPeriodicSync(account, ContactsContract.AUTHORITY, res.getExtras(), 3600);

        // Bundle extras = new Bundle();
        // extras.putBoolean(ContentResolver.SYNC_EXTRAS_MANUAL, false);
        // extras.putBoolean(ContentResolver.SYNC_EXTRAS_EXPEDITED, false);
        // Log.d("AuthenticatorActivity", "Account created");
        setResult(RESULT_OK, res);
        finish();
    }
}