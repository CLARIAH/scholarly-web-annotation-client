'use strict'

import React from 'react';
import AppAnnotationStore from './../../flux/AnnotationStore';
import AnnotationActions from './../../flux/AnnotationActions';
import Annotation from './Annotation.jsx';
import $ from 'jquery';

class AnnotationList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            annotations: [],
        }
    }
    componentDidMount() {
        AppAnnotationStore.bind('loaded-annotations', this.setAnnotations.bind(this));
        AppAnnotationStore.bind('load-annotations', this.loadAnnotations.bind(this));
        AppAnnotationStore.bind('changed-target', this.loadAnnotations.bind(this));
        AppAnnotationStore.bind('deleted-annotation', this.loadAnnotations.bind(this));
    }
    loadAnnotations() {
        AnnotationActions.loadAnnotations();
    }
    setAnnotations(annotations) {
        this.setState({annotations: annotations});
    }
    render() {
        var annotationItems = null;
        let component = this;
        if (this.state.annotations) {
            annotationItems = this.state.annotations.map(function(annotation) {
                return (
                    <Annotation
                        annotation={annotation}
                        key={annotation.id}
                        currentUser={component.props.currentUser}
                    />
                );
            });
        }
        $(() => {
            $("[data-toggle=popover]").popover();
        })
        return (
            <div className="annotationList">
                <h3>Stored Annotations</h3>
                <ul className="list-group annotation-scroll-list">
                    {annotationItems}
                </ul>
            </div>
        );
    }
}

export default AnnotationList;
