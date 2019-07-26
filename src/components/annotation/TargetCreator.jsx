'use strict'

import React from 'react';
import CandidateList from './CandidateList.jsx';
import SelectedList from './SelectedList.jsx';
import IDUtil from '../../util/IDUtil';

export default class TargetCreator extends React.Component {

    constructor(props) {
        super(props);
        this.addToSelected = this.addToSelected.bind(this);
        this.removeFromSelected = this.removeFromSelected.bind(this);
        this.state = {
            selected: this.props.selectedTargets,
            annotations: [],
            activeType: "resource",
            candidateTypes: ["resource", "external", "annotation"],
        };
    }

    addToSelected = candidate => {
        var selected = this.state.selected;
        if (selected.indexOf(candidate) === -1) {
            selected.push(candidate);
            this.setState({selected: selected});
            this.props.setTargets(selected);
        }
    };

    removeFromSelected = candidate => {
        var selected = this.state.selected;
        var index = selected.indexOf(candidate);
        if (index !== -1) {
            selected.splice(index, 1);
            this.setState({selected: selected});
            this.props.setTargets(selected);
        }
    };

    //FIXME this is never used!
    addMotivations = () => {
        this.props.addMotivations();
    };

    selectTab(view) {
        this.setState({activeType : view})
    }

    renderTabbedViews = (candidateTypes, activeType, candidates, selectFunc) => {
        const tabs = candidateTypes.map(candidateType => {
            return (
                <a
                    key={candidateType + '__tab_option'}
                    href={'#' + candidateType}
                    aria-current={activeType === candidateType ? "page" : null}
                    className={activeType === candidateType ? 'active' : null}
                    onClick={this.selectTab.bind(this, candidateType)}
                >
                    {candidateType}
                </a>
            )
        })

        const tabContents = candidateTypes.map(candidateType => {
            return (
                <div key={candidateType + '__tab_content'} style={{display : activeType === candidateType ? 'block' : 'none'}}>
                    <CandidateList
                        candidates={candidates[candidateType]}
                        addToSelected={selectFunc}
                        candidateType={candidateType}
                    />
                </div>
            );
        });

        return (
            <div>
                <div className={IDUtil.cssClassName('submenu')}>{tabs}</div>
                <div>{tabContents}</div>
            </div>
        )
    };

    render() {
        //generate the tabs from the configured modes
        const tabbedViews = this.renderTabbedViews(
            this.state.candidateTypes,
            this.state.activeType,
            this.props.candidates,
            this.addToSelected
        );

        return (
            <div className={IDUtil.cssClassName('target-creator')}>
                <div>
                    <h3>Available Targets</h3>
                    <span>Click on a target to select it.</span>
                    {tabbedViews}
                </div>
                <div>
                    <h3>Selected Targets</h3>
                    <span>Click on a selected target to deselect it.</span>
                    <SelectedList candidates={this.state.selected} removeFromSelected={this.removeFromSelected}/>
                </div>
            </div>
        )
    }
}
