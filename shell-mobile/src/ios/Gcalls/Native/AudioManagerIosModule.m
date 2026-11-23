//
//  AudioManagerIosModule.m
//  Gcalls
//
//  Created by Minh Nong on 04/08/2023.
//

// AudioManagerIosModule.m

#import "AudioManagerIosModule.h"
#import <AVFoundation/AVFoundation.h>

@implementation AudioManagerIosModule

RCT_EXPORT_MODULE();



// Private property to store the shared audio session
static AVAudioSession *sharedAudioSession = nil;


// Private method to get the shared audio session
- (AVAudioSession *)getSharedAudioSession {
    if (!sharedAudioSession) {
        sharedAudioSession = [AVAudioSession sharedInstance];
    }
    return sharedAudioSession;
}

// Enable the built-in microphone for the audio session
- (void)enableBuiltInMic {
    AVAudioSession *audioSession = [self getSharedAudioSession];
    
    // Find the built-in microphone input.
    NSArray<AVAudioSessionPortDescription *> *availableInputs = audioSession.availableInputs;
    
    NSPredicate *predicate = [NSPredicate predicateWithBlock:^BOOL(AVAudioSessionPortDescription * _Nullable portDescription, NSDictionary<NSString *,id> * _Nullable bindings) {
        return [portDescription.portType isEqualToString:AVAudioSessionPortBuiltInMic];
    }];
    
    NSArray<AVAudioSessionPortDescription *> *builtInMicInputs = [availableInputs filteredArrayUsingPredicate:predicate];
    
    if (builtInMicInputs.count == 0) {
        NSLog(@"The device must have a built-in microphone.");
        return;
    }
    
    AVAudioSessionPortDescription *builtInMicInput = [builtInMicInputs firstObject];
    
    // Make the built-in microphone input the preferred input.
    NSError *error = nil;
    if (![audioSession setPreferredInput:builtInMicInput error:&error]) {
        NSLog(@"Unable to set the built-in mic as the preferred input. Error: %@", error.localizedDescription);
    }
}



- (NSString *)getCurrentAudioRoute {
    AVAudioSession *audioSession = [AVAudioSession sharedInstance];
    AVAudioSessionRouteDescription *currentRoute = audioSession.currentRoute;
    
    NSMutableString *audioRouteInfo = [NSMutableString string];
    for (AVAudioSessionPortDescription *output in currentRoute.outputs) {
        [audioRouteInfo appendFormat:@"Output Port Type: %@\n", output.portType];
        [audioRouteInfo appendFormat:@"Output Name: %@\n", output.portName];
        [audioRouteInfo appendFormat:@"Output UID: %@\n", output.UID];
    }
    
    for (AVAudioSessionPortDescription *input in currentRoute.inputs) {
        [audioRouteInfo appendFormat:@"Input Port Type: %@\n", input.portType];
        [audioRouteInfo appendFormat:@"Input Name: %@\n", input.portName];
        [audioRouteInfo appendFormat:@"Input UID: %@\n", input.UID];
    }
    
    return [audioRouteInfo copy];
}



- (void)listAvailableOutputPorts {
    AVAudioSession *audioSession = [AVAudioSession sharedInstance];
    NSArray<AVAudioSessionPortDescription *> *availableOutputs = audioSession.currentRoute.outputs;
    
    NSLog(@"Available Output Ports:");
    for (AVAudioSessionPortDescription *output in availableOutputs) {
        NSLog(@"Output Port Type: %@", output.portType);
        NSLog(@"Output Port Name: %@", output.portName);
        NSLog(@"Output Port UID: %@", output.UID);
        NSLog(@"---");
    }
}

// Function to print the details of an AVAudioSessionPortDescription
void printPortDescription(AVAudioSessionPortDescription *portDescription) {
    NSLog(@"Port Type: %@", portDescription.portType);
    NSLog(@"Port Name: %@", portDescription.portName);
    NSLog(@"Port UID: %@", portDescription.UID);
    NSLog(@"Selected Data Source: %@", portDescription.selectedDataSource);
    NSLog(@"Preferred Data Source: %@", portDescription.preferredDataSource);
    NSLog(@"Channels: %@", portDescription.channels);
}

