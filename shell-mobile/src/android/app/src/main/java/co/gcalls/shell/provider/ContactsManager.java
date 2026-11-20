package co.gcalls.shell.contacts;

import android.app.Activity;
import android.content.ComponentName;
import android.content.ContentProviderOperation;
import android.content.ContentProviderResult;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.OperationApplicationException;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.content.res.Resources;
import android.content.res.XmlResourceParser;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.os.RemoteException;
import android.provider.ContactsContract;
import android.provider.ContactsContract.CommonDataKinds.Email;
import android.provider.ContactsContract.CommonDataKinds.Phone;
import android.provider.ContactsContract.CommonDataKinds.StructuredName;
import android.provider.ContactsContract.Data;
import android.provider.ContactsContract.RawContacts;
import android.util.AttributeSet;
import android.util.Log;
import android.util.Xml;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.accessibility.AccessibilityNodeInfo;
import android.widget.ImageView;
import android.widget.TextView;

import org.xmlpull.v1.XmlPullParser;
import org.xmlpull.v1.XmlPullParserException;
import org.xmlpull.v1.XmlPullParserFactory;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import androidx.core.content.ContextCompat;

import co.gcalls.shell.R;
import co.gcalls.shell.provider.ContactProviderContract;



public class ContactsManager {

    private static final String MIMETYPE_CUSTOM_FIELD = "vnd.android.cursor.item/co.gcalls.shell.profile";
    public static String accountType = AccountGeneral.ACCOUNT_TYPE;
    public static String accountName = "Gcalls";
    private static final String TAG = "ContactsManager";

    public static final String MIME_TYPE_CUSTOM_SECTION ="vnd.android.cursor.item/custom_section";


    private static final String CUSTOM_SECTION_LABEL = "Custom Section Label";

    public static void addContact(Context context, Contact contact) {

        Log.v("ContactsManager", "FUNC ADD CONTACT STARTED");
        ContentResolver contentResolver =context.getContentResolver();

        // Query the contacts from the provider
        // Uri contactsUri = ContactProviderContract.CONTACTS_WITH_CUSTOM_FIELDS_URI;
        // Uri contactsCustomFieldsUri= Uri.parse("content://" + "co.gcalls.shell.provider.contactprovider" + "/custom_fields");
        // public static final String CONTACTS_WITH_CUSTOM_FIELDS_PATH = "contacts_with_custom_fields";
        // public static final Uri CONTACTS_WITH_CUSTOM_FIELDS_URI = Uri.parse("content://" + AUTHORITY + "/" + CONTACTS_WITH_CUSTOM_FIELDS_PATH);

   

        Uri contactsUri = ContactProviderContract.CONTACTS_URI;
        // Uri contactsUri = ContactProviderContract.CONTACTS_WITH_CUSTOM_FIELDS_URI;

        Cursor cursor = contentResolver.query(contactsUri, null, null, null, null);

        Log.v("ContactsManager", "content://" + "co.gcalls.shell.provider.contactprovider" + "/contacts");

        

        // Create a list of content provider operations to insert the contacts into the default contact app
         ArrayList<ContentProviderOperation> ops = new ArrayList<>();
         

        // while (cursor.moveToNext()) {

            // String name = cursor.getString(cursor.getColumnIndexOrThrow("name"));
            // String phone = cursor.getString(cursor.getColumnIndexOrThrow("phone_number"));
            // String customFieldValue = cursor.getString(cursor.getColumnIndexOrThrow("custom_field_name"));

            // Log.v("TAG-name", name);
            // Log.v("TAG-phone", phone);
            // Log.v("TAG-custom-field-value", customFieldValue);



            // Set up the contact fields
            // String name = "John Doe 1";
            // String phoneNumber = "09090909090";
            // String providerName = "Gcalls";
            // Bitmap logoBitmap = BitmapFactory.decodeResource(context.getResources(), R.drawable.ic_launcher);

            // Create a new raw contact
            // ContentValues values = new ContentValues();
            // values.put(RawContacts.ACCOUNT_TYPE, "com.example.providerx");
            // values.put(RawContacts.ACCOUNT_NAME, "john.doe@example.com");
            // Uri rawContactUri = contentResolver.insert(RawContacts.CONTENT_URI, values);
            // long rawContactId = ContentUris.parseId(rawContactUri);

            // Add the name to the raw contact
            // values.clear();
            // values.put(Data.RAW_CONTACT_ID, rawContactId);
            // values.put(Data.MIMETYPE, StructuredName.CONTENT_ITEM_TYPE);
            // values.put(StructuredName.DISPLAY_NAME, name);
            // contentResolver.insert(Data.CONTENT_URI, values);

            // Add the phone number to the raw contact
            // values.clear();
            // values.put(Data.RAW_CONTACT_ID, rawContactId);
            // values.put(Data.MIMETYPE, Phone.CONTENT_ITEM_TYPE);
            // values.put(Phone.NUMBER, phoneNumber);
            // contentResolver.insert(Data.CONTENT_URI, values);

            // Add the provider logo to the raw contact
            // ByteArrayOutputStream stream = new ByteArrayOutputStream();
            // logoBitmap.compress(Bitmap.CompressFormat.PNG, 100, stream);
            // byte[] logoBytes = stream.toByteArray();
            // values.clear();
            // values.put(Data.RAW_CONTACT_ID, rawContactId);
            // values.put(Data.MIMETYPE, "vnd.android.cursor.item/provider_logo");
            // values.put("data15", logoBytes);
            // contentResolver.insert(Data.CONTENT_URI, values);




    
        // }

        try {
            contentResolver.applyBatch(ContactsContract.AUTHORITY, ops);
        } catch (RemoteException | OperationApplicationException e) {
            e.printStackTrace();
        }

    }


