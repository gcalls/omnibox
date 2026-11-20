#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <React/RCTLinkingManager.h>
#import <Foundation/Foundation.h>
#import <React/RCTBridge.h>
#import "UserActivityModule.h"

#import <Intents/Intents.h>

#import <UserNotifications/UserNotifications.h>
#import <RNCPushNotificationIOS.h>
#import "LocalStorageIosModule.h"





@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"Gcalls";
//  NSLog(@"Callkit - LAUNCH APPPPPPP: %@");

  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
   UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
  center.delegate = self;

  self.initialProps = @{};
  [UserActivityModule new];


  NSString *userAgent = @"Mozilla/5.0 (Linux; Android 10; Android SDK built for x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.185 Mobile Safari/537.36";
  NSDictionary *dictionnary = [[NSDictionary alloc] initWithObjectsAndKeys:userAgent, @"UserAgent", nil];
[[NSUserDefaults standardUserDefaults] registerDefaults:dictionnary];
  

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}


//Called when a notification is delivered to a foreground app.
-(void)userNotificationCenter:(UNUserNotificationCenter *)center willPresentNotification:(UNNotification *)notification withCompletionHandler:(void (^)(UNNotificationPresentationOptions options))completionHandler
{
  completionHandler(UNNotificationPresentationOptionSound | UNNotificationPresentationOptionAlert | UNNotificationPresentationOptionBadge);
}

- (void)applicationWillEnterForeground:(UIApplication *)application {
//    NSLog(@"Callkit - App resumed from the background");
    // Your code here
}


- (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity restorationHandler:(void (^)(NSArray * _Nullable))restorationHandler {
    UserActivityModule *module = [self.bridge moduleForName:@"UserActivityModule"];
  
    if ([userActivity.activityType isEqualToString:INStartAudioCallIntentIdentifier]) {
        INStartAudioCallIntent *startAudioCallIntent = (INStartAudioCallIntent *)userActivity.interaction.intent;
        INPerson *contact = startAudioCallIntent.contacts.firstObject;
        NSString *phoneNumber = contact.personHandle.value;

        [[NSUserDefaults standardUserDefaults] setObject:phoneNumber forKey:@"phoneNumber"];
        [[NSUserDefaults standardUserDefaults] synchronize];

      // Retrieve the saved phone number from local storage using NSUserDefaults
        NSString *retrievedPhoneNumber = [[NSUserDefaults standardUserDefaults] objectForKey:@"phoneNumber"];
        NSLog(@"Retrieved Phone number: %@", retrievedPhoneNumber);

  
        // Emit the modified phone number to your React Native code using the supportedEvents
        [module sendEventWithName:@"continueUserActivity" body:@{@"phoneNumber": phoneNumber}];

        return YES;
    }

    return NO;
}

//-------------
// Required for the register event.
- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
 [RNCPushNotificationIOS didRegisterForRemoteNotificationsWithDeviceToken:deviceToken];
}
// Required for the notification event. You must call the completion handler after handling the remote notification.
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo
fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  [RNCPushNotificationIOS didReceiveRemoteNotification:userInfo fetchCompletionHandler:completionHandler];
}
// Required for the registrationError event.
- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
{
 [RNCPushNotificationIOS didFailToRegisterForRemoteNotificationsWithError:error];
}
// Required for localNotification event
- (void)userNotificationCenter:(UNUserNotificationCenter *)center
didReceiveNotificationResponse:(UNNotificationResponse *)response
         withCompletionHandler:(void (^)(void))completionHandler
{
  [RNCPushNotificationIOS didReceiveNotificationResponse:response];
}
//-------------


//- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
//    if ([url.scheme isEqualToString:@"tel"]) {
//        NSString *phoneNumber = [url.absoluteString stringByReplacingOccurrencesOfString:@"tel:" withString:@""];
//        NSLog(@"Initiating phone call to %@", phoneNumber);
//        [[UIApplication sharedApplication] openURL:url options:@{} completionHandler:nil];
//        return YES;
//    }
//    return NO;
//}





- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

/// This method controls whether the `concurrentRoot`feature of React18 is turned on or off.
///
/// @see: https://reactjs.org/blog/2022/03/29/react-v18.html
/// @note: This requires to be rendering on Fabric (i.e. on the New Architecture).
/// @return: `true` if the `concurrentRoot` feature is enabled. Otherwise, it returns `false`.
- (BOOL)concurrentRootEnabled
{
  return true;
}

// Add this inside `@implementation AppDelegate` above `@end`:
- (BOOL)application:(UIApplication *)application
   openURL:(NSURL *)url
   options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  // NSLog(@"Callkit - Open URL: %@", url);
  
  
  return [RCTLinkingManager application:application openURL:url options:options];
}

//- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
//{
//  if ([url.scheme isEqualToString:@"tel"]) {
//    // Handle the URL as desired
//    return YES;
//  }
//
//  // Handle other URLs as desired
//
//  return NO;
//}


@end
