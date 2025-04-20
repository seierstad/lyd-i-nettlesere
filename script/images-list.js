import {html} from "htm/preact";
import {useState, useLayoutEffect} from "preact/hooks";

import {noop} from "./event-handlers.js";
import {FileReaderView} from "./file-reader.js";
import {ImageView} from "./image.js";
import {idToMetadata, compareMetadata} from "./metadata.js";


const ImagesList = (props = {}) => {
    const {
        images = {
            value: []
        } = {},
        handlers: {
            fileLoadedHandler,
            unloadImageHandler,
            setActiveImage
        } = {}
    } = props;

    const [fileReaders, setFileReaders] = useState([]);

    const addFileReaders = (readers = []) => {
        if (readers.length !== 0) {
            setFileReaders(currentFileReaders => ([...currentFileReaders, ...readers]));
        }
    };


    useLayoutEffect(() => {
        if (images.value.length !== 0 && fileReaders.length !== 0) {
            setFileReaders(currentReaders => currentReaders.filter(reader => images.value.findIndex(compareMetadata(reader.file)) === -1));
        }
    }, [images.value]);

    const readImages = (files = []) => files.filter(
        (file) => images.value.findIndex(compareMetadata(file)) === -1)
        .map(file => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            return {file, reader};
        });


    const loadImages = (event) => {
        event.preventDefault();

        if (event.dataTransfer.items) {
            addFileReaders(readImages([...event.dataTransfer.items]
                .filter(item => item.kind === "file" && item.type.indexOf("image/") === 0)
                .map(item => item.getAsFile()))
            );
        }
    };

    const submitHandler = (event) => {
        event.stopPropagation();
        event.preventDefault();
        const metadata = idToMetadata(event.submitter.value);
        unloadImageHandler(metadata);
    };

    const fileInputHandler = (event) => {
        addFileReaders(readImages([...event.target.files]));
        event.target.value = null;
    };

    return html`
        <form
            id="innlastede-bilder-velger"
            ondragover=${noop}
            ondrop=${loadImages}
            onsubmit=${submitHandler}
        >
            <fieldset>
                <legend>innlastede bilder (klikk for å aktivere, dra og slipp eller trykk "last inn" for å legge til flere)</legend>
                <ul id="innlastede-bilder-liste">
                    ${images.value.map(img => html`<${ImageView} ...${img} setActive=${setActiveImage} />`)}
                </ul>
                ${fileReaders.length > 0 ? html`
                    <ul>
                        ${fileReaders.map(fr => html`
                            <li>
                                <${FileReaderView} completedHandler=${fileLoadedHandler} ...${fr} />
                            </li>
                        `)}
                    </ul>
                ` : null}
                <label>last inn et bilde <input type="file" id="bilde-filfelt" multiple accept="image/*" oninput=${fileInputHandler} /></label>
            </fieldset>
        </form>
    `;
};


export {
    ImagesList
};