// Function to print all available audio routes
void printAudioRoutes() {
    AVAudioSession *audioSession = [AVAudioSession sharedInstance];
    AVAudioSessionRouteDescription *currentRoute = audioSession.currentRoute;
    
    NSLog(@"Current Audio Route:");
    for (AVAudioSessionPortDescription *inputPort in currentRoute.inputs) {
        NSLog(@"--- Input Port ---");
        printPortDescription(inputPort);
    }
    
    for (AVAudioSessionPortDescription *outputPort in currentRoute.outputs) {
        NSLog(@"--- Output Port ---");
        printPortDescription(outputPort);
    }
}


// Configure the audio session for speaker output
- (void)configureAudioSessionToSpeaker {
  NSError *error = nil;
  AVAudioSession *audioSession = [self getSharedAudioSession];
  
  // Deactivate the audio session first
//  if (![audioSession setActive:NO error:&error]) {
//    NSLog(@"Failed to deactivate audio session: %@", error.localizedDescription);
//  }
//
  // Set the category to PlayAndRecord with DefaultToSpeaker option disabled
//  if (![audioSession setCategory:AVAudioSessionCategoryPlayAndRecord withOptions:0 error:&error]) {
//    NSLog(@"Failed to set audio session category: %@", error.localizedDescription);
//    return;
//  }
  

  
  // Set the category to MultiRoute with MixWithOthers option
//  if (![audioSession setCategory:AVAudioSessionCategoryMultiRoute withOptions:AVAudioSessionCategoryOptionMixWithOthers error:&error]) {
//      NSLog(@"Failed to set audio session category: %@", error.localizedDescription);
//      return;
//  }
  
  // Deactivate the audio session first with notification to other audio sessions
    if (![audioSession setActive:NO
                    withOptions:AVAudioSessionSetActiveOptionNotifyOthersOnDeactivation
                          error:&error]) {
        NSLog(@"Failed to deactivate audio session: %@", error.localizedDescription);
        return;
    }
    
    // Set the category to PlayAndRecord with Bluetooth option allowed
    if (![audioSession setCategory:AVAudioSessionCategoryPlayAndRecord
                       withOptions:AVAudioSessionCategoryOptionAllowBluetooth
                             error:&error]) {
        NSLog(@"Failed to set audio session category: %@", error.localizedDescription);
        return;
    }
    
    // Set the mode to VoiceChat for optimizing voice communication
    if (![audioSession setMode:AVAudioSessionModeVoiceChat error:&error]) {
        NSLog(@"Failed to set audio session mode: %@", error.localizedDescription);
        return;
    }
    
    // Activate the audio session
    if (![audioSession setActive:YES error:&error]) {
        NSLog(@"Failed to activate audio session: %@", error.localizedDescription);
        return;
    }
//
  // Override the output audio port to none (to use the receiver)
//  if (![audioSession overrideOutputAudioPort:AVAudioSessionPortOverrideNone error:&error]) {
//    NSLog(@"Failed to override output audio port: %@", error.localizedDescription);
//    return;
//  }
  
  // Enable the built-in microphone
  [self enableBuiltInMic];
//    if (![audioSession setActive:NO error:&error]) {
//      NSLog(@"Failed to deactivate audio session: %@", error.localizedDescription);
//    }
  // Activate the audio session
  if (![audioSession setActive:YES error:&error]) {
    NSLog(@"Failed to activate audio session: %@", error.localizedDescription);
    return;
  }
  
  NSLog(@"Successfully configured audio session (Receiver).");
  NSLog(@"Current audio route:\n%@", [self getCurrentAudioRoute]);
  
}

