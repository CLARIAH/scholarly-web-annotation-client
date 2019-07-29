'use strict'

import React from 'react';
import AnnotationActions from '../../flux/AnnotationActions';
import AnnotationStore from '../../flux/AnnotationStore';
import AppCollectionStore from '../../flux/CollectionStore';
import FlexModal from '../FlexModal';
import IDUtil from '../../util/IDUtil';

export default class Annotation extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            highlighted: false
        }
    }

    componentDidMount() {
        this.setState({targetDOMElements: AnnotationActions.mapTargetsToDOMElements(this.props.annotation)});
    }

    editAnnotationTarget = annotation => {
        // ask for adding, changing or removing target
        // if target is resource, allow new resource selection
        // if target is annotation, allow new annotation selection
        // TODO: implement changing target
    };

    editAnnotationBody = annotation => {
        AnnotationActions.edit(annotation);
    };

    copyAnnotation = annotation => {
        let confirm = window.confirm("Are you sure you want to copy this annotation?");
        if (confirm) {
            AnnotationActions.copyAnnotation(annotation);
        }
    };

    deleteAnnotation = annotation => {
        let confirm = window.confirm("Are you sure you want to delete this annotation?");
        if (confirm) {
            AnnotationActions.delete(annotation);
        }
    };

    toggleHighlight = () => {
        AnnotationActions.toggleHighlight(this.state.targetDOMElements, this.state.highlighted);
        this.setState({highlighted: this.state.highlighted ? false : true});
    };

    createResourceTarget = (target, source, targetCount) => {
        let text = "";
        if (target.type === "Text") {
            text = AnnotationActions.getTargetText(target, source);
        } else if (target.type === "Image") {
            let selector = AnnotationActions.getTargetMediaFragment(target);
            let rect = selector.rect;
            let topLeft = selector.rect.x + ',' + selector.rect.y;
            let bottomRight = selector.rect.x + selector.rect.w + ',' + (selector.rect.y + selector.rect.h);
            text = <span>{'[' + topLeft + ' - ' + bottomRight + ']'}</span>;
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
            if (!index) next = "";
            return (
                <span key={"crumb" + index}
                    onMouseOver={this.onMouseOverHandler.bind(this, crumb)}
                    onMouseOut={this.onMouseOutHandler.bind(this, crumb)}
                >
                    <span title={crumb.property}>
                    {next}
                    </span>
                    <span className="badge badge-info" title={"Identifier: " + crumb.id}>
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
    };

    createExternalTarget = (target, source, targetCount) => {
        const text = target.type === "Text" ? AnnotationActions.getTargetText(target, source) : '';
        const breadcrumbs = AnnotationActions.createBreadcrumbTrail(target.source);
        const breadcrumbLabels = breadcrumbs.map((crumb, index) => {
            let next = " > ";
            if (!index) next = "";
            const crumbType = crumb.type[0].substr(crumb.type[0].indexOf("#") + 1);
            return (
                <span key={"crumb" + index}>
                    <span title={crumb.property}>
                    {next}
                    </span>
                    <span className="badge badge-secondary" title={"Identifier: " + crumb.id}>
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
                <span className="annotation-text">{text}</span>
            </div>
        );
    };

    createAnnotationTarget = (target, source) => {
        const body = AnnotationActions.extractBodies(source.data)[0];
        return (
            <div key={targetCount}>
                <span className="badge badge-success">{body.type}</span>
                &nbsp;
                <span className="annotation-text">{body.value}</span>
            </div>
        );
    };

    canEdit = () => this.props.currentUser && this.props.currentUser.username === this.props.annotation.creator ? true : false;

    canDelete = () => this.props.currentUser && this.props.currentUser.username === this.props.annotation.creator ? true : false;

    canCopy = () => this.props.currentUser ? true : false; // TODO: implement permission check (what should permission check be?)

    onMouseOverHandler(crumb) {
        crumb.node.style.border += " 1px solid red";
    }

    onMouseOutHandler(crumb) {
        let index = crumb.node.style.border.indexOf(" 1px solid red");
        crumb.node.style.border = crumb.node.style.border.substr(0, index);
    }

    /* -------------------------- RENDER FUNCTIONS -------------------------- */

    renderButtons = () => {
        const renderButton = (btnText, onClickFunc) => <a href="#" onClick={onClickFunc.bind(this, this.props.annotation)}>{btnText}</a>;

        const editBody = this.canEdit() ? renderButton('edit body', this.editAnnotationBody) : null;
        const editTarget = this.canEdit() ? renderButton('edit target', this.editAnnotationTarget) : null;
        const del = this.canDelete() ? renderButton('delete', this.deleteAnnotation) : null;
        const copy = this.canCopy() ? renderButton('copy', this.copyAnnotation) : null;
        return (
            <div>
                {editBody} | {editTarget} | {del} | {copy}
            </div>
        );

    }

    render() {
        let annotation = this.props.annotation;
        const actionButtons = this.renderButtons();

        const timestamp = (new Date(annotation.created)).toLocaleString();
        const bodies = AnnotationActions.extractBodies(annotation).map((body, index) => {
            return (
                <div key={'__body__' + index} >
                    <div className={IDUtil.cssClassName('badge body-' + body.purpose)}>{body.purpose}</div>
                    &nbsp;
                    <span>
                        {body.value}
                    </span>
                </div>
            );
        });
        let targetCount = 0;
        const targets = AnnotationActions.extractTargets(annotation).map(target => {
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

        return (
            <div className={IDUtil.cssClassName(this.state.highlighted ? 'annotation active' : 'annotation')} title={annotation.id}>
                <div onClick={this.toggleHighlight}>
                    <abbr>
                        {timestamp}&nbsp;
                        (created by: {annotation.creator})
                    </abbr>
                    {targets}
                    {bodies}
                    <br/>
                </div>
                {actionButtons}
            </div>
        );
    }
}
