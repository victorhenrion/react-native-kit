#if canImport(ExpoModulesCore)
    @_implementationOnly import ExpoModulesCore

    public enum ExpoBootstrap {
        public static func registerModules() {
            if let cls = NSClassFromString("ReactNativeKit.ExpoModulesProvider")
                as? ModulesProvider.Type
            {
                AppContext().useModulesProvider(cls.init())
            } else {
                assertionFailure("ExpoModulesProvider not found in ReactNativeKit")
            }
        }
    }
#else
    public enum ExpoBootstrap {
        public static func registerModules() {}
    }
#endif
