import AppDispatcher from "./AppDispatcher";
import AnnotationAPI from "../api/AnnotationAPI";
import AppAnnotationStore from '../flux/AnnotationStore';

import RDFaUtil from "../util/RDFaUtil";
import AnnotationUtil from "../util/AnnotationUtil";
import TimeUtil from "../util/TimeUtil";
import TargetUtil from "../util/TargetUtil";
import FRBRooUtil from "../util/FRBRooUtil";

const restorePermission = () => {
    console.debug('restoring permissions & access status')
    let permission = {accessStatus: ["private", "public"], permission: "private"};
    try {
        if (window.localStorage && window.localStorage.hasOwnProperty("swac-permission")) {
            permission = JSON.parse(window.localStorage.getItem("swac-permission"));
        }
    } catch (e) {
        // catch errors if no localStorage exists
    }
    return permission;
}

let permission = restorePermission();

const storePermission = (permission) => {
    if (!window.localStorage) {
    } else {
        window.localStorage.setItem("swac-permission", JSON.stringify(permission));
    }
}

const AnnotationActions = {

    serverAvailable : false,
    accessStatus : permission.accessStatus, // for retrieving annotations from the server
    permission : permission.permission, // for submitting or updating annotations in the server
    annotationListener: [], // stores any (external) listeners interested in whenever the annotations are loaded
    baseAnnotationOntologyURL: null, // referenced by both FRBRooUtil and RDFaUtil

    getServerAddress() {
        return AnnotationAPI.getServerAddress();
    },

    setServerAddress(apiURL) {
        AnnotationAPI.setServerAddress(apiURL);
        AnnotationActions.pollServer();
    },

    setBaseAnnotationOntology(url) {
        AnnotationActions.baseAnnotationOntologyURL = url;
    },

    addListenerElement(element) {
        if (!AnnotationActions.annotationListener.includes(element))
            AnnotationActions.annotationListener.push(element);
    },

    /* -------------------------------- ACCESS STATUS & PERMISSION FUNCTIONS --------------------------------- */

    setAccessStatus(accessStatus) {
        switch(accessStatus) {
            case 'private' : AnnotationActions.accessStatus = ['private'];break;
            case 'public' : AnnotationActions.accessStatus = ['public'];break;
            case 'all' : AnnotationActions.accessStatus = ['private', 'public'];break;
            default: AnnotationActions.accessStatus = ['private', 'public'];break;
        }
        storePermission({permission: AnnotationActions.permission, accessStatus: AnnotationActions.accessStatus});
        AnnotationActions.loadAnnotations(AppAnnotationStore.topResources);
    },

    getAccessStatus() {
        if(AnnotationActions.accessStatus.length === 1) {
            return AnnotationActions.accessStatus[0]
        }
        return 'all';
    },

    getPermission() {
        return AnnotationActions.permission;
    },

    setPermission(permission) {
        storePermission({permission: permission, accessStatus: AnnotationActions.accessStatus});
        AnnotationActions.permission = permission;
    },

    /* -------------------------------- FUNCTIONS FOR DISPATCHING GLOBAL APPLICATION EVENTS --------------------------------- */

    pollServer : () => {
        AnnotationAPI.checkServerAvailable((serverAvailable) => {
            if (serverAvailable !== AnnotationActions.serverAvailable) {
                AnnotationActions.serverAvailable = serverAvailable;
            }
            AppDispatcher.dispatch({
                eventName: "server-status-change",
                serverAvailable: serverAvailable
            });
        });
        setTimeout(AnnotationActions.pollServer, 60000);
    },

    save : function(annotation) {
        AnnotationAPI.saveAnnotation(annotation, AnnotationActions.permission, (error, data) => {
            AppDispatcher.dispatch({
                eventName: "save-annotation",
                annotation: data
            });
        });
    },

    delete : function(annotation) {
        AnnotationAPI.deleteAnnotation(annotation, (error, data) => {
            AppDispatcher.dispatch({
                eventName: "delete-annotation",
                annotation: data
            });
        });
    },

    activate : function(annotation) {
        AppDispatcher.dispatch({
            eventName: "activate-annotation",
            annotation: annotation
        });
    },

    edit : function(annotation) { //is the annotation always on the same page?
        AppDispatcher.dispatch({
            eventName: "edit-annotation",
            annotation: annotation
        });
    },

    createAnnotation : function(annotationTargets) { //is the annotation always on the same page?
        AppDispatcher.dispatch({
            eventName: "create-annotation",
            annotationTargets: annotationTargets
        });
    },

    set : function(annotation) { //is the annotation always on the same page?
        AppDispatcher.dispatch({
            eventName: "set-annotation",
            annotation: annotation
        });
    },

    play : (annotation) => { //is the annotation always on the same page? (no)
        AppDispatcher.dispatch({
            eventName: "play-annotation",
            annotation: annotation
        });
    },

    changeTarget : (annotationTarget) => {
        AppDispatcher.dispatch({
            eventName: "change-target",
            annotationTarget: annotationTarget
        });
    },

    copyAnnotation: (annotation) => {
        // remove id, creation timestamp, permissions (assume permission of current user setting)
        delete annotation.id;
        delete annotation.created;
        delete annotation.premissions;
        AnnotationAPI.saveAnnotation(annotation, AnnotationActions.permission, (error, data) => {
            AppDispatcher.dispatch({
                eventName: "save-annotation",
                annotation: data
            });
        });
    },

    reload: () => {
        AppDispatcher.dispatch({
            eventName: "reload-annotations"
        });
    },

    loadResources: () => {
        AppAnnotationStore.setTopResources(RDFaUtil.getTopRDFaResources());
        AnnotationActions._indexResources().then(() => {
            AppDispatcher.dispatch({
                eventName: "loaded-resources",
                topResources: AppAnnotationStore.topResources,
            });
            AnnotationActions.loadAnnotations(AppAnnotationStore.topResources);
        });
    },

    _indexResources: () => {
        return new Promise((resolve, reject) => {
            FRBRooUtil.indexResources().then((resourceData) => {
                console.debug('done indexing', resourceData)
                AppAnnotationStore.setResourceData(resourceData);
                return resolve();
            }, (error) => {
                console.log("Error indexing resources");
                console.log(error);
                return reject(error);
            }); // ... refresh index
        });
    },

    loadAnnotations: (resourceIds) => {
        AppAnnotationStore.setAnnotations([]); // reset to remove old annotations
        if (resourceIds === undefined)
            resourceIds = AppAnnotationStore.topResources;
        let externalResources = AppAnnotationStore.getExternalResources(resourceIds);
        let externalIds = externalResources.map((res) => { return res.parentResource }).filter((externalId) => { return typeof externalId === "string"});

        resourceIds = resourceIds.concat(externalIds);
        console.debug('fetching annotations for: ', resourceIds, AnnotationActions.accessStatus)
        AnnotationAPI.getAnnotationsByTargets(resourceIds, AnnotationActions.accessStatus, (error, annotations) => {
            if (error) {
                throw error;
            }

            //set the annotations in the store
            AppAnnotationStore.setAnnotations(annotations);

            //dispatch internally that the loading of annotations is happening
            AppDispatcher.dispatch({
                eventName: "load-annotations",
                annotations: annotations
            });

            //dispatch externally that the loading of annotations is happening
            AnnotationActions.annotationListener.forEach((element) => {
                let event = new CustomEvent("load-annotations");
                element.dispatchEvent(event);
            });
        });
    },

    /* ---------------------------- USER FUNCTIONS ---------------------- */

    registerUser : function(userDetails) {
        AnnotationAPI.registerUser(userDetails, (error) => {
            if (error) {
                AppDispatcher.dispatch({
                    eventName: "register-failed",
                    userDetails: userDetails
                });
            } else {
                AppDispatcher.dispatch({
                    eventName: "register-succeeded",
                    userDetails: userDetails
                });
            }
        });
    },

    loginUser : function(userDetails) {
        AnnotationAPI.loginUser(userDetails, (error) => {
            if (error) {
                AppDispatcher.dispatch({
                    eventName: "login-failed",
                    userDetails: error
                });
            } else {
                AnnotationActions.loadResources();
                AppDispatcher.dispatch({
                    eventName: "login-succeeded",
                    userDetails: userDetails
                });
            }
        });
    },

    logoutUser : function() {
        AnnotationAPI.logoutUser((error) => {
            if (error) {
                //window.alert("Error logging out!");
                return null;
            }
            AppDispatcher.dispatch({
                eventName: "logout-user",
                userDetails: null
            });
        });
    }

};

export default AnnotationActions;
