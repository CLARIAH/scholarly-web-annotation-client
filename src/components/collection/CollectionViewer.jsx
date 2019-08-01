'use strict'

import React from 'react';

import IDUtil from '../../util/IDUtil';

import FlexModal from '../FlexModal';

import CollectionCreator from './CollectionCreator';
import CollectionList from './CollectionList';

import AppAnnotationStore from '../../flux/AnnotationStore';
import AnnotationActions from '../../flux/AnnotationActions';

import AppCollectionStore from '../../flux/CollectionStore';
import CollectionActions from '../../flux/CollectionActions';

export default class CollectionViewer extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            showModal : false,
            collections : null,
            selectedCollection : null,
            annotations : [],
            page : []
        }
    }

    componentDidMount() {
        AppCollectionStore.bind('edit-collection', this.editCollection);

        //these all set new data to the state, so the list and the creator have all the required data
        AppCollectionStore.bind('loaded-collection', this.setCollection);
        AppCollectionStore.bind('loaded-collections', this.setCollections);
        AppCollectionStore.bind('loaded-page', this.setPage);
        AppAnnotationStore.bind('loaded-annotations', this.setAnnotations);

        //refresh the list when a collection was updated or deleted
        AppCollectionStore.bind('updated-collection', this.refreshCollections);
        AppCollectionStore.bind('saved-collection', this.refreshCollections);
        AppCollectionStore.bind('deleted-collection', this.refreshCollections);

        //also refresh the list when annotations were added/removed
        AppAnnotationStore.bind('saved-annotation',this.refreshCollections);
        AppAnnotationStore.bind('deleted-annotation', this.refreshCollections);

        this.refreshCollections();
    }

    refreshCollections = collection => {
        console.debug('refreshing collection list');
        if(this.state.showModal) this.hideModal(); //when the user saves in the modal
        if(collection) this.fetchPage(collection);
        CollectionActions.getCollections();
    }

    //flux event callback functions
    setCollections = collections => this.setState({collections: collections});
    setCollection = collection => this.setState({collection: collection});
    setPage = page => this.setState({page: page});
    setAnnotations = annotations => this.setState({annotations: annotations});
    fetchPage = collection => CollectionActions.getCollectionPage(collection.last);

    editCollection = (collection, view) => {
        if (!view) view = "label";
        if (collection.last !== undefined && collection.last !== null) {
            console.log("getting collection page");
            CollectionActions.getCollectionPage(collection.last);
        }
        this.setState({selectedCollection: collection, view: view, showModal: true});
    };

    makeCollection = () => this.editCollection({creator: this.props.currentUser.username});

    hideModal = () => this.setState({showModal: false});

    //callback functions for the CollectionCreator
    onSaveCollection = collection => CollectionActions.save(collection);
    onAddToCollection = (collectionId, annotation) => CollectionActions.addAnnotation(collectionId, annotation);
    onRemoveFromCollection = (collectionId, annotation) => CollectionActions.removeAnnotation(collectionId, annotation.id);

    render() {
        const modal = this.state.showModal && this.state.selectedCollection && this.state.annotations && this.state.page ? (
            <FlexModal elementId="collection__modal" onClose={this.hideModal} title={'Provide a label for your collection'}>
                <CollectionCreator
                    collection={this.state.selectedCollection}
                    page={this.state.page}
                    annotations={this.state.annotations}
                    onSave={this.onSaveCollection}
                    onAddToCollection={this.onAddToCollection}
                    onRemoveFromCollection={this.onRemoveFromCollection}
                />
            </FlexModal>
        ) : null;

        const collectionList = this.state.collections ? <CollectionList collections={this.state.collections} currentUser={this.props.currentUser}/> : null;

        return (
            <div className="collectionViewer">
                <button className={IDUtil.cssClassName('btn plus')} onClick={this.makeCollection}>Collection</button>
                {modal}
                {collectionList}
            </div>
        );
    }
}
