/*
 * annotate-rdfa.js allows user to select RDFA-labeled text fragments
 * in RDFa enriched HTML documents.
 *
 */

// TO DO: deal with elements that have multiple types

'use strict'

import ViewSelector from './ViewSelector.jsx';
import React from 'react';
import AnnotationViewer from './annotation/AnnotationViewer.jsx';
import CollectionViewer from './collection/CollectionViewer.jsx';
import ResourceViewer from './resource/ResourceViewer.jsx';
import AppAnnotationStore from './../flux/AnnotationStore';
import AnnotationActions from '../flux/AnnotationActions.js';
import IDUtil from '../util/IDUtil';
import LoginBox from './LoginBox';

export default class AnnotationClient extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            user: null,
            view: "annotations",
            serverAvailable: false,
            selectedAccessStatus : AnnotationActions.getAccessStatus()
        };
        this.CLASS_PREFIX = 'acl'
    }

    componentDidMount() {
        AppAnnotationStore.bind('login-succeeded', this.setUser.bind(this));
        AppAnnotationStore.bind('register-succeeded', this.setUser.bind(this));
        AppAnnotationStore.bind('logout-user', this.setUser.bind(this));
        AppAnnotationStore.bind('server-status-change', this.setServerAvailable.bind(this));
    }

    setServerAvailable(serverAvailable) {
        this.setState({serverAvailable: serverAvailable});
    }

    setUser(user) {
        this.setState({user: user});
    }

    handleAccessPreferenceChange = event => {
        let level = event.target.value;
        this.setState({selectedAccessStatus: level});
        AnnotationActions.setAccessStatus(level);
    };

    selectTab(view) {
        this.setState({view : view})
    }

    renderTabbedViews = (currentView, user, config) => {
        let itemTypes = ["annotations", "collections", "resources"];

        const tabs = itemTypes.map(itemType => {
            return (
                <a
                    key={itemType + '__tab_option'}
                    href={'#' + itemType}
                    aria-current={currentView === itemType ? "page" : null}
                    className={currentView === itemType ? 'active' : null}
                    onClick={this.selectTab.bind(this, itemType)}
                >
                    {itemType}
                </a>
            )
        });

        let viewer = null;
        const tabContents = itemTypes.map(itemType => {
            if (itemType === "annotations")
                viewer = <AnnotationViewer currentUser={user} config={config}/>;
            if (itemType === "collections")
                viewer = <CollectionViewer currentUser={user} config={config}/>;
            if (itemType === "resources")
                viewer = <ResourceViewer currentUser={user} config={config}/>;
            return (
                <div key={itemType + '__tab_content'} style={{display : currentView === itemType ? 'block' : 'none'}}>
                    {viewer}
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

    renderAccessPreferences = (accessStatus, onChangeFunc) => {
        return (
            <div className={IDUtil.cssClassName('access', this.CLASS_PREFIX)}>
                <label>Annotation access level:</label>
                <div className={IDUtil.cssClassName('radio-group')}>
                    <input type="radio" value="private" checked={accessStatus === "private"} onChange={onChangeFunc}/>
                    <label>Private</label>
                    <input type="radio" value="public" checked={accessStatus === "public"} onChange={onChangeFunc}/>
                    <label>Public</label>
                    <input type="radio" value="all" checked={accessStatus === "all"} onChange={onChangeFunc}/>
                    <label>All</label>
                </div>
            </div>
        )
    };

    renderServerStatusAndLogin = serverAvailable => {
        return (
            <div className={IDUtil.cssClassName('server-status', this.CLASS_PREFIX)}>
                <div>
                    <label>Annotation server status:</label>
                    <div className={serverAvailable ? IDUtil.cssClassName('led-green') : IDUtil.cssClassName('led-red')}/>
                </div>
                <LoginBox user={this.state.user}/>
            </div>
        )
    };

    render() {
        const tabbedViews = this.renderTabbedViews(this.state.view, this.state.user, this.props.config);
        const accessPreferences = this.renderAccessPreferences(this.state.selectedAccessStatus, this.handleAccessPreferenceChange)
        const serverStatusAndLogin = this.renderServerStatusAndLogin(this.state.serverAvailable);

        return (
            <div className={IDUtil.cssClassName('annotation-client')}>
                {serverStatusAndLogin}
                {accessPreferences}
                {tabbedViews}
            </div>
        );
    }
}
