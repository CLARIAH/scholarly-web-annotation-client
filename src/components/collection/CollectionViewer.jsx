'use strict'

import React from 'react';

import IDUtil from '../../util/IDUtil';

import FlexModal from '../FlexModal';

import CollectionCreator from './CollectionCreator.jsx';
import CollectionList from './CollectionList.jsx';

import AppAnnotationStore from '../../flux/AnnotationStore';
import AnnotationActions from '../../flux/AnnotationActions';

import AppCollectionStore from '../../flux/CollectionStore';
import CollectionActions from '../../flux/CollectionActions';

export default class CollectionViewer extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            showModal : false,
            collection : null,
            annotations : [],
            page : []
        }
    }

    componentDidMount() {
        AppCollectionStore.bind('edit-collection', this.editCollection);
        AppCollectionStore.bind('updated-collection', this.fetchPage);
        AppCollectionStore.bind('loaded-collection', this.setCollection);
        AppCollectionStore.bind('loaded-page', this.setPage);
        AppCollectionStore.bind('saved-collection', this.hideModal); //hide the modal after a collection was saved

        AppAnnotationStore.bind('loaded-annotations', this.setAnnotations);
    }

    //flux event callback functions
    setCollection = collection => this.setState({collection: collection});
    setPage = page => this.setState({page: page});
    fetchPage = collection => CollectionActions.getCollectionPage(collection.last);
    setAnnotations = annotations => this.setState({annotations: annotations});

    hideModal = () => this.setState({showModal: false});

    //callback functions for collection CRUD
    onSaveCollection = collection => CollectionActions.save(collection);
    onAddToCollection = (collectionId, annotation) => CollectionActions.addAnnotation(collectionId, annotation);
    onRemoveFromCollection = (collectionId, annotation) => CollectionActions.removeAnnotation(collectionId, annotation.id);

    editCollection = (collection, view) => {
        if (!view) view = "label";
        console.debug('editing collection:', collection, view)
        if (collection.last !== undefined && collection.last !== null) {
            console.log("getting collection page");
            CollectionActions.getCollectionPage(collection.last);
        }
        this.setState({collection: collection, view: view, showModal: true});
    };

    makeCollection = () => this.editCollection({creator: this.props.currentUser.username});

    render() {
        const modal = this.state.showModal && this.state.collection && this.state.annotations && this.state.page ? (
            <FlexModal elementId="collection__modal" onClose={this.hideModal} title={'Provide a label for your collection'}>
                <CollectionCreator
                    collection={this.state.collection}
                    page={this.state.page}
                    annotations={this.state.annotations}
                    onSave={this.onSaveCollection}
                    onAddToCollection={this.onAddToCollection}
                    onRemoveFromCollection={this.onRemoveFromCollection}
                />
            </FlexModal>
        ) : null;

        return (
            <div className="collectionViewer">
                <button className={IDUtil.cssClassName('btn plus')} onClick={this.makeCollection}>Collection</button>
                {modal}
                <CollectionList currentUser={this.props.currentUser} config={this.props.config}/>
            </div>
        );
    }
}
