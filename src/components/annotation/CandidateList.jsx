'use strict'

import React from 'react';
import CandidateTarget from './CandidateTarget.jsx';
import IDUtil from '../../util/IDUtil';

export default class CandidateList extends React.Component {

    constructor(props) {
        super(props);
        this.selectTarget = this.selectTarget.bind(this);
        this.state = {
            selected: []
        };
    }

    selectTarget = candidate => {
        const selected = this.state.selected;
        if (selected.indexOf(candidate) === -1) {
            selected.push(candidate);
            this.setState({selected: selected});
        }
        this.props.addToSelected(candidate);
    };

    renderCandidateTarget = candidate => <CandidateTarget onClick={this.selectTarget} key={candidate.source} candidate={candidate}/>;

    render() {
        if (this.props.candidateType === "resource") {
            const candidateWholeNodes = this.props.candidates.wholeNodes.map(candidate => this.renderCandidateTarget(candidate));
            let candidateHighlighted = null;
            if (this.props.candidates.highlighted) {
                let highlighted = this.props.candidates.highlighted;
                candidateHighlighted = this.renderCandidateTarget(this.props.candidates.highlighted);
            }
            return (
                <div>
                    <div>
                        <h4>Highlighted fragment:</h4>
                        {candidateHighlighted}
                    </div>
                    <div>
                        <h4>Whole elements:</h4>
                        <ul className={IDUtil.cssClassName('item-list')}>
                            {candidateWholeNodes}
                        </ul>
                    </div>
                </div>
            )
        }
        if (this.props.candidateType === "external") {
            const candidateWholeNodes = this.props.candidates.wholeNodes.map(candidate => this.renderCandidateTarget(candidate));
            let candidateWholeNodeList = null;
            if (candidateWholeNodes.length === 0) {
                candidateWholeNodeList = (<div>No whole {this.props.candidateType} elements available</div>);
            } else {
               candidateWholeNodeList = (
                   <div>
                        <h4>Whole elements:</h4>
                        <ul className={IDUtil.cssClassName('item-list')}>
                            {candidateWholeNodes}
                        </ul>
                    </div>
               );
            }
            let candidateHighlighted = null;
            if (this.props.candidates.highlighted) {
                candidateHighlighted = (
                    <div>
                        <h4>Highlighted fragment:</h4>
                        {this.renderCandidateTarget(this.props.candidates.highlighted)}
                    </div>
                );
            } else {
                candidateHighlighted = (<div>No {this.props.candidateType} fragments highlighted</div>);
            }
            return (
                <div>
                    {candidateHighlighted}
                    <br />
                    {candidateWholeNodeList}

                </div>
            )
        }
        if (this.props.candidateType === "annotation") {
            const candidateNodes = this.props.candidates.map(candidate => this.renderCandidateTarget(candidate));
            return (
                <div>
                    <ul className={IDUtil.cssClassName('item-list')}>
                        {candidateNodes}
                    </ul>
                </div>
            )
        }

    }
}
