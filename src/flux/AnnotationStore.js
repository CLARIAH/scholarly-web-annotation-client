import MicroEvent from "microevent";
import AppDispatcher from "./AppDispatcher";

class AnnotationStore {

    constructor() {
        //all set via setResourceData()
        this.resourceData = null;
        this.resourceIndex = null;
        this.relationIndex = null;
        this.resourceStore = null;
        this.representedResourceMap = null;
        this.externalResourceIndex = null;

        //set via setTopResources()
        this.topResources = null;

        //all set via setAnnotations()
        this.annotations = null;
        this.annotationIndex = null;
    }

    /* ----------------------------- SET DATA FUNCTIONS ----------------------------- */

    //called by AnnotationActions._indexResources
    setResourceData = resourceData => {
        console.debug('setting resource data', resourceData);
        this.resourceData = resourceData;
        this.resourceIndex = resourceData ? resourceData.resourceIndex.resources : null;
        this.relationIndex = resourceData ? resourceData.resourceIndex.relations : null;
        this.resourceStore = resourceData ? resourceData.resourceStore : null;
        this.representedResourceMap = resourceData ? resourceData.representedResourceMap : null;
        this.externalResourceIndex = resourceData ? resourceData.externalResourceIndex : null;
    }

    //called by AnnotationActions.loadResources
    setTopResources = topResources => {
        console.debug('setting top resources', topResources);
        this.topResources = topResources;
    }

    //called by AnnotationActions.loadAnnotations
    setAnnotations = annotations => {
        console.debug('setting annotations', annotations);
        this.annotations = annotations;
        this.annotationIndex = {};
        annotations.forEach(a => {
            this.annotationIndex[a.id] = a;
        });
    }

    /* ----------------------------- GET DATA FUNCTIONS ----------------------------- */

    lookupIdentifier = sourceId => {
        var source = { type: null, data: null }; // for IDs to external resources
        if (this.annotationIndex.hasOwnProperty(sourceId))
            source = { type: "annotation", data: this.annotationIndex[sourceId] };
        else if (this.resourceIndex.hasOwnProperty(sourceId))
            source = { type: "resource", data: this.resourceIndex[sourceId] };
        else if (this.externalResourceIndex.hasOwnProperty(sourceId))
            source = { type: "external", data: this.externalResourceIndex[sourceId] };
        return source;
    }

    lookupAnnotationsByTarget = resourceId => {
        return Object.values(this.annotationIndex).filter(annotation => {
            let match = annotation.target.some(target => {
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
    }

    hasExternalResource = resourceId => {
        if (!this.externalResourceIndex) {
            return false;
        } else {
            return this.externalResourceIndex.hasOwnProperty(resourceId);
        }
    }

    getExternalResources = resourceIds => {
        if (!Array.isArray(resourceIds)) {
            console.log("resourceIds:", resourceIds);
            throw Error("resourceIds should be an array");
        }
        return resourceIds.filter(this.hasExternalResource).map((resourceId) => {
            return this.getExternalResource(resourceId);
        });
    }

    getExternalResource = resourceId => {
        if (!this.externalResourceIndex) {
            return null;
        } else if (this.externalResourceIndex.hasOwnProperty(resourceId)) {
            return this.externalResourceIndex[resourceId];
        } else {
            return null;
        }
    }

    /* --------------------------- FUNCTIONS HANDLING THE DISPATCH EVENTS ------------------------- */


    setTargetObserverClass() {
        return this.clientConfiguration.targetObserverClass;
    }

    getTargetObserverClass() {
        return this.clientConfiguration.targetObserverClass;
    }

    loadAnnotations(annotations) {
        this.trigger("loaded-annotations", annotations);
    }

    changeTarget() {
        this.trigger("changed-target");
    }

    //TODO change the name of the event 'change' --> save-annotation
    save(annotation) {
        //notify all components that just listen to a single target
        this.trigger(annotation.target.source, "update", annotation);
        //then notify all components that are interested in all annotations
        this.trigger("load-annotations");
        // then notify components interested in the saved annotation
        this.trigger("saved-annotation", annotation);
    }

    delete(annotation) {
        //then notify all components that are interested in all annotations
        this.trigger("load-annotations");
        // then notify all components that are interested in the deleted annotation
        this.trigger("deleted-annotation", annotation);
    }

    activate(annotation) {
        this.trigger("activate-annotation", annotation);
    }

    edit(annotation) {
        this.trigger("edit-annotation", annotation);
    }

    createAnnotation(annotationTargets) {
        this.trigger("create-annotation", annotationTargets);
    }

    set(annotation) {
        this.trigger("set-annotation", annotation);
    }

    play(annotation) {
        this.trigger("play-annotation", annotation);
    }

    reloadAnnotations() {
        this.trigger("reload-annotations");
    }

    loadResources(topResources) {
        this.trigger("loaded-resources", topResources);
    }

    loadCollections(collections) {
        this.trigger("load-collections", collections);
    }

    login(userDetails, triggerMessage) {
        this.trigger(triggerMessage, userDetails);
    }

    logout(userDetails) {
        this.trigger("logout-user", userDetails);
    }

    changeServerStatus(serverAvailable) {
        this.trigger("server-status-change", serverAvailable);
    }

}

const AppAnnotationStore = new AnnotationStore();

//add support for emitting events
MicroEvent.mixin(AnnotationStore);

AppDispatcher.register( function( action ) {

    switch(action.eventName) {

    case "save-annotation":
        AppAnnotationStore.save(action.annotation);
        break;
    case "delete-annotation":
        AppAnnotationStore.delete(action.annotation);
        break;
    case "activate-annotation":
        AppAnnotationStore.activate(action.annotation, action.callback);
        break;
    case "edit-annotation":
        AppAnnotationStore.edit(action.annotation, action.callback);
        break;
    case "create-annotation":
        AppAnnotationStore.createAnnotation(action.annotationTargets, action.callback);
        break;
    case "set-annotation":
        AppAnnotationStore.set(action.annotation, action.callback);
        break;
    case "play-annotation":
        AppAnnotationStore.play(action.annotation, action.callback);
        break;
    case "change-target":
        AppAnnotationStore.changeTarget(action.annotationTarget);
        break;
    case "load-annotations":
        AppAnnotationStore.loadAnnotations(action.annotations, action.callback);
        break;
    case "reload-annotations":
        AppAnnotationStore.reloadAnnotations();
        break;
    case "loaded-resources":
        AppAnnotationStore.loadResources(action.topResources);
        break;
    case "load-collections":
        AppAnnotationStore.loadCollections(action.collections, action.callback);
        break;
    case "login-succeeded":
        AppAnnotationStore.login(action.userDetails, "login-succeeded");
        break;
    case "login-failed":
        AppAnnotationStore.login(action.userDetails, "login-failed");
        break;
    case "logout-user":
        AppAnnotationStore.logout(action.userDetails);
        break;
    case "register-succeeded":
        AppAnnotationStore.login(action.userDetails, "register-succeeded");
        break;
    case "register-failed":
        AppAnnotationStore.logout(action.userDetails, "register-failed");
        break;
    case "get-server-address":
        AppAnnotationStore.getServerAddress();
        break;
    case "set-server-address":
        AppAnnotationStore.setServerAddress(action.apiURL);
        break;
    case "server-status-change":
        AppAnnotationStore.changeServerStatus(action.serverAvailable);
        break;

    }

});

export default AppAnnotationStore;
