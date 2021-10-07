import { Folder } from './models/folder';
import { User } from './models/user';
import * as firebase from 'firebase-admin';
import { } from 'firebase-admin';
import { Utils } from './utils';
import { ElementServices } from './services/elementServices';

export class Connect {

    static serviceAccount: any = {
        "type": "service_account",
        "project_id": "timeplusplus-1af29",
        "private_key_id": "413a8cb0bf2fb92e5c3e826475e09791d35df8d2",
        "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC6IpmC635WwMU1\nJsg8d3AZe3O6IUcM4pxJBzDihc59dVv30iVg7ch+u6VB/0CQLxcCe68alMLco4RG\noWqHR6Ms3IraCdzIqjK3tpBfMjWk6fN/WAJHygYaDZeiw3QxroZjlaMXoLPvjjzb\n/nnGhNMXIYiTeDUjCIHzijk0TkyrmbajC1CK2hBoTDpEl4WNhYkPAz935mSCRNHP\n6YFIIyJZIiuYKfIzszbIgZoSmIxsR5+SDQJtXBm+e+A+IMzX/Dd/YuP4fwzNI7gP\n5jPHu8QPol6jL0XbjelL7QrGrc4b+BUYCTlrzQuN0YWt8x+Bwr98fIHBLdn/u4bq\ner5CgewZAgMBAAECggEABcMfcc7yLM5alzV5pRbkzgJ6h9cS44JlEy+uoudAiAq+\nNkhM/ENa3cLXsAODuf2d3pJPTpPaCnQ3b+um/W7JeDs67dq4o9pSUp9LYzRjNmqV\nrVS0prNJiBHxUUpwCj+xt7CAtDEMkPccHuAHC2Ro7Szjv6j3gCZPG5J6Xd+p/kqT\nh0N/B/wY5TBz3nDXtKrAoQnmrqsepu+MP77iCWac6DZYqxqOvDoWWAo7qDbi6a11\nZXAvgB2JrU8KXxUqQviKv5Jl7iJ5+zB+BBp5rbqMEAJBjg9w5MhanzBIS36UqIsz\nLsrBUjLbgNrgptkXJn6XdBDhuMYGNcaBhQmIJLh4AQKBgQDpcJhx117fP7kfX35Y\n5JmABsAYPpIYD9iFs3djTcGA8LQptFkWtgbL4R8oloGmnQyAt+lsk/PehILndmjR\nNkQR+WXgt4a8Rt6BS6I4y8NSkPRB6Ldda4tgB/DtymAfSKzTOjsdb4L2hramxL1N\n056liLRH0cneni5XD6L2W9PWAQKBgQDMH6pqV/venv5Z+k/lvrbq9uickDrVLZDt\n9tPEOkXqfRzIcRwlBLsA6rf4FZVAdl+uwN8ZD3iI7mI/PJQgCe1uKw53rCwjpXC9\nz2mhfws/5hDyJPySasNfqZ1VGeM1gfz/HiToUfxZqhUmUmofChiq5KlGk1+m3XnY\nEc8oH84GGQKBgQC7lU361N0YuoUQ79SArBmpJkOAd+8/xKPyNFewhZAEA+hSRuj7\n9gOaG2nFXMQMVdDxMlgxduaVnZfvVVg/HcMvSmCSZgewDabI8TUHPL3VAEQ3HkES\nodPatCbnfiMloGm4Ruev7KapYXEuq5OPEYk/bY2o1KzJ5gRI03jZTMr6AQKBgQCR\npX6JRqI25KeEODDOM1h9KxQqslboSQ0CXn4Xo6TDfeYNt3dnioqMSu5dm7jVOCFp\npcEKNpnAyqdbi7P9cFfzpdE63qTYAnIBXX93dhjmzRgGTxHQv1EMbxAN6tzODyQg\nPLgE9Irkx5EzuNZzs1aKiYGnE/zKKXmJDJwNezQb8QKBgHy0eV/k1DpuMomk9UDi\nk53pYC9Ek3MCCDsbVpDC4iMv9cErvrj91iqE8G48KAWnurVT5T91Et2eAvt8IU1Y\n0h6wQGfrYk/8TF3IcHFkepalz91Vwnu/J7dxrgwefThza53OANWy8kuzHKDbnDNP\nAMBjX3RtzsEPXGqhIiYBolSQ\n-----END PRIVATE KEY-----\n",
        "client_email": "firebase-adminsdk-uxw9v@timeplusplus-1af29.iam.gserviceaccount.com",
        "client_id": "104103137422084953263",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-uxw9v%40timeplusplus-1af29.iam.gserviceaccount.com"
    };
    static connect() {
        try {
            if (!firebase.apps.length) {
                firebase.initializeApp({
                    credential: firebase.credential.cert(this.serviceAccount),
                    databaseURL: "https://timeplusplus-1af29-default-rtdb.firebaseio.com"
                });
            }

        } catch (err) {
            Utils.addLog('Error', 'Connection with database failed');
        }
    }

