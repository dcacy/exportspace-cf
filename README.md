# dpc-exportspace

This tool will let you export the content of a space. The app will authenticate the user to Workspace, then request permission to see the user's spaces.  If permission is granted, the user can then click on a space to export the most recent 50 messages, including any files those messages contain.  See a demo here: [https://exportspace.mybluemix.net](https://dpc-exportspace.mybluemix.net).

Please see the LICENSE file for copyright and license information.

## Run locally

1. Create a new Watson Work application [here](https://developer.watsonwork.ibm.com/apps). Make note of the App ID and secret, as you'll need to provide them to your application. 

1. Copy the `local.env.sample` file to `local.env`. Change the APP_ID and APP_SECRET to the ones you created above.

1. The `OAUTH_REDIRECT_URI` value in local.env must be set to a URI which will support HTTPS.  I use ngrok, so my value would be something like `44ffff.ngrok.io`.

1. Download `date.format.js` from https://gist.github.com/jhbsk/4690754 and copy it to the public/js directory.

1. Install the dependencies the application needs:

```
npm install
```

1. Start the application locally:

```
npm start
```

1. Navigate to the URL for the application in your browser. 

## Run on Bluemix

1. Copy the `manifest.yml.sample` to `manifest.yml` and replace the values with ones appropriate to your app.

1. Deploy as you normally do.
