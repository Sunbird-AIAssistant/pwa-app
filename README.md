# Sunbird-AIAssistant

**Prerequisites:**
|Package| Version | Recommended  Version |
|--|--|--|
[Node](https://nodejs.org/en/) | 18+ | 18.16.1
[NPM](https://nodejs.org/en/) | 9+ | 9.5.1
[Capacitor](https://capacitorjs.com/) | 5+ | 5.5.1
[Ionic](https://ionicframework.com/docs/intro/cli) | 7 | 7.2.0
[Java(For Android)](https://www.oracle.com/in/java/technologies/downloads/) | 17+ | 17.0.5
[Gradle(For Android)](https://gradle.org/install/) | 8+ | 8.5

**Project Setup**

**1. Ionic-Android build Setup**    
    - [Install java](https://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html)    
    - [Install Gradle](https://gradle.org/install/)    
    - [Install Android Studio](https://developer.android.com/studio/)   
    - After Android studio installation, install SDK    
    - Open Android studio and goto `settings/appearance and behavior/system settings/Android SDK`    
    - Install appropriate Android sdk platform package.    
    - Add environment variables in `~/.bashrc` or `~/.bash_profile` as follows    
        ```export ANDROID_SDK_ROOT=path_to_sdk```    
        ```export PATH=$PATH:$ANDROID_SDK_ROOT/tools/bin```    
        ```export PATH=$PATH:$ANDROID_SDK_ROOT/platform-tools```    
    - Reference: https://ionicframework.com/docs/installation/android    
 
    CLI Setup    
    - `npm install -g ionic`   
    - `npm install -g capacitor`  
 
**2. Project Setup**    
    - git clone the repo(https://github.com/Sunbird-AIAssistant/djp-mobile-app.git).    
    - Rename `config.properties.example` file to `config.properties` and put all the valid credentials and api endpoint.   

    - Run `./build.sh`    
    - npm i
    - npx cap add android

    <!-- for windows -->
    install git-bash https://git-scm.com/download/win and run `./build.sh`

**3. How to build apk**    
   - To check attached devices do `adb devices`    
   - `npm run ionic-build` (Make sure you have attached device)    
   - Apk location `project_folder/android/app/build/outputs/apk/apk_debug.apk`    
   
**3. How to update or add new appicon** 
    - Add the new icon.png file in assets folder in project root 
    - icon resolution should be 1024x1024
    - Run `npx @capacitor/assets generate --iconBackgroundColor '#eeeeee' --iconBackgroundColorDark '#222222'`
    github reference - https://github.com/ionic-team/capacitor-assets

**5. How to debug apk**    

   - Open chrome and enter `chrome://inspect`    
    - Select app    

---

### How to test chatbot in Prajayatna

1. **Run the app**  
   - Start the PWA: `npm start` (and open the app in the browser, e.g. `http://localhost:8100` or the port shown).  
   - The app loads **learningresources** config (subDomain is hardcoded for Prajayatna), so you get the Prajayatna experience.

2. **Log in as Prajayatna**  
   - Ensure the splash/config shows **siteName: "Prajayatna"** (from `src/assets/appConfig/learningresources.json`).  
   - Log in with a Prajayatna user (email/phone + password, then OTP if enabled).  
   - After login you are on the **tabs** screen (Home, bot tab(s), My Pitara).

3. **Open the chatbot**  
   - In the bottom tab bar, tap the **Teacher Sakhi** tab (Teacher Tara / ಅಂಗನವಾಡಿ ಕಾರ್ಯಕರ್ತೆ).  
   - Prajayatna’s config has `"bots": ["teacher"]`, so only the Teacher bot tab is shown.  
   - The chatbot page opens with the bot UI (welcome message and text/voice input).

4. **Use the chatbot**  
   - Type a message and send, or use the microphone for voice.  
   - Bot requests go to **BASE_URL_BOT** (`configuration/environment.prod.ts` → `config.api.BASE_URL_BOT`, e.g. `https://aibot-prod.tekdinext.com/`) with context `learningresources_teacher` (subDomain + bot type).  
   - Ensure the bot backend is reachable and accepts this context; otherwise you may see errors or no reply.

5. **Optional: show more bots**  
   - To test **Katha Sakhi** or **Parent Tara**, add them in `src/assets/appConfig/learningresources.json`:  
     - e.g. `"bots": ["story", "parent", "teacher"]`  
   - Restart or refresh the app; the extra bot tabs appear in the tab bar.

   