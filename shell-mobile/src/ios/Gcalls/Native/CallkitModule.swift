import CallKit

@objc(CallKitModule)
class CallKitModule: NSObject {
  // CallKitManager instance to handle the CallKit-related logic
  let callKitManager = CallKitManager()
  
  // CXCallController instance to initiate the call actions
  let callController = CXCallController()
  
  // Method to start a call with a phone number
  @objc func startCall(_ phoneNumber: String) {
    // Create a CXHandle instance with the phone number
    let callHandle = CXHandle(type: .phoneNumber, value: phoneNumber)
    
    // Create a CXStartCallAction instance with a unique UUID and the CXHandle
    let startCallAction = CXStartCallAction(call: UUID(), handle: callHandle)
    
    // Create a CXTransaction instance with the CXStartCallAction
    let transaction = CXTransaction(action: startCallAction)
    
    // Request the transaction with the CXCallController
    callController.request(transaction) { error in
      if let error = error {
        print("Callkit - Error requesting transaction: \(error.localizedDescription)")
      } else {
        print("Callkit -  Transaction requested successfully")
        self.callKitManager.callUUID = startCallAction.callUUID
      }
    }
  }
  
  // Method to end the current call
  @objc func endCall() {
    
    print("Callkit - end call")

      guard let callUUID = callKitManager.callUUID else {
          print("Callkit - Call UUID not found")
          return
      }
      

      let endCallAction = CXEndCallAction(call: callUUID)
      let transaction = CXTransaction(action: endCallAction)

      callController.request(transaction) { error in
          if let error = error {
              print("Callkit - Error cancelling call: \(error.localizedDescription)")
          } else {
              print("Callkit - Call cancelled successfully")

              // Report the call as ended with the CXProvider
              // self.callKitManager.provider.reportCall(with: callUUID, endedAt: nil, reason: .remoteEnded)




              // Remove the call UUID to avoid identifying the call after it has ended
              self.callKitManager.callUUID = nil
          }
      
    }
  }
  
  // Implement the requiresMainQueueSetup method to ensure that the module is initialized on the main thread
  @objc static func requiresMainQueueSetup() -> Bool {
      return true
  }
}
