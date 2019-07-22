/*
import React from 'react';
import ReactDOM from 'react-dom'
import $ from 'jquery';

class FlexModal extends React.Component {

    constructor(props) {
        super(props);
        this.state = {

        }
    }

    componentDidMount() {
        $(ReactDOM.findDOMNode(this)).modal({
            keyboard : true
        });
        $(ReactDOM.findDOMNode(this)).modal('show');
        $(ReactDOM.findDOMNode(this)).on('hidden.bs.modal', this.props.handleHideModal);
    }

    render() {
        return (
            <div id={this.props.elementId} role="dialog">
                <div role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title">{this.props.title}</h4>
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                        </div>
                        <div className="modal-body">
                            {this.props.children}
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-primary" onClick={this.props.confirmAction} data-dismiss="modal">{this.props.confirmLabel}</button>
                            <button type="button" className="btn btn-primary" data-dismiss="modal">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default FlexModal;
*/

import React from 'react';
import IDUtil from '../util/IDUtil';

class FlexModal extends React.Component {

    constructor(props) {
        super(props);
        this.CLASS_PREFIX = 'm';
    }

    render() {
        console.debug('rendering this modal ' + IDUtil.cssClassName('modal'))
        return (
            <div id={this.props.elementId} className={IDUtil.cssClassName('modal')}>
                <div className={IDUtil.cssClassName('container', this.CLASS_PREFIX)}>
                    <div className={IDUtil.cssClassName('close', this.CLASS_PREFIX)} onClick={this.props.onClose}>
                        Close
                    </div>
                    {this.props.children}
                </div>
            </div>
        )
    }
}

export default FlexModal;

