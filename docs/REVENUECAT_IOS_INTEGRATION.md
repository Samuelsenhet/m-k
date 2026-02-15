# RevenueCat SDK – iOS (SwiftUI) integration for Määk

This guide covers integrating RevenueCat in a **native SwiftUI iOS app** with Swift Package Manager: configuration, paywall, entitlement “Määk Pro”, Customer Center, and product setup.

---

## 1. Install RevenueCat via Swift Package Manager

1. In Xcode: **File → Add Package Dependencies...**
2. Enter:
   ```
   https://github.com/RevenueCat/purchases-ios-spm.git
   ```
3. Set **Dependency Rule**: “Up to next major”, version **5.0.0** &lt; **6.0.0**.
4. Under **Add Package**, select only:
   - **RevenueCat**
   - **RevenueCatUI**
5. Click **Add Package**.

Ref: [RevenueCat iOS installation](https://www.revenuecat.com/docs/getting-started/installation/ios#install-via-swift-package-manager).

---

## 2. Enable In-App Purchase

1. Select your app target → **Signing & Capabilities**.
2. Click **+ Capability** and add **In-App Purchase**.

---

## 3. Configure RevenueCat (API key & app)

Use your **public** iOS API key (e.g. test key for development).

- **Test API key (example):** `test_ppFmJIiHXdKjjYiiSgrULtiKsac`  
  Replace with your real key from [RevenueCat Dashboard](https://app.revenuecat.com) → your project → **API keys** (Apple app).

Configure **once** at app launch (e.g. in your `@main` App struct or `AppDelegate`):

```swift
import RevenueCat

// At launch, e.g. in App init or AppDelegate:
Purchases.logLevel = .debug  // Use .warn or .info in production
Purchases.configure(withAPIKey: RevenueCatConstants.apiKey)
// Optional: set user ID when user logs in
// Purchases.shared.logIn("your-app-user-id") { customerInfo, created in }
```

Keep the API key in a single place (e.g. `RevenueCatConstants.apiKey`); see **Step 6** for the constants file.

---

## 4. Product configuration in RevenueCat & App Store Connect

### 4.1 App Store Connect

1. **App Store Connect** → your app → **In-App Purchases**.
2. Create:
   - **Subscription** (or **Consumable/Non-Consumable** for lifetime):
     - **Monthly** – product ID e.g. `monthly`
     - **Yearly** – product ID e.g. `yearly`
     - **Lifetime** – product ID e.g. `lifetime` (non-consumable or non-renewing if needed)
3. Configure pricing, duration, and metadata.

### 4.2 RevenueCat Dashboard

1. **RevenueCat** → your project → **Products**.
2. Add the same product identifiers: `monthly`, `yearly`, `lifetime` (must match App Store Connect).
3. **Entitlements**: create an entitlement, e.g. **Identifier**: `maak_pro` (display name “Määk Pro”).
4. Attach the three products to this entitlement (or to the offering you use).
5. **Offerings**: create an offering (e.g. “default”) and add packages:
   - `$rc_monthly` → product `monthly`
   - `$rc_annual` → product `yearly`
   - custom package for `lifetime` if needed  
   Set one offering as **Current**.

Product IDs in code and dashboard must match exactly (e.g. `monthly`, `yearly`, `lifetime`).

---

## 5. Entitlement checking: “Määk Pro”

Use a single entitlement identifier everywhere (e.g. `maak_pro` for “Määk Pro”):

```swift
// Check if user has Määk Pro
let customerInfo = try await Purchases.shared.customerInfo()
let isPro = customerInfo.entitlements[RevenueCatConstants.entitlementId]?.isActive == true
```

For reactive UI, use an `ObservableObject` that holds `CustomerInfo` and exposes `isPro`; see **Step 7** (SubscriptionManager).

---

## 6. Constants file

Create `RevenueCatConstants.swift` (or similar) and **do not** commit a production key to git; use env vars or a secure config in production:

```swift
import Foundation

enum RevenueCatConstants {
    /// Public iOS API key from RevenueCat Dashboard → API keys.
    /// Use test key for development, production key for release.
    static let apiKey = "test_ppFmJIiHXdKjjYiiSgrULtiKsac"

    /// Entitlement identifier for "Määk Pro" (must match RevenueCat Dashboard).
    static let entitlementId = "maak_pro"

    /// Product identifiers (must match App Store Connect & RevenueCat).
    enum ProductIdentifier {
        static let monthly = "monthly"
        static let yearly = "yearly"
        static let lifetime = "lifetime"
    }
}
```

---

## 7. Subscription manager (customer info & entitlement)

Central place for customer info and “Määk Pro” status:

```swift
import Foundation
import RevenueCat

@MainActor
final class SubscriptionManager: ObservableObject {
    static let shared = SubscriptionManager()

    @Published private(set) var customerInfo: CustomerInfo?
    @Published private(set) var error: Error?

    var isPro: Bool {
        customerInfo?.entitlements[RevenueCatConstants.entitlementId]?.isActive == true
    }

    private init() {}

    func fetchCustomerInfo() async {
        do {
            customerInfo = try await Purchases.shared.customerInfo()
            error = nil
        } catch {
            self.error = error
            // Log or show user-friendly message
        }
    }

    func restorePurchases() async {
        do {
            customerInfo = try await Purchases.shared.restorePurchases()
            error = nil
        } catch {
            self.error = error
        }
    }
}
```

Call `await SubscriptionManager.shared.fetchCustomerInfo()` at launch and after login; use `isPro` to gate features and `customerInfo` for any extra UI (expiry, product IDs, etc.).

---

## 8. Present RevenueCat Paywall (SwiftUI)

Use **RevenueCatUI** so the paywall is shown automatically when the user lacks the entitlement.

### Option A: Present paywall if user doesn’t have “Määk Pro”

Attach to your root content (e.g. main tab or home screen):

```swift
import SwiftUI
import RevenueCat
import RevenueCatUI

struct ContentView: View {
    var body: some View {
        YourMainContent()
            .presentPaywallIfNeeded(
                requiredEntitlementIdentifier: RevenueCatConstants.entitlementId,
                purchaseCompleted: { customerInfo in
                    // User bought; paywall dismisses automatically if entitlement is active
                },
                restoreCompleted: { customerInfo in
                    // Restore finished; paywall dismisses if entitlement is now active
                }
            )
    }
}
```

### Option B: Manual paywall (e.g. from a “Go Pro” button)

```swift
@State private var showPaywall = false

// In body:
.sheet(isPresented: $showPaywall) {
    PaywallView(
        purchaseCompleted: { customerInfo in
            showPaywall = false
        },
        restoreCompleted: { customerInfo in
            showPaywall = false
        }
    )
}

// Button to show:
Button("Unlock Määk Pro") { showPaywall = true }
```

Use **Option A** for a required gate (e.g. “must have Pro to use app”). Use **Option B** when you only show the paywall on demand.

---

## 9. Customer Center (manage subscription)

Customer Center lets users restore purchases, cancel, or change plan. Add it where it makes sense (e.g. Settings or profile).

```swift
import SwiftUI
import RevenueCatUI

struct SettingsView: View {
    var body: some View {
        List {
            if SubscriptionManager.shared.isPro {
                Section {
                    Button("Manage subscription") {
                        presentCustomerCenter()
                    }
                }
            }
        }
    }

    private func presentCustomerCenter() {
        Task { @MainActor in
            do {
                try await CustomerCenter.shared.showCustomerCenter()
            } catch {
                // Show error (e.g. alert)
            }
        }
    }
}
```

Or present Customer Center from a single “Manage subscription” button and let RevenueCat handle visibility of options.

Ref: [Customer Center](https://www.revenuecat.com/docs/tools/customer-center), [Customer Center integration](https://www.revenuecat.com/docs/tools/customer-center/customer-center-integration).

---

## 10. App entry point (configure once at launch)

Configure Purchases in your `@main` App and optionally set delegate to react to customer info updates:

```swift
import SwiftUI
import RevenueCat

@main
struct MaakApp: App {
    init() {
        Purchases.logLevel = .debug
        Purchases.configure(withAPIKey: RevenueCatConstants.apiKey)
        Purchases.shared.delegate = PurchasesDelegateHandler.shared
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .task {
                    await SubscriptionManager.shared.fetchCustomerInfo()
                }
        }
    }
}

// Optional: react to customer info updates (e.g. renewals, restores from another device)
final class PurchasesDelegateHandler: PurchasesDelegate {
    static let shared = PurchasesDelegateHandler()

    func purchases(_ purchases: Purchases, receivedUpdated customerInfo: CustomerInfo) {
        Task { @MainActor in
            SubscriptionManager.shared.updateCustomerInfo(customerInfo)
        }
    }
}
```

Add to `SubscriptionManager`:

```swift
func updateCustomerInfo(_ info: CustomerInfo) {
    customerInfo = info
}
```

---

## 11. Error handling best practices

- **Network / RevenueCat errors**: Show a short message (“Couldn’t load subscription. Try again.”) and allow retry or “Restore purchases”.
- **User cancellation**: Don’t treat as error; only log if needed.
- **Restore**: Always offer “Restore purchases” (Apple expects it). Call `SubscriptionManager.shared.restorePurchases()` and then refresh UI from `customerInfo`.
- **Log level**: Use `.debug` (or `.verbose`) in development; `.warn` or `.info` in production.
- Never log or expose the **secret** API key; only the **public** key is used in the app.

---

## 12. Summary checklist

- [ ] Add RevenueCat + RevenueCatUI via SPM (`purchases-ios-spm.git`, 5.x).
- [ ] Enable **In-App Purchase** capability.
- [ ] Configure `Purchases.configure(withAPIKey:)` once at launch.
- [ ] Create entitlement **Määk Pro** (e.g. identifier `maak_pro`) and products `monthly`, `yearly`, `lifetime` in RevenueCat and App Store Connect.
- [ ] Use `presentPaywallIfNeeded(requiredEntitlementIdentifier:)` or `PaywallView()` for paywall.
- [ ] Gate features with `SubscriptionManager.shared.isPro` (or `customerInfo.entitlements[...].isActive`).
- [ ] Add Customer Center where users manage subscription (`CustomerCenter.shared.showCustomerCenter()`).
- [ ] Provide “Restore purchases” (PaywallView includes it; you can also call `restorePurchases()` from your own button).
- [ ] Replace test API key with production key for release builds (e.g. via build config or env).

The Swift files in `ios-app/Maak/` mirror this setup so you can copy them into your own Xcode project.
