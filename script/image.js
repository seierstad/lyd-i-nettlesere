import {html} from "htm/preact";

import {MetadataView, metadataToId} from "./metadata.js";


const ImageView = (props = {}) => {
    const {
        size = 0,
        lastModified = 0,
        name = "",
        img,
        id = metadataToId({size, lastModified, name}),
        setActive
    } = props;

    const clickHandler = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setActive({size, lastModified, name});
    };

    return html`
        <li id=${id}>
            <a
                href=${"#" + id}
                onclick=${clickHandler}
            >
                <figure>
                    <img
                        alt=""
                        height=${img.naturalHeight}
                        src=${img.src}
                        width=${img.naturalWidth}
                    />
                    <figcaption>
                        <${MetadataView} ...${props} />
                    </figcaption>
                </figure>
            </a>
            <button
                title="fjern ${name}"
                type="submit"
                value=${id}
            >fjern ${name}</button>
        </li>
    `;
};


export {
    ImageView
};
