package co.gcalls.shell.provider;

import android.content.Context;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

public class DatabaseHelper extends SQLiteOpenHelper {
    public static final String DATABASE_NAME = "Contacts.db";
    public static final int DATABASE_VERSION = 1;

    public DatabaseHelper(Context context) {
        super(context, DATABASE_NAME, null, DATABASE_VERSION);
    }

    
    @Override
    public void onCreate(SQLiteDatabase db) {
        db.execSQL("CREATE TABLE " + ContactProviderContract.Contacts.TABLE_NAME + " (" +
                ContactProviderContract.Contacts._ID + " INTEGER PRIMARY KEY AUTOINCREMENT," +
                ContactProviderContract.Contacts.NAME + " TEXT," +
                ContactProviderContract.Contacts.PHONE_NUMBER + " TEXT," +
                ContactProviderContract.Contacts.EMAIL + " TEXT" +
                ");");

        db.execSQL("CREATE TABLE " + ContactProviderContract.CustomFields.TABLE_NAME + " (" +
                ContactProviderContract.CustomFields._ID + " INTEGER PRIMARY KEY AUTOINCREMENT," +
                ContactProviderContract.CustomFields.CONTACT_ID + " INTEGER," +
                ContactProviderContract.CustomFields.CUSTOM_FIELD_NAME + " TEXT," +
                "FOREIGN KEY(" + ContactProviderContract.CustomFields.CONTACT_ID + ") REFERENCES " +
                ContactProviderContract.Contacts.TABLE_NAME + "(" + ContactProviderContract.Contacts._ID + ")" +
                ");");
    }


    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        db.execSQL("DROP TABLE IF EXISTS " + ContactProviderContract.CustomFields.TABLE_NAME);
        db.execSQL("DROP TABLE IF EXISTS " + ContactProviderContract.Contacts.TABLE_NAME);
        onCreate(db);
    }


    public void doSelectRawQuery(SQLiteDatabase db) {
        db.rawQuery("SELECT * FROM contacts con INNER JOINT custom_fields field WHERE con._id = field.contact_id", null);
    }
}
