import React, { useEffect, useRef } from 'react';

const DocumentPiPVideo = () => {
    const videoRef = useRef();

    useEffect(() => {
        const largeVideo = document.getElementById('prejoinVideo') || document.getElementById('largeVideo');
        const video = videoRef.current;

        if (!video) {
            return;
        }

        if (largeVideo) {
            video.style.display = 'block';
            const mediaStream = largeVideo.srcObject;
            const transform = largeVideo.style.transform;

            video.srcObject = mediaStream;
            video.style.transform = transform;
            video.play();
        } else {
            video.style.display = 'none';
            video.srcObject = null;
        }
    }, []);

    return (
        <video
            autoPlay = { true }
            muted = { true }
            ref = { videoRef }
            // eslint-disable-next-line react-native/no-inline-styles
            style = {{
                height: '100%',
                width: '100%' }} />
    );
};

export default DocumentPiPVideo;
