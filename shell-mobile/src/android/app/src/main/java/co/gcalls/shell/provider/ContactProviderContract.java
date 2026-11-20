package co.gcalls.shell.provider;

import android.net.Uri;
import android.provider.BaseColumns;

public class ContactProviderContract {

    public static final String AUTHORITY = "co.gcalls.shell.provider.contactprovider";
    public static final Uri CONTENT_URI = Uri.parse("content://" + AUTHORITY);

    // content://" + "co.gcalls.shell.provider.contactprovider" + "/custom_fields"
    public static final String CONTACTS_PATH = "contacts";
    public static final Uri CONTACTS_URI = Uri.parse("content://" + AUTHORITY + "/" + CONTACTS_PATH);

    public static final String CONTACTS_WITH_CUSTOM_FIELDS_PATH = "contacts_with_custom_fields";
    public static final Uri CONTACTS_WITH_CUSTOM_FIELDS_URI = Uri.parse("content://" + AUTHORITY + "/" + CONTACTS_WITH_CUSTOM_FIELDS_PATH);


    public static class Contacts implements BaseColumns {
        public static final String TABLE_NAME = "contacts";
        public static final String NAME = "name";
        public static final String PHONE_NUMBER = "phone_number";
        public static final String EMAIL = "email";
        public static final String CONTENT_TYPE = "vnd.android.cursor.dir/vnd." + AUTHORITY + "." + TABLE_NAME;

        public static final Uri CONTENT_URI = Uri.withAppendedPath(ContactProviderContract.CONTENT_URI, TABLE_NAME);
        public static final String CONTENT_ITEM_TYPE = "vnd.android.cursor.item/vnd." + AUTHORITY + "." + TABLE_NAME;
    }

    public static class CustomFields implements BaseColumns {
        public static final String TABLE_NAME = "custom_fields";
        public static final String CONTACT_ID = "contact_id";
        public static final String CUSTOM_FIELD_NAME = "custom_field";

        public static final Uri CONTENT_URI = Uri.withAppendedPath(ContactProviderContract.CONTENT_URI, TABLE_NAME);
        public static final String CONTENT_TYPE = "vnd.android.cursor.dir/vnd." + AUTHORITY + "." + TABLE_NAME;
        public static final String CONTENT_ITEM_TYPE = "vnd.android.cursor.item/vnd." + AUTHORITY + "." + TABLE_NAME;
    }
}


