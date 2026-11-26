//
//  LocalStorageIosModule.m
//  Gcalls
//
//  Created by Minh Nong on 31/07/2023.
//

#import "LocalStorageIosModule.h"

@implementation LocalStorageIosModule
RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(saveData:(NSString *)key value:(NSString *)value) {
    // Your implementation to save data to local storage
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    [defaults setObject:value forKey:key];
    [defaults synchronize];
}

RCT_EXPORT_METHOD(getData:(NSString *)key resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    NSString *value = [defaults objectForKey:key];
    if (value) {
        resolve(value);
    } else {
        NSString *errorMessage = [NSString stringWithFormat:@"Data not found for key: %@", key];
        NSError *error = [NSError errorWithDomain:@"com.yourapp" code:404 userInfo:@{NSLocalizedDescriptionKey: errorMessage}];
        reject(@"not_found", errorMessage, error);
    }
}

// Phiên bản app (CFBundleShortVersionString), số build (CFBundleVersion) và bundle id – hiện khi khởi động,
// so với App Store để yêu cầu cập nhật (services/appUpdate.js)
RCT_EXPORT_METHOD(getAppInfo:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
    NSDictionary *info = [[NSBundle mainBundle] infoDictionary];
    resolve(@{
        @"version": info[@"CFBundleShortVersionString"] ?: @"",
        @"build": info[@"CFBundleVersion"] ?: @"",
        @"bundleId": [[NSBundle mainBundle] bundleIdentifier] ?: @"",
    });
}

@end