    static async getUser(userId: number): Promise<User | undefined> {

        try {
            this.connect();

            let db = firebase.database();

            let ref = db.ref('/users/' + userId);


            let snapshot = await ref.once('value');

            return new Promise((resolve, reject) => {
                if (snapshot !== undefined) {

                    let value = snapshot.val();

                    if ('folders' in value && !(Array.isArray(value.folders))) {
                        let temp: { userid: string, username: string, folders: Record<string, Folder> } = (snapshot.val());

                        let temp1 = temp.folders;

                        resolve(new User(temp.userid, temp.username, [temp.folders[Object.keys(temp.folders)[0]]]));

                    } else {

                        resolve(value);
                    }

                } else {
                    reject(undefined);
                }
            });

        } catch (err) {

            Utils.addLog('Error', 'Couldnt load user data');

        }
    }

    static async addUser(user: User): Promise<boolean> {

        this.connect();

        let usr: Record<string, any> = {};

        usr[user.userid] = {
            userid: user.userid,
            username: user.username,
            folders: user.folders
        };

        let result: boolean = false;

        await firebase.database().ref().child('users').set(usr, (a) => {
            if (a === null) {
                result = true;
            }
        });


        return new Promise((resolve, reject) => {
            if (result) {
                resolve(result);
            } else {
                reject(result);
            }
        });



    }

    static updateWorkspace(user: User) {

        try {

            this.connect();
            let db = firebase.database();

            let ref = db.ref().child('users').child(user.userid.toString()).child('folders');

            ref.update(user.folders).catch((err) => {

            });

        } catch (err) {

            Utils.addLog('Error', 'Coulndt update workspaces');
        }


    }

    static addAllChild(folder: Folder) {

        let obj: Record<string, any> = {};
        let subElements: Record<string, any> = {};

        let folderNames = ElementServices.seperateFolder(folder.name, 0);

        let folderName = folderNames[folderNames.length - 1];
        obj[folderName] = {
            name: folderName,
            isMainFolder: folder.isMainFolder,
            githubUrl: folder.githubUrl,
            time: folder.time,
            totalTime: folder.time,
        };

        obj['subElements'] = [];

        subElements['subElements'] = {};


        folder.subElements.forEach(f => {

            let folderNames = ElementServices.seperateFolder(f.name, 0);

            let folderName = folderNames[folderNames.length - 1];

            folderName = Utils.removeAnyOtherChar(folderName);

            if ('subElements' in f) {
                subElements['subElements'] = this.addAllChild(f as Folder);
            } else {

                subElements['subElements'][folderName] = {
                    name: folderName,
                    time: f.time,
                    totalTime: f.time,
                };
            }
        });

        obj[folderName]['subElements'] = subElements['subElements'];


        return obj;

    }




}
