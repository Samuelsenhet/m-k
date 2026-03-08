import Combine
internal import ExpoBrownfield

public struct BrownfieldState {
  public static func get(_ key: String) -> Any? {
    return BrownfieldStateInternal.shared.get(key)
  }

  public static func set(_ key: String, _ value: Any?) {
    BrownfieldStateInternal.shared.set(key, value)
  }

  /// Subscribe to state changes. Store the returned `AnyCancellable` to keep the subscription alive; if it is deallocated, the subscription is cancelled.
  public static func subscribe(
    _ key: String,
    _ callback: @escaping (Any?) -> Void
  ) -> AnyCancellable {
    return BrownfieldStateInternal.shared.subscribe(key, callback)
  }

  public static func delete(_ key: String) -> Any? {
    return BrownfieldStateInternal.shared.delete(key)
  }
}
