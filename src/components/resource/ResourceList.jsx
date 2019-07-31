'use strict'

import React from 'react';
import AppAnnotationStore from './../../flux/AnnotationStore';
import Resource from './Resource';
import IDUtil from '../../util/IDUtil';

class ResourceList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            resourceIds: [],
            externalIds: [],
            view: "resources",
        }
    }
    componentDidMount() {
        AppAnnotationStore.bind('loaded-resources', this.listResources);
    }

    listResources = topResources => {
        let resourceIds = Object.keys(AppAnnotationStore.resourceIndex);
        let externalIds = Object.keys(AppAnnotationStore.externalResourceIndex).filter((resourceId) => {
            return !AppAnnotationStore.resourceIndex.hasOwnProperty(resourceId);
        })
        this.setState({
            resourceIds: resourceIds,
            externalIds: externalIds
        });
    };

    selectTab(view) {
        this.setState({view : view})
    }

    renderTabbedView = (activeView, resourceList, externalResourceList) => {
        const itemTypes = ["resources", "external"];

        const tabs = itemTypes.map(itemType => {
            return (
                 <a
                    key={itemType + '__tab_option'}
                    href={'#' + itemType}
                    aria-current={activeView === itemType ? "page" : null}
                    className={activeView === itemType ? 'active' : null}
                    onClick={this.selectTab.bind(this, itemType)}
                >
                    {itemType}
                </a>
            )
        });

        const tabContents = itemTypes.map(itemType => {
            let itemList = null;
            if (itemType === "resources") itemList = resourceList;
            if (itemType === "external") itemList = externalResourceList;
            return (
                <div key={itemType + '__tab_content'} style={{display : activeView === itemType ? 'block' : 'none'}}>
                    {itemList}
                </div>
            )
        });

        return (
            <div>
                <div className={IDUtil.cssClassName('tabs')}>{tabs}</div>
                <div className={IDUtil.cssClassName('tab-contents')}>{tabContents}</div>
            </div>
        )
    };

    renderResourceList = (idList, resourceIndex) => {
        const items = idList.map(id => <li key={id}><Resource data={resourceIndex[id]}/></li>);
        return <ul className={IDUtil.cssClassName('item-list')}>{items}</ul>
    };

    render() {
        const tabbedView = this.renderTabbedView(
            this.state.view,
            this.renderResourceList(this.state.resourceIds, AppAnnotationStore.resourceIndex),
            this.renderResourceList(this.state.externalIds, AppAnnotationStore.externalResourceIndex)
        );

        return (
            <div className={IDUtil.cssClassName('resource-list')}>
                <h3>Annotatable Resources</h3>
                {tabbedView}
            </div>
        );
    }
}

export default ResourceList;

