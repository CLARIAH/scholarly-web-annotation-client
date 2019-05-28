// api-test.js
"use strict";

const chai = require("chai");
const chaiFetch = require("chai-fetch");
const mockServer = require("mockttp").getLocal();
const ServerMock = require("mock-http-server");
chai.use(chaiFetch);
const expect = require("chai").expect;
require("es6-promise").polyfill();
require("isomorphic-fetch");
import AnnotationAPI from "../api/AnnotationAPI.js";
var uuid = require("uuid4");

let user = {username: "a_certain_someone", password: "cannotbehacked"};
let annotationInvalid = {
    "@context": "http://www.w3.org/ns/anno.jsonld",
    type: "Annotation",
    body: [
        {
            vocabulary: "DBpedia",
            purpose: "classifying",
            type: "Classifying",
            id: "http://dbpedia.org/resource/Vincent_van_Gogh",
            value: "Vincent van Gogh"
        }
    ],
    creator: "A. Certain Someone"
};

let annotationValid = {
    "@context": "http://www.w3.org/ns/anno.jsonld",
    type: "Annotation",
    body: [
        {
            vocabulary: "DBpedia",
            purpose: "classifying",
            type: "Classifying",
            id: "http://dbpedia.org/resource/Vincent_van_Gogh",
            value: "Vincent van Gogh"
        }
    ],
    creator: "A. Certain Someone",
    target: [
        {
            source: "urn:vangogh:testletter.sender",
            selector: null,
            type: "Text"
        }
    ]
};

let getAnnotationsReply = {
    "@context": [
        "http://www.w3.org/ns/ldp.jsonld",
        "http://www.w3.org/ns/anno.jsonld"
    ],
    "id": "http://localhost:3000/api/annotations?iris=1",
    "total": 0,
    "type": [
        "BasicContainer",
        "AnnotationContainer"
    ],
    "first": "http://localhost:3000/api/annotations?iris=1&page=0",
    "last": "http://localhost:3000/api/annotations?iris=1&page=0"
}

describe("AnnotationAPI", () => {
});

describe("AnnotationAPI", () => {

    before((done) => {
        let serverAddress = "http://localhost:3000/api";
        AnnotationAPI.setServerAddress(serverAddress);
        return done();
    });

    describe("after initialising", () => {

        before((done) => {
            mockServer.start((3000));
            mockServer.get("/api").thenReply(200, true);
            return done();
        });

        after((done) => {
            mockServer.stop();
            done();
        });

        it("should exist", (done) => {
            expect(AnnotationAPI).to.not.be.undefined;
            done();
        });

        it("should have a server address", (done) => {
            expect(AnnotationAPI.annotationServer).to.not.be.null;
            done();
        });

        it("should should check server is available", (done) => {
            AnnotationAPI.checkServerAvailable((serverAvailable) => {
                expect(serverAvailable).to.be.true;
                done();
            });
        });

        it("should have no user details", (done) => {
            expect(AnnotationAPI.userDetails).to.equal(null);
            done();
        });
    });

    describe("registering a new user", () => {

        before((done) => {
            mockServer.start((3000));
            mockServer.post("/api/users", user).thenReply(201, JSON.stringify({user: {username: user.username, token: 'bla'}, action: "created"}));
            mockServer.get("/api/logout").thenReply(200, JSON.stringify({action: "logged out"}));
            mockServer.post("/api/login", user).thenReply(200, JSON.stringify({user: {username: user.username, token: 'bla'}, action: "authenticated"}));
            mockServer.delete("/api/users", user).thenReply(204, JSON.stringify({}));
            return done();
        });

        after((done) => {
            mockServer.stop();
            done();
        });

        it("should return 201 on registering", (done) => {
            AnnotationAPI.registerUser(user, (error, response) => {
                expect(error).to.equal(null);
                expect(response.action).to.equal("created");
                done();
            });
        });

        it("should return 200 on logout", (done) => {
            AnnotationAPI.logoutUser((error, response) => {
                expect(error).to.equal(null);
                expect(AnnotationAPI.userDetails).to.equal(null);
                done();
            });
        });

        it("should return 200 on login", (done) => {
            AnnotationAPI.loginUser(user, (error, response) => {
                expect(error).to.equal(null);
                expect(response.action).to.equal("authenticated");
                done();
            });
        });

        it("should return 204 on delete", (done) => {
            AnnotationAPI.deleteUser(user, (error, response) => {
                expect(error).to.equal(null);
                done();
            });
        });

    });

});

