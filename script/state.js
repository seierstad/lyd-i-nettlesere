import {createContext} from "preact";
import {signal} from "@preact/signals";


const AppStateContext = createContext();


const state = {
    activeImageIndex: signal(null),
    canvasContext: null,
    images: signal([]),
    histogram: {
        rows: signal(null),
        columns: signal(null),
        visibility: {
            r: signal(true),
            g: signal(true),
            b: signal(true)
        },
        grouping: signal(10),
        maxRelativeCount: signal({r: 0, g: 0, b: 0})
    }
};

export {
    AppStateContext,
    state
};
