import CallKit

// CallKitManager class that handles the CallKit-related logic
class CallKitManager: NSObject, CXProviderDelegate, CXCallObserverDelegate {
    
    // CXProvider and CXCallObserver instances
    private let provider: CXProvider
    private let callObserver = CXCallObserver()
    
    // Flag to check if the call is outgoing
    private var isOutgoing = false
    
    // Call UUID to uniquely identify the call
    var callUUID: UUID?
    
    // Initialize the CallKitManager with the CXProvider configuration
    override init() {

        provider = CXProvider(configuration: CallKitManager.providerConfiguration)

        super.init()
        
        // Set the delegate of CXProvider and CXCallObserver

        provider.setDelegate(self, queue: nil)
        callObserver.setDelegate(self, queue: nil)
    }
    
    // CXProviderDelegate method called when the provider is reset
    func providerDidReset(_ provider: CXProvider) {
//      print("Callkit - providerDidReset")

    }
    
    // CXProviderDelegate method called when an incoming call is received
    func provider(_ provider: CXProvider, perform action: CXAnswerCallAction) {
        print("Callkit - performAnswerCallAction")
        // Perform necessary actions before answering the call
        
        // Fulfill the answer call action to answer the call
        action.fulfill()
        
        // Set the call UUID to uniquely identify the call
        callUUID = action.callUUID
    }
    
    // CXProviderDelegate method called when a call is ended
    func provider(_ provider: CXProvider, perform action: CXEndCallAction) {
//        print("CXProviderDelegate - performEndCallAction")
//        print("Callkit - Provider performEndCallAction")

        // Perform necessary actions before ending the call
        
        // Fulfill the end call action to end the call
        action.fulfill()
        
        // Remove the call UUID to avoid identifying the call after it has ended
        callUUID = nil
    }
    
    // CXCallObserverDelegate method called when the call state changes
    func callObserver(_ callObserver: CXCallObserver, callChanged call: CXCall) {

//        print("Callkit - Provider callChanged")

        if call.hasConnected {
            if isOutgoing {
//                print("Callkit - Outgoing call connected")
            } else {
//                print("Callkit - Incoming call connected")
            }
        } else if call.isOutgoing {
            isOutgoing = true
//            print("Callkit - Outgoing call started dialing")
        } else if call.hasEnded {
//            print("Callkit - Call ended")
            isOutgoing = false
        }
    }
  
    func provider(_ provider: CXProvider, perform action: CXStartCallAction) {
//        print("Callkit - Started call with phone number")

          if let phoneNumber = action.handle.value as? String {
//              print("Started call with phone number: \(phoneNumber)")
          } else {
//              print("Could not retrieve phone number for call")
          }

        // Perform any other custom logic here
        action.fulfill()
    }

    
    // Static method to configure the CXProvider
  private static var providerConfiguration: CXProviderConfiguration {
      print("Callkit - CXProviderConfiguration")

      let providerConfiguration = CXProviderConfiguration(localizedName: Bundle.main.localizedInfoDictionary?["CFBundleDisplayName"] as? String ?? "Gcalls")
      providerConfiguration.supportsVideo = false
      providerConfiguration.maximumCallsPerCallGroup = 1
      providerConfiguration.supportedHandleTypes = [.phoneNumber]
      providerConfiguration.includesCallsInRecents = false
      return providerConfiguration
  }
  
//  func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
//      if let userActivity = connectionOptions.userActivities.first ?? session.stateRestorationActivity {
////          if userActivity.activityType == NSUserActivityTypeStartAudioCall {
////              print("CallKit launched the app with user activity type: \(userActivity.activityType)")
////          }
//      }
//  }


}

