'use strict'

import React from 'react';
import AnnotationCreator from './AnnotationCreator.jsx';
import AnnotationList from './AnnotationList.jsx';
import IDUtil from '../../util/IDUtil';

export default class AnnotationViewer extends React.PureComponent {

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className={IDUtil.cssClassName('annotation-viewer')}>
                <AnnotationCreator currentUser={this.props.currentUser} config={this.props.config}/>
                <AnnotationList currentUser={this.props.currentUser} config={this.props.config}/>
            </div>
        );
    }
}

