require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "SpeedLib"
  s.version      = package["version"]
  s.platforms    = { :ios => "15.1", :macos => "11.0"}

  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]
  s.source       = { :git => "https://github.com/victorhenrion/react-native-kit.git", :tag => "#{s.version}" }

  s.default_subspecs = 'Public'

  s.subspec 'Public' do |sp|
    sp.source_files = 'Sources/Public/**/*.{swift}'

    sp.pod_target_xcconfig = {
      "DEFINES_MODULE" => "YES"
    }
  end

  s.subspec 'Private' do |sp|
    sp.source_files = 'Sources/Private/**/*.{swift}'

    sp.dependency 'SpeedLib/Public'
    sp.dependency 'React-jsi'
    sp.dependency 'React-callinvoker'

    load 'nitrogen/generated/ios/SpeedLib+autolinking.rb'
    add_nitrogen_files(sp)

    install_modules_dependencies(sp)
  end
end
