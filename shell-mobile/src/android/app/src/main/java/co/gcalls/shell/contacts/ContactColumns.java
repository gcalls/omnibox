package co.gcalls.shell.contacts;

import android.provider.BaseColumns;
import co.gcalls.shell.provider.ContactProviderContract;

public final class ContactColumns implements BaseColumns {
    public static final String CUSTOM_FIELD_NAME = "custom_field";
    public static final String TABLE_NAME = "contacts";
    public static final String DISPLAY_NAME = "display_name";
    public static final String PHONE_NUMBER = "phone_number";
    public static final String EMAIL = "email";
    public static final String CONTACT_ID   = "contact_id";
    public static final String CONTACT_NAME = "contact_name";
    public static final  String TABLE_NAME_CUSTOM_FIELDS = "custom_fields";
    public static final String CONTENT_TYPE = "vnd.android.cursor.dir/vnd." + ContactProviderContract.AUTHORITY + "." + TABLE_NAME;
    public static final String CONTENT_ITEM_TYPE = "vnd.android.cursor.item/vnd." + ContactProviderContract.AUTHORITY + "." + TABLE_NAME;
    public static final String CONTENT_ITEM_TYPE_CUSTOM_FIELDS = "vnd.android.cursor.item/vnd." + ContactProviderContract.AUTHORITY + "." + TABLE_NAME_CUSTOM_FIELDS;
}