    public String getString(Context context ,int resId) {
        return context.getString(resId);
    }



    public static List<Contact> getContacts(Context context) {
        List<Contact> contactList = new ArrayList<>();
        Log.v("TAG", "FUNC GET CONTACTS STARTED ");
        
        ContentResolver contentResolver = context.getContentResolver();
        Cursor cursor = contentResolver.query(ContactsContract.Contacts.CONTENT_URI, null, null, null, null);

        if (cursor != null && cursor.getCount() > 0) {
            while (cursor.moveToNext()) {
                String id = cursor.getString(cursor.getColumnIndex(ContactsContract.Contacts._ID));
                String name = cursor.getString(cursor.getColumnIndex(ContactsContract.Contacts.DISPLAY_NAME));

                String phone = "";
                if (cursor.getInt(cursor.getColumnIndex(ContactsContract.Contacts.HAS_PHONE_NUMBER)) > 0) {
                    Cursor phoneCursor = contentResolver.query(
                            ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
                            null,
                            ContactsContract.CommonDataKinds.Phone.CONTACT_ID + " = ?",
                            new String[]{id},
                            null);

                    if (phoneCursor != null && phoneCursor.moveToFirst()) {
                        phone = phoneCursor.getString(phoneCursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER));
                        phoneCursor.close();
                    }
                }

                String customSection = "Custom section content"; // Replace this with your custom field value retrieval logic

                //...
      
                Cursor customCursor = contentResolver.query(
                        ContactsContract.Data.CONTENT_URI,
                        null,
                        ContactsContract.Data.CONTACT_ID + " = ? AND " + ContactsContract.Data.MIMETYPE + " = ?",
                        new String[]{id, MIMETYPE_CUSTOM_FIELD},
                        null);

                if (customCursor != null && customCursor.moveToFirst()) {
                    customSection = customCursor.getString(customCursor.getColumnIndex(ContactsContract.Data.DATA1));
                    customCursor.close();
                }


                Contact contact =  new Contact(id, name, phone, customSection);
                contactList.add(contact);
            }
            cursor.close();
        }

        return contactList;
    }
    

    public static void updateContact(Context context, String name) {
            int id = -1;
            Cursor cursor = context.getContentResolver().query(Data.CONTENT_URI,
                    new String[] { Data.RAW_CONTACT_ID, Data.DISPLAY_NAME, Data.MIMETYPE, Data.CONTACT_ID },
                    StructuredName.DISPLAY_NAME + "= ?",
                    new String[] { name }, null);
            if (cursor != null && cursor.moveToFirst()) {
                do {
                    id = cursor.getInt(0);
                    // Log.d("TEST 0", cursor.getString(0));
                    // Log.d("TEST 1", cursor.getString(1));
                    // Log.d("TEST 2", cursor.getString(2));
                    // Log.d("TEST 3", cursor.getString(3));

                } while (cursor.moveToNext());
            }
            if (id != -1) {
                ArrayList<ContentProviderOperation> ops = new ArrayList<>();

                // ops.add(ContentProviderOperation.newInsert(Data.CONTENT_URI)
                //         .withValue(Data.RAW_CONTACT_ID, id)
                //         .withValue(Data.MIMETYPE, Email.CONTENT_ITEM_TYPE)
                //         .withValue(Email.DATA, "sample")
                //         .build());

                // ops.add(ContentProviderOperation.newInsert(Data.CONTENT_URI)
                //         .withValue(Data.RAW_CONTACT_ID, id)
                //         .withValue(Data.MIMETYPE, MIMETYPE_CUSTOM_FIELD)
                //         .withValue(Data.DATA1, "profile")
                //         .build());

                try {
                    context.getContentResolver().applyBatch(ContactsContract.AUTHORITY, ops);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            } else {
                // Log.d("ContactsManager", "Contact not found");
            }
        }
}


