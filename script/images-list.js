import {html} from "htm/preact";
import {useContext, useMemo, useEffect, useState} from "preact/hooks";
//import {AppStateContext, AppHandlerContext} from "../script.js";

import {noop} from "./event-handlers.js";

const kB = 1024;
const mB = 1024 * kB;
const gB = 1024 * mB;
const tB = 1024 * gB;

const readableFileSize = (bytes) => {
    const tBSize = bytes / tB;
    if (tBSize >= 0.5) {
        return `${tBSize.toPrecision(3)} TB`;
    }
    const gBSize = bytes / gB;
    if (gBSize >= 0.5) {
        return `${gBSize.toPrecision(3)} GB`;
    }
    const mBSize = bytes / mB;
    if (mBSize >= 0.5) {
        return `${mBSize.toPrecision(3)} MB`;
    }
    const kBSize = bytes / kB;
    if (kBSize >= 0.5) {
        return `${kBSize.toPrecision(3)} kB`;
    }

    return `${bytes} byte`;

};

const FileReader = (props) => {

};

const Image = (props = {}) => {
    const {
        size = 0,
        lastModified = 0,
        name = "",
        id = `${size}-${lastModified}-${name}`
    } = props;


    return html`
        <li id=${id}>
            <a href="#${id}">
                <figure>
                    <img src="./eksempeldata/ekkogram.png" />
                    <figcaption>
                        <dl>
                            <dt>filnavn</dt><dd>${name}</dd>
                            <dt>endret</dt><dd><time title="2025-03-19T14:25:28.494Z">2025-03-19</time></dd>
                            <dt>størrelse</dt><dd><span title="${size} bytes">${readableFileSize(size)}</span></dd>
                        </dl>
                    </figcaption>
                </figure>
            </a>
            <button title="fjern ${name}" value=${id}>fjern ${name}</button>
        </li>
    `;
};

const compareMetadata = a => b => a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;

const ImagesList = (props = {}) => {
    const {
        images = [],
        handlers = {}
    } = props;

    const [fileReaders, setFileReaders] = useState([]);

    const addFileReader = (data) => currentFileReaders => {
        const {name, size, lastModified} = data;
        if (currentFileReaders.findIndex(compareMetadata({name, size, lastModified})) === -1) {
            return [...fileReaders, data];
        }
    };

    const fileReaderCompleted = (data) => currentFileReaders => {
        const {name, size, lastModified} = data;
        if (currentFileReaders.findIndex(compareMetadata({name, size, lastModified})) === -1) {
            return [...fileReaders, data];
        }
    };


    const loadImages = (event) => {
        event.preventDefault();
        if (event.dataTransfer.items) {
            [...event.dataTransfer.items].filter(item => item.kind === "file" && item.type.indexOf("image/") === 0).forEach(item => {
                const file = item.getAsFile();
                const reader = new FileReader();
                reader.readAsDataURL(file);

                const {name, size, lastModified} = file;
                const metadata = {name, size, lastModified};
                addFileReader({file, ...metadata, reader});
                //hvis filnavn, sist endret (i millisekunder) og størrelse (i bytes) ikke er nok til å skille)
                reader.addEventListener("progress", getProgressHandler(metadata), {once: true});
                reader.addEventListener("load", filLastet(metadata), {once: true});
            });
        }
    };

    return html`
        <form
            target="."
            id="innlastede-bilder-velger"
            ondragover=${noop}
            ondrop=${loadImages}
        >
            <fieldset>
                <legend>innlastede bilder (klikk for å aktivere, dra og slipp eller trykk "last inn" for å legge til flere)</legend>
                <ul id="innlastede-bilder-liste">
                    ${images.map(i => html`<${Image} ...${i} />`)}
                </ul>
                ${fileReaders.length > 0 ? html`
                    <ul>
                        ${fileReaders.map(fr => html`
                            <li>
                                <${FileReader} loadedFn=${console.log} />
                            </li>
                        `)}
                    </ul>
                ` : null}
                <label>last inn et bilde <input type="file" id="bilde-filfelt" multiple accept="image/*"/></label>
            </fieldset>
        </form>
    `;
};


export {
    ImagesList
};
