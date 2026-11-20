package co.gcalls.shell.provider;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.content.UriMatcher;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteQueryBuilder;
import android.net.Uri;
import android.text.TextUtils;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

public class ContactProvider extends ContentProvider {
    private static final int CONTACTS = 1;
    private static final int CONTACT_ID = 2;
    private static final int CUSTOM_FIELDS = 3;
    private static final int CUSTOM_FIELD_ID = 4;
    private static final int CONTACTS_WITH_CUSTOM_FIELDS = 5;
    private static final String AUTHORITY = "co.gcalls.shell.provider.contactprovider";
    private static final String BASE_PATH = "contacts";
    private static final String CUSTOM_FIELDS_BASE_PATH = "custom_fields";
    public static final Uri CONTENT_URI = Uri.parse("content://" + AUTHORITY + "/" + BASE_PATH);
    public static final Uri CUSTOM_FIELDS_CONTENT_URI = Uri.parse("content://" + AUTHORITY + "/" + CUSTOM_FIELDS_BASE_PATH);
    private static final UriMatcher sUriMatcher = new UriMatcher(UriMatcher.NO_MATCH);

    static {
        sUriMatcher.addURI(AUTHORITY, BASE_PATH, CONTACTS);
        sUriMatcher.addURI(AUTHORITY, BASE_PATH + "/#", CONTACT_ID);
        sUriMatcher.addURI(AUTHORITY, CUSTOM_FIELDS_BASE_PATH, CUSTOM_FIELDS);
        sUriMatcher.addURI(AUTHORITY, CUSTOM_FIELDS_BASE_PATH + "/#", CUSTOM_FIELD_ID);
        sUriMatcher.addURI(AUTHORITY, BASE_PATH + "/contacts_with_custom_fields", CONTACTS_WITH_CUSTOM_FIELDS);
    }

    private DatabaseHelper dbHelper;

    @Override
    public boolean onCreate() {
        // Log.d("ContactProvider", "onCreate DB");
        dbHelper = new DatabaseHelper(getContext());
        return true;
    }

    @Nullable
    @Override
    public Cursor query(@NonNull Uri uri, @Nullable String[] projection, @Nullable String selection, @Nullable String[] selectionArgs, @Nullable String sortOrder) {

        // Log.d("ContactProvider", "onQuery DB");

        SQLiteDatabase db = dbHelper.getWritableDatabase();
        Cursor cursor;

        // Log.d("ContactProvider", "URI: " + uri.toString() + " Match: " + sUriMatcher.match(uri) + "");

        switch (sUriMatcher.match(uri)) {
            case CONTACTS:
                // Log.d("ContactProvider", "onQuery DB CONTACTS");
                // cursor = db.rawQuery("SELECT * FROM " + ContactProviderContract.Contacts.TABLE_NAME, null);
                cursor = db.rawQuery("SELECT contacts.*, custom_fields.* " +
                    "FROM contacts " +
                    "INNER JOIN custom_fields " +
                    "ON contacts._id = custom_fields.contact_id", null);
                break;
            case CONTACT_ID:
                // Log.d("ContactProvider", "onQuery DB CONTACT_ID");
                cursor = db.rawQuery("SELECT * FROM " + ContactProviderContract.Contacts.TABLE_NAME + " WHERE " + ContactProviderContract.Contacts._ID + " = ?", new String[] {uri.getLastPathSegment()});
                break;
            case CUSTOM_FIELDS:
                // Log.d("ContactProvider", "onQuery DB CUSTOM_FIELDS");
                cursor = db.rawQuery("SELECT * FROM " + ContactProviderContract.CustomFields.TABLE_NAME, null);
                break;
            case CUSTOM_FIELD_ID:
                // Log.d("ContactProvider", "onQuery DB CUSTOM_FIELD_ID");
                cursor = db.rawQuery("SELECT * FROM " + ContactProviderContract.CustomFields.TABLE_NAME + " WHERE " + ContactProviderContract.CustomFields._ID + " = ?", new String[] {uri.getLastPathSegment()});
                break;
            case CONTACTS_WITH_CUSTOM_FIELDS:
                // Log.d("ContactProvider", "onQuery DB CONTACTS_WITH_CUSTOM_FIELDS");
                cursor = db.rawQuery("SELECT contacts.*, custom_fields.* " +
                                    "FROM contacts " +
                                    "INNER JOIN custom_fields " +
                                    "ON contacts._id = custom_fields.contact_id", null);
                break;

            default:
                throw new IllegalArgumentException("Unknown URI: " + uri);
        }

        cursor.setNotificationUri(getContext().getContentResolver(), uri);
        return cursor;
    }


    @Nullable
    @Override
    public String getType(@NonNull Uri uri) {


        // Log.d("ContactProvider", "URI: " + uri.toString() + " Match: " + sUriMatcher.match(uri) + "");
        switch (sUriMatcher.match(uri)) {
            case CONTACTS:
                return ContactProviderContract.Contacts.CONTENT_TYPE;
            case CONTACT_ID:
                return ContactProviderContract.Contacts.CONTENT_ITEM_TYPE;
            case CUSTOM_FIELDS:
                return ContactProviderContract.CustomFields.CONTENT_TYPE;
            case CUSTOM_FIELD_ID:
                return ContactProviderContract.CustomFields.CONTENT_ITEM_TYPE;
            default:
                throw new IllegalArgumentException("Unknown URI: " + uri);
        }
    }


