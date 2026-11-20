#import "UserActivityModule.h"
#import <Intents/Intents.h>

@implementation UserActivityModule

RCT_EXPORT_MODULE()

- (NSArray<NSString *> *)supportedEvents {
    return @[@"continueUserActivity"];
}

- (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity restorationHandler:(void (^)(NSArray * _Nullable))restorationHandler {
    if ([userActivity.activityType isEqualToString:INStartAudioCallIntentIdentifier]) {
        INStartAudioCallIntent *startAudioCallIntent = (INStartAudioCallIntent *)userActivity.interaction.intent;
        INPerson *contact = startAudioCallIntent.contacts.firstObject;
        NSString *phoneNumber = contact.personHandle.value;
        NSLog(@"Phone number: %@", phoneNumber);
        
        // Modify the phone number to the desired format
        NSString *modifiedPhoneNumber = [NSString stringWithFormat:@"gcall://%@", phoneNumber];
        
        // Emit the modified phone number to your React Native code using the supportedEvents
        [self sendEventWithName:@"continueUserActivity" body:@{@"phoneNumber": modifiedPhoneNumber}];
        
        // Pass the modified phone number to your React Native code using the restorationHandler
        restorationHandler(@[modifiedPhoneNumber]);
        
        return YES;
    }
    
    return NO;
}

@end
