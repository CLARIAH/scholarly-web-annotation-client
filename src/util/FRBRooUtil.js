
"use strict";

import parse from "rdflib/lib/parse";
import Namespace from "rdflib/lib/namespace";
import DataFactory from "rdflib/lib/data-factory";
import rdf from "rdflib";
import RDFaUtil from "./RDFaUtil.js";
import VocabularyUtil from "./VocabularyUtil.js";
import AnnotationActions from '../flux/AnnotationActions';

const FRBRooUtil = {

    store : null,
    RDF : Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#"),
    RDFS : Namespace("http://www.w3.org/2000/01/rdf-schema#"),

    importPredicate : "http://www.w3.org/2002/07/owl#imports",
    baseAnnotationOntologyURL : null, //requires to be set on init (now set from AnnotationActions)

    newStore() {
        return DataFactory.graph();
    },

    getAlternateLinkRefs() {
        let alternateLinks = FRBRooUtil.getAlternateLinks();
        return alternateLinks.map((link) => { return {url: link.href, mimeType: link.type }});
    },

    getAlternateLinks() {
        let linkElements = document.getElementsByTagName("link");
        return Array.from(linkElements).filter(FRBRooUtil.isAlternateLink);
    },

    isAlternateLink(node) {
        if (node.tagName !== "LINK") {
            return false;
        } else if (!node.getAttribute("rel") || node.getAttribute("rel") !== "alternate") {
            return false;
        } else if (!node.getAttribute("href")) {
            return false;
        } else {
            return true;
        }
    },

    storeExternalResources(store, frbrooRelationsString, baseURI, mimeType) {
        if (!store) {
            throw Error("Invalid store given");
        }
        try {
            parse(frbrooRelationsString, store, baseURI, mimeType);
        } catch(error) {
            console.log(error);
            throw error;
        }
    },

    findExternalObjectRelations(resourceStore, resource, relationType) {
        let objectNode = rdf.sym(resource);
        var relationNode = undefined;
        if (relationType) {
            relationNode = rdf.sym(relationType);
        }
        return resourceStore.triples.statementsMatching(undefined, relationNode, objectNode);
    },

    findExternalSubjectRelations(resourceStore, resource, relationType) {
        let subjectNode = rdf.sym(resource);
        var relationNode = undefined;
        if (relationType) {
            relationNode = rdf.sym(relationType);
        }
        return resourceStore.triples.statementsMatching(subjectNode, relationNode, undefined);
    },

    findExternalResources(resourceStore, resources, relationType) {
        var relationNode = undefined;
        if (relationType) {
            relationNode = rdf.sym(relationType);
        }
        try {
            let resourceList = ensureList(resources);
            var relations = [];
            resourceList.forEach((resource) => {
                let node = rdf.sym(resource);
                var subjectRelations = resourceStore.triples.statementsMatching(node, relationNode, undefined);
                var objectRelations = resourceStore.triples.statementsMatching(undefined, relationNode, node);
                relations = relations.concat(subjectRelations, objectRelations);
            });
            return relations;
        } catch (error) {
            console.log(error);
            return null;
        }
    },

    gatherResourceProperties(store, resource) {
        let properties = {rdfaResource: resource};
        let node = rdf.sym(resource);
        var subjectRelations = store.statementsMatching(node, undefined, undefined);
        var objectRelations = store.statementsMatching(undefined, undefined, node);
        subjectRelations.forEach((relation) => {
            if (relation.predicate.value === FRBRooUtil.RDF('type').value) {
                FRBRooUtil.addRDFTypeProperty(properties, relation.object.value);
            }
        })
        if (subjectRelations.length + objectRelations.length === 0) {
            return null;
        } else {
            return properties;
        }
    },

    getRDFTypeLabels(typeList) {
        if (!Array.isArray(typeList)) {
            return null;
        }
        return typeList.map((rdfType) => {
            let index = rdfType.indexOf("#");
            return rdfType.substr(index);
        });
    },

    getRDFType(resourceStore, resource) {
        let node = rdf.sym(resource);
        var triples = resourceStore.triples.statementsMatching(node, FRBRooUtil.RDF('type'), undefined);
        if (triples.length > 0) {
            return triples.map((triple) => { return triple.object.value; });
        }
        return null;
    },

    addRDFTypeProperty(properties, rdfType) {
        if (!rdfType) {
            return true;
        } else if (properties.hasOwnProperty("rdfType") === false) {
            properties.rdfType = rdfType;
            return true;
        } else if (typeof properties.rdfType === "string") {
            properties.rdfType = [properties.rdfType, rdfType];
        } else if (Array.isArray(properties.rdfType)){
            properties.rdfType.push(rdfType);
        } else {
            throw Error("properties.rdfType should be string or array");
        }
    },

    indexResources() {
        return new Promise((resolve, reject) => {
            let resourceData = {}
            RDFaUtil.indexRDFa().then((resourceIndex) => {
                resourceData.resourceIndex = resourceIndex;
                let resources = Object.keys(resourceIndex.resources);
                FRBRooUtil.loadVocabularies()
                    .then(FRBRooUtil.loadExternalResources)
                    .then((resourceStore) => {
                        resourceData.resourceStore = resourceStore;
                        resourceData.representedResourceMap = FRBRooUtil.mapRepresentedResources(resourceStore, resources);
                        resourceData.externalResourceIndex = FRBRooUtil.indexExternalResources(resourceStore, resources);
                        return resolve(resourceData);
                    }, (error) => {
                        reject(error);
                    });
            });
        });
    },

    indexExternalResources(resourceStore, resources) {
        let externalResourceIndex = {};
        if (!resourceStore.triples) {
            return externalResourceIndex;
        }
        resources.forEach((resource) => {
            let relation = FRBRooUtil.resourceGetParentRelation(resourceStore, resource);
            if (relation) {
                externalResourceIndex[resource] = relation;
                let rdfType = FRBRooUtil.getRDFType(resourceStore, resource);
                externalResourceIndex[resource].type = "external";
                externalResourceIndex[resource].rdfType = rdfType;
                externalResourceIndex[resource].rdfTypeLabel = FRBRooUtil.getRDFTypeLabels(rdfType);
                if (!externalResourceIndex.hasOwnProperty(relation.parentResource)) {
                    FRBRooUtil.indexExternalParentResource(resourceStore, externalResourceIndex, relation.parentResource);
                }
            }
        });
        return externalResourceIndex;
    },

    indexExternalParentResource(resourceStore, index, resource) {
        if (!FRBRooUtil.isKnownResource(resourceStore, resource)) {
            throw Error ("parentResource does not exist: " + resource);
        }
        let resourceInfo = {resource: resource, type: "external"};
        resourceInfo.rdfType = FRBRooUtil.getRDFType(resourceStore, resource);
        resourceInfo.rdfTypeLabel = FRBRooUtil.getRDFTypeLabels(resourceInfo.rdfType);
        index[resource]
        let relation = FRBRooUtil.resourceGetParentRelation(resourceStore, resource);
        if (relation) {
            resourceInfo.parentResource = relation.parentResource;
            resourceInfo.relation = relation.relation;
            if (!index.hasOwnProperty(relation.parentResource)) {
                FRBRooUtil.indexExternalParentResource(resourceStore, index, relation.parentResource);
            }
        }
        index[resource] = resourceInfo;
    },

    mapRepresentedResources(resourceStore, resources) {
        if (!resources || !Array.isArray(resources)) {
            throw Error("resources should be an array of resource IDs");
        }
        let representedResourceIndex = {};
        if (!resourceStore.triples) {
            return representedResourceIndex;
        }
        resources.forEach((resource) => {
            FRBRooUtil.mapRepresentedObjectResources(resourceStore, resource, representedResourceIndex);
            FRBRooUtil.mapRepresentedSubjectResources(resourceStore, resource, representedResourceIndex);
            FRBRooUtil.mapFragmentObjectResources(resourceStore, resource, representedResourceIndex);
            FRBRooUtil.mapFragmentSubjectResources(resourceStore, resource, representedResourceIndex);
        });
        return representedResourceIndex;
    },

    mapFragmentObjectResources(resourceStore, resource, representedResourceIndex) {
        let hasFragmentIn = FRBRooUtil.baseAnnotationOntologyURL + "#hasFragmentIn";
        let hasFragmentOf = FRBRooUtil.baseAnnotationOntologyURL + "#hasFragmentOf";
        var objectRelations = FRBRooUtil.findExternalObjectRelations(resourceStore, resource, hasFragmentIn);
        var objectRelations = objectRelations.concat(FRBRooUtil.findExternalObjectRelations(resourceStore, resource, hasFragmentOf));
        if (objectRelations.length > 0) {
            FRBRooUtil.addIndexEntry(representedResourceIndex, resource, objectRelations[0]);
        }
    },

    mapFragmentSubjectResources(resourceStore, resource, representedResourceIndex) {
        let isFragmentIn = FRBRooUtil.baseAnnotationOntologyURL + "#isFragmentIn";
        let isFragmentOf = FRBRooUtil.baseAnnotationOntologyURL + "#isFragmentOf";
        var subjectRelations = FRBRooUtil.findExternalSubjectRelations(resourceStore, resource, isFragmentIn);
        var subjectRelations = subjectRelations.concat(FRBRooUtil.findExternalSubjectRelations(resourceStore, resource, isFragmentOf));
        if (subjectRelations.length > 0) {
            FRBRooUtil.addIndexEntry(representedResourceIndex, resource, subjectRelations[0]);
        }
    },

    mapRepresentedObjectResources(resourceStore, resource, representedResourceIndex) {
        let hasRepresentation = FRBRooUtil.baseAnnotationOntologyURL + "#hasRepresentation";
        let objectRelations = FRBRooUtil.findExternalObjectRelations(resourceStore, resource, hasRepresentation);
        if (objectRelations.length > 0) {
            FRBRooUtil.addIndexEntry(representedResourceIndex, resource, objectRelations[0]);
        }
    },

    mapRepresentedSubjectResources(resourceStore, resource, representedResourceIndex) {
        let isRepresentationOf = FRBRooUtil.baseAnnotationOntologyURL + "#isRepresentationOf";
        let subjectRelations = FRBRooUtil.findExternalSubjectRelations(resourceStore, resource, isRepresentationOf);
        if (subjectRelations.length > 0) {
            FRBRooUtil.addIndexEntry(representedResourceIndex, resource, subjectRelations[0]);
        }
    },

    addIndexEntry(index, resource, relation) {
        if (typeof resource !== "string") {
            throw Error("resource must be a string");
        } else if (!FRBRooUtil.isRDFTriple(relation)) {
            throw Error("relation must be RDF triple")
        }
        var entry = null;
        if (relation.subject.value === resource) {
            entry = {resource: resource, relation: relation.predicate.value, parentResource: relation.object.value};
        } else if (relation.object.value === resource) {
            entry = {resource: resource, relation: relation.predicate.value, parentResource: relation.subject.value};
        } else {
            throw Error("relation must contain resource as subject or object");
        }
        index[resource] = entry;
        return true;
    },

    isRDFTriple(triple) {
        if (!triple || typeof triple !== "object") {
            return false;
        } else if (!triple.hasOwnProperty("subject") || !triple.subject.hasOwnProperty("value")) {
            return false;
        } else if (!triple.hasOwnProperty("predicate") || !triple.subject.hasOwnProperty("value")) {
            return false;
        } else if (!triple.hasOwnProperty("object") || !triple.subject.hasOwnProperty("value")) {
            return false;
        } else {
            return true;
        }
    },

    loadExternalResources(vocabularyStore) {
        return new Promise((resolve, reject) => {
            var externalStore = {doIndexing: false, triples: null, relations: null};
            let externalResourcesRefs = FRBRooUtil.getAlternateLinkRefs();
            if (!FRBRooUtil.hasExternalResources()) {
                return resolve(externalStore);
            }
            externalStore.relations = FRBRooUtil.getRelations(vocabularyStore);
            //let externalResourcesRefs = FRBRooUtil.getAlternateLinkRefs();
            externalStore.triples = FRBRooUtil.newStore();
            externalResourcesRefs.forEach((ref) => {
                externalStore.doIndexing = true;
                FRBRooUtil.readExternalResources(ref.url).then((externalRelations) => {
                    externalStore.externalRelations = externalRelations;
                    try {
                        FRBRooUtil.storeExternalResources(externalStore.triples, externalRelations, ref.url, ref.mimeType);
                    } catch(error) {
                        console.log("Error storing external resources:", externalRelations);
                        return reject(error);
                    }
                    return resolve(externalStore);
                }, (error) => {
                    console.log("Error reading external resources for URL", ref);
                    console.log(error);
                    return reject(error);

                });
            });
        });
    },

    hasExternalResources() {
        let externalResourcesRefs = FRBRooUtil.getAlternateLinkRefs();
        return (externalResourcesRefs.length > 0);
    },

    checkExternalResources() {
        return new Promise((resolve, reject) => {
            let externalResourcesRefs = FRBRooUtil.getAlternateLinkRefs();
            var data = {doIndexing: false, externalStore: null};
            if (externalResourcesRefs.length === 0) {
                return resolve(data);
            }
            data.externalStore = FRBRooUtil.newStore();
            externalResourcesRefs.forEach((ref) => {
                data.doIndexing = true;
                FRBRooUtil.readExternalResources(ref.url).then((externalRelations) => {
                    try {
                        FRBRooUtil.storeExternalResources(data.externalStore, externalRelations, ref.url, ref.mimeType);
                    } catch(error) {
                        console.log("Error storing external resources:", externalRelations);
                        return reject(error);
                    }
                    return resolve(data);
                }, (error) => {
                    console.log("Error reading external resources for URL", ref);
                    console.log(error);
                    return reject(error);

                });
            });
        });
    },

    readExternalResources(url) {
        return new Promise((resolve, reject) => {
            var status = null;
            fetch(url, {
                method: "GET"
            }).then((response) => {
                if (!response.ok) {
                    let error = new Error('HTTP error, status = ' + response.status);
                    reject(error);
                }
                return response.text();
            }).then((relationsData) => {
                return resolve(relationsData);
            }).catch((error) => {
                console.log("Error reading specified vocabulary:", url);
                console.log(error);
                return reject(error);
            });
        });
    },

    readVocabularies(vocabularyURLs) {
        return new Promise((resolve, reject) => {
            let vocabularies = [];
            if (vocabularyURLs.length === 0) {
                return resolve(vocabularies);
            }
            let lastURL = vocabularyURLs[vocabularyURLs.length - 1];
            vocabularyURLs.forEach((vocabularyURL) => {
                FRBRooUtil.readVocabulary(vocabularyURL).then((vocabulary) => {
                    vocabularies.push(vocabulary);
                    if (vocabularyURL === lastURL) {
                        return resolve(vocabularies);
                    }
                }, (error) => {
                    return reject(error);
                });
            });
        });
    },

    readVocabulary(vocabularyURL) {
        if (vocabularyURL.endsWith("#")) {
            vocabularyURL = vocabularyURL.substring(0, vocabularyURL.length - 1);
        }
        let vocab = {
            url: vocabularyURL,
            data: null
        }
        return new Promise((resolve, reject) => {
            FRBRooUtil.readExternalResources(vocabularyURL).then((data) => {
                vocab.data = data;
                return resolve(vocab);
            }, (error) => {
                return reject(error);
            });
        });
    },

    makeVocabularyStore(vocabularies) {
        if (!Array.isArray(vocabularies)) {
            throw Error("cannot make store if no vocabulary data is given");
        }
        let store = {vocabularies: [], triples: DataFactory.graph()};
        vocabularies.forEach((vocabulary) => {
            if (!FRBRooUtil.isValidVocabulary(vocabulary)) {
                throw Error("Invalid vocabulary data! vocabulary should have properties 'url' and 'data'");
            }
            store.vocabularies.push(vocabulary.url);
            parse(vocabulary.data, store.triples, vocabulary.url, undefined);
        })
        return store;
    },

    isValidVocabulary(vocabulary) {
        if (!vocabulary || typeof vocabulary !== "object") {
            return false;
        } else if (!vocabulary.hasOwnProperty("url")) {
            return false;
        } else if (!vocabulary.hasOwnProperty("data")) {
            return false;
        } else {
            return true;
        }
    },

    isValidVocabularyStore(vocabularyStore) {
        if (!vocabularyStore || typeof vocabularyStore !== "object") {
            return false;
        } else if (!vocabularyStore.hasOwnProperty("vocabularies")) {
            return false;
        } else if (!vocabularyStore.hasOwnProperty("triples")) {
            return false;
        } else {
            return true;
        }
    },

    getHierarchicalRelations(vocabularyStore) {
        let relations = {includes: [], isIncludedIn: []};
        let includesProperty = VocabularyUtil.getLabelClass(vocabularyStore.triples, 'includes');
        if (!includesProperty) {
            throw Error("Cannot read base includes property");
        }
        let includesSubProperties = VocabularyUtil.getDescendantProperties(vocabularyStore.triples, includesProperty);
        relations.includes.push(includesProperty);
        relations.includes = relations.includes.concat(includesSubProperties);
        relations.includes.forEach((includeProperty) => {
            let inverse = VocabularyUtil.getInverseOfRelation(vocabularyStore.triples, includeProperty);
            if (inverse) {
                relations.isIncludedIn.push(inverse);
            }
        });
        return relations;
    },

    getRepresentationRelations(vocabularyStore) {
        let relations = {hasRepresentation: [], isRepresentationOf: []};
        let hasRepresentationProperty = VocabularyUtil.getLabelClass(vocabularyStore.triples, 'hasRepresentation');
        let hasRepresentationSubProperties = VocabularyUtil.getDescendantProperties(vocabularyStore.triples, hasRepresentationProperty);
        relations.hasRepresentation.push(hasRepresentationProperty);
        relations.hasRepresentation = relations.hasRepresentation.concat(hasRepresentationSubProperties);
        relations.isRepresentationOf = relations.hasRepresentation.map((includeProperty) => {
            return VocabularyUtil.getInverseOfRelation(vocabularyStore.triples, includeProperty);
        })
        return relations;
    },

    getRelations(vocabularyStore) {
        let relations = {};
        let hierarchicalRelations = FRBRooUtil.getHierarchicalRelations(vocabularyStore);
        let representationRelations = FRBRooUtil.getRepresentationRelations(vocabularyStore);
        relations.includes = hierarchicalRelations.includes;
        relations.isIncludedIn = hierarchicalRelations.isIncludedIn;
        relations.hasRepresentation = representationRelations.hasRepresentation;
        relations.isRepresentationOf = representationRelations.isRepresentationOf;
        return relations;
    },

    getImports(vocabularyStore) {
        if (!FRBRooUtil.isValidVocabularyStore(vocabularyStore)) {
            throw Error("Invalid vocabularyStore given");
        }
        if (!FRBRooUtil.baseAnnotationOntologyURL) {
            console.log("No baseAnnotationOntologyURL set!");
        }
        let imports = [];
        vocabularyStore.vocabularies.forEach((vocabularyURL) => {
            let vocabularyNode = rdf.sym(vocabularyURL);
            let importNode = rdf.sym(FRBRooUtil.importPredicate);
            let triples = vocabularyStore.triples.each(vocabularyNode, importNode, undefined);
            if (vocabularyURL === FRBRooUtil.baseAnnotationOntologyURL) {
                // don't import beyond the base annotation ontology
                return;
            }
            triples.forEach((triple) => {
                if (!vocabularyStore.vocabularies.includes(triple.value)) {
                    imports.push(triple.value);
                }
            })
        });
        return imports;
    },

    updateVocabularyStore(vocabularyStore, vocabularies) {
        if (!FRBRooUtil.isValidVocabularyStore(vocabularyStore)) {
            throw Error("Invalid vocabularyStore given");
        } else if (!vocabularies || !Array.isArray(vocabularies)) {
            throw Error("vocabularies must be an Array of vocabulary objects");
        } else {
            vocabularies.forEach((vocabulary) => {
                if (!FRBRooUtil.isValidVocabulary(vocabulary)) {
                    throw Error("Invalid vocabulary data! vocabulary should have properties 'url' and 'data'");
                }
            });
        }
        vocabularies.forEach((vocabulary) => {
            vocabularyStore.vocabularies.push(vocabulary.url);
            parse(vocabulary.data, vocabularyStore.triples, vocabulary.url, undefined);
        });
    },

    importAndUpdate(vocabularyStore) {
        return new Promise((resolve, reject) => {
            if (!FRBRooUtil.isValidVocabularyStore(vocabularyStore)) {
                throw Error("Invalid vocabularyStore given");
            }
            let imports = FRBRooUtil.getImports(vocabularyStore);
            if (imports.length > 0) {
                FRBRooUtil.readVocabularies(imports).then((vocabularies) => {
                    FRBRooUtil.updateVocabularyStore(vocabularyStore, vocabularies);
                    FRBRooUtil.importAndUpdate(vocabularyStore).then((done) => {
                        return resolve(done);
                    }, (error) => {
                        return reject(error);
                    });
                }, (error) => {
                    return reject(error);
                });
            } else {
                return resolve(true);
            }
        });
    },

    loadVocabularies() {
        return new Promise((resolve, reject) => {
            let vocabData = [];
            let vocabularyURLs = RDFaUtil.listVocabularyURLs(document);
            if (vocabularyURLs.length === 0) {
                let vocabularyStore = FRBRooUtil.makeVocabularyStore([]);
                return resolve(vocabularyStore);
            }
            FRBRooUtil.readVocabularies(vocabularyURLs).then((vocabularies) => {
                let vocabularyStore = FRBRooUtil.makeVocabularyStore(vocabularies);
                // iterate: 1) get imports, 2) update store
                FRBRooUtil.importAndUpdate(vocabularyStore).then((updatesDone) => {
                    return resolve(vocabularyStore);
                }, (error) => {
                    return reject(error);
                });
            }, (error) => {
                return reject(error);
            });
        })
    },

    determineResourceHierarchy(resourceStore, resource) {
        if (!resourceStore) {
            throw Error("Invalid resourceStore");
        } else if (!FRBRooUtil.isKnownResource(resourceStore, resource)) {
            throw Error("Unknown resource");
        }
        let parentRelation = FRBRooUtil.resourceGetParentRelation(resourceStore, resource);
        if (parentRelation) {
            return parentRelation;
        } else {
            return {resource: resource};
        }
    },

    resourceGetParentRelation(resourceStore, resource) {
        // assumption is that in external resources store, each resource has a single parent.
        var relation = null;
        relation = FRBRooUtil.resourceGetParentSubjectRelation(resourceStore, resource);
        if (relation) {
            return relation;
        }
        relation = FRBRooUtil.resourceGetParentObjectRelation(resourceStore, resource);
        return relation;
    },

    resourceHasParent(resourceStore, resource) {
        if (!FRBRooUtil.isKnownResource(resourceStore, resource)) {
            throw Error("Unknown resource");
        }
        let relation = FRBRooUtil.resourceGetParentRelation(resourceStore, resource)
        if (relation) {
            return true;
        } else {
            return false;
        }
    },

    resourceGetParentSubjectRelation(resourceStore, resource) {
        let resourceNode = rdf.sym(resource);
        let parentRelation = null;
        resourceStore.relations.includes.some((relation) => {
            let relationNode = rdf.sym(relation);
            let subject = resourceStore.triples.any(undefined, relationNode, resourceNode);
            if (subject) {
                parentRelation = {resource: resource, parentResource: subject.value, relation: relation};
            }
        });
        return parentRelation;
    },

    resourceGetParentObjectRelation(resourceStore, resource) {
        let resourceNode = rdf.sym(resource);
        let parentRelation = null;
        resourceStore.relations.isIncludedIn.some((relation) => {
            let relationNode = rdf.sym(relation);
            let object = resourceStore.triples.any(resourceNode, relationNode, undefined);
            if (object) {
                parentRelation = {resource: resource, parentResource: object.value, relation: relation};
            }
        });
        return parentRelation;
    },

    isKnownResource(resourceStore, resource) {
        if (!resourceStore) {
            throw Error("Invalid resourceStore");
        } else if (!resource) {
            throw Error("Invalid resource");
        }
        let resourceNode = rdf.sym(resource);
        var triple = resourceStore.triples.any(resourceNode, undefined, undefined);
        if (!triple) {
            triple = resourceStore.triples.any(undefined, undefined, resourceNode);
        }
        return triple !== undefined;
    },

    addBreadcrumb(labelTrail, source) {
        labelTrail.unshift({
            id: source.data.rdfaResource,
            property: source.data.rdfaProperty,
            type: source.data.rdfTypeLabel
        });
    },

    createBreadcrumbTrail(resourceId, externalResourceIndex) {
        var rootFound = false;
        var labelTrail = [];
        while (!rootFound) {
            if (!externalResourceIndex.hasOwnProperty(resourceId)) {
                throw Error("Invalid resource");
            }
            let data = externalResourceIndex[resourceId];
            var breadcrumb = {};
            breadcrumb.type = data.rdfType;
            breadcrumb.id = resourceId;
            breadcrumb.property = data.relation;
            labelTrail.unshift(breadcrumb);
            if (resourceId !== undefined && data.hasOwnProperty("parentResource")) {
                resourceId = data.parentResource;
            } else {
                rootFound = true;
            }
        }
        return labelTrail;
    },


}

var ensureList = (resources) => {
    if (typeof(resources) === "string" || resources instanceof String) {
        return [resources];
    } else if (Array.isArray(resources)) {
        return resources;
    } else {
        throw Error("resources should be string or list of strings");
    }
}

var invalidVocabularyStore = (vocabularyStore) => {
    throw Error("Invalid vocabularyStore given");
}

export default FRBRooUtil;
