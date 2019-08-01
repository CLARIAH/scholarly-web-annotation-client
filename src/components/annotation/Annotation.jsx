'use strict'

import React from 'react';
import AnnotationActions from '../../flux/AnnotationActions';
import AppCollectionStore from '../../flux/CollectionStore';
import AppAnnotationStore from '../../flux/AnnotationStore';

import IDUtil from '../../util/IDUtil';
import RDFaUtil from '../../util/RDFaUtil';
import FRBRooUtil from '../../util/FRBRooUtil';
import TimeUtil from '../../util/IDUtil';
import TargetUtil from '../../util/TargetUtil';
import AnnotationUtil from '../../util/AnnotationUtil';

export default class Annotation extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            highlighted: false
        }
        this.CLASS_PREFIX = 'a';
    }

    componentDidMount() {
        this.setState({targetDOMElements: TargetUtil.mapTargetsToDOMElements(this.props.annotation, AppAnnotationStore)});
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

    toggleHighlight = e => {
        console.debug('THIS SHOULD NOT HAPPEN', e);
        TargetUtil.toggleHighlight(this.state.targetDOMElements, this.state.highlighted);
        this.setState({highlighted: this.state.highlighted ? false : true});
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


    /* -------------------------- LOCAL BREADCRUMB TRAIL FUNCTION -------------------------- */

    createBreadcrumbTrail = resourceId => {
        if (AppAnnotationStore.resourceIndex.hasOwnProperty(resourceId)) {
            return RDFaUtil.createBreadcrumbTrail(resourceId, AppAnnotationStore.resourceIndex);
        } else if (AppAnnotationStore.externalResourceIndex.hasOwnProperty(resourceId)) {
            return FRBRooUtil.createBreadcrumbTrail(resourceId, AppAnnotationStore.externalResourceIndex);
        } else {
            throw Error("Unknown resource!");
        }
    };

    /* -------------------------- RENDER FUNCTIONS -------------------------- */

    renderButtons = () => {
        const renderButton = (btnText, onClickFunc) => <a href="#" onClick={onClickFunc.bind(this, this.props.annotation)}>{btnText}</a>;

        const editBody = this.canEdit() ? renderButton('edit body', this.editAnnotationBody) : null;
        const editTarget = this.canEdit() ? renderButton('edit target', this.editAnnotationTarget) : null;
        const del = this.canDelete() ? renderButton('delete', this.deleteAnnotation) : null;
        const copy = this.canCopy() ? renderButton('copy', this.copyAnnotation) : null;

        return this.props.currentUser ? <div>{editBody} | {editTarget} | {del} | {copy}</div> : null;

    };

    renderResourceTarget = (target, source, targetCount) => {
        let text = "";
        if (target.type === "Text") {
            text = TargetUtil.getTargetText(target, source);
            if (text.length > 40) {
               text = text.substr(0, 37) + "...";
            }
        } else if (target.type === "Image") {
            let selector = TargetUtil.getTargetMediaFragment(target);
            let rect = selector.rect;
            let topLeft = selector.rect.x + ',' + selector.rect.y;
            let bottomRight = selector.rect.x + selector.rect.w + ',' + (selector.rect.y + selector.rect.h);
            text = <span>{'[' + topLeft + ' - ' + bottomRight + ']'}</span>;
        } else if (target.type === "Video") {
            let selector = TargetUtil.getTargetMediaFragment(target);
            let segment = selector.interval;
            text = (
                <span>
                    {'[' + TimeUtil.formatTime(segment.start) + ' - ' + TimeUtil.formatTime(segment.end) + ']'}
                </span>
            );
        }
        const breadcrumbs = this.createBreadcrumbTrail(source.data.rdfaResource);
        const breadcrumbLabels = breadcrumbs.map((crumb, index) => {
            const next = index == 0 ? null : <span title={crumb.property}>&nbsp;&gt;&nbsp;</span>;
            return (
                <span key={"crumb" + index} onMouseOver={this.onMouseOverHandler.bind(this, crumb)} onMouseOut={this.onMouseOutHandler.bind(this, crumb)}>
                    {next}
                    <span className={IDUtil.cssClassName('badge primary')} title={"Identifier: " + crumb.id}>
                       {crumb.type}
                    </span>
                </span>
            );
        });
        return (
            <div key={targetCount} className={IDUtil.cssClassName('annotation-target', this.CLASS_PREFIX)}>
                <div className={IDUtil.cssClassName('breadcrumbs')}>{breadcrumbLabels}</div>
                &nbsp;&gt;&nbsp;
                <label className={IDUtil.cssClassName('badge default')}>Target content</label>
                &nbsp;&gt;&nbsp;
                {text}
            </div>
        );
    };

    renderExternalTarget = (target, source, targetCount) => {
        const text = target.type === "Text" ? TargetUtil.getTargetText(target, source) : '';
        const breadcrumbs = this.createBreadcrumbTrail(target.source);
        const breadcrumbLabels = breadcrumbs.map((crumb, index) => {
            const next = index == 0 ? null : <span title={crumb.property}>&nbsp;&gt;&nbsp;</span>;
            const crumbType = crumb.type[0].substr(crumb.type[0].indexOf("#") + 1);
            return (
                <span key={"crumb" + index}>
                    {next}
                    <span className={IDUtil.cssClassName('badge secondary')} title={"Identifier: " + crumb.id}>
                       {crumbType}
                    </span>
                </span>
            )
        });
        return (
            <div key={targetCount} className={IDUtil.cssClassName('annotation-target', this.CLASS_PREFIX)}>
                <div className={IDUtil.cssClassName('breadcrumbs')}>{breadcrumbLabels}</div>
                &nbsp;&gt;&nbsp;
                <label className={IDUtil.cssClassName('badge default')}>Target content</label>
                &nbsp;&gt;&nbsp;
                {text}
            </div>
        );
    };

    renderAnnotationTarget = (target, source) => {
        const body = AnnotationUtil.extractBodies(source.data)[0];
        return (
            <div key={targetCount} className={IDUtil.cssClassName('annotation-target', this.CLASS_PREFIX)}>
                <span className={IDUtil.cssClassName('badge annotation')}>{body.type}</span>
                {body.value}
            </div>
        );
    };

    render() {
        let annotation = this.props.annotation;
        const actionButtons = this.renderButtons();
        const timestamp = (new Date(annotation.created)).toLocaleString();

        const bodies = AnnotationUtil.extractBodies(annotation).map((body, index) => {
            return (
                <div key={'__body__' + index}>
                    <div className={IDUtil.cssClassName('badge body-' + body.purpose)}>{body.purpose}</div>
                    <label>{body.value}</label>
                </div>
            );
        });

        let targetCount = 0;
        const targets = AnnotationUtil.extractTargets(annotation).map(target => {
            try {
                targetCount++;
                let source = AppAnnotationStore.lookupIdentifier(AnnotationUtil.extractTargetIdentifier(target));
                if (source.type === "external") {
                    return this.renderExternalTarget(target, source, targetCount);
                }
                if (source.type === "resource") {
                    return this.renderResourceTarget(target, source, targetCount);
                } else if (source.type === "annotation") {
                    return this.renderAnnotationTarget(target, source);
                } else if (source.type === undefined) {
                    console.error("source.type is not defined, showing content of annotation target and associated indexed source", target, source);
                }
            } catch (error) {
                // filter out annotation targets that result in errors;
                console.debug(error);
                return undefined;
            }
        }).filter(target => { return target !== undefined });

        return (
            <div className={IDUtil.cssClassName(this.state.highlighted ? 'annotation active' : 'annotation')} title={annotation.id}>
                <div onClick={this.toggleHighlight}>
                    <abbr>{timestamp}&nbsp;(created by: {annotation.creator})</abbr>
                    {targets}
                    <div className={IDUtil.cssClassName('annotation-bodies', this.CLASS_PREFIX)}>
                        {bodies}
                    </div>
                </div>
                {actionButtons}
            </div>
        );
    }
}
