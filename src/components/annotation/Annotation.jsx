'use strict'

import React from 'react';
import AnnotationActions from './../../flux/AnnotationActions.js';
import AnnotationStore from './../../flux/AnnotationStore.js';
import AppCollectionStore from '../../flux/CollectionStore.js';
import FlexModal from './../FlexModal';

class Annotation extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            highlighted: false
        }
    }
    componentDidMount() {
        this.setState({targetDOMElements: AnnotationActions.mapTargetsToDOMElements(this.props.annotation)});
    }
    canEdit() {
        return this.props.currentUser && this.props.currentUser.username === this.props.annotation.creator ? true : false;
    }
    canDelete() {
        return this.props.currentUser && this.props.currentUser.username === this.props.annotation.creator ? true : false;
    }
    canCopy() {
        return this.props.currentUser ? true : false;
        var allowed = true;
        // TODO: implement permission check (what should permission check be?)
        return allowed;
    }
    editAnnotationTarget(annotation) {
        // ask for adding, changing or removing target
        // if target is resource, allow new resource selection
        // if target is annotation, allow new annotation selection
        // TODO: implement changing target
    }
    editAnnotationBody(annotation) {
        AnnotationActions.edit(annotation);
    }
    copyAnnotation(annotation) {
        let confirm = window.confirm("Are you sure you want to copy this annotation?");
        if (confirm) {
            AnnotationActions.copyAnnotation(annotation);
        }
    }
    deleteAnnotation(annotation) {
        let confirm = window.confirm("Are you sure you want to delete this annotation?");
        if (confirm) {
            AnnotationActions.delete(annotation);
        }
    }
    toggleHighlight() {
        AnnotationActions.toggleHighlight(this.state.targetDOMElements, this.state.highlighted);
        this.setState({highlighted: this.state.highlighted ? false : true});
    }
    computeClass() {
        var className = 'list-group-item';
        if(this.state.highlighted)
            className += ' active';
        return className;
    }

    onMouseOverHandler(crumb) {
        crumb.node.style.border += " 1px solid red";
    }

    onMouseOutHandler(crumb) {
        let index = crumb.node.style.border.indexOf(" 1px solid red");
        crumb.node.style.border = crumb.node.style.border.substr(0, index);
    }

    createResourceTarget(target, source, targetCount) {
        let component = this;
        var text = "";
        if (target.type === "Text") {
            text = AnnotationActions.getTargetText(target, source);
        } else if (target.type === "Image") {
            let selector = AnnotationActions.getTargetMediaFragment(target);
            let rect = selector.rect;
            let topLeft = selector.rect.x + ',' + selector.rect.y;
            let bottomRight = selector.rect.x + selector.rect.w + ',' + (selector.rect.y + selector.rect.h);
            text = (
                <span>
                    {'[' + topLeft + ' - ' + bottomRight + ']'}
                </span>
            )
        } else if (target.type === "Video") {
            let selector = AnnotationActions.getTargetMediaFragment(target);
            let segment = selector.interval;
            text = (
                <span>
                    {'[' + AnnotationActions.formatTime(segment.start) + ' - ' + AnnotationActions.formatTime(segment.end) + ']'}
                </span>
            );
        }
        if (text.length > 40) {
            text = text.substr(0, 37) + "...";
        }
        let breadcrumbs = AnnotationActions.createBreadcrumbTrail(source.data.rdfaResource);
        let breadcrumbLabels = breadcrumbs.map((crumb, index) => {
            let next = " > ";
            if (!index)
                next = "";
            return (
                <span key={"crumb" + index}
                    onMouseOver={component.onMouseOverHandler.bind(this, crumb)}
                    onMouseOut={component.onMouseOutHandler.bind(this, crumb)}
                >
                    <span title={crumb.property}>
                    {next}
                    </span>
                    <span
                        className="badge badge-info"
                        title={"Identifier: " + crumb.id}
                    >
                       {crumb.type}
                    </span>
                    &nbsp;
                </span>
            );
        });
        return (
            <div key={targetCount}>
                <div className="breadcrumbs">
                    {breadcrumbLabels}
                </div>
                <label className="badge badge-warning">Target content</label>
                {' '}
                <span
                    className="annotation-text"
                >{text}</span>
            </div>
        );
    }

    createExternalTarget(target, source, targetCount) {
        var text = "";
        if (target.type === "Text") {
            text = AnnotationActions.getTargetText(target, source);
        }
        let breadcrumbs = AnnotationActions.createBreadcrumbTrail(target.source);
        let breadcrumbLabels = breadcrumbs.map((crumb, index) => {
            let next = " > ";
            if (!index)
                next = "";
            let crumbType = crumb.type[0].substr(crumb.type[0].indexOf("#") + 1);
            return (
                <span key={"crumb" + index}>
                    <span title={crumb.property}>
                    {next}
                    </span>
                    <span
                        className="badge badge-secondary"
                        title={"Identifier: " + crumb.id}
                    >
                       {crumbType}
                    </span>
                    &nbsp;
                </span>
            )
        });
        return (
            <div key={targetCount}>
                <div className="breadcrumbs">
                    {breadcrumbLabels}
                </div>
                <label className="badge badge-warning">Target content</label>
                {' '}
                <span
                    className="annotation-text"
                >{text}</span>
            </div>
        );
    }

    createAnnotationTarget(target, source) {
        let body = AnnotationActions.extractBodies(source.data)[0];
        let label = body.type;
        let text = body.value;
        return (
            <div key={targetCount}>
                <span></span>
                <span
                    className="badge badge-success"
                    >{label}</span>
                &nbsp;
                <span
                    className="annotation-text"
                >{text}</span>
            </div>
        );
    }

    render() {
        let component = this;
        let annotation = component.props.annotation;
        var bodyCount = 0;
        var timestamp = (new Date(annotation.created)).toLocaleString();
        var bodies = AnnotationActions.extractBodies(annotation).map((body) => {
            bodyCount++;
            var bodyText = body.value;
            //if (bodyText.length > 100) {
            //    bodyText = bodyText.substr(0, 97) + "...";
            //}
            //
                        //data-toggle="popover"
                        //data-trigger="hover"
                        //data-content={body.value}
                        //data-placement="top"
            return (
                <div key={bodyCount} >
                    <span></span>
                    <span
                        className="badge badge-success"
                        >{body.purpose}</span>
                    &nbsp;
                    <span
                        className="annotation-text"
                    >
                        {bodyText}
                    </span>
                </div>
            );
        });
        var targetCount = 0;
        var targets = AnnotationActions.extractTargets(annotation).map((target) => {
            try {
                targetCount++;
                let source = AnnotationActions.lookupIdentifier(AnnotationActions.extractTargetIdentifier(target));
                var text = "";
                var label;
                if (source.type === "external") {
                    return this.createExternalTarget(target, source, targetCount);
                }
                if (source.type === "resource") {
                    return this.createResourceTarget(target, source, targetCount);
                } else if (source.type === "annotation") {
                    return this.createAnnotationTarget(target, source);
                } else if (source.type === undefined) {
                    console.error("source.type is not defined, showing content of annotation target and associated indexed source", target, source);
                }
            } catch (error) {
                // filter out annotation targets that result in errors;
                return undefined;
            }
        }).filter((target) => { return target !== undefined });

        var renderEditBody = function() {
            return (
                <span className="badge badge-primary"
                    onClick={() => {component.editAnnotationBody(annotation)}}>
                    edit body
                </span>
            )
        }
        var renderEditTarget = function() {
            return (
                <span className="badge badge-warning"
                    onClick={() => {component.editAnnotationTarget(annotation)}}>
                    edit target
                </span>
            )
        }
        var renderDelete = function() {
            return (
                <span className="badge badge-danger"
                    onClick={() => {component.deleteAnnotation(annotation)}}>
                    delete
                </span>
            )
        }
        var renderCopy = function() {
            return (
                <span className="badge badge-success"
                    onClick={() => {component.copyAnnotation(annotation)}}>
                    copy
                </span>
            )
        }

        var makeOptions = function() {
            var editBody = component.canEdit() ? renderEditBody() : "";
            var editTarget = component.canEdit() ? renderEditTarget() : "";
            var del = component.canDelete() ? renderDelete() : "";
            var copy = component.canCopy() ? renderCopy() : "";
            return (
                <div>
                    {editBody} {editTarget} {del} {copy}
                </div>
            );
        }
        let options = makeOptions();

        return (
            <li
                className={component.computeClass()}
                title={annotation.id}
            >
                <div
                    onClick={component.toggleHighlight.bind(this)}
                    >
                    <abbr>
                        {timestamp}&nbsp;
                        (created by: {annotation.creator})
                    </abbr>
                    {targets}
                    {bodies}
                    <br/>
                </div>
                {options}
            </li>
        );
    }
}

export default Annotation;
