<h1 align="center"><b> Vagalume App </b> </h1>

<h1 align="center">
  <br>
  <kbd>
    <img src="https://image.prntscr.com/image/YrkdAm5xSxe0MmkqrvGeJA.png" alt="Animavita" height="525" width="725">
  </kbd>
  <br>
  <br><br>
</h1>

<p align="center">With Vagalume streaming you will never miss music to keep up with the moments of your life. Download for FREE and always have it around!</p>

<p align="center"><i>"How to save a life?" - The Audio Streaming</i> </p>

<p align="center">
  <a href="http://makeapullrequest.com">
    <img src="https://img.shields.io/badge/progress-40%25-brightgreen.svg" alt="PRs Welcome">
  </a>
  <a href="http://makeapullrequest.com">
    <img src="https://img.shields.io/badge/contribuition-welcome-brightgreen.svg" alt="PRs Welcome">
  </a>
  <a href="https://saythanks.io/to/wendelfreitas">
      <img src="https://img.shields.io/badge/SayThanks.io-%E2%98%BC-1EAEDB.svg">
  </a>
<a href="https://www.repostatus.org/#wip"><img src="https://www.repostatus.org/badges/latest/wip.svg" alt="Project Status: WIP – Initial development is in progress, but there has not yet been a stable, usable release suitable for the public." /></a>  
</p>

<p align="center">
  <a href="#blush-overview">Overview</a> •
  <a href="#dizzy-roadmap">Roadmap</a> •
  <a href="#wrench-install-instructions">Install</a> •
  <a href="#zap-tech-stack">Tech Stack</a> •
  <a href="#iphone-Test">Test</a> •
  <a href="#eyes-version">Version</a> •
</p>

<p align="center">
  <kbd>
    <img width="250" style="border-radius: 5px" height="450" src="screenshots/1.jpg" alt="1">
  </kbd>
  &nbsp;&nbsp;&nbsp;&nbsp;
  <kbd>
    <img width="250" style="border-radius: 5px" height="450" src="screenshots/2.jpg" alt="2">
  </kbd>
  &nbsp;&nbsp;&nbsp;&nbsp;
  <kbd>
    <img width="250" style="border-radius: 5px" height="450" src="screenshots/3.jpg" alt="3">
  </kbd>
  <br/><br/>
  <kbd>
    <img width="250" style="border-radius: 5px" height="450" src="screenshots/4.jpg" alt="4">
  </kbd>
    &nbsp;&nbsp;&nbsp;&nbsp;
  <kbd>
    <img width="250" style="border-radius: 5px" height="450" src="screenshots/5.jpg" alt="5">
  </kbd>
    &nbsp;&nbsp;&nbsp;&nbsp;
  <kbd>
    <img width="250" style="border-radius: 5px" height="450" src="screenshots/6.jpg" alt="6">
  </kbd>
    <br/><br/>
  <kbd>
    <img width="250" style="border-radius: 5px" height="450" src="screenshots/7.jpg" alt="7">
  </kbd>
    &nbsp;&nbsp;&nbsp;&nbsp;
  <kbd>
    <img width="250" style="border-radius: 5px" height="450" src="screenshots/8.jpg" alt="8">
  </kbd>
    &nbsp;&nbsp;&nbsp;&nbsp;
  <kbd>
    <img width="250" style="border-radius: 5px" height="450" src="screenshots/9.jpg" alt="9">
  </kbd>
</p>

## :blush: **Overview?**

Finding the perfect trail can sometimes be a big challenge, so let the work with us! Just choose from one of 90 available playlists, play and let it roll. Vagalume.FM is the ideal partner to accompany your day, whether at work, gym, traffic, traveling, having a party or relaxing at home.


From pop to rock, from sertanejo to funk, from axé to gospel… here you can find a little of everything! Curated by a truly passionate music team, Vagalume.FM is updated weekly with new stations and features.


No data? No problem! With the recording feature you can take station schedule snippets with you anywhere without the need for an internet connection.


Follow your favorite stations, rate songs, check out what played / will play on the schedules and share what you're listening to on social networks.

## :dizzy: **Roadmap**

-   [x] Make it work on IOS
-   [x] Make it work on Android
-   [x] Transform into responsive
-   [x] Google Analytices Bridge
-   [ ] Update to latest React Native version

## :wrench: **Install instructions**

### Getting Started

#### 1) Clone & Install Dependencies

- 1.1) `git clone https://github.com/funnyjerry/react-native-audio-stream.git`
- 1.2) `cd react-native-homeautomation-app` - cd into your newly created project directory.
- 1.3) Install NPM packages with `yarn install`
        **Note:** NPM has issues with React Native so `yarn` is recommended over `npm`.
- 1.4) **[iOS]** `cd ios` and run `pod install` - if you don't have CocoaPods you can follow [these instructions](https://guides.cocoapods.org/using/getting-started.html#getting-started) to install it.
- 1.5) **[Android]** If you haven't already generated a `debug.keystore` file you will need to complete this step from within the `/android/app` folder. Run `keytool -genkey -v -keystore debug.keystore -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000`

#### 2) Start your app

- 2.1) **[iOS]** Build and run the iOS app, run `react-native run-ios` (to run on simulator) or `react-native run-ios --device` (to run on real device) from the root of your project. The first build will take some time.
- 2.2) **[Android]** If you haven't already got an android device attached/emulator running then you'll need to get one running (make sure the emulator is with Google Play / APIs). When ready run `react-native run-android` from the root of your project.

## :zap: **Tech Stack**

<h1 align="center">
  <img src="https://apprecs.org/gp/images/app-icons/300/d8/host.exp.exponent.jpg" alt="Stack" height="100" width="100">
  <img src="https://ionicframework.com/docs/assets/icons/logo-react-icon.png" alt="Stack" height="100" width="100">
  <img src="https://cdn4.iconfinder.com/data/icons/google-i-o-2016/512/google_firebase-512.png" alt="Stack" height="100" width="100">
  <img src="https://icon-library.net/images/png-map-icon/png-map-icon-26.jpg" alt="Stack" height="100" width="100">
  <img src="https://cdn.iconscout.com/icon/free/png-512/facebook-logo-2019-1597680-1350125.png" alt="Stack" height="100" width="100">

  <br>
</h1>

-   [React Native](https://github.com/facebook/react-native)
-   [Redux](https://github.com/reduxjs/react-redux)
-   [Redux-Persist](https://github.com/rt2zz/redux-persist)
-   [Lottie React Native](https://github.com/react-native-community/lottie-react-native)
-   [Antd Mobile RN](https://github.com/ant-design/ant-design-mobile-rn)
-   [React Native Firebase](https://github.com/invertase/react-native-firebase)
-   [Eslint](https://eslint.org/)
-   [Bug Snag](https://github.com/bugsnag/bugsnag-react-native)

## :iphone: **Test**

- [x] Test on Android
- [x] Test on iOS

## :eyes: **Version**
- [x] React-Native 0.55.4
- [ ] Expo 35
