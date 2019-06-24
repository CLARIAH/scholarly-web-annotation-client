
"use strict";

require("isomorphic-fetch");
const chai = require("chai");
const chaiFetch = require("chai-fetch");
const mockServer = require("mockttp").getLocal();
chai.use(chaiFetch);
const expect = require("chai").expect;
require("es6-promise").polyfill();
const fs = require("fs");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
import { baseAnnotationOntologyURL, htmlSource, vangoghOntologyString, editionOntologyString, frbrooRelationsString } from "./testData.js";
import RDFaUtil from "../util/RDFaUtil.js";
import TargetUtil from "../util/TargetUtil.js";
import FRBRooUtil from "../util/FRBRooUtil.js";
import AnnotationActions from "../flux/AnnotationActions.js";
import AnnotationStore from "../flux/AnnotationStore.js";
import DOMUtil from "../util/DOMUtil.js";
import SelectionUtil from "../util/SelectionUtil.js";

const $rdf = require("rdflib");

var makeDOM = (htmlSource, jsdomConfig) => {
    let dom = new JSDOM(htmlSource, jsdomConfig);
    global.window = dom.window;
    global.document = dom.window.document;
}

let localURL = "http://localhost:3001/";
var loadPage = (htmlSource) => {
    const jsdomConfig = {url: localURL}
    let dom = new JSDOM(htmlSource, jsdomConfig);
    global.document = dom.window.document;
    global.window = dom.window;
}

var loadRDFaPage = () => {
    let vocabulary = "http://boot.huygens.knaw.nl/vgdemo/vangoghannotationontology.ttl#";
    loadPage(htmlSource);
    let observerNodes = document.getElementsByClassName("annotation-target-observer");
    RDFaUtil.setObserverNodes(observerNodes);
    SelectionUtil.currentSelection = null;
}

var loadResources = (callback) => {
    FRBRooUtil.indexResources().then((resourceData) => {
        return callback(resourceData);
    });
}



describe("TargetUtil", () => {

    let htmlSource = fs.readFileSync("public/testletter.html", "utf-8");
    let baseAnnotationOntologyURL = "http://localhost:3001/editionannotationontology.ttl";
    let resourceData = null;

    before(() => {
        AnnotationActions.setBaseAnnotationOntology(baseAnnotationOntologyURL);
    });

    beforeEach((done) => {
        const jsdomConfig = {url: "http://localhost:3001/testletter"}
        makeDOM(htmlSource, jsdomConfig);
        // make sure observerNodes are reset in case of mocha caching utils
        AnnotationStore.resourceIndex = null;
        DOMUtil.setObserverNodeClass("annotation-target-observer");
        let observerNodes = DOMUtil.getObserverNodes();
        RDFaUtil.setObserverNodes(observerNodes);
        FRBRooUtil.indexResources().then((data) => {
            resourceData = data;
            done();
        });
    });

    describe("getCandidateRDFaTargets", () => {

        it("should return candidate element with image coordinates", (done) => {
            let element = document.getElementsByTagName("img")[0];
            let rect = {x: 1, y: 1, h:100, w: 100};
            SelectionUtil.setImageSelection(element, rect);
            let defaultTargets = [];
            let candidates = TargetUtil.getCandidateRDFaTargets(defaultTargets, resourceData.resourceIndex);
            expect(typeof candidates).to.equal("object");
            let candidate = candidates.highlighted;
            expect(candidate.mimeType).to.equal("image");
            expect(candidate.params.rect.x).to.equal(rect.x);
            done();
        });
    });

    describe("parsing text selection", () => {

        before((done) => {
            let htmlSource = fs.readFileSync("public/vgdemo/translated.html");
            makeDOM(htmlSource);
            done();
        });

        it("should get correct container node", (done) => {
            done();
        });
    });
});

describe("TargetUtil", () => {

    let abstractResource = "urn:vangogh/letter=001";
    let originalResource = "urn:vangogh/letter=001:repr=original";
    let transcriptResource = "urn:vangogh/letter=001:repr=transcript";
    let resources = [originalResource, transcriptResource];
    let defaultTargets = ["EditionText", "EditionTranscript"];

    describe("getCandidateExternalResources", () => {

        beforeEach((done) => {
            loadRDFaPage();
            mockServer.start((3001));
            mockServer.get("/frbroo_alternate.ttl").thenReply(200, frbrooRelationsString);
            mockServer.get("/vangoghannotationontology.ttl").thenReply(200, vangoghOntologyString);
            mockServer.get("/editionannotationontology.ttl").thenReply(200, editionOntologyString);
            AnnotationActions.setBaseAnnotationOntology(baseAnnotationOntologyURL);
            FRBRooUtil.store = null;
            done();
        });

        afterEach((done) => {
            mockServer.stop();
            done();
        });

        it("should return an object", (done) => {
            loadResources((resourceData) => {
                let candidateResources = TargetUtil.getCandidateRDFaTargets(defaultTargets, resourceData.resourceIndex);
                let candidateExternalResources = TargetUtil.getCandidateExternalResources(candidateResources, resourceData);
                expect(candidateExternalResources).to.not.equal(null);
                done();
            });
        });

        it("should return an object with a highlighed property", (done) => {
            loadResources((resourceData) => {
                let candidateResources = TargetUtil.getCandidateRDFaTargets(defaultTargets, resourceData.resourceIndex);
                let candidateExternalResources = TargetUtil.getCandidateExternalResources(candidateResources, resourceData);
                expect(candidateExternalResources.hasOwnProperty("highlighted")).to.equal(true);
                done();
            });
        });

        it("should return an object with a highlighed property", (done) => {
            loadResources((resourceData) => {
                let candidateResources = TargetUtil.getCandidateRDFaTargets(defaultTargets, resourceData.resourceIndex);
                let candidateExternalResources = TargetUtil.getCandidateExternalResources(candidateResources, resourceData);
                expect(candidateExternalResources.hasOwnProperty("wholeNodes")).to.equal(true);
                done();
            });
        });

        it("should return wholeNodes if candidateResources wholeNodes have external resources", (done) => {
            loadResources((resourceData) => {
                let candidateResources = TargetUtil.getCandidateRDFaTargets(defaultTargets, resourceData.resourceIndex);
                let candidateExternalResources = TargetUtil.getCandidateExternalResources(candidateResources, resourceData);
                expect(candidateExternalResources.wholeNodes.length).to.not.equal(0);
                done();
            });
        });

        it("should get abstract resource if original representation is candidate", (done) => {
            loadResources((resourceData) => {
                let candidateResources = TargetUtil.getCandidateRDFaTargets(defaultTargets, resourceData.resourceIndex);
                let candidateExternalResources = TargetUtil.getCandidateExternalResources(candidateResources, resourceData);
                let externalRelation = candidateExternalResources.wholeNodes[0];
                expect(externalRelation.resource).to.equal(abstractResource);
                done();
            });
        });
    });
});


