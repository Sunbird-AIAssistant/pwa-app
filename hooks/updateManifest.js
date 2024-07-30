var fs = require('fs');
// update android permissions in manifest file 
let permissiontags = ` 
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES"/>
    <uses-permission android:name="android.permission.READ_MEDIA_VIDEO"/>
    <uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />`

let manifestPath = 'android/app/src/main/AndroidManifest.xml';
checkFileAndUpdate(permissiontags, manifestPath, "manifest")

// proguard text 
let proguardTxt = `# Please add these rules to your existing keep rules in order to suppress warnings.
# This is generated automatically by the Android Gradle plugin.
-dontwarn com.google.errorprone.annotations.CanIgnoreReturnValue
-dontwarn com.google.errorprone.annotations.CheckReturnValue
-dontwarn com.google.errorprone.annotations.Immutable
-dontwarn com.google.errorprone.annotations.RestrictedApi
-dontwarn javax.annotation.Nullable
-dontwarn javax.annotation.concurrent.GuardedBy
-keep class net.sqlcipher.** { *; }
-keep class net.sqlcipher.database.* { *; }
`
let proguardPath = 'android/app/proguard-rules.pro';
checkFileAndUpdate(proguardTxt, proguardPath, 'proguard');

function checkFileAndUpdate(updateCode, destinationPath, type) {
    fs.readFile(destinationPath, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return;
        }
        if (data.match('android:allowBackup="true"')) {
            let replacedData = data.replace('android:allowBackup="true"', `android:allowBackup="false" \n \t\tandroid:requestLegacyExternalStorage="true"`)
            data = replacedData;
        }
        if(type == "manifest" && data.match("<!-- Permissions -->")){
            let res = data.replace("<!-- Permissions -->", updateCode)
            fs.writeFile(destinationPath, res, (err) => {
                if (err) {
                    console.error("********* err", err);
                }
            });
        } 
        if (type == "proguard" && !data.match("# Please add ")) {
            fs.appendFileSync(destinationPath, updateCode, (err) => {
                if (err) {
                    console.error("********* err", err);
                }
            });
        }
    });
}

// styles.xml to aviod splashscreen
fs.readFile("android/app/src/main/res/values/styles.xml", 'utf-8', (err, data) => {
    if(err) {
        console.log(err)
    }
    if(data.match('<item name="android:background">@drawable/splash</item>')) {
        let replacedData = data.replace('<item name="android:background">@drawable/splash</item>', `<item name="android:background"></item>
        <item name="android:windowIsTranslucent">true</item>`) 
        fs.writeFile('android/app/src/main/res/values/styles.xml', replacedData, (err) => {
            if (err) {
                console.error("********* err", err);
            }
        })
    }
})

    fs.copyFile("configuration/strings.xml", "android/app/src/main/res/values/strings.xml", (err) => {
        if(err) {
            console.log(err)
        }
    })
