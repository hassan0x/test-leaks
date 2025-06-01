adb devices
adb push "$hash.0" /sdcard/
adb shell "su -c 'mount -o rw,remount /system'"
adb shell "su -c 'mv /sdcard/$hash.0 /system/etc/security/cacerts/'"
adb shell "su -c 'chmod 644 /system/etc/security/cacerts/$hash.0'"
adb shell "su -c 'ls -l /system/etc/security/cacerts/$hash.0'"
adb shell "su -c 'reboot'"