// Configure the audio session for ear speaker output
- (void)configureAudioSessionToEarSpeaker {
  NSError *error = nil;
  AVAudioSession *audioSession = [self getSharedAudioSession];
  
  
  // Override the output audio port to none (to use the receiver)
//  printAudioRoutes();
  [self checkAudioInputAvailability];
  [self listAvailableOutputPorts];
  // Deactivate the audio session first
//  if (![audioSession setActive:NO error:&error]) {
//    NSLog(@"Failed to deactivate audio session: %@", error.localizedDescription);
//  }
////
//  // Set the category to PlayAndRecord with DefaultToSpeaker option disabled
//  if (![audioSession overrideOutputAudioPort:AVAudioSessionPortOverrideSpeaker error:&error]) {
//    NSLog(@"Failed to override output audio port: %@", error.localizedDescription);
//    return;
//  }
//  if (![audioSession setCategory:AVAudioSessionCategoryPlayAndRecord
//                           error:&error]) {
//      NSLog(@"Failed to set audio session category: %@", error.localizedDescription);
//      return;
//  }
//
//  // Set the audio session mode to Measurement
//  if (![audioSession setMode:AVAudioSessionModeVideoChat error:&error]) {
//      NSLog(@"Failed to set audio session mode to Measurement: %@", error.localizedDescription);
//      return;
//  }
//
//  if (![audioSession overrideOutputAudioPort:AVAudioSessionPortOverrideNone error:&error]) {
//    NSLog(@"Failed to override output audio port: %@", error.localizedDescription);
//    return;
//  }
//

//  if (![audioSession setActive:NO
//                  withOptions:AVAudioSessionSetActiveOptionNotifyOthersOnDeactivation
//                        error:&error]) {
//      NSLog(@"Failed to deactivate audio session: %@", error.localizedDescription);
//      return;
//  }
  

  
  // Set the category to PlayAndRecord with Bluetooth option allowed
//  if (![audioSession setCategory:AVAudioSessionCategoryPlayAndRecord
//
//                           error:&error]) {
//      NSLog(@"Failed to set audio session category: %@", error.localizedDescription);
//      return;
//  }
  
  
//  if (![audioSession overrideOutputAudioPort:AVAudioSessionPortOverrideSpeaker error:&error]) {
//    NSLog(@"Failed to override output audio port: %@", error.localizedDescription);
//    return;
//  }

  
  // Set the mode to VoiceChat for optimizing voice communication
//  if (![audioSession setMode:AVAudioSessionModeSpokenAudio error:&error]) {
//      NSLog(@"Failed to set audio session mode: %@", error.localizedDescription);
//      return;
//  }
//
//    if (![audioSession overrideOutputAudioPort:AVAudioSessionPortOverrideSpeaker error:&error]) {
//      NSLog(@"Failed to override output audio port: %@", error.localizedDescription);
//      return;
//    }
  // Enable the built-in microphone
//    [self enableBuiltInMic];
  // Activate the audio session
  if (![audioSession setActive:YES  withOptions:AVAudioSessionSetActiveOptionNotifyOthersOnDeactivation error:&error]) {
      NSLog(@"Failed to activate audio session: %@", error.localizedDescription);
      return;
  }

  
//  [self ensureRequiredCategoryAndMode];
//  if (![audioSession overrideOutputAudioPort:AVAudioSessionPortOverrideSpeaker error:&error]) {
//    NSLog(@"Failed to override output audio port: %@", error.localizedDescription);
//    return;
//  }
  for (AVAudioSessionPortDescription *output in audioSession.currentRoute.outputs) {
      NSLog(@"Output Port Type: %@", output.portType);
      NSLog(@"Output Port Name: %@", output.portName);
      NSLog(@"Output Port UID: %@", output.UID);
  }
  //    if (![audioSession setActive:NO error:&error]) {
  //      NSLog(@"Failed to deactivate audio session: %@", error.localizedDescription);
  //    }
  // Activate the audio session
//  if (![audioSession setActive:YES error:&error]) {
//    NSLog(@"Failed to activate audio session: %@", error.localizedDescription);
//    return;
//  }
  
  // Set the category to PlayAndRecord to allow audio playback and recording

//     if (![audioSession setCategory:AVAudioSessionCategoryPlayAndRecord error:&error]) {
//         NSLog(@"Failed to set audio session category: %@", error.localizedDescription);
//         return;
//     }
//
//     // Set the mode to VoiceChat to optimize for voice communication
//     if (![audioSession setMode:AVAudioSessionModeVoiceChat error:&error]) {
//         NSLog(@"Failed to set audio session mode: %@", error.localizedDescription);
//         return;
//     }
//
//     // Activate the audio session
//     if (![audioSession setActive:YES error:&error]) {
//         NSLog(@"Failed to activate audio session: %@", error.localizedDescription);
//         return;
//     }
     
     // URL of the online MP3 file
     NSURL *audioFileURL = [NSURL URLWithString:@"https://samplelib.com/lib/preview/mp3/sample-3s.mp3"];
     
     // Initialize the AVPlayer with the online audio file URL
      AVPlayer *player;
      player = [AVPlayer playerWithURL:audioFileURL];
     
     // Set the audio route to the ear speaker
     if (![audioSession overrideOutputAudioPort:AVAudioSessionPortOverrideSpeaker error:&error]) {
         NSLog(@"Failed to override output audio port to ear speaker: %@", error.localizedDescription);
         return;
     }
     
     // Start playing the audio
     [player play];
  printAudioRoutes();
  NSLog(@"Successfully configured audio session (Receiver).");
  NSLog(@"Current audio route:\n%@", [self getCurrentAudioRoute]);
  
}


