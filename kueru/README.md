*Disclamer* Setting up the source code includes creating your own firebase account with its api key. There is no guarentee that the code will work the same. Use the hosted site link for the best accurate representation. 

# Hosted Site Link
https://kueru.org/

# Setting Up Instruction 
- cd to `kueru` folder 
- install firebase cli
    - `npm install -g firebase-tools`
    - `firebase login`
- run `npm install` to download dependencies
- create a new firebase project 
- initialise app hosting, firestore, cloud storage, authentication, AI logic Vertex API
- Put firebase config under environmental variables under app hosting 
    - NEXT_PUBLIC_FIREBASE_API_KEY = "your_key"
    - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = "your_key"
    - NEXT_PUBLIC_FIREBASE_PROJECT_ID = "your_key"
    - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = "your_key"
    - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = "your_key"
    - NEXT_PUBLIC_FIREBASE_APP_ID = "your_key"
    - NEXT_PUBLIC_MEASUREMENT_ID = "your_key"
    - FIREBASE_PRIVATE_KEY = "your_key"
    - FIREBASE_CLIENT_EMAIL = "your_key"
- run `firebase deploy` to deploy the code 
- to create an administrator account 
    - create a user manually through firebase 
    - alternatively, create a user through the production site, go to firebase to change the role of user to `admin`
