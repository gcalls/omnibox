//
//  LocalStorageIosModule.m
//  Gcalls
//
//  Created by Minh Nong on 31/07/2023.
//

#import "LocalStorageIosModule.h"
#import <AVFoundation/AVFoundation.h>

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

// Quyền micro (màn hình cấp quyền lần đầu – components/Boot.tsx): "granted" | "denied" | "undetermined"
static NSString *MicStatus(void) {
    switch ([[AVAudioSession sharedInstance] recordPermission]) {
        case AVAudioSessionRecordPermissionGranted: return @"granted";
        case AVAudioSessionRecordPermissionDenied: return @"denied";
        default: return @"undetermined";
    }
}

RCT_EXPORT_METHOD(microphonePermission:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
    resolve(MicStatus());
}

RCT_EXPORT_METHOD(requestMicrophone:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
    [[AVAudioSession sharedInstance] requestRecordPermission:^(BOOL granted) {
        resolve(granted ? @"granted" : @"denied");
    }];
}

@end
