package co.gcalls.shell.contacts;

public class Contact {
	
	public String name;
	public String lastName;
	public String phone;
	public String customSection;
	public String id;
	
    public Contact(String id, String name, String phone, String customSection) {
        this.id = id;
        this.name = name;
        this.phone = phone;
        this.customSection = customSection;
	}


	public String getName() {
		return name;
	}
	
	public String getPhone() {
		return phone;
	}


	public String getCustomSection() {
		return customSection;
	}
	
}