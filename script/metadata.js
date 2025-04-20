import {html} from "htm/preact";

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

const ID_DELIMITER = "-";

const metadataToId = ({size, lastModified, name}) => [size, lastModified, name].join(ID_DELIMITER);
const idToMetadata = id => {
    const [size, lastModified, ...name] = id.split(ID_DELIMITER);
    return {
        size: parseInt(size, 10),
        lastModified: parseInt(lastModified, 10),
        name: name.join(ID_DELIMITER)
    };
};

const compareMetadata = a => b => a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;


const MetadataView = (props = {}) => {
    const {
        name = false,
        lastModified = false,
        size = false,
        progress = false
    } = props;

    return html`
        <dl class="metadata">
            ${name && html`<dt>filnavn</dt><dd>${name}</dd>`}
            ${lastModified && html`<dt>endret</dt><dd><time title="2025-03-19T14:25:28.494Z">2025-03-19</time></dd>`}
            ${typeof size === "number" && html`<dt>størrelse</dt><dd><span title="${size} bytes">${readableFileSize(size)}</span></dd>`}
            ${typeof progress === "number" && html`<dt>lastet</dt><dd>${progress} %</dd>`}
        </dl>
    `;
};


export {
    MetadataView,
    metadataToId,
    idToMetadata,
    compareMetadata
};
