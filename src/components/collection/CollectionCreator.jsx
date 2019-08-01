'use strict'

import React from 'react';
import PropTypes from 'prop-types';

import IDUtil from '../../util/IDUtil';
import Annotation from '../annotation/Annotation';

export default class CollectionCreator extends React.Component {

    constructor(props) {
        super(props);
        this.CLASS_PREFIX = 'cc';
        this.labelRef = React.createRef();
    }

    componentDidMount() {
        console.debug(this.labelRef)
        this.labelRef.current.value = this.props.collection.label;
    }

    //CRUD callback functions
    save = () => this.props.onSave({...this.props.collection, label : this.labelRef.current.value});
    addToCollection = annotation => this.props.onAddToCollection(this.props.collection.id, annotation);
    removeFromCollection = annotation => this.props.onRemoveFromCollection(this.props.collection.id, annotation);

    renderMembershipEditor = (collection, addCandidates, removeCandidates) => {
        return (
            <div className={IDUtil.cssClassName('editor', this.CLASS_PREFIX)}>
                <input ref={this.labelRef} type="text"/>
                <div className={IDUtil.cssClassName('memberships', this.CLASS_PREFIX)}>
                    <div>
                        <label className={IDUtil.cssClassName('block-title')}>Select which to remove</label>
                        {removeCandidates}
                    </div>
                    <div>
                        <label className={IDUtil.cssClassName('block-title')}>Select which to add</label>
                        {addCandidates}
                    </div>
                </div>
            </div>
        )
    };

    render() {
        const pageIds = this.props.page.map(annotation => annotation.id);

        //annotations that are not on the page can be selected for addition
        const addCandidates = this.props.annotations.filter(annotation => pageIds.includes(annotation.id) === false).map(annotation => {
            return (
                <div onClick={this.addToCollection.bind(this, annotation)} key={annotation.id}>
                    <Annotation annotation={annotation}/>
                </div>
            );
        });

        //annotations on the page can be selected to be removed
        const removeCandidates = this.props.page.map(annotation => {
            return (
                <div onClick={this.removeFromCollection.bind(this, annotation)} key={annotation.id}>
                    <Annotation annotation={annotation}/>
                </div>
            );
        });

        //render the tabbed view containing 1) a CollectionLabelEditor and 2) CollectionContentEditor
        const editor = this.renderMembershipEditor(this.props.collection, addCandidates, removeCandidates);

        return (
            <div className={IDUtil.cssClassName('collection-creator')}>
                {editor}
                <button id="save_btn" className={IDUtil.cssClassName('btn')} onClick={this.save}>Save</button>
            </div>
        )
    }
}

CollectionCreator.propTypes = {
    collection: PropTypes.object.isRequired,
    annotations: PropTypes.array.isRequired,
    page: PropTypes.array.isRequired,
    onSave: PropTypes.func.isRequired,
    onAddToCollection: PropTypes.func.isRequired,
    onRemoveFromCollection: PropTypes.func.isRequired
};