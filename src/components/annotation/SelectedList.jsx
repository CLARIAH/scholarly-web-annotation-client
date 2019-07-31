'use strict'

import React from 'react';
import CandidateTarget from './CandidateTarget.jsx';
import IDUtil from '../../util/IDUtil';

export default class SelectedList extends React.Component {

    constructor(props) {
        super(props);
    }

    removeTarget = candidate => this.props.removeFromSelected(candidate);

    render() {
        const selectedTargets = this.props.candidates.map(
            candidate => <li key={'__sel__' + candidate.source}><CandidateTarget onClick={this.removeTarget} candidate={candidate}/></li>
        );
        return (
            <div className="selectedList">
                <ul className={IDUtil.cssClassName('item-list')}>
                    {selectedTargets}
                </ul>
            </div>
        )
    }
}
