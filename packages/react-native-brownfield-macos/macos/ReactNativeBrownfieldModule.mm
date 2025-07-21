#import "ReactNativeBrownfieldModule.h"

#if __has_include("ReactBrownfield/ReactBrownfield-Swift.h")
#import "ReactBrownfield/ReactBrownfield-Swift.h"
#else
#import "ReactBrownfield-Swift.h"
#endif

@implementation ReactNativeBrownfieldModule

RCT_EXPORT_MODULE(ReactNativeBrownfield);

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeReactNativeBrownfieldModuleSpecJSI>(params);
}

@end
