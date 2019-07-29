'use strict'

import React from 'react';
import IDUtil from '../../util/IDUtil';

export default class CandidateTarget extends React.Component {

    constructor(props) {
        super(props);
        this.CLASS_PREFIX = 'ct';
    }

    handleClick = () => this.props.onClick(this.props.candidate);

    render() {
        let badgeClass = IDUtil.cssClassName('resource', this.CLASS_PREFIX);
        let targetType = "Resource";
        if (this.props.candidate.type === "external") {
            badgeClass = IDUtil.cssClassName('external', this.CLASS_PREFIX);
        }
        // TO DO: deal with elements that have multiple types
        let text = "";
        if (this.props.candidate.type === "annotation") {
            badgeClass = IDUtil.cssClassName('annotation', this.CLASS_PREFIX);
            targetType = "Annotation";
            text = this.props.candidate.params.text;
        } else if (this.props.candidate.mimeType === "text") {
            if (this.props.candidate.params.quote) {
                text = this.props.candidate.params.quote.exact;
            } else if (this.props.candidate.params.text) {
                text = this.props.candidate.params.text;
            }
        } else if (this.props.candidate.mimeType === "image") {
            text = "Image selection"
        }
        if (text.length > 100) {
            text = text.substr(0,100) + "...";
        }
        return (
            <div className={IDUtil.cssClassName('candidate-target')} onClick={this.handleClick}>
                {this.props.candidate.source}
                <span className={badgeClass}>{this.props.candidate.label}</span>
                <span className={IDUtil.cssClassName('target-type',this.CLASS_PREFIX)}>{targetType}</span>

                <p>{text}</p>
            </div>
        )
    }
}
