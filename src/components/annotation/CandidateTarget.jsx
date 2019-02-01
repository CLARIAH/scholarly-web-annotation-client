
'use strict'

import React from 'react';

class CandidateTarget extends React.Component {
    constructor(props) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
    }
    handleClick() {
        this.props.onClick(this.props.candidate);
    }
    render() {
        // TO DO: deal with elements that have multiple types
        var text = "";
        if (this.props.candidate.type === "annotation") {
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
            <li
                onClick={this.handleClick}
                className="list-group-item candidate-target">
                <div>
                    <label>Resource:</label>
                    <span>{this.props.candidate.source}</span>
                </div>
                <div>
                    <label>Type:</label>
                    <span className="badge badge-info">{this.props.candidate.label}</span>
                </div>
                <div>
                    <label>Content:</label>
                    <span>{text}</span>
                </div>
            </li>
        )
    }
}

export default CandidateTarget;
