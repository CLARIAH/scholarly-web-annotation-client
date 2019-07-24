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
//import '../css/swa.css';

export default class AnnotationClient extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            user: null,
            view: "annotations",
            serverAvailable: false,
            accessStatus: AnnotationActions.accessStatus
            //accessStatus: ["private", "public"],
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
        console.debug(event)
        let level = event.target.value;
        var accessStatus = this.state.accessStatus;
        if (!accessStatus.includes(level)) {
            accessStatus.push(level);
        } else {
            accessStatus.splice(accessStatus.indexOf(level), 1);
        }
        this.setState({
            accessStatus: accessStatus
        });
        AnnotationActions.setAccessStatus(accessStatus);
    };

    selectTab(view) {
        this.setState({view : view})
    }

    renderTabbedViews = (currentView, user, config) => {
        let itemTypes = ["annotations", "collections", "resources"];

        const viewerTabs = itemTypes.map((itemType) => {
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
        const viewerTabContents = itemTypes.map((itemType) => {
            if (itemType === "annotations")
                viewer = <AnnotationViewer currentUser={user} config={config}/>;
            if (itemType === "collections")
                viewer = <CollectionViewer currentUser={user} config={config}/>;
            if (itemType === "resources")
                viewer = <ResourceViewer currentUser={user} config={config}/>;
            return (
                <div
                    key={itemType + '__tab_content'}
                    id={itemType}
                    style={{display : currentView === itemType ? 'block' : 'none'}}>
                    {viewer}
                </div>
            )
        });

        return (
            <div>
                <div className={IDUtil.cssClassName('submenu')}>{viewerTabs}</div>
                <div>{viewerTabContents}</div>
            </div>
        )
    };

    renderAccessPreferences = (accessStatus, onChangeFunc) => {
        return (
            <div className="access-preferences">
                <div>Show:</div>
                <div>
                    <label>
                        <input type="checkbox" value="private" checked={accessStatus.includes("private")} onChange={onChangeFunc}/>
                        Private annotations
                    </label>
                </div>
                <div>
                    <label>
                        <input type="checkbox" value="public" checked={accessStatus.includes("public")} onChange={onChangeFunc}/>
                        Public annotations
                    </label>
                </div>
            </div>
        )
    };

    renderServerStatus = serverAvailable => {
        return (
            <div className={IDUtil.cssClassName('server-status', this.CLASS_PREFIX)}>
                <label>Annotation server status:</label>
                <div className={serverAvailable ? IDUtil.cssClassName('led-green') : IDUtil.cssClassName('led-red')}/>
            </div>
        )
    };

    render() {
        const tabbedViews = this.renderTabbedViews(this.state.view, this.state.user, this.props.config);
        const accessPreferences = this.renderAccessPreferences(this.state.accessStatus, this.handleAccessPreferenceChange)
        const serverStatus = this.renderServerStatus(this.state.serverAvailable);

        return (
            <div className={IDUtil.cssClassName('annotation-client')}>
                <h1>Annotator</h1>
                <LoginBox user={this.state.user}/>
                {serverStatus}
                {accessPreferences}
                {tabbedViews}
            </div>
        );
    }
}
