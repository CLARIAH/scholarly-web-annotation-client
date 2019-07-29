'use strict'

import React from 'react';
import TargetCreator from './TargetCreator';
import BodyCreator from './BodyCreator';
import FlexModal from '../FlexModal';
import AnnotationActions from '../../flux/AnnotationActions';
import AppAnnotationStore from '../../flux/AnnotationStore';
import IDUtil from '../../util/IDUtil';

class AnnotationCreator extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            permission: "private",
            showModal: null,
            annotations: [],
            selectedTargets: [],
            createdBodies: {},
            editor: null
        }
        this.CLASS_PREFIX = 'acr'
    }

    componentDidMount() {
        AppAnnotationStore.bind('loaded-annotations', this.setAnnotations);
        AppAnnotationStore.bind('create-annotation', this.createAnnotation);
        AppAnnotationStore.bind('edit-annotation', this.editAnnotationBody);
    }

    setAnnotations = annotations => this.setState({annotations: annotations});

    createAnnotation = annotationTargets => {
        let annotation = AnnotationActions.makeAnnotation(annotationTargets, this.props.currentUser.username);
        annotation.body = this.listBodies(this.state.createdBodies);
        this.editAnnotationBody(annotation);
    };

    editAnnotationBody = annotation => {
        this.setState({
            editAnnotation: annotation,
            createdBodies: this.categorizeBodies(annotation.body),
            showModal: true,
            editor: "body"
        });
    };

    categorizeBodies = bodies => {
        const createdBodies = {};
        bodies.forEach((body) => {
            if (!createdBodies[body.type])
                createdBodies[body.type] = [];
            createdBodies[body.type].push(body);
        });
        return createdBodies;
    };

    /* ------------------------------------- FOR OPENING/CLOSING THE ANNOTATION MODAL --------------------- */

    makeAnnotation = () => {
        let candidates = AnnotationActions.getCandidates(this.state.annotations, this.props.config.defaults.target);
        this.setState({
            editAnnotation: null,
            candidates: candidates,
            showModal: true,
            editor: "target",
            createdBodies: {}
        });
    };

    hideAnnotationModal = () => {
        this.setState({
            showModal: false,
            selectedTargets: [],
            createdBodies: {}
        });
    };

    showBodyEditor = () => {
        console.debug('body editor selected')
        this.setState({showModal: true, editor: "body"});
    };

    showTargetEditor = () => {
        console.debug('target editor selected')
        this.setState({showModal: true, editor: "target"});
    };

    handlePermissionChange = event => {
        this.setState({permission: event.target.value});
        AnnotationActions.setPermission(event.target.value);
    };

    /* ------------------------------------- CALLBACKS FOR THE BODY/TARGET CREATORS ---------------------------- */

    setTargets = selectedTargets => this.setState({selectedTargets: selectedTargets});

    setBodies = createdBodies => this.setState({createdBodies: createdBodies});

    /* ------------------------------------- NOT USED ANYMORE ---------------------------- */

    hasTarget = () => {
        return this.state.selectedTargets.length > 0 || this.state.editAnnotation !== null;
    };

    hasBody = () => {
        return this.listBodies(this.state.createdBodies).length > 0;
    };

    /* ------------------------------------- FOR SAVING --------------------------------------- */

    gatherDataAndSave = e => {
        e.preventDefault();
        let annotation = null;
        if (this.state.editAnnotation) {
            annotation = this.state.editAnnotation;
        } else {
            annotation = AnnotationActions.makeAnnotation(this.state.selectedTargets, this.props.currentUser.username);
        }
        let bodies = this.listBodies(this.state.createdBodies);
        if (bodies.length === 0) {
            alert("Cannot save annotation without content. Please add at least one motivation.");
        } else {
            annotation.body = bodies;
            AnnotationActions.save(annotation);
            this.hideAnnotationModal();
        }
    };

    listBodies = createdBodies => {
        const bodies = [];
        Object.keys(createdBodies).forEach(bodyType => {
            bodies = bodies.concat(createdBodies[bodyType]);
        });
        return bodies;
    };

    renderButtons = (disableTargetBtn, disableContentBtn, selectedPermission, showTargetEditorFunc, showBodyEditorFunc, changePermissionFunc) => {
        return (
            <div className={IDUtil.cssClassName('buttons', this.CLASS_PREFIX)}>
                <button className={IDUtil.cssClassName('btn blank')} disabled={disableTargetBtn} onClick={showTargetEditorFunc}>
                    Show targets
                </button>
                <button className={IDUtil.cssClassName('btn blank')} disabled={disableContentBtn} onClick={showBodyEditorFunc}>
                    Show content
                </button>
                <div className={IDUtil.cssClassName('radio-group')}>
                    <input type="radio" value="private" checked={selectedPermission === "private"} onChange={changePermissionFunc}/>
                    <label>Private</label>
                    <input type="radio" value="public" checked={selectedPermission === "public"} onChange={changePermissionFunc}/>
                    <label>Public</label>
                </div>
            </div>
        )
    };

    render() {
        const buttonPanel = this.renderButtons(
            !this.state.candidates, //disable target btn y/n
            this.state.selectedTargets.length === 0, //disable content btn y/n
            this.state.permission,
            this.showTargetEditor,
            this.showBodyEditor,
            this.handlePermissionChange
        );

        const targetEditor = (
            <TargetCreator
                selectedTargets={this.state.selectedTargets}
                //addMotivations={this.addMotivations}
                setTargets={this.setTargets}
                candidates={this.state.candidates}
                annotations={this.state.annotations}
                defaultTargets={this.props.config.defaults.target}
                permission={this.state.permission}
            />
        )

        const bodyEditor = (
            <BodyCreator
                createdBodies={this.state.createdBodies}
                //addTargets={this.addTargets}
                setBodies={this.setBodies}
                currentUser={this.props.currentUser}
                annotationTasks={this.props.config.annotationTasks}
                services={this.props.config.services}
                permission={this.state.permission} //FIXME not used
            />
        )

        const editor = this.state.editor === "target" ? targetEditor : bodyEditor;
        const makeAnnotationBtn = this.props.currentUser ?
            <button className={IDUtil.cssClassName('btn')} onClick={this.makeAnnotation}>Make annotation</button> :
            null
        return (
            <div className={IDUtil.cssClassName('annotation-creator')}>
                {makeAnnotationBtn}
                {this.state.showModal ?
                    <FlexModal
                        elementId="annotation__modal"
                        onClose={this.hideAnnotationModal}
                        title={"Add one or more annotation to: " + (this.state.editor === "target" ? "targets" : "content")}
                    >
                        <div className={IDUtil.cssClassName('modal', this.CLASS_PREFIX)}>
                            {buttonPanel}
                            {editor}
                            <button id="save_btn" className={IDUtil.cssClassName('btn')} onClick={this.gatherDataAndSave}>Save</button>
                        </div>
                    </FlexModal>: null
                }
            </div>
        );
    }
}

export default AnnotationCreator;
