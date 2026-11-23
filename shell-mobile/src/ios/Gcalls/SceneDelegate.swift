import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import Intents
import UIKit

class SceneDelegate: RCTDefaultReactNativeFactoryDelegate, UIWindowSceneDelegate {
  var window: UIWindow?
  var reactNativeFactory: RCTReactNativeFactory?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene else {
      return
    }

    dependencyProvider = RCTAppDependencyProvider()
    reactNativeFactory = RCTReactNativeFactory(delegate: self)
    window = UIWindow(windowScene: windowScene)
    
    #if DEBUG
    let devMenuConfiguration = RCTDevMenuConfiguration(
      devMenuEnabled: true,
      shakeGestureEnabled: true,
      keyboardShortcutsEnabled: true
    )
    reactNativeFactory?.devMenuConfiguration = devMenuConfiguration
    #endif
    
    reactNativeFactory?.startReactNative(
      withModuleName: "Gcalls",
      in: window,
      connectionOptions: connectionOptions
    )

    // Mở app lạnh từ danh bạ / lịch sử cuộc gọi / Siri: lưu số để JS đọc khi khởi động
    for activity in connectionOptions.userActivities {
      _ = Self.phoneNumber(from: activity).map(Self.savePhoneNumber)
    }

   
  }

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    RCTLinkingManager.scene(scene, openURLContexts: URLContexts)
  }

  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    // Cuộc gọi từ danh bạ / lịch sử cuộc gọi / Siri (CallKit) → gcalls://<số> cho JS (Linking)
    if let phone = Self.phoneNumber(from: userActivity) {
      Self.savePhoneNumber(phone)
      if let url = URL(string: "gcalls://" + (phone.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? phone)) {
        RCTLinkingManager.application(UIApplication.shared, open: url, options: [:])
      }
      return
    }
    RCTLinkingManager.scene(scene, continue: userActivity)
  }

  /// Số điện thoại trong intent gọi điện (INStartCallIntent iOS 13+, INStartAudioCallIntent cũ)
  private static func phoneNumber(from activity: NSUserActivity) -> String? {
    let intent = activity.interaction?.intent
    if let call = intent as? INStartCallIntent { return call.contacts?.first?.personHandle?.value }
    if let call = intent as? INStartAudioCallIntent { return call.contacts?.first?.personHandle?.value }
    return nil
  }

  private static func savePhoneNumber(_ phone: String) {
    UserDefaults.standard.set(phone, forKey: "phoneNumber")
  }

  override func bundleURL() -> URL? {
    #if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
    #else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    #endif
  }
}
