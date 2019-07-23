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