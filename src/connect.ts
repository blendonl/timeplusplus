import { FirebaseApp, initializeApp } from '@firebase/app';
import {getDatabase, ref, set, get, DatabaseReference, child, onValue, update, push} from 'firebase/database' 
import { basename } from 'path';
import { isDeepStrictEqual } from 'util';
import { Folder } from './models/folder';
import { User } from './models/user';
import * as firebase from 'firebase-admin';

export class Connect {

    static firebaseConfig = {
        apiKey: "AIzaSyDkuREpZ3xLCMtWpf0uQUHs4FyYw_IehBw",
        authDomain: "timeplusplus-1af29.firebaseapp.com",
        databaseURL: "https://timeplusplus-1af29-default-rtdb.firebaseio.com",
        projectId: "timeplusplus-1af29",
        storageBucket: "timeplusplus-1af29.appspot.com",
        messagingSenderId: "260082124510",
        appId: "1:260082124510:web:f2b9f61c9455ba2c6ba44f",
        measurementId: "G-LT1VTVTTQW"
      };

    static app: FirebaseApp = initializeApp({
        apiKey: "AIzaSyDkuREpZ3xLCMtWpf0uQUHs4FyYw_IehBw",
        authDomain: "timeplusplus-1af29.firebaseapp.com",
        databaseURL: "https://timeplusplus-1af29-default-rtdb.firebaseio.com",
        projectId: "timeplusplus-1af29",
        storageBucket: "timeplusplus-1af29.appspot.com",
        messagingSenderId: "260082124510",
        appId: "1:260082124510:web:f2b9f61c9455ba2c6ba44f",
        measurementId: "G-LT1VTVTTQW"
    });
    
    static serviceAccount = require("C:\\Users\\blend\\Downloads\\timeplusplus-1af29-firebase-adminsdk-uxw9v-5a28d8ce71.json");

  
    static connect()  {
        if(!firebase.apps.length) {
            firebase.initializeApp({
                credential: firebase.credential.cert(this.serviceAccount),
                databaseURL: "https://timeplusplus-1af29-default-rtdb.firebaseio.com"
            });
        }
    }

    static async getUser(userId: number) : Promise<User | undefined>{

        
        this.connect();

        let db = firebase.database();

        let ref = db.ref('/users/' + userId);

        
        let snapshot = await ref.once('value');
        
        return new Promise((resolve, reject) => {
            if(snapshot.val() !== null) {

                resolve(snapshot.val());
            } else {
                reject(undefined);
            }
        });
        

    }

    static addUser(user: User) {
        set(ref(getDatabase(), 'users/' + user.userId), {
            userid: user.userId,
            username: user.username,
            folders: user.folders
        });
    }

    static addProject(user: User, folder: Folder) {

        push(ref(getDatabase(), 'users/' + user.userId + '/folders'), folder);


        // update(ref(getDatabase(this.connect()), 'users/' + user.userId + '/folders/' + basename(folder.name)), folder).catch((err) => {
        //     if(err) {

        //     }
        // });
        
    }

    static updateProject(user: User, folder: Folder) {

        push(ref(getDatabase(), 'users/' + user.userId + '/folders'), folder);


        // update(ref(getDatabase(this.connect()), 'users/' + user.userId + '/folders/' + basename(folder.name)), {
        //     subElements: folder.subElements,
        //     time: folder.time,
        //     totalTime: folder.totalTime
        //  }).catch((err) => {
        //     if(err) {

        //     }
        // });
    }

    static addFolder(user: User, workspace: Folder, folder: Folder) {

        let refd = ref(getDatabase(), 'users/' + user.userId + '/folders');

        
        

       //push(, folder);


        // update(ref(getDatabase(this.connect()), , folder).catch((err) => {
        //     if(err) {

        //     }
        // });
    }

  


    static getProjects(user: User) : Folder[]{
        let projects: Folder [] = [];
        get(child(ref(getDatabase()), '/users/' + user.userId + '/folders')).then((snapshot) => {
            if(snapshot.val() !== null) {
                return snapshot.val() as Folder[];
            }
        });

        return [];
    }
    
  // Initialize Firebase
    

    readWorkspaces(user: User) {

    }
  
  


}