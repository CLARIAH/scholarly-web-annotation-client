import React from 'react';

import FreetextForm from './FreetextForm';
import ClassifyingForm from './ClassifyingForm';
import LinkingForm from './LinkingForm';
import IDUtil from '../../util/IDUtil';

class BodyCreator extends React.Component {

    constructor(props) {
        super(props);

        let activeView = null;
        for(let i=0;i<Object.keys(this.props.annotationTasks).length;i++) {
            if(Object.keys(this.props.annotationTasks)[i] != 'bookmark') {
                activeView = Object.keys(this.props.annotationTasks)[i];
                break;
            }
        }
        this.state = {
            activeView : activeView,
            bodies: this.props.createdBodies,
            defaultCollection: null,
        }
    }

    updateAnnotationBody = (annotationMode, value) => {
        var bodies = this.state.bodies;
        bodies[annotationMode] = value;
        this.setState({bodies: bodies});
        this.props.setBodies(bodies);
    }

    //FIXME not used at all!
    addTargets() {
        this.props.addTargets();
    }

    selectTab(view) {
        this.setState({activeView : view})
    }

    renderTabbedView = (annotationTasks, activeView, updateBodyFunc, services) => {
        //generate the tabs from the configured modes
        const tabs = Object.keys(annotationTasks).filter(mode => mode !== 'bookmark').map(mode => {
            return (
                <a
                    key={mode + '__tab_option'}
                    href={'#' + mode}
                    aria-current={activeView == mode ? "page" : null}
                    className={activeView == mode ? 'active' : null}
                    onClick={this.selectTab.bind(this, mode)}
                >
                    {mode}
                </a>
            )
        });

        //generate the content of each tab (a form based on a annotation mode/motivation)
        const tabContents = Object.keys(annotationTasks).filter(mode => mode !== 'bookmark').map(mode => {
            let form = '';
            switch(mode) {
                case 'classify' : form = (
                    <ClassifyingForm
                        data={this.state.bodies.classification}
                        config={annotationTasks[mode]}
                        onOutput={updateBodyFunc}
                        services={services}
                    />
                );
                break;
                case 'link' : form = (
                    <LinkingForm
                        data={this.state.bodies.link}
                        config={annotationTasks[mode]}
                        onOutput={updateBodyFunc}
                        services={services}
                    />
                );
                break;
                default : form = (
                    <FreetextForm
                        data={this.state.bodies[annotationTasks[mode].type]}
                        config={this.props.annotationTasks[mode]}
                        onOutput={updateBodyFunc}
                    />
                );
                break;
            }
            return (
                <div key={mode + '__tab_content'} style={{display : activeView === mode ? 'block' : 'none'}}>
                    {form}
                </div>
            );
        });

        return (
            <div>
                <div className={IDUtil.cssClassName('submenu')}>{tabs}</div>
                <div>{tabContents}</div>
            </div>
        )
    }

    render() {
        const tabbedView = this.renderTabbedView(
            this.props.annotationTasks, // a tab will be generated for each configured annotation task
            this.state.activeView, // which tab is active
            this.updateAnnotationBody, // callback function for saving the annotation body
            this.props.services // APIs or services passed on to the linking & classifying view
        );

        return (
            <div className={IDUtil.cssClassName('body-creator')}>
                {tabbedView}
            </div>
        )
    }
}

export default BodyCreator;
