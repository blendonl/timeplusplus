import { Folder } from './models/folder';
import { User } from './models/user';
import * as firebase from 'firebase-admin';
import {  } from 'firebase-admin';
import { writeFile } from 'fs';
import { TreeItem } from 'vscode';

export class Connect {

    // static firebaseConfig = {
    //     apiKey: "AIzaSyDkuREpZ3xLCMtWpf0uQUHs4FyYw_IehBw",
    //     authDomain: "timeplusplus-1af29.firebaseapp.com",
    //     databaseURL: "https://timeplusplus-1af29-default-rtdb.firebaseio.com",
    //     projectId: "timeplusplus-1af29",
    //     storageBucket: "timeplusplus-1af29.appspot.com",
    //     messagingSenderId: "260082124510",
    //     appId: "1:260082124510:web:f2b9f61c9455ba2c6ba44f",
    //     measurementId: "G-LT1VTVTTQW"
    //   };

    // static app: FirebaseApp = initializeApp({
    //     apiKey: "AIzaSyDkuREpZ3xLCMtWpf0uQUHs4FyYw_IehBw",
    //     authDomain: "timeplusplus-1af29.firebaseapp.com",
    //     databaseURL: "https://timeplusplus-1af29-default-rtdb.firebaseio.com",
    //     projectId: "timeplusplus-1af29",
    //     storageBucket: "timeplusplus-1af29.appspot.com",
    //     messagingSenderId: "260082124510",
    //     appId: "1:260082124510:web:f2b9f61c9455ba2c6ba44f",
    //     measurementId: "G-LT1VTVTTQW"
    // });
    
    static serviceAccount  = () => { 
        try {    
        return require(__dirname + '/timeplusplus-1af29-firebase-adminsdk-uxw9v-5a28d8ce71.json'); 
        } catch(err) {
            console.log(err);
        }
    }
    static connect()  {
        
        if(!firebase.apps.length) {
            firebase.initializeApp({
                credential: firebase.credential.cert(this.serviceAccount()),
                databaseURL: "https://timeplusplus-1af29-default-rtdb.firebaseio.com"
            });
        }
    }

    static async getUser(userId: number) : Promise<User | undefined>{

        try { 
        this.connect();

        let db = firebase.database();

        let ref = db.ref('/users/' + userId);

        
        let snapshot = await ref.once('value');
        
        return new Promise((resolve, reject) => {
            if(snapshot !== undefined) {

                let value = snapshot.val();
								


                if('folders' in value && !(Array.isArray(value.folders))) {
                    let temp : { userid : string, username: string, folders : Record<string, Folder> } =  ( snapshot.val()) ;

                    let temp1 = temp.folders;

                    resolve(new User(temp.userid, temp.username, [temp.folders[Object.keys(temp.folders)[0]]]));
                
                } else {

                    resolve(value);
                }

            } else {
                reject(undefined);
            }
        });

    } catch(err) {
       
    }
    }

    static async addUser(user: User) : Promise<boolean> {

        this.connect();

        let usr : Record<string, any> = {};

        usr[user.userid] = {
            userid: user.userid,
            username: user.username,
            folders: user.folders
        };

        let result: boolean = false;

        await firebase.database().ref().child('users').set(usr, (a) => {
            if(a === null) {
                result = true;
            } 
        });


        return new Promise((resolve, reject) => {
            if(result) {
                resolve(result);
            } else {
                reject(result);
            }
        });

        

    }

    // static getAllUser(folder: Folder) : User[] {

	//     let all : User[] = []

	//     this.connect();

	//     let ref = firebase.database().ref('users')

	//     ref.once('value', (value) => {
		
	// 	    let users : User[] = value.val();

	// 	    if(users !== undefined) {
	// 		users.foreach(u => {
	// 			if('folders' in u) {

	// 				let temp = u.folders.find(f => f.name === folder.name);	

	// 				if(temp !== undefined) {
	// 					all.push(u);
	// 				}
	// 			}
				
	// 		});
	// 	    }

	//     })

	//     return all;
    // }

  


    static updateWorkspace(user: User) {

       try { 

        this.connect();
        let db = firebase.database();

        let ref  = db.ref().child('users').child(user.userid.toString()).child('folders');

        ref.update(user.folders).catch((err) => {

            // writeFile('C:\\Users\\blend\\Desktop\\errrors.txt', err, (err) => {

            // });

        });
        
    } catch(err ) {

            // writeFile('C:\\Users\\blend\\Desktop\\errors.txt',err  + '', (erro) => {
            //     console.log(erro);
            // });
    }
     

    }

    // static addAllChild(folder: Folder) {

    //     let obj : Record<string, any> = { };
    //     let subElements : Record<string, any> = {};

    //     let folderNames = ElementServices.seperateFolder(folder.name, 0);

    //     let folderName = folderNames[folderNames.length - 1];
    //     obj[folderName] = {
    //         name: folderName,
    //         isMainFolder: folder.isMainFolder,
    //         githubUrl: folder.githubUrl,
    //         time: folder.time,
    //         totalTime: folder.time,
    //     };

    //     obj['subElements'] = [];

    //     subElements['subElements'] = {};

        
    //     folder.subElements.forEach(f => {

    //         let folderNames = ElementServices.seperateFolder(f.name, 0);

    //         let folderName = folderNames[folderNames.length - 1];

    //         folderName = Utils.removeAnyOtherChar(folderName);

    //         if('subElements' in f) {
    //            subElements['subElements']= this.addAllChild(f as Folder);
    //         } else {
        
    //             subElements['subElements'][folderName] = {
    //                 name: folderName,
    //                 time: f.time,
    //                 totalTime: f.time,
    //             };
    //         }
    //     });

    //     obj[folderName]['subElements'] = subElements['subElements'];


    //     return obj;

    // }

  


}