- (BOOL)checkAudioInputAvailability {
    AVAudioSession *audioSession = [AVAudioSession sharedInstance];
    
    // Check if audio input is available
    if (!audioSession.isInputAvailable) {
        NSLog(@"No audio input path is available!");
        return NO;
    }
    
    // Audio input is available
    return YES;
}

- (void)ensureRequiredCategoryAndMode {
    AVAudioSession *audioSession = [AVAudioSession sharedInstance];
    
    // Check the current category and mode of the audio session
    AVAudioSessionCategory currentCategory = audioSession.category;
    AVAudioSessionMode currentMode = audioSession.mode;
    
    // Define your desired category and mode
    AVAudioSessionCategory desiredCategory = AVAudioSessionCategoryPlayAndRecord;
    AVAudioSessionMode desiredMode = AVAudioSessionModeSpokenAudio;
    
    // Check if the current category and mode match the desired values
    if (currentCategory != desiredCategory || currentMode != desiredMode) {
        // Deactivate the audio session first (optional, depends on your use case)
        NSError *error = nil;
        if (![audioSession setActive:NO error:&error]) {
            NSLog(@"Failed to deactivate audio session: %@", error.localizedDescription);
            return;
        }
        
        // Set the desired category and mode
        NSError *categoryError = nil;
        NSError *modeError = nil;
        if (![audioSession setCategory:desiredCategory error:&categoryError] ||
            ![audioSession setMode:desiredMode error:&modeError]) {
            NSLog(@"Failed to set audio session category or mode: %@", categoryError.localizedDescription ?: modeError.localizedDescription);
            return;
        }
        
        // Activate the audio session with options (optional, depends on your use case)
        NSError *activationError = nil;
        if (![audioSession setActive:YES withOptions:AVAudioSessionSetActiveOptionNotifyOthersOnDeactivation error:&activationError]) {
            NSLog(@"Failed to activate audio session: %@", activationError.localizedDescription);
            return;
        }
        
        NSLog(@"Successfully configured audio session with the desired category and mode.");
    } else {
        NSLog(@"The audio session is already configured with the desired category and mode.");
    }
  
  // Get available audio input ports (e.g., microphones)
  NSArray<AVAudioSessionPortDescription *> *availableInputs = audioSession.availableInputs;
  for (AVAudioSessionPortDescription *inputPort in availableInputs) {
      NSLog(@"Available Input Port: %@", inputPort.portType);
  }

  // Get the current audio route
  AVAudioSessionRouteDescription *currentRoute = audioSession.currentRoute;
  for (AVAudioSessionPortDescription *outputPort in currentRoute.outputs) {
      NSLog(@"Current Output Port: %@", outputPort.portType);
  }

  // Get available output data sources for the current route
  NSArray<AVAudioSessionDataSourceDescription *> *outputDataSources = audioSession.outputDataSources;
  for (AVAudioSessionDataSourceDescription *dataSource in outputDataSources) {
      NSLog(@"Available Output Data Source: %@", dataSource.dataSourceName);
  }

  // Get available input data sources for the current route
  NSArray<AVAudioSessionDataSourceDescription *> *inputDataSources = audioSession.inputDataSources;
  for (AVAudioSessionDataSourceDescription *dataSource in inputDataSources) {
      NSLog(@"Available Input Data Source: %@", dataSource.dataSourceName);
  }
}


// Bridge method to enable the speaker on React Native
RCT_EXPORT_METHOD(setIosSpeakerOn) {
    [self configureAudioSessionToSpeaker];
}

// Bridge method to disable the speaker on React Native
RCT_EXPORT_METHOD(setIosSpeakerOff) {
    [self configureAudioSessionToEarSpeaker];
}

@end
