/*
 * Taken from http://jsfiddle.net/8mdX4/1211/
 * See stackoverflow discussion: http://stackoverflow.com/questions/6240139/highlight-text-range-using-javascript
 * Originally created by Tim Down
 * Contributors:
 *   - Marijn Koolen
 *
 * It's difficult to get selected text without any ignorable element content:
 * - innerText interface computes how element content is displayed:
 *   https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/innerText
 * - but innerText is not an interface for #text nodes, and not available in JSDOM for testing
 *    - https://github.com/jsdom/jsdom/issues/1245
 * - http://perfectionkills.com/the-poor-misunderstood-innerText/
 * - innerText available in:
 *    - PhantomJS: https://github.com/ariya/phantomjs
 *    - rangy: https://github.com/timdown/rangy/blob/master/src/modules/rangy-textrange.js
 * Attempt similar to what's needed:
 *   - https://stackoverflow.com/questions/34223326/get-selected-text-except-for-un-selectable-elements
 *
 */

"use strict";

import RDFaUtil from "./RDFaUtil.js";
import DOMUtil from "./DOMUtil.js";

const SelectionUtil = {

    currentSelection : null,

    /* ------------------------------------ HIGHLIGHTING RDFa SELECTION FUNCTIONS -------------------- */

    makeEditableAndHighlight : function(colour) {
        var sel = window.getSelection();
        if (sel.rangeCount && sel.getRangeAt) {
            var range = sel.getRangeAt(0);
        }
        document.designMode = "on";
        if (range) {
            sel.removeAllRanges();
            sel.addRange(range);
        }
        // Use HiliteColor since some browsers apply BackColor to the whole block
        if (!document.execCommand("HiliteColor", false, colour)) {
            document.execCommand("BackColor", false, colour);
        }
        document.designMode = "off";
    },

    addHighlight : function(colour) {
        var range, sel;
        if (window.getSelection) {
            // IE9 and non-IE
            try {
                if (!document.execCommand("BackColor", false, colour)) {
                    SelectionUtil.makeEditableAndHighlight(colour);
                }
            } catch (ex) {
                SelectionUtil.makeEditableAndHighlight(colour);
            }
            sel = window.getSelection();
        } else if (document.selection && document.selection.createRange) {
            // IE <= 8 case
            range = document.selection.createRange();
            range.execCommand("BackColor", false, colour);
        }
        sel.removeAllRanges();
    },

    removeHighlight : function() {
        document.designMode = "on";
        document.execCommand("removeFormat", false, null);
        document.designMode = "off";
        var sel = window.getSelection();
        sel.removeAllRanges();
    },

    selectAndHighlightRange : function (node, start, end) {
        SelectionUtil.setRDFaSelectionRange(node, start, end);
        SelectionUtil.addHighlight("yellow");
    },

    selectAndRemoveRange : function(node, start, end) {
        SelectionUtil.setRDFaSelectionRange(node, start, end);
        SelectionUtil.removeHighlight();
    },

    setRDFaSelectionRange : function(el, start, end) {
        if (document.createRange && window.getSelection) {
            var range = document.createRange();
            range.selectNodeContents(el);
            var textNodes = RDFaUtil.getRDFaTextNodes(el);
            var foundStart = false;
            var charCount = 0, endCharCount;

            for (var i = 0; i < textNodes.length; i++) {
                let textNode = textNodes[i];
                // offset of display text w.r.t underlying text content (e.g. removed leading whitespace)
                let displayOffset = DOMUtil.getTextNodeDisplayOffset(textNode);
                let displayText = DOMUtil.getTextNodeDisplayText(textNode);
                endCharCount = charCount + displayText.length;
                if (!foundStart && start >= charCount && (start < endCharCount || (start === endCharCount && i <= textNodes.length))) {
                    range.setStart(textNode, start - charCount + displayOffset);
                    foundStart = true;
                }
                if (foundStart && end === -1) {
                    let lastTextNode = textNodes[textNodes.length-1];
                    range.setEnd(lastTextNode, lastTextNode.length);
                    break;
                }
                else if (foundStart && end !== -1 && end <= endCharCount) {
                    range.setEnd(textNode, end - charCount + displayOffset);
                    break;
                }
                charCount = endCharCount;
            }
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);

        } else if (document.selection && document.body.createTextRange) {
            var textRange = document.body.createTextRange();
            textRange.moveToElementText(el);
            textRange.collapse(true);
            textRange.moveEnd("character", end);
            textRange.moveStart("character", start);
            textRange.select();
        }
    },

    /* ------------------------------------ SELECTING AUDIO/VIDEO/IMAGE "MANUALLY" -------------------- */

    setSelection : function(element, selection, mimeType) {
        SelectionUtil._checkDOMElement(element);
        SelectionUtil.currentSelection = {
            startNode: element,
            endNode: element,
            mimeType: mimeType
        };
        if (!selection) {
            return true;
        } else if (mimeType.startsWith("video") || mimeType.startsWith("audio")) {
            SelectionUtil.checkInterval(selection);
            SelectionUtil.currentSelection.interval = selection;
        } else if (mimeType.startsWith("image")) {
            SelectionUtil.checkRectangle(selection);
            SelectionUtil.currentSelection.rect = selection;
        }
    },

    setImageSelection : function(element, rect) {
        SelectionUtil._checkDOMElement(element);
        SelectionUtil.checkRectangle(rect);
        SelectionUtil.currentSelection = {
            startNode: element,
            endNode: element,
            rect: rect,
            mimeType: "image"
        };
    },

    setAudioSelection : function(element, interval) {
        SelectionUtil._checkDOMElement(element);
        SelectionUtil.checkInterval(interval);
        SelectionUtil.currentSelection = {
            startNode: element,
            endNode: element,
            interval: interval,
            mimeType: "audio"
        };
    },

    setVideoSelection : function(element, interval) {
        SelectionUtil._checkDOMElement(element);
        SelectionUtil.checkInterval(interval);
        SelectionUtil.currentSelection = {
            startNode: element,
            endNode: element,
            interval: interval,
            mimeType: "video"
        };
    },

    _checkDOMElement : (element) => {
        if (element === undefined)
            throw Error("argument 'element' is required.");
        if (!(element instanceof Element) || !document.contains(element))
            throw Error("element must be a DOM element.");
        return true;
    },

    /* ------------------------------------ AUDIO/VIDEO/IMAGE VALIDATION FUNCTIONS (see AnnotationUtil) -------------------- */

    checkRectangle : (rect) => {
        if (rect === undefined)
            throw Error("argument 'rect' is required.");
        if (!(rect instanceof Object))
            throw Error("rect should be an object with properties: x, y, w, h.");
        let keys = Object.keys(rect);
        ["x", "y", "w", "h"].forEach((prop) => {
            if (!keys.includes(prop))
                throw Error("rect is missing required property " + prop + ".");
            if (!Number.isInteger(rect[prop]))
                throw Error("rect property " + prop + " is not an integer.");
        });
        return true;
    },

    checkInterval : (interval) => {
        if (interval === undefined)
            throw Error("argument 'interval' is required.");
        if (!(interval instanceof Object))
            throw Error("interval should be an object with properties: start, end.");
        let keys = Object.keys(interval);
        ["start", "end"].forEach((prop) => {
            if (!keys.includes(prop))
                throw Error("interval is missing required property " + prop + ".");
            if (Number.isNaN(interval[prop]))
                throw Error("interval property " + prop + " is not a number.");
            //if (!Number.isInteger(interval[prop]))
            //    interval[prop] = parseInt(interval[prop]);
        });
        return true;
    },

    /* -------------------------------------------- SET/GET THE CURRENT DOM SELECTION ---------------------------------- */

    // Find nodes and offsets corresponding to the selection.
    // Start node is always before end node in presentation order
    // regardless of whether selection is done forwards or backwards.
    getDOMSelection() {
        if (!SelectionUtil.currentSelection)
            SelectionUtil.setDOMSelection();
        return SelectionUtil.currentSelection;
    },

    //sets the current DOM selection
    setDOMSelection() {
        let currentSelection = null;

        //first get the selection from the overall DOM
        let rawSelection = document.getSelection ? document.getSelection() : null;
        const noSelection = !rawSelection || rawSelection.isCollapsed;

        //if something was selected, use that as the current selection, else use the observer DOME node as a whole?
        if (noSelection) {
            console.debug('returning observer node selection');
            currentSelection = SelectionUtil._getObserverNodeSelection();
        } else {
            console.debug('further processing the raw selection');
            currentSelection = SelectionUtil._getSelectionStartEndNodes(rawSelection);
        }

        //validate the selection object (FIXME should be done by above functions...)
        SelectionUtil._checkValidTextSelection(currentSelection);

        //get the common ancestors of the selection
        currentSelection.ancestors = DOMUtil.findCommonAncestors(currentSelection.startNode, currentSelection.endNode);
        currentSelection.containerNode = SelectionUtil._getContainerNode(currentSelection);


        //only do this if there is a text selection
        if(!noSelection) {
            // Set container node of start and end nodes (so defining which parent DOM node encaptulates the selection)
            currentSelection.selectionText = rawSelection ? rawSelection.toString() : null;//TODO or set to ''

            // if end node or parent is an ignorable element, set parent to previous text node
            const endParent = currentSelection.endNode.parentNode;
            if (RDFaUtil.isRDFaIgnoreNode(endParent)) {
                const prevNode = DOMUtil.getPreviousTextNode(currentSelection.endNode);
                currentSelection.endNode = prevNode;
                currentSelection.endOffset = prevNode.length;
            }
            currentSelection.selectionText = SelectionUtil._getSelectionText(currentSelection);
        }

        //finally set the selection to the SelectionUtil (FIXME not a nice place to keep things...)
        SelectionUtil.currentSelection = currentSelection;
    },

    //get the observer DOM node and use that as the current selection
    _getObserverNodeSelection() {
        const observerNodes = DOMUtil.getObserverNodes(); //FIXME validate there being observer nodes!!!
        return {
            startNode: observerNodes[0],
            endNode: observerNodes[observerNodes.length - 1],
            mimeType: "multipart" // TODO: FIX based on actual content; this will not pass _checkValidTextSelection()!
        };
    },

    _getSelectionStartEndNodes(rawSelection) {
        rawSelection = SelectionUtil._ensureFocusAnchorAreLeafNodes(rawSelection);
        return SelectionUtil._ensureSelectionStartPreceedsEnd({
            startNode: rawSelection.anchorNode,
            startOffset: rawSelection.anchorOffset,
            endNode: rawSelection.focusNode,
            endOffset: rawSelection.focusOffset,
            mimeType: "text"
        });
    },

    _ensureFocusAnchorAreLeafNodes(rawSelection) {
        if (rawSelection.focusNode.nodeType === Node.ELEMENT_NODE) {
            rawSelection.focusNode = rawSelection.focusNode.childNodes[rawSelection.focusOffset];
            rawSelection.focusOffset = 0;
        }
        if (rawSelection.anchorNode.nodeType === Node.ELEMENT_NODE) {
            rawSelection.anchorNode = rawSelection.anchorNode.childNodes[rawSelection.anchorOffset];
            rawSelection.anchorOffset = 0;
        }
        return rawSelection;
    },

    _ensureSelectionStartPreceedsEnd(selection) {
        if (SelectionUtil._endPreceedsStart(selection)) {
            let endNode = selection.startNode;
            let endOffset = selection.startOffset;
            selection.startNode = selection.endNode;
            selection.startOffset = selection.endOffset;
            selection.endNode = endNode;
            selection.endOffset = endOffset;
        }
        return selection;
    },

    _endPreceedsStart(selection) {
        let position = selection.startNode.compareDocumentPosition(selection.endNode);
        let backwards = position & Node.DOCUMENT_POSITION_PRECEDING;
        if (position === 0 && selection.startOffset > selection.endOffset)
            backwards = 1;
        return (backwards !== 0);
    },

    _getContainerNode(selection) {
        const ancestors = selection.ancestors ? selection.ancestors : DOMUtil.findCommonAncestors(selection.startNode, selection.endNode);
        return ancestors[ancestors.length - 1];
    },

    _checkValidTextSelection(selection) {
        if (!selection) {
            throw Error("No currentSelection set");
        }
        if (!selection.mimeType) {
            throw Error("No currentSelection mimeType set")
        } else if (selection.mimeType !== "text") {
            throw Error("currentSelection mimeType is not text")
        } else if (!selection.startOffset || !selection.endOffset) {
            throw Error("Invalid currentSelection");
        }
    },

    /*
     * Considerations:
     * - selection can contain ignorable elements, getSelection().toString captures ignored content
     * - if there are ignorable elements, their content needs to be stripped from the selection text
     * - displayed whitespace is difficult to predict for individual text nodes
     * Strategy:
     * - list all text nodes of container node and include an ignore flag which is set to true if
     *   the text node is descendant of an ignorable element
     * - process text nodes in display order
     *   - move text node content from unfiltered to filtered selection text if it's not an ignore node
     *   (trimmed to avoid incorrectly computed leading and trailing whitespace)
     *   - remove text node content from unfiltered selection text if it is an ignore node
     */
    _getSelectionText(selection) {
        let selectionText = "";
        let unfilteredText = selection.selectionText;

        const startOffset = SelectionUtil._getTrimmedOffset(selection.startNode, selection.startOffset);
        const endOffset = SelectionUtil._getTrimmedOffset(selection.endNode, selection.endOffset);

        const textNodes = RDFaUtil.getRDFaTextNodesExtended(selection.containerNode)
        const ignoreNodes = RDFaUtil.getRDFaIgnoreNodes(selection.containerNode);
        if (ignoreNodes.length === 0)
            return unfilteredText; // no ignore nodes in selection, no changes needed

        let include = false;
        //const textChunks = []; NOT USED?
        textNodes.forEach((textNode) => {
            var displayText = DOMUtil.getTextNodeDisplayText(textNode.node);
            let startNodePosition = selection.startNode.compareDocumentPosition(textNode.node)
            let startNodePreceeds = startNodePosition & Node.DOCUMENT_POSITION_FOLLOWING;
            let endNodePosition = selection.endNode.compareDocumentPosition(textNode.node)
            let endNodePreceeds = endNodePosition & Node.DOCUMENT_POSITION_FOLLOWING;
            if (selection.startNode === textNode.node || startNodePreceeds) {
                include = true;
            }
            if (selection.startNode === textNode.node) {
                displayText = displayText.substr(startOffset);
            }
            if (selection.endNode === textNode.node) {
                displayText = displayText.substr(0, endOffset);
            }
            if (include){
                if (textNode.ignore) {
                    let ignoreOffset = unfilteredText.indexOf(displayText);
                    selectionText += unfilteredText.substr(0, ignoreOffset);
                    let chunkLength = ignoreOffset + displayText.length;
                    unfilteredText = unfilteredText.substr(chunkLength);
                } else {
                    let chunkLength = unfilteredText.indexOf(displayText.trim()) + displayText.trim().length;
                    selectionText += unfilteredText.substr(0, chunkLength);
                    unfilteredText = unfilteredText.substr(chunkLength);
                }
                //textChunks.push(displayText.trim());
            }
            if (selection.endNode === textNode.node || endNodePreceeds) {
                include = false;
            }
        });
        // if there is any trailing whitespace in the unfiltered text, move it to the filtered text
        return selectionText + unfilteredText;
    },

    _getTrimmedOffset : function(node, offset) {
        if (node.nodeType === window.Node.TEXT_NODE && offset > 0) {
            //let textContent = node.textContent;
            if (offset > 0)
                offset -= DOMUtil.getTextNodeDisplayOffset(node);
            //offset -= textContent.length - textContent.trimLeft().length;
        }
        return offset;
    },

    /* -------------------------------------------- CHECKING SELECTION RANGE FUNCTIONS? ---------------------------------- */

    checkSelectionRange : function() {
        // 1. do nothing if selection is collapsed (e.g. does not span a range)
        if (document.getSelection().isCollapsed) {
            return null;
        }
        // 2. get start and end nodes of selection in display order
        var selection = SelectionUtil.getDOMSelection();
        // 3. if selection start node has SelectWholeElement property
        let startNode = SelectionUtil._selectWholeElement(selection.startNode);
        let endNode = SelectionUtil._selectWholeElement(selection.endNode);
        if (selection.startOffset !== undefined && startNode) {
            // move selection to start of start node
            selection.startOffset = 0;
            selection.startNode = startNode;
        }
        // 4. if selection end node has SelectWholeElement property
        if (selection.endOffset !== undefined && endNode) {
            // move selection to end of end node
            let textNodes = DOMUtil.getTextNodes(endNode);
            selection.endNode = textNodes[textNodes.length - 1];
            selection.endOffset = selection.endNode.length;
        }
        // 5. if start and/or end nodes have SelectWholeElement property,
        // make sure the offsets are set properly
        if (startNode || endNode){
            SelectionUtil._adjustSelection(selection);
        }
    },

    _adjustSelection : (selection) => {
        var range = document.createRange();
        range.setStart(selection.startNode, selection.startOffset);
        range.setEnd(selection.endNode, selection.endOffset);
        var sel = document.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    },

    _selectWholeElement : function(node) {
        let ancestors = DOMUtil.getAncestors(node);
        let nodes = ancestors.concat([node]).reverse();
        for (var index = 0; index < nodes.length; index++) {
            var checkNode = nodes[index];
            if (checkNode.attributes && checkNode.hasAttribute("property") && checkNode.getAttribute("property") === "selectWholeElement") {
                return checkNode;
            }
        }
        return null;
    },

};

export default SelectionUtil;
