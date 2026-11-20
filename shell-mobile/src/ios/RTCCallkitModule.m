//
//  RTCCallkitModule.m
//  Gcalls
//
//  Created by Minh Nong on 27/04/2023.
//

// CalendarManagerBridge.m
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(CallKitModule, NSObject)

RCT_EXTERN_METHOD(startCall:(NSString *)name)

RCT_EXTERN_METHOD(endCall)




@end
