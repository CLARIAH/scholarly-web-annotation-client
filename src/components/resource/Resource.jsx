'use strict'

import React from 'react';
import AppAnnotationStore from './../../flux/AnnotationStore';
import AnnotationActions from './../../flux/AnnotationActions';
import IDUtil from '../../util/IDUtil';

export default class Resource extends React.PureComponent {

    constructor(props) {
        super(props);
    }

    onMouseOverHandler = () => {
        if (this.props.data.domNode) {
            this.props.data.domNode.style.border = "1px solid red";
        }
    }

    onMouseOutHandler = () => {
        if (this.props.data.domNode) {
            this.props.data.domNode.style.border = "";
        }
    }

    render() {
        const typeLabels = this.props.data.rdfTypeLabel.map(label => {
            if (!this.props.data.rdfTypeLabel) {
                return (<span key={this.props.data.resource}></span>)
            }
            return (
                <span key={"rdfa-label-" + label} className={IDUtil.cssClassName('badge default')}>
                    {label}
                </span>
            )
        })

        const resource = this.props.data.resource ? this.props.data.resource : this.props.data.rdfaResource;
        const parent = this.props.data.parentResource ? (<div>Parent: &nbsp; {this.props.data.parentResource}</div>) : "";
        let rdfaProperty = this.props.data.rdfaProperty ? this.props.data.rdfaProperty.split("#")[1] : null;
        if (this.props.data.relation) {
            rdfaProperty = this.props.data.relation.split("#")[1];
        }
        const relation = rdfaProperty ? (<div>Relation: &nbsp; {rdfaProperty}</div>) : "";

        return (
            <div className={IDUtil.cssClassName('resource')} onMouseOver={this.onMouseOverHandler} onMouseOut={this.onMouseOutHandler}>
                {typeLabels}&nbsp;{resource}
                {parent}
                {relation}
            </div>
        );
    }
}