    @Nullable
    @Override
    public Uri insert(@NonNull Uri uri, @Nullable ContentValues values) {
        SQLiteDatabase db = dbHelper.getWritableDatabase();

        switch (sUriMatcher.match(uri)) {
            case CONTACTS:
                long contactId = db.insert(ContactProviderContract.Contacts.TABLE_NAME, null, values);
                getContext().getContentResolver().notifyChange(uri, null);
                return Uri.withAppendedPath(CONTENT_URI, String.valueOf(contactId));
            case CUSTOM_FIELDS:
                long customFieldId = db.insert(ContactProviderContract.CustomFields.TABLE_NAME, null, values);
                getContext().getContentResolver().notifyChange(uri, null);
                return Uri.withAppendedPath(CUSTOM_FIELDS_CONTENT_URI, String.valueOf(customFieldId));
            default:
                throw new IllegalArgumentException("Unknown URI: " + uri);
        }
    }



    @Nullable
    @Override
    public int update(@NonNull Uri uri, @Nullable ContentValues values, @Nullable String selection, @Nullable String[] selectionArgs) {
        SQLiteDatabase db = dbHelper.getWritableDatabase();
        int rowsUpdated = 0;

        switch (sUriMatcher.match(uri)) {
            case CONTACTS:
                rowsUpdated = db.update(ContactProviderContract.Contacts.TABLE_NAME, values, selection, selectionArgs);
                break;
            case CONTACT_ID:
                String id = uri.getLastPathSegment();
                if (TextUtils.isEmpty(selection)) {
                    rowsUpdated = db.update(ContactProviderContract.Contacts.TABLE_NAME, values,
                            ContactProviderContract.Contacts._ID + "=" + id, null);
                } else {
                    rowsUpdated = db.update(ContactProviderContract.Contacts.TABLE_NAME, values,
                            ContactProviderContract.Contacts._ID + "=" + id + " and " + selection, selectionArgs);
                }
                break;
            case CUSTOM_FIELDS:
                rowsUpdated = db.update(ContactProviderContract.CustomFields.TABLE_NAME, values, selection, selectionArgs);
                break;
            case CUSTOM_FIELD_ID:
                String customFieldId = uri.getLastPathSegment();
                if (TextUtils.isEmpty(selection)) {
                    rowsUpdated = db.update(ContactProviderContract.CustomFields.TABLE_NAME, values,
                            ContactProviderContract.CustomFields._ID + "=" + customFieldId, null);
                } else {
                    rowsUpdated = db.update(ContactProviderContract.CustomFields.TABLE_NAME, values,
                            ContactProviderContract.CustomFields._ID + "=" + customFieldId + " and " + selection, selectionArgs);
                }
                break;
            default:
                throw new IllegalArgumentException("Unknown URI: " + uri);
        }

        getContext().getContentResolver().notifyChange(uri, null);
        return rowsUpdated;
    }



    @Nullable
    @Override
    public int delete(@NonNull Uri uri, @Nullable String selection, @Nullable String[] selectionArgs) {
        SQLiteDatabase db = dbHelper.getWritableDatabase();
        int rowsDeleted = 0;

        switch (sUriMatcher.match(uri)) {
            case CONTACTS:
                rowsDeleted = db.delete(ContactProviderContract.Contacts.TABLE_NAME, selection, selectionArgs);
                break;
            case CONTACT_ID:
                String id = uri.getLastPathSegment();
                if (TextUtils.isEmpty(selection)) {
                    rowsDeleted = db.delete(ContactProviderContract.Contacts.TABLE_NAME,
                            ContactProviderContract.Contacts._ID + "=" + id, null);
                } else {
                    rowsDeleted = db.delete(ContactProviderContract.Contacts.TABLE_NAME,
                            ContactProviderContract.Contacts._ID + "=" + id + " and " + selection, selectionArgs);
                }
                break;
            case CUSTOM_FIELDS:
                rowsDeleted = db.delete(ContactProviderContract.CustomFields.TABLE_NAME, selection, selectionArgs);
                break;
            case CUSTOM_FIELD_ID:
                String customFieldId = uri.getLastPathSegment();
                if (TextUtils.isEmpty(selection)) {
                    rowsDeleted = db.delete(ContactProviderContract.CustomFields.TABLE_NAME,
                            ContactProviderContract.CustomFields._ID + "=" + customFieldId, null);
                } else {
                    rowsDeleted = db.delete(ContactProviderContract.CustomFields.TABLE_NAME,
                            ContactProviderContract.CustomFields._ID + "=" + customFieldId + " and " + selection, selectionArgs);
                }
                break;
            default:
                throw new IllegalArgumentException("Unknown URI: " + uri);
        }

        getContext().getContentResolver().notifyChange(uri, null);
        return rowsDeleted;
    }


}