describe("AnnotationAPI", () => {

    var server = new ServerMock({ host: "localhost", port: 3000 });

    before((done) => {
        let serverAddress = "http://localhost:3000/api";
        AnnotationAPI.setServerAddress(serverAddress);
        mockServer.start((3000));
        mockServer.post("/api/annotations", annotationValid).thenReply(403, JSON.stringify({message: "Unauthorized access"}));
        mockServer.get("/api/annotations").thenReply(200, JSON.stringify(getAnnotationsReply));
        done();
    });

    after((done) => {
        mockServer.stop();
        done();
    })

    describe("POSTing an annotation unauthorized", () => {

        it("should return 403", (done) => {
            let permission = "private";
            AnnotationAPI.saveAnnotation(annotationValid, permission, function(error, annotation) {
                expect(error).to.not.equal(null);
                expect(error.status).to.equal(403);
                done();
            });
        });
    });

    describe("GETting an annotation unauthorized", () => {
        it("should return list", (done) => {
            AnnotationAPI.getAnnotations(function(error, annotationContainer) {
                expect(error).to.equal(null);
                expect(annotationContainer.type).to.include("AnnotationContainer");
                done();
            });
        });
    });

});

describe("AnnotationAPI", () => {

    let fakeId = "this-resource-does-not-exist";
    let host = "localhost";
    let port = 3333;
    let serverAddress = "http://" + host + ":" + port + "/api";
    let userDetails = {user: {username: user.username, token: 'bla'}, action: "authenticated"};
    let annotationWithId = JSON.parse(JSON.stringify(annotationValid))
    annotationWithId.id = "some_id";
    var server =  new ServerMock({ host: host, port: port });

    before((done) => {
        //mockServer.start((3000));
        AnnotationAPI.setServerAddress(serverAddress);
        AnnotationAPI.setUserDetails(userDetails);
        server.start(done);
        /*
        server.on({
            method: "POST",
            path: "/api/login",
            reply: {
                status: 200,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userDetails)
            }
        })
        //mockServer.post("/api/login", user).thenReply(200, JSON.stringify({user: {username: user.username, token: 'bla'}, action: "authenticated"}));
        //mockServer.post("/api/annotations", annotationValid).thenReply(201, JSON.stringify(annotationWithId));
        mockServer.post("/api/annotations", annotationInvalid).thenReply(400, JSON.stringify({message: "annotation MUST have at least one target"}));
        mockServer.get("/api/annotations").thenReply(200, JSON.stringify(getAnnotationsReply));
        */
        //AnnotationAPI.registerUser(user, (error, response) => {
        //    done();
        //});
    });

    after((done) => {
        server.stop(done);
        /*
        AnnotationAPI.deleteUser(user, (error, response) => {
            server.stop(done);
            //mockServer.stop();
            //done();
        });
        */
    });

    describe("sending a non-existing resource ID", () => {

        it("should return an empty list", (done) => {
            let accessStatus = ["private"];
            let urlQuery = {"target_id": fakeId,"access_status": accessStatus.join(","),"include_permissions":"true"};

            //mockServer.get("/api/annotations").withQuery(urlQuery).thenReply(200, JSON.stringify(getAnnotationsReply));
            server.on({
                method: "GET",
                path: "/api/annotations",
                reply: {
                    status: 200,
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(getAnnotationsReply)
                }
            });
            let expectedData = [];
            AnnotationAPI.getAnnotationsByTarget(fakeId, accessStatus, function(error, actualData) {
                expect(error).to.equal(null);
                expect(actualData.total).to.eql(0);
                done();
            });
        });
    });

    describe("sending an object as resource ID", () => {

        it("should return an error", (done) => {
            let objectAsId = {"id": "this-resource-does-not-exist"};
            let expectedData = null;
            let accessStatus = ["private"];
            AnnotationAPI.getAnnotationsByTarget(objectAsId, accessStatus, function(error, actualData) {
                expect(error.name).to.equal("TypeError");
                expect(error.message).to.equal("resource ID should be string");
                expect(actualData).to.eql(expectedData);
                done();
            });
        });
    });

    describe("POSTing an annotation without a target", () => {

        it("should return an error", (done) => {
            let permission = "private";
            var status = null;
            server.on({
                method: "POST",
                path: "/api/annotations",
                reply: {
                    status: function(req) {
                        if (req.body.target) {
                            return 201;
                        } else {
                            return 400;
                        }
                    },
                    headers: {"Content-Type": "application/json" },
                    body: function(req) {
                        var body = null;
                        if (req.body.target) {
                            body = annotationWithId;
                        } else {
                            body = {message: "annotation MUST have at least one target"};
                        }
                        return JSON.stringify(body);
                    }
                }
            });
            AnnotationAPI.saveAnnotation(annotationInvalid, permission, function(error, data) {
                expect(error).to.not.equal(null);
                expect(error.status).to.equal(400);
                expect(error.message).to.equal("annotation MUST have at least one target");
                done();
            });
        });
    });


    describe("handling a valid annotation", () => {

        var savedAnnotation;
        mockServer.post("/api/annotations", annotationValid).thenReply(201, JSON.stringify({message: "Unauthorized access"}));

        server.on({
            method: "GET",
            path: "/api/annotations/" + annotationWithId.id,
            reply: {
                status: 200,
                header: {"Content-Type": "application/json"},
                body: JSON.stringify(annotationWithId)
            }
        });

        it("should return annotation with ID after POST", (done) => {
            let permission = "private";
            AnnotationAPI.saveAnnotation(annotationValid, permission, function(error, annotation) {
                expect(error).to.equal(null);
                expect(annotation.id).to.not.be.undefined;
                savedAnnotation = annotation;
                //expect(uuid.valid(id)).to.be.true;
                done();
            });
        });

        it("should return annotation after GET", (done) => {
            AnnotationAPI.getAnnotationById(savedAnnotation.id, function(error, annotation) {
                expect(error).to.equal(null);
                expect(annotation.id).to.equal(savedAnnotation.id);
                done();
            });
        });

        /*
        it("should return updated annotation after PUT", (done) => {
            let newTarget = "urn:vangogh:testletter.receiver";
            savedAnnotation.target[0].source = newTarget;
            let permission = "private";
            AnnotationAPI.saveAnnotation(savedAnnotation, permission, function(error, annotation) {
                expect(error).to.equal(null);
                expect(annotation.id).to.equal(savedAnnotation.id);
                expect(annotation.target[0].source).to.equal(newTarget);
                done();
            });
        });

        it("should return annotation after DELETE", (done) => {
            AnnotationAPI.deleteAnnotation(savedAnnotation, function(error, annotation) {
                expect(error).to.equal(null);
                expect(annotation.id).to.equal(savedAnnotation.id);
                done();
            });
        });

        it("should return an error after GETting deleted annotation", (done) => {
            AnnotationAPI.getAnnotationById(savedAnnotation.id, function(error, data) {
                expect(error.status).to.equal(404);
                expect(error.message).to.equal("Annotation with id " + savedAnnotation.id + " does not exist");
                done();
            });
        });
        */

    });
});



