Simple App


## Local variables

```
APPLE_APP_ID = "Apple app id"
APPLE_ID = "Apple id"
APPLE_PASSWORD = "App specific password generated under apple id account"
APPLE_TEAM_ID = "Apple developer team id"
APPLE_CERT_IDENTITY = "Developer ID Application: ... (...)"
```


## Github Actions

Open Xcode, go into the signing certificates modal, and export the Developer ID Application certificate (called `APPLE_SIGNING_CERTIFICATE_BASE64` from here on) we’ve been referring to in the last guide. To export the certificate, choose a secure password and remember it for later. To retrieve the base64-encoded certificate representation after exporting, run

```
base64 -i APPLE_SIGNING_CERTIFICATE_BASE64.p12 | pbcopy
```

To import the code signing certificate to GitHub Actions, you should end up with two secrets: `APPLE_SIGNING_CERTIFICATE_BASE64` and `APPLE_SIGNING_CERTIFICATE_PASSWORD`. To create a temporary Keychain instance, configure a random `KEYCHAIN_PASSWORD`.

Configure secrets for GithubActions
```
APPLE_SIGNING_CERTIFICATE_BASE64 =
APPLE_SIGNING_CERTIFICATE_PASSWORD =  
KEYCHAIN_PASSWORD = 
```
