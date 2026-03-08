import UIKit

@objc
public class ReactNativeViewController: UIViewController {
  private let moduleName: String
  private let initialProps: [AnyHashable: Any]?
  private let launchOptions: [AnyHashable: Any]?
  private var savedGestureStates: (Bool?, [(UIGestureRecognizer, Bool)])?

  @objc
  public init(
    moduleName: String,
    initialProps: [AnyHashable: Any]? = nil,
    launchOptions: [AnyHashable: Any]? = nil
  ) {
    self.moduleName = moduleName
    self.initialProps = initialProps
    self.launchOptions = launchOptions
    super.init(nibName: nil, bundle: nil)
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  override public func viewDidLoad() {
    super.viewDidLoad()

    do {
      self.view = try ReactNativeHostManager.shared.loadView(
        moduleName: moduleName,
        initialProps: initialProps,
        launchOptions: launchOptions
      )
    } catch {
      print("Error loading React Native view: \(error)")
      print(
        "Please make sure ReactNativeHostManager.shared.initialize() has been called prior to using the view controller"
      )
      DispatchQueue.main.async { [weak self] in
        guard let self else { return }
        let label = UILabel()
        label.text = "Kunde inte ladda vyn. Kontrollera att ReactNativeHostManager.shared.initialize() anropats."
        label.numberOfLines = 0
        label.textAlignment = .center
        label.translatesAutoresizingMaskIntoConstraints = false
        self.view = UIView()
        self.view?.backgroundColor = .systemBackground
        self.view?.addSubview(label)
        NSLayoutConstraint.activate([
          label.leadingAnchor.constraint(equalTo: self.view!.leadingAnchor, constant: 24),
          label.trailingAnchor.constraint(equalTo: self.view!.trailingAnchor, constant: -24),
          label.centerYAnchor.constraint(equalTo: self.view!.centerYAnchor),
        ])
      }
    }

    NotificationCenter.default.addObserver(
      self,
      selector: #selector(popToNative(_:)),
      name: NSNotification.Name("popToNative"),
      object: nil
    )

    NotificationCenter.default.addObserver(
      self,
      selector: #selector(setNativeBackEnabled(_:)),
      name: NSNotification.Name("setNativeBackEnabled"),
      object: nil
    )
  }

  @objc
  private func popToNative(_ notification: Notification) {
    let animated = notification.userInfo?["animated"] as? Bool ?? false
    DispatchQueue.main.async { [weak self] in
      self?.navigationController?.popViewController(animated: animated)
    }
  }

  @objc
  private func setNativeBackEnabled(_ notification: Notification) {
    guard let enabled = notification.userInfo?["enabled"] as? Bool else {
      return
    }

    DispatchQueue.main.async { [weak self] in
      guard let self else { return }
      let nav = self.navigationController
      let prevPop = nav?.interactivePopGestureRecognizer?.isEnabled
      let recognizers = nav?.view?.gestureRecognizers ?? []
      let prevStates: [(UIGestureRecognizer, Bool)] = recognizers.compactMap { r in
        (r === nav?.interactivePopGestureRecognizer) ? nil : (r, r.isEnabled)
      }
      self.savedGestureStates = (prevPop, prevStates)
      nav?.interactivePopGestureRecognizer?.isEnabled = enabled
      recognizers.forEach { gesture in
        if gesture !== nav?.interactivePopGestureRecognizer,
           gesture is UIScreenEdgePanGestureRecognizer || gesture is UIPanGestureRecognizer {
          gesture.isEnabled = enabled
        }
      }
    }
  }

  override public func viewWillDisappear(_ animated: Bool) {
    super.viewWillDisappear(animated)
    if let (popEnabled, recognizerStates) = savedGestureStates {
      navigationController?.interactivePopGestureRecognizer?.isEnabled = popEnabled ?? true
      for (recognizer, enabled) in recognizerStates {
        recognizer.isEnabled = enabled
      }
      savedGestureStates = nil
    }
  }
}
