import {html} from "htm/preact";
import {useEffect, useRef, useContext, useMemo} from "preact/hooks";

import {AppStateContext} from "../state.js";
import {AppHandlersContext} from "../handlers.js";

import {ActiveImage} from "./active-image.js";
import {Histogram} from "./histogram.js";
import {HistogramForm} from "./histogram-form.js";
import {PixelSum} from "./column-pixel-sum.js";


const Visual = (props = {}) => {
    const handlers = useContext(AppHandlersContext);

    const {
        activeImageIndex: idx = {value: null},
        images: {
            value: {
                [idx.value]: {
                    selection
                } = {}
            } = []
        } = [],
        histogram: {
            rows,
            columns,
            visibility,
            grouping
        } = {}
    } = useContext(AppStateContext);

    return html`
        <section id="visuell-analyse">
            <${ActiveImage} handlers=${handlers} />
            <${Histogram}
                data=${rows}
                selection=${selection}
            />
            <${HistogramForm}
                allGrey=${selection.allGrey}
                handlers=${handlers.histogram}
                visibility=${visibility}
                grouping=${grouping}
            />
            <${PixelSum}
                columns=${columns}
                selection=${selection}
            />
        </section>
    `;
};


export {
    Visual
};
