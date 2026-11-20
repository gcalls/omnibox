package co.gcalls.shell.contacts;
import android.database.Cursor;
import android.content.Context;

import android.accounts.AccountManager;
import android.accounts.AccountManagerFuture;
import android.app.Service;
import android.content.Intent;
import android.os.Bundle;
import android.os.IBinder;
import android.util.Log;
import android.content.ContentValues;
import android.provider.ContactsContract;
import android.content.ContentValues;
import android.net.Uri;
import android.provider.ContactsContract;
import android.content.ContentUris;
import co.gcalls.shell.contacts.ContactColumns;
import android.content.ContentResolver;

import android.net.Uri;
import co.gcalls.shell.provider.ContactProviderContract;


public class ContactUpdateService extends Service {
	
	private static final String TAG = "ContactUpdateService";

	@Override
	public IBinder onBind(Intent arg0) {
		return null;
	}

	@Override
	public void onCreate() {
		super.onCreate();
        Log.v(TAG, "FUNC SYNC CONTACT STARTED");
		ContactsManager.updateContact(this, "Sync (Beta)");
		AccountManager manager = AccountManager.get(this);
		AccountManagerFuture<Bundle> future = manager.addAccount(ContactsManager.accountType, null, null, null, null, null, null);
		Intent intent = new Intent(this, AuthenticatorActivity.class);
		try {
			intent.putExtras(future.getResult());
			startActivity(intent);
		}
		catch (Exception e) {
			e.printStackTrace();
		}
	
	}

    public void syncContacts() {
        // Define the projection to use for the query
        String[] projection = {
                ContactColumns.TABLE_NAME,
                ContactColumns.PHONE_NUMBER,
                ContactColumns.EMAIL,
                // ContactColumns.CUSTOM_FIELD_NAME
        };

        Log.v(TAG, "FUNC SYNC CONTACT STARTED");
        Context context = this;
        ContentResolver contentResolver = context.getContentResolver();

        // Query the provider for the contacts
        Cursor cursor = contentResolver.query(
                Uri.parse("content://" + "co.gcalls.shell.provider.contactprovider" + "/contacts"),
                null,
                null,
                null,
                null
        );


        // Iterate over the cursor and add/update the contacts in the default Contacts app
        if (cursor != null) {
            while (cursor.moveToNext()) {
                String name = cursor.getString(cursor.getColumnIndex(ContactColumns.TABLE_NAME));
                String phone = cursor.getString(cursor.getColumnIndex(ContactColumns.PHONE_NUMBER));
                String email = cursor.getString(cursor.getColumnIndex(ContactColumns.EMAIL));
                // String customField = cursor.getString(cursor.getColumnIndex(ContactColumns.CUSTOM_FIELD_NAME));

                // Build the values to use for the insert/update operation
                ContentValues values = new ContentValues();
                values.put(ContactsContract.Data.MIMETYPE, ContactsContract.CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE);
                values.put(ContactsContract.CommonDataKinds.StructuredName.DISPLAY_NAME, name);

                if (phone != null && !phone.isEmpty()) {
                    values.put(ContactsContract.Data.MIMETYPE, ContactsContract.CommonDataKinds.Phone.CONTENT_ITEM_TYPE);
                    values.put(ContactsContract.CommonDataKinds.Phone.NUMBER, phone);
                }

                if (email != null && !email.isEmpty()) {
                    values.put(ContactsContract.Data.MIMETYPE, ContactsContract.CommonDataKinds.Email.CONTENT_ITEM_TYPE);
                    values.put(ContactsContract.CommonDataKinds.Email.ADDRESS, email);
                }

                // if (customField != null && !customField.isEmpty()) {
                //     values.put(ContactsContract.Data.MIMETYPE, "vnd.android.cursor.item/co.gcalls.shell.profile");
                //     values.put("data1", customField);
                // }

                // Perform the insert/update operation
                Uri rawContactUri = getContentResolver().insert(ContactsContract.RawContacts.CONTENT_URI, values);
                long rawContactId = ContentUris.parseId(rawContactUri);
                values.clear();
                values.put(ContactsContract.Data.RAW_CONTACT_ID, rawContactId);
                values.put(ContactsContract.Data.MIMETYPE, ContactsContract.CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE);
                values.put(ContactsContract.CommonDataKinds.StructuredName.DISPLAY_NAME, name);
                getContentResolver().insert(ContactsContract.Data.CONTENT_URI, values);
            }

            cursor.close();
        }
    }


}