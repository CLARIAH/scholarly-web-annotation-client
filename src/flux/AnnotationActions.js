import AppDispatcher from "./AppDispatcher";
import AnnotationAPI from "../api/AnnotationAPI";
import AnnotationStore from "../flux/AnnotationStore.js";
import RDFaUtil from "../util/RDFaUtil.js";
import AnnotationUtil from "../util/AnnotationUtil.js";
import TimeUtil from "../util/TimeUtil.js";
import TargetUtil from "../util/TargetUtil.js";
import FRBRooUtil from "../util/FRBRooUtil.js";

var restorePermission = () => {
    var permission = {accessStatus: ["private", "public"], permission: "private"};
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

var storePermission = (permission) => {
    if (!window.localStorage) {
    } else {
        window.localStorage.setItem("swac-permission", JSON.stringify(permission));
    }
}


const AnnotationActions = {

    serverAvailable : false,
    accessStatus : permission.accessStatus, // for retrieving annotations from the server
    permission : permission.permission, // for submitting or updating annotations in the server
    //accessStatus : ["private", "public"], // for retrieving annotations from the server
    //permission : "private", // for submitting or updating annotations in the server
    annotationIndex : {},
    resourceIndex : {},
    relationIndex : {},
    topResources : [],
    annotationListener: [],


    getServerAddress() {
        return AnnotationAPI.getServerAddress();
    },

    setServerAddress(apiURL) {
        AnnotationAPI.setServerAddress(apiURL);
        AnnotationActions.pollServer();
    },

    pollServer : () => {
        AnnotationAPI.checkServerAvailable((serverAvailable) => {
            if (serverAvailable !== AnnotationActions.serverAvailable) {
                AnnotationActions.serverAvailable = serverAvailable;
            }
            AppDispatcher.dispatch({
                eventName: "server-status-change",
                serverAvailable: serverAvailable
            });
            //if (!serverAvailable) {
            //    console.error("Annotation server not reachable");
            //}
        });
        setTimeout(AnnotationActions.pollServer, 60000);
    },

    getAccessStatus() {
        return AnnotationActions.accessStatus;
    },

    setAccessStatus(accessStatus) {
        AnnotationActions.accessStatus = accessStatus;
        storePermission({permission: AnnotationActions.permission, accessStatus: accessStatus});
        if (AnnotationActions.accessStatus.length === 0) {
            AnnotationActions.dispatchAnnotations([]); // when no access levels are selected
        } else {
            AnnotationActions.loadAnnotations(AnnotationStore.topResources);
        }
    },

    getPermission() {
        return AnnotationActions.permission;
    },

    setPermission(permission) {
        storePermission({permission: permission, accessStatus: AnnotationActions.accessStatus});
        AnnotationActions.permission = permission;
    },

    setBaseAnnotationOntology(url) {
        FRBRooUtil.baseAnnotationOntologyURL = url;
        RDFaUtil.baseAnnotationOntologyURL = url;
        RDFaUtil.setBaseAnnotationOntology(url);
    },

    addListenerElement(element) {
        if (!AnnotationActions.annotationListener.includes(element))
            AnnotationActions.annotationListener.push(element);
    },

    lookupIdentifier(sourceId) {
        var source = { type: null, data: null }; // for IDs to external resources
        if (AnnotationStore.annotationIndex.hasOwnProperty(sourceId))
            source = { type: "annotation", data: AnnotationStore.annotationIndex[sourceId] };
        else if (AnnotationStore.resourceIndex.hasOwnProperty(sourceId))
            source = { type: "resource", data: AnnotationStore.resourceIndex[sourceId] };
        else if (AnnotationStore.externalResourceIndex.hasOwnProperty(sourceId))
            source = { type: "external", data: AnnotationStore.externalResourceIndex[sourceId] };
        return source;
    },

    lookupAnnotationsByTarget(resourceId) {
        return Object.values(AnnotationStore.annotationIndex).filter((annotation) => {
            let match = annotation.target.some((target) => {
                if (target.source && target.source === resourceId) {
                    return true;
                } else if (target.identifier && target.identifier === resourceId) {
                    return true;
                } else {
                    return false;
                }
            });
            return match ? true : false;
        });
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

    makeAnnotation: (annotationTargets, username) => {
        return AnnotationUtil.generateW3CAnnotation(annotationTargets, username);
    },

    loadAnnotations: (resourceIds) => {
        AnnotationStore.annotations = []; // reset to remove old annotations
        if (resourceIds === undefined)
            resourceIds = AnnotationStore.topResources;
        let externalResources = AnnotationActions.getExternalResources(resourceIds);
        let externalIds = externalResources.map((res) => { return res.parentResource }).filter((externalId) => { return typeof externalId === "string"});

        resourceIds = resourceIds.concat(externalIds);
        AnnotationAPI.getAnnotationsByTargets(resourceIds, AnnotationActions.accessStatus, (error, annotations) => {
            if (error) {
                throw error;
            }

            AnnotationStore.annotationIndex = {};
            AnnotationStore.annotations = annotations;
            annotations.forEach((annotation) => {
                AnnotationStore.annotationIndex[annotation.id] = annotation;
            });
            AnnotationActions.dispatchAnnotations(annotations);
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

    dispatchAnnotations(annotations) {
        AppDispatcher.dispatch({
            eventName: "load-annotations",
            annotations: annotations
        });
        AnnotationActions.dispatchLoadEvent();
    },

    dispatchLoadEvent() { // for external listeners
        AnnotationActions.annotationListener.forEach((element) => {
            let event = new CustomEvent("load-annotations");
            element.dispatchEvent(event);
        });
    },

    reload: () => {
        AppDispatcher.dispatch({
            eventName: "reload-annotations"
        });
    },

    indexResources: () => {
        return new Promise((resolve, reject) => {
            FRBRooUtil.indexResources().then((resourceData) => {
                AnnotationStore.resourceIndex = resourceData.resourceIndex.resources;
                AnnotationStore.relationIndex = resourceData.resourceIndex.relations;
                AnnotationStore.resourceStore = resourceData.resourceStore;
                AnnotationStore.representedResourceMap = resourceData.representedResourceMap;
                AnnotationStore.externalResourceIndex = resourceData.externalResourceIndex;
                AnnotationStore.resourceData = resourceData;
                return resolve();
            }, (error) => {
                console.log("Error indexing resources");
                console.log(error);
                return reject(error);
            }); // ... refresh index
        });
    },

    hasExternalResource(resourceId) {
        if (!AnnotationStore.externalResourceIndex) {
            return false;
        } else {
            return AnnotationStore.externalResourceIndex.hasOwnProperty(resourceId);
        }
    },

    hasRepresentedResource(resourceId) {
        if (!AnnotationStore.representedResourceMap) {
            return false;
        } else {
            return AnnotationStore.representedResourceMap.hasOwnProperty(resourceId);
        }
    },

    getRepresentedResource(resourceId) {
        if (!AnnotationStore.externalResourceIndex) {
            throw Error("externalResourceIndex does not exist");
        } else if (!AnnotationStore.externalResourceIndex.hasOwnProperty(resourceId)) {
            throw Error("resourceId does not have represented resource");
        } else {
            return AnnotationStore.externalResourceIndex[resourceId];
        }
    },

    getExternalResources(resourceIds) {
        if (!Array.isArray(resourceIds)) {
            console.log("resourceIds:", resourceIds);
            throw Error("resourceIds should be an array");
        }
        return resourceIds.filter(AnnotationActions.hasExternalResource).map((resourceId) => {
            return AnnotationActions.getExternalResource(resourceId);
        });
    },

    getExternalResource(resourceId) {
        if (!AnnotationStore.externalResourceIndex) {
            return null;
        } else if (AnnotationStore.externalResourceIndex.hasOwnProperty(resourceId)) {
            return AnnotationStore.externalResourceIndex[resourceId];
        } else {
            return null;
        }
    },

    loadResources: () => {
        AnnotationStore.topResources = RDFaUtil.getTopRDFaResources();
        AnnotationActions.indexResources().then(() => {
            AppDispatcher.dispatch({
                eventName: "loaded-resources",
                topResources: AnnotationStore.topResources,
            });
            AnnotationActions.loadAnnotations(AnnotationStore.topResources);
        });
    },

    getCandidates: (annotations, defaultTargets) => {
        console.debug('getCandidates()')
        console.debug(AnnotationStore.resourceData)
        return TargetUtil.getCandidates(annotations, defaultTargets, AnnotationStore.resourceData);
    },

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
    },

    registerResources : function(maps) {
        if (Object.keys(maps).length === 0)
            return null;
        Object.keys(maps).forEach((resourceId, index) => {
            // check if server knows about resource
            AnnotationAPI.checkResource(resourceId, (error, data) => {
                if (data && index === Object.keys(maps).length -1)
                    return data;
                else if (data)
                    return null;
                // register if server doesn't know resource
                AnnotationAPI.registerResource(maps[resourceId], (error, data) => {
                    if (error)
                        return null;

                    if (index === Object.keys(maps).length -1)
                        return data;
                });
            });
        });
    },

    parseVocabularySuggestion : (suggestion, vocabulary) => {
        var entry = {
            value: null,
            label: {
                className: "badge badge-success",
                value: ""
            },
            scopeNote: null
        }
        if (vocabulary === "GTAA") {
            let arr = suggestion.label.split('|');
            entry.value = arr[0];
            entry.scopeNote = arr[2] ? '(' + arr[2] + ')' : ''
            switch(arr[1]) {
                case 'Persoon' :
                    entry.label = {className: "badge badge-warning", value: "Persoon"};
                    break;
                case 'Maker' :
                    entry.label = {className: "badge badge-warning", value: "Maker"};
                    break;
                case 'Geografisch' :
                    entry.label = {className: "badge badge-success", value: "Locatie"};
                    break;
                case 'Naam' :
                    entry.label = {className: "badge badge-info", value: "Naam"};
                    break;
                case 'Onderwerp' :
                    entry.label = {className: "badge badge-primary", value: "Onderwerp"};
                    break;
                case 'Genre' :
                    entry.label = {className: "badge badge-default", value: "Genre"};
                    break;
                case 'B&G Onderwerp' :
                    entry.label = {className: "badge badge-danger", value: "B&G Onderwerp"};
                    break;
                default :
                    entry.label = {className: "badge badge-default", value: "Concept"};
                    break;
            }
        } else if (vocabulary === "DBpedia") {
            let arr = suggestion.label.split('|');
            entry.value = arr[0];
            entry.scopeNote = arr[2] ? '(' + arr[2] + ')' : ''
            entry.label = {className: "badge badge-default", value: "Concept"};
        } else if (vocabulary == 'UNESCO') {
            let arr = suggestion.prefLabel.split('|');
            entry.value = arr[0];
            entry.label.value = arr[1];
            switch(arr[1]) {
                case 'Education' :
                    entry.label.className = "badge badge-warning"
                    break;
                case 'Science' :
                    entry.label.className = "badge badge-warning"
                    break;
                case 'Social and human sciences' :
                    entry.label.className = "badge badge-success"
                    break;
                case 'Information and communication' :
                    entry.label.className = "badge badge-info"
                    break;
                case 'Politics, law and economics' :
                    entry.label.className = "badge badge-primary"
                    break;
                case 'Countries and country groupings' :
                    entry.label.className = "badge badge-default"
                    break;
                default :
                    entry.label.className = "badge badge-warning"
                    entry.label.value = "Concept";
                    break;
            }
        }
        return entry;
    },

    mapTargetsToDOMElements: (annotation) => {
        return TargetUtil.mapTargetsToDOMElements(annotation, AnnotationStore.resourceData, AnnotationStore.annotations);
    },

    createBreadcrumbTrail : (resourceId) => {
        if (AnnotationStore.resourceIndex.hasOwnProperty(resourceId)) {
            return RDFaUtil.createBreadcrumbTrail(resourceId, AnnotationStore.resourceIndex);
        } else if (AnnotationStore.externalResourceIndex.hasOwnProperty(resourceId)) {
            return FRBRooUtil.createBreadcrumbTrail(resourceId, AnnotationStore.externalResourceIndex);
        } else {
            throw Error("Unknown resource!");
        }
    },

    extractBodies : (annotation) => {
        return AnnotationUtil.extractBodies(annotation);
    },

    extractTargets : (annotation) => {
        return AnnotationUtil.extractTargets(annotation);
    },

    extractTargetIdentifier : (target) => {
        return AnnotationUtil.extractTargetIdentifier(target);
    },

    getTargetText : (target, source) => {
        return TargetUtil.getTargetText(target, source);
    },

    getTargetMediaFragment : (target) => {
        return TargetUtil.getTargetMediaFragment(target);
    },

    toggleHighlight : (targetDOMElements, highlighted) => {
        return TargetUtil.toggleHighlight(targetDOMElements, highlighted);
    },

    formatTime : (timestamp) => {
        return TimeUtil.formatTime(timestamp);
    }

};

export default AnnotationActions;
