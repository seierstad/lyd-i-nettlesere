import {createContext} from "preact";
import {signal} from "@preact/signals";


const AppStateContext = createContext();


const state = {
    activeImageIndex: signal(null),
    canvasContext: null,
    images: signal([]),
    histogramData: signal(null)
};

export {
    AppStateContext,
    state
};
