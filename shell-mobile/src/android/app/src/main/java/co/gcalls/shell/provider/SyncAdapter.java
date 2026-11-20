/*
 * Copyright (C) 2010 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
package co.gcalls.shell.contacts;

import android.content.ContentValues;
import android.provider.ContactsContract;
import android.content.ContentUris;
import co.gcalls.shell.contacts.ContactColumns;
import android.content.ContentResolver;

import android.net.Uri;
import co.gcalls.shell.provider.ContactProviderContract;
import android.content.ContentResolver;
import android.accounts.Account;
import android.content.AbstractThreadedSyncAdapter;
import android.content.ContentProviderClient;
import android.content.Context;
import android.content.SyncResult;
import android.os.Bundle;
import android.util.Log;
import android.database.Cursor;
// import android.support.v4.content.ContextCompat;
// import android.support.v4.app.ActivityCompat;
import android.content.pm.PackageManager;
import android.Manifest;

/**
 * SyncAdapter implementation for syncing sample SyncAdapter contacts to the
 * platform ContactOperations provider.  This sample shows a basic 2-way
 * sync between the client and a sample server.  It also contains an
 * example of how to update the contacts' status messages, which
 * would be useful for a messaging or social networking client.
 */
public class SyncAdapter extends AbstractThreadedSyncAdapter {


    private final Context mContext;
    // private final ContextCompat mContextCompat;
    // private static final int REQUEST_CODE = 1;
    // private static final ActivityCompat mActivityCompat;

    public SyncAdapter(Context context, boolean autoInitialize) {
        super(context, autoInitialize);
        this.mContext = context;

    }


    @Override
    public void onPerformSync(Account account, Bundle extras, String authority, ContentProviderClient provider, SyncResult syncResult) {
        // Perform the synchronization of data between your app and the Contacts app here
        // Log.d("SyncAdapter","SYNC ADAPTER CALLED");
            // ContactsManager.addContact(mContext, new Contact("1", "Gcalls", "(+84) 8985 870 99", ""));


    }
}

