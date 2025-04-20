import {html} from "htm/preact";
import {useEffect, useState} from "preact/hooks";
//import {AppStateContext, AppHandlerContext} from "../script.js";

import {MetadataView} from "./metadata.js";


const FileReaderView = (props = {}) => {
    const {
        file,
        reader,
        completedHandler
    } = props;

    const {name, size, lastModified} = file;
    const metadata = {lastModified, name, size};

    const [progress, setProgress] = useState(0);
    const [image, setImage] = useState(null);


    const progressHandler = event => {
        const percents = Math.floor((event.loaded / event.total) * 100);
        setProgress(percents);
    };

    const createImage = (src) => {
        const img = new Image();
        img.src = src;

        setImage(img);

    };

    const fileLoadedHandler = (event) => {
        createImage(event.target.result);
    };

    const imageLoadedHandler = (event) => {
        completedHandler({
            name,
            size,
            lastModified,
            //file,
            img: event.target,
            src: event.target.src,
            width: event.target.naturalWidth,
            height: event.target.naturalHeight
        });
    };

    useEffect(() => {
        if (image !== null) {
            if (image.complete) {
                completedHandler({name, size, lastModified, img: image, src: image.src, width: image.naturalWidth, height: image.naturalHeight});
            } else {
                image.addEventListener("load", imageLoadedHandler, {once: true});
                return () => image.removeEventListener("load", imageLoadedHandler);
            }
        }
    }, [image]);

    useEffect(() => {
        if (reader !== null) {
            if (reader.readyState === reader.DONE) {
                createImage(reader.result);
            } else {
                reader.addEventListener("load", fileLoadedHandler, {once: true});
                reader.addEventListener("progress", progressHandler);

                return () => {
                    reader.removeEventListener("load", fileLoadedHandler);
                    reader.removeEventListener("progress", progressHandler);
                };
            }
        }
    }, [reader]);


    return html`
        <li>
            <${MetadataView} ...${metadata} progress=${progress} />
        </li>
    `;
};


export {
    FileReaderView
};
