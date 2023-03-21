import { AtlasKitThemeProvider } from '@atlaskit/theme';
import React from 'react';
import { useSelector } from 'react-redux';

import { AOT_BUTTONS, AOT_PREJOIN_BUTTONS } from '../../base/config';
import JitsiThemeProvider from '../../base/ui/components/JitsiThemeProvider.web';
import { isPrejoinPageVisible } from '../../prejoin/functions';
import { Toolbox } from '../../toolbox/components';


import DocumentPiPVideo from './video';

const DocumentPiPContent = () => {
    const isInPrejoin = useSelector(isPrejoinPageVisible);
    const buttons = isInPrejoin ? AOT_PREJOIN_BUTTONS : AOT_BUTTONS;

    return (
        <JitsiThemeProvider>
            <AtlasKitThemeProvider mode = 'dark'>
                <div>
                    <DocumentPiPVideo />
                    <Toolbox toolbarButtons = { buttons } />
                </div>
            </AtlasKitThemeProvider>
        </JitsiThemeProvider>
    );
};

export default DocumentPiPContent;
