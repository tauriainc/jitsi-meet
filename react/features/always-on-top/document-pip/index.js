/* global APP */

import React from 'react';
import { Provider } from 'react-redux';

import DocumentPipContent from './content';

const DocumentPiP = () => (
    <Provider store = { APP.store }>
        <DocumentPipContent />
    </Provider>

);

export default DocumentPiP;
