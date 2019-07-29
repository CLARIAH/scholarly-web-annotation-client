'use strict'

import React from 'react';
import AppAnnotationStore from './../../flux/AnnotationStore';
import AnnotationActions from './../../flux/AnnotationActions';
import Annotation from './Annotation';
import IDUtil from '../../util/IDUtil';

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
        const annotationItems = this.state.annotations ? this.state.annotations.map(
            annotation => <li key={annotation.id}><Annotation annotation={annotation} currentUser={this.props.currentUser}/></li>
        ) : null;
        return (
            <div className={IDUtil.cssClassName('annotation-list')}>
                <label className={IDUtil.cssClassName('block-title')}>Stored Annotations</label>
                <ul className={IDUtil.cssClassName('item-list')}>
                    {annotationItems}
                </ul>
            </div>
        );
    }
}

export default AnnotationList;
