
'use strict'

import React from 'react';
import PropTypes from 'prop-types';
import Collection from './Collection';
import IDUtil from '../../util/IDUtil';

export default class CollectionList extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        const collections = this.props.collections.map(
            (collection, index) => <Collection key={"__c__" + index} collection={collection} currentUser={this.props.currentUser}/>
        );
        return (
            <div className={IDUtil.cssClassName('collection-list')}>
                <label className={IDUtil.cssClassName('block-title')}>Saved collections</label>
                <ul className={IDUtil.cssClassName('item-list')}>
                    {collections}
                </ul>
            </div>
        )
    }

}

CollectionList.propTypes = {
    collections: PropTypes.array.isRequired,
    currentUser: PropTypes.object.isRequired
}